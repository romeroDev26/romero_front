# 📄 Guía Frontend: Subida de PDFs A4 y Ticket

## 🎯 Flujo Completo para Subir PDFs desde Frontend

### *Paso 1: Generar los PDFs en Frontend*

javascript
// Ejemplo: Generar PDFs después de crear una factura
async function generateInvoicePDFs(invoiceData) {
    // 1. Generar PDF A4 (formato estándar)
    const pdfA4Blob = await generatePDF_A4(invoiceData);
    
    // 2. Generar PDF Ticket (formato térmico)
    const pdfTicketBlob = await generatePDF_Ticket(invoiceData);
    
    return {
        pdfA4: pdfA4Blob,
        pdfTicket: pdfTicketBlob
    };
}


### *Paso 2: Subir PDFs usando el Endpoint de File Upload*

#### *Endpoint para Subir Archivos*

POST  /files/upload


#### *Código JavaScript Completo*

javascript
async function uploadInvoicePDFs(invoiceId, pdfA4Blob, pdfTicketBlob, authToken) {
    const baseURL = 'http://localhost:8000 ';
    
    try {
        // 1. Subir PDF A4
        const pdfA4URL = await uploadPDF({
            file: pdfA4Blob,
            section: 'invoices',
            documentId: invoiceId,
            fileType: 'pdf_a4',
            authToken: authToken
        });
        
        // 2. Subir PDF Ticket
        const pdfTicketURL = await uploadPDF({
            file: pdfTicketBlob,
            section: 'invoices',
            documentId: invoiceId,
            fileType: 'pdf_ticket',
            authToken: authToken
        });
        
        // 3. Actualizar la factura con las URLs de los PDFs
        await updateInvoicePDFPaths(invoiceId, {
            pdf_a4_file_path: pdfA4URL,
            pdf_ticket_file_path: pdfTicketURL
        }, authToken);
        
        return {
            success: true,
            pdf_a4_url: pdfA4URL,
            pdf_ticket_url: pdfTicketURL
        };
        
    } catch (error) {
        console.error('Error uploading PDFs:', error);
        throw error;
    }
}

// Función auxiliar para subir un PDF
async function uploadPDF({ file, section, documentId, fileType, authToken }) {
    const formData = new FormData();
    
    // Crear nombre de archivo descriptivo
    const fileName = `${section}_${documentId}_${fileType}_${Date.now()}.pdf`;
    
    formData.append('file', file, fileName);
    formData.append('section', section);
    formData.append('document_id', documentId.toString());
    
    const response = await fetch(' /files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data.file_url;
}

// Función para actualizar los campos PDF en la factura
async function updateInvoicePDFPaths(invoiceId, pdfPaths, authToken) {
    const response = await fetch(` /invoices/${invoiceId}/pdf-paths`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pdfPaths)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to update PDF paths: ${response.statusText}`);
    }
    
    return await response.json();
}


### *Paso 3: Uso Completo en el Frontend*

javascript
// Ejemplo completo: Crear factura y subir PDFs
async function createInvoiceWithPDFs(invoiceData, authToken) {
    try {
        // 1. Crear la factura
        const invoice = await createInvoice(invoiceData, authToken);
        const invoiceId = invoice.id;
        
        // 2. Generar los PDFs
        const { pdfA4, pdfTicket } = await generateInvoicePDFs(invoice);
        
        // 3. Subir los PDFs y actualizar la factura
        const uploadResult = await uploadInvoicePDFs(
            invoiceId, 
            pdfA4, 
            pdfTicket, 
            authToken
        );
        
        console.log('✅ Factura creada con PDFs:', {
            invoiceId: invoiceId,
            pdfA4URL: uploadResult.pdf_a4_url,
            pdfTicketURL: uploadResult.pdf_ticket_url
        });
        
        return {
            invoice: invoice,
            pdfs: uploadResult
        };
        
    } catch (error) {
        console.error('❌ Error en proceso completo:', error);
        throw error;
    }
}


## 🔧 Endpoint Necesario en Backend

### *IMPORTANTE: Crear Endpoint para Actualizar PDF Paths*

Necesitas agregar este endpoint en app/api/endpoints/invoices.py:

python
@router.patch("/{invoice_id}/pdf-paths")
async def update_invoice_pdf_paths(
    invoice_id: int,
    pdf_paths: dict,
    db: AsyncPGConnection = Depends(get_db_connection),
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar las rutas de PDFs de una factura
    """
    try:
        # Construir query dinámicamente
        update_fields = []
        values = []
        
        if 'pdf_a4_file_path' in pdf_paths:
            update_fields.append("pdf_a4_file_path = $" + str(len(values) + 1))
            values.append(pdf_paths['pdf_a4_file_path'])
            
        if 'pdf_ticket_file_path' in pdf_paths:
            update_fields.append("pdf_ticket_file_path = $" + str(len(values) + 1))
            values.append(pdf_paths['pdf_ticket_file_path'])
            
        if 'pdf_file_path' in pdf_paths:
            update_fields.append("pdf_file_path = $" + str(len(values) + 1))
            values.append(pdf_paths['pdf_file_path'])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No PDF paths provided")
        
        # Agregar invoice_id al final
        values.append(invoice_id)
        
        query = f"""
            UPDATE invoices 
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = ${len(values)}
            RETURNING *
        """
        
        result = await db.fetchrow(query, *values)
        
        if not result:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return {
            "success": True,
            "message": "PDF paths updated successfully",
            "data": dict(result)
        }
        
    except Exception as e:
        logger.error(f"Error updating PDF paths: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


## 📱 Ejemplo React/Vue

### *React Hook Personalizado*

javascript
import { useState } from 'react';

function useInvoicePDFs() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const uploadPDFs = async (invoiceId, pdfA4Blob, pdfTicketBlob) => {
        setLoading(true);
        setError(null);
        
        try {
            const authToken = localStorage.getItem('authToken');
            
            const result = await uploadInvoicePDFs(
                invoiceId, 
                pdfA4Blob, 
                pdfTicketBlob, 
                authToken
            );
            
            setLoading(false);
            return result;
            
        } catch (err) {
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };
    
    return { uploadPDFs, loading, error };
}

// Uso en componente
function InvoiceComponent() {
    const { uploadPDFs, loading, error } = useInvoicePDFs();
    
    const handleCreateInvoice = async (invoiceData) => {
        try {
            // 1. Crear factura
            const invoice = await createInvoice(invoiceData);
            
            // 2. Generar PDFs
            const pdfA4 = await generatePDF_A4(invoice);
            const pdfTicket = await generatePDF_Ticket(invoice);
            
            // 3. Subir PDFs
            await uploadPDFs(invoice.id, pdfA4, pdfTicket);
            
            alert('✅ Factura creada con PDFs exitosamente');
            
        } catch (error) {
            alert('❌ Error: ' + error.message);
        }
    };
    
    return (
        <div>
            {loading && <p>Subiendo PDFs...</p>}
            {error && <p style={{color: 'red'}}>Error: {error}</p>}
            {/* Tu formulario aquí */}
        </div>
    );
}


## 🔍 Verificar Subida con Endpoint de Búsqueda

javascript
// Verificar que los PDFs se subieron correctamente
async function verifyPDFUpload(invoiceId, authToken) {
    const response = await fetch(
        ` /files/search?section=invoices&document_id=${invoiceId}`,
        {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        }
    );
    
    const result = await response.json();
    
    if (result.success && result.data.files.length > 0) {
        const invoice = result.data.files[0];
        const pdfFiles = invoice.files.filter(f => f.type.includes('pdf'));
        
        console.log('PDFs encontrados:', pdfFiles);
        return pdfFiles;
    }
    
    return [];
}


## 📋 Resumen del Flujo

1. *Frontend genera PDFs* (A4 y Ticket)
2. *Sube PDFs* usando POST  /files/upload
3. *Actualiza factura* usando PATCH  /invoices/{id}/pdf-paths
4. *Verifica subida* usando GET  /files/search

## ⚠ Consideraciones Importantes

### *Tamaños de Archivo*
- *PDF A4*: Máximo 10MB
- *PDF Ticket*: Máximo 5MB

### *Nombres de Archivo*
- Usar formato descriptivo: invoices_{id}_pdf_a4_{timestamp}.pdf
- Incluir timestamp para evitar conflictos

### *Manejo de Errores*
- Validar que los blobs de PDF sean válidos
- Manejar errores de red y timeouts
- Mostrar progreso de subida al usuario

### *Seguridad*
- Siempre incluir token de autenticación
- Validar permisos antes de subir
- No exponer URLs de archivos en logs

## 🚀 Próximos Pasos

1. *Implementar endpoint* PATCH  /invoices/{id}/pdf-paths
2. *Probar flujo completo* con datos reales
3. *Agregar validaciones* de formato PDF
4. *Implementar progreso* de subida
5. *Documentar errores* comunes y soluciones

---
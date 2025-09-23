// src/features/remissionGuides/utils/guideConversion.ts

import { RemissionGuideTransportista, AutoGenerateRemissionGuide, AutoGenerateRemissionGuideItem } from '../../../types';

/**
 * Convierte una RemissionGuideRemitente (estructura del log.md) a AutoGenerateRemissionGuide
 * para poder usar el generador de PDFs
 */
export const convertSenderGuideToAutoGenerate = (
  guide: any // Usamos any porque los datos vienen en estructura plana desde el backend
): AutoGenerateRemissionGuide | null => {
  try {
    // Verificar que tenemos una guía válida
    if (!guide || !guide.id) {
      console.error('Guía inválida o faltante:', guide);
      return null;
    }

    // Extraer nombres del remitente y destinatario usando múltiples fuentes posibles
    const senderName = guide.sender_name || guide.sender?.business_name || 'Remitente';
    const recipientName = guide.recipient_name || guide.receiver?.business_name || 'Destinatario';
    const series = guide.series || 'T001';
    const number = guide.number || 1;

    // Verificar que tenemos los datos mínimos requeridos
    if (!senderName || !recipientName || !series || !number) {
      console.error('Datos insuficientes para generar PDF del remitente:', {
        senderName, recipientName, series, number, guide
      });
      return null;
    }

    // Convertir items desde la estructura del remitente
    const packageItems: AutoGenerateRemissionGuideItem[] = guide.items?.map((item: any, index: number) => ({
      id: item.id || index + 1,
      item_order: index + 1,
      quantity: item.quantity || 1,
      unit_code: item.unit_code || 'ZZ',
      description: item.description || 'Servicio de Envío de Encomienda',
      internal_code: item.internal_code || `INV-${guide.id}-${index + 1}`
    })) || [{
      id: 1,
      item_order: 1,
      quantity: 1,
      unit_code: 'ZZ',
      description: 'Servicio de Envío de Encomienda',
      internal_code: `INV-${guide.id}-1`
    }];

    // Formatear fecha y hora
    const issueDateTime = new Date(guide.issue_date);
    const issueDate = issueDateTime.toISOString().split('T')[0];
    const issueTime = guide.issue_time || issueDateTime.toTimeString().split(' ')[0];

    const convertedGuide: AutoGenerateRemissionGuide = {
      guide_id: guide.id,
      ubl_version: guide.ubl_version || '2.1',
      document_type_code: guide.document_type_code,
      series: series,
      number: number,
      document_number: guide.document_number || `${series}-${number.toString().padStart(8, '0')}`,
      issue_date: issueDate,
      issue_time: issueTime,
      sender_doc_type: guide.sender_doc_type || guide.sender?.document_type_code || '6',
      sender_doc_number: guide.sender_doc_number || guide.sender?.document_number || '',
      sender_name: senderName,
      recipient_doc_type: guide.recipient_doc_type || guide.receiver?.document_type_code || '6',
      recipient_doc_number: guide.recipient_doc_number || guide.receiver?.document_number || '',
      recipient_name: recipientName,
      origin_ubigeo: guide.origin_ubigeo || guide.origin_address?.ubigeo || '',
      origin_address: guide.origin_address?.address || guide.origin_address || '',
      destination_ubigeo: guide.destination_ubigeo || guide.destination_address?.ubigeo || '',
      destination_address: guide.destination_address?.address || guide.destination_address || '',
      destination_port_name: 'Puerto de destino', // No disponible en estructura del remitente
      transport_mode_code: guide.transport_mode_code,
      total_gross_weight: guide.total_gross_weight || 1,
      weight_unit_code: guide.weight_unit_code || 'KGM',
      number_of_packages: guide.number_of_packages || 1,
      total_packages: guide.number_of_packages || 1,
      total_weight: guide.total_gross_weight || 1,
      shipment_start_date: guide.transfer_start_date || guide.issue_date,
      driver_doc_type: guide.driver_doc_type,
      driver_doc_number: guide.driver_doc_number,
      driver_name: guide.driver_name || 'Conductor',
      driver_license: guide.driver_license || '',
      captain_name: guide.driver_name || 'Conductor',
      captain_doc_type: guide.driver_doc_type,
      captain_doc_number: guide.driver_doc_number,
      captain_license: guide.driver_license || '',
      vessel_name: guide.vessel_name || guide.vehicle_plate || 'Embarcación',
      vessel_plate: guide.vehicle_plate || guide.vessel_plate || '',
      related_doc_type: guide.related_doc_type || null,
      related_doc_number: guide.related_doc_number || null,
      sunat_status: guide.sunat_status || 'PENDING',
      sunat_ticket: guide.sunat_ticket || null,
      sunat_response_code: guide.sunat_response_code || null,
      sunat_response_description: guide.sunat_response_description || null,
      sunat_observations: guide.sunat_observations || null,
      sunat_reception_date: guide.sunat_reception_date || null,
      xml_file_path: guide.xml_file_path || null,
      signed_xml_file_path: guide.signed_xml_file_path || null,
      zip_file_path: guide.zip_file_path || null,
      zip_hash: guide.zip_hash || null,
      cdr_file_path: guide.cdr_file_path || null,
      pdf_file_path: guide.pdf_file_path || null,
      pdf_a4_file_path: guide.pdf_a4_file_path || null,
      pdf_ticket_file_path: guide.pdf_ticket_file_path || null,
      qr_code_data: guide.qr_code_data || '', // Se puede generar en el PDF
      company_ruc: guide.company_ruc || '',
      company_business_name: guide.company_business_name || '',
      company_trade_name: guide.company_trade_name || null,
      company_address: guide.company_address || '',
      company_phone: guide.company_phone || null,
      company_email: guide.company_email || null,
      package_items: packageItems,
      observation: guide.observation || null,
      trip_name: `Guía ${guide.id}`,
      departure_date: guide.transfer_start_date || guide.issue_date,
      created_by_name: guide.created_by_name || guide.created_by || 'Sistema',
      created_by_email: '',
      created_at: guide.created_at,
      updated_at: guide.updated_at
    };

    return convertedGuide;
  } catch (error) {
    console.error('Error al convertir guía del remitente:', error);
    return null;
  }
};

/**
 * Convierte una RemissionGuideTransportista a AutoGenerateRemissionGuide
 * para poder usar el generador de PDFs
 */
export const convertToAutoGenerateGuide = (
  guide: RemissionGuideTransportista
): AutoGenerateRemissionGuide | null => {
  try {
    // Verificar que tenemos los datos mínimos requeridos
    if (!guide.company || !guide.sender || !guide.receiver || !guide.destination_address) {
      console.error('Datos insuficientes para generar PDF:', guide);
      return null;
    }

    // Convertir items
    const packageItems: AutoGenerateRemissionGuideItem[] = guide.items?.map((item, index) => ({
      id: item.id || index + 1,
      item_order: index + 1,
      quantity: item.quantity || 1,
      unit_code: item.unit_code || 'ZZ',
      description: item.description || 'Servicio de Envío de Encomienda Fluvial',
      internal_code: item.internal_code || `INV-${guide.id}-${index + 1}`
    })) || [{
      id: 1,
      item_order: 1,
      quantity: 1,
      unit_code: 'ZZ',
      description: 'Servicio de Envío de Encomienda Fluvial',
      internal_code: `INV-${guide.id}-1`
    }];

    // Formatear fecha y hora
    const issueDateTime = new Date(guide.issue_date);
    const issueDate = issueDateTime.toISOString().split('T')[0];
    const issueTime = issueDateTime.toTimeString().split(' ')[0];

    const convertedGuide: AutoGenerateRemissionGuide = {
      guide_id: guide.id,
      ubl_version: guide.ubl_version || '2.1',
      document_type_code: guide.document_type_code,
      series: guide.series,
      number: guide.number,
      document_number: `${guide.series}-${guide.number.toString().padStart(8, '0')}`,
      issue_date: issueDate,
      issue_time: issueTime,
      sender_doc_type: guide.sender.document_type_code,
      sender_doc_number: guide.sender.document_number,
      sender_name: guide.sender.business_name,
      recipient_doc_type: guide.receiver.document_type_code,
      recipient_doc_number: guide.receiver.document_number,
      recipient_name: guide.receiver.business_name,
      origin_ubigeo: guide.origin_address.ubigeo_code,
      origin_address: guide.origin_address.address,
      destination_ubigeo: guide.destination_address.ubigeo_code,
      destination_address: guide.destination_address.address,
      destination_port_name: guide.disembarking_trip_stop?.port?.name || 'Puerto de destino',
      transport_mode_code: guide.transport_mode_code,
      total_gross_weight: guide.gross_total_weight || 1,
      weight_unit_code: 'KGM',
      number_of_packages: guide.number_of_packages || 1,
      total_packages: guide.number_of_packages || 1,
      total_weight: guide.gross_total_weight || 1,
      shipment_start_date: guide.transfer_start_date,
      driver_doc_type: guide.driver_doc_type,
      driver_doc_number: guide.driver_doc_number,
      driver_name: guide.driver_name || 'Conductor',
      driver_license: guide.driver_license || '',
      captain_name: guide.driver_name || 'Conductor',
      captain_doc_type: guide.driver_doc_type,
      captain_doc_number: guide.driver_doc_number,
      captain_license: guide.driver_license || '',
      vessel_name: guide.vessel?.name || 'Embarcación',
      vessel_plate: guide.vessel?.registration_number || '',
      related_doc_type: guide.related_doc_type || null,
      related_doc_number: guide.related_doc_number || null,
      sunat_status: guide.sunat_status || 'PENDING',
      sunat_ticket: guide.sunat_ticket || null,
      sunat_response_code: guide.sunat_response_code || null,
      sunat_response_description: guide.sunat_response_description || null,
      sunat_observations: guide.sunat_observations || null,
      sunat_reception_date: null, // No existe en RemissionGuideTransportista
      xml_file_path: guide.xml_file_path || null,
      signed_xml_file_path: guide.signed_xml_file_path || null,
      zip_file_path: guide.zip_file_path || null,
      zip_hash: null, // No existe en RemissionGuideTransportista
      cdr_file_path: guide.cdr_file_path || null,
      pdf_file_path: guide.pdf_file_path || null,
      pdf_a4_file_path: null, // No existe en RemissionGuideTransportista
      pdf_ticket_file_path: null, // No existe en RemissionGuideTransportista
      qr_code_data: '', // Se puede generar en el PDF
      company_ruc: guide.company.ruc,
      company_business_name: guide.company.business_name,
      company_trade_name: guide.company.trade_name || null,
      company_address: guide.company.address,
      company_phone: guide.company.phone || null,
      company_email: guide.company.email || null,
      package_items: packageItems,
      observation: guide.observation || null,
      trip_name: guide.trip?.trip_name || `Viaje ${guide.trip_id || guide.id}`,
      departure_date: guide.transfer_start_date,
      created_by_name: guide.created_by || 'Sistema',
      created_by_email: '', // No disponible en el tipo original
      created_at: guide.created_at,
      updated_at: guide.updated_at
    };

    return convertedGuide;
  } catch (error) {
    console.error('Error al convertir guía:', error);
    return null;
  }
};

/**
 * Verifica si una guía del remitente puede ser convertida para generar PDF
 */
export const canGenerateSenderPDF = (guide: any): boolean => {
  return !!(
    guide.sender_name &&
    guide.recipient_name &&
    guide.origin_address &&
    guide.destination_address &&
    guide.series &&
    guide.number
  );
};

/**
 * Obtiene el nombre de archivo sugerido para el PDF del remitente
 */
export const getSenderPDFFileName = (guide: any): string => {
  const docNumber = guide.document_number || `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
  return `guia-remision-remitente-${docNumber}.pdf`;
};

/**
 * Verifica si una guía puede ser convertida para generar PDF
 */
export const canGeneratePDF = (guide: RemissionGuideTransportista): boolean => {
  return !!(
    guide.company &&
    guide.sender &&
    guide.receiver &&
    guide.destination_address &&
    guide.series &&
    guide.number
  );
};

/**
 * Obtiene el nombre de archivo sugerido para el PDF
 */
export const getPDFFileName = (guide: RemissionGuideTransportista): string => {
  const docNumber = `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
  return `guia-remision-${docNumber}.pdf`;
};
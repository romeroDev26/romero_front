## Análisis de Numeración de Encomiendas
Situación Actual: Actualmente el manifiesto de cargo agrupa las encomiendas por paradas/destinos, pero necesitas enumerar las encomiendas según el orden de venta (cronológico) para que coincida con la numeración física que escriben con plumón en los paquetes.

Estructura Actual del JSON:

- Manifiesto de cargo agrupado: get_cargo_manifest_grouped_by_stops() - Agrupa por destinos
- Manifiesto de cargo simple: _get_cargo_manifest_data() - Lista ordenada por ii.id (ORDER BY ii.id)
Soluciones Recomendadas:

### Opción 1: Sin cambios en la API (Recomendada)
En tu frontend, procesa el JSON del manifiesto de cargo para crear una numeración correlativa:


// Extraer todas las encomiendas de 
todas las paradas
const todasLasEncomiendas = [];
manifestData.data.forEach(parada => {
    parada.cargo_items.forEach(item => {
        todasLasEncomiendas.push(item);
    });
});

// Ordenar por invoice_item_id (orden de 
venta cronológico)
todasLasEncomiendas.sort((a, b) => a.
invoice_item_id - b.invoice_item_id);

// Asignar números de llegada
todasLasEncomiendas.forEach((item, 
index) => {
    item.numero_llegada = index + 1;
});

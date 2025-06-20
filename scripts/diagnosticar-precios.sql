-- Verificar ingredientes importados para Montana iStay
SELECT 
    ir.id,
    ir.clave_innsist,
    ir.clave_rapsodia,
    ir.descripcion,
    ir.precio_total,
    ir.precio_unitario,
    ir.created_at
FROM ingredientes_restaurante ir
WHERE ir.restaurante_id = 'eb492bec-f87a-4bda-917f-4e8109ec914c'
ORDER BY ir.created_at DESC
LIMIT 10;

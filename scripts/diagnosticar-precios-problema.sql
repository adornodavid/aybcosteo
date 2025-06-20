-- 1. Verificar si hay precios en la tabla precios_unitarios
SELECT COUNT(*) as total_precios FROM precios_unitarios;

-- 2. Verificar si hay ingredientes con precios asociados
SELECT 
    COUNT(DISTINCT ir.id) as total_ingredientes,
    COUNT(DISTINCT pu.ingrediente_id) as ingredientes_con_precio
FROM 
    ingredientes_restaurante ir
LEFT JOIN 
    precios_unitarios pu ON ir.id = pu.ingrediente_id;

-- 3. Examinar algunos precios para ver su estructura
SELECT 
    pu.id,
    pu.ingrediente_id,
    ir.descripcion,
    pu.precio_total,
    pu.precio_unitario,
    pu.unidad,
    pu.fecha_inicio,
    pu.fecha_fin
FROM 
    precios_unitarios pu
JOIN 
    ingredientes_restaurante ir ON pu.ingrediente_id = ir.id
LIMIT 5;

-- 4. Verificar si hay ingredientes con precio_total pero sin precio en precios_unitarios
SELECT 
    ir.id,
    ir.descripcion,
    ir.clave_innsist,
    ir.clave_rapsodia
FROM 
    ingredientes_restaurante ir
LEFT JOIN 
    precios_unitarios pu ON ir.id = pu.ingrediente_id
WHERE 
    pu.id IS NULL
LIMIT 10;

-- Verificar la estructura de la tabla ingredientes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ingredientes' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

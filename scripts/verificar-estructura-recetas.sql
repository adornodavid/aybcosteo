-- Verificar la estructura real de la tabla recetas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'recetas' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- También verificar si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'recetas'
) as tabla_existe;

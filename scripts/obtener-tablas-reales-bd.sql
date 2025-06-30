-- Obtener todas las tablas que existen actualmente en tu base de datos
SELECT 
    table_name as "Nombre de Tabla",
    table_type as "Tipo"
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

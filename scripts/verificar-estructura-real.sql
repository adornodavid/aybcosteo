SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'hoteles', 'restaurantes', 'roles', 'usuarios', 'permisos', 'permisosxrol',
        'menus', 'platillos', 'platillosxmenu', 'categoriaingredientes', 
        'tipounidadmedida', 'ingredientes', 'ingredientesxplatillo', 
        'recetas', 'recetasxplatillo', 'ingredientesxreceta', 'historico'
    )
ORDER BY table_name, ordinal_position;

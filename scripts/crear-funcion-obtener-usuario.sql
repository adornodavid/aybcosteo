-- Crear función para obtener usuario con permisos
CREATE OR REPLACE FUNCTION ObtenerUsuarioPer(p_usuario_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    nombre VARCHAR,
    email VARCHAR,
    rol VARCHAR,
    permisos TEXT[],
    activo BOOLEAN,
    fecha_creacion TIMESTAMP
) AS $$
BEGIN
    -- Esta es una función de ejemplo que devuelve datos simulados
    -- Puedes modificarla según tu estructura real de base de datos
    RETURN QUERY
    SELECT 
        p_usuario_id as id,
        'Usuario Demo'::VARCHAR as nombre,
        'demo@sistema.com'::VARCHAR as email,
        'Administrador'::VARCHAR as rol,
        ARRAY['crear', 'editar', 'eliminar', 'ver']::TEXT[] as permisos,
        true as activo,
        NOW() as fecha_creacion;
END;
$$ LANGUAGE plpgsql;

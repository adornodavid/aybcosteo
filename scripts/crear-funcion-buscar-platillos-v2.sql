-- Elimina la función anterior si existe para evitar conflictos
DROP FUNCTION IF EXISTS buscar_platillos_listado;

-- Nueva función optimizada para la búsqueda de platillos
CREATE OR REPLACE FUNCTION buscar_platillos_listado_v2(
    p_nombre TEXT,
    p_hotel_id INT,
    p_restaurante_id INT,
    p_menu_id INT
)
RETURNS TABLE (
    "PlatilloId" INT,
    "PlatilloNombre" TEXT,
    "PlatilloDescripcion" TEXT,
    "PlatilloTiempo" TEXT,
    "PlatilloCosto" NUMERIC,
    "PlatilloActivo" BOOLEAN,
    "HotelId" INT,
    "HotelNombre" TEXT,
    "RestauranteId" INT,
    "RestauranteNombre" TEXT,
    "MenuId" INT,
    "MenuNombre" TEXT,
    "PlatilloImagenUrl" TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT -- Usamos DISTINCT para evitar platillos duplicados si están en varios menús
        p.id as "PlatilloId",
        p.nombre as "PlatilloNombre",
        p.descripcion as "PlatilloDescripcion",
        p.tiempopreparacion as "PlatilloTiempo",
        p.costototal as "PlatilloCosto",
        p.activo as "PlatilloActivo",
        h.id as "HotelId",
        h.nombre as "HotelNombre",
        r.id as "RestauranteId",
        r.nombre as "RestauranteNombre",
        m.id as "MenuId",
        m.nombre as "MenuNombre",
        p.imagen_url as "PlatilloImagenUrl"
    FROM
        platillos p
    -- Usamos LEFT JOIN para incluir platillos que podrían no estar asignados a un menú aún
    LEFT JOIN
        platillosxmenu pxm ON p.id = pxm.platilloid
    LEFT JOIN
        menus m ON pxm.menuid = m.id
    LEFT JOIN
        restaurantes r ON m.restaurante_id = r.id
    LEFT JOIN
        hoteles h ON r.hotel_id = h.id
    WHERE
        -- Filtro por nombre de platillo (insensible a mayúsculas/minúsculas)
        (p.nombre ILIKE '%' || p_nombre || '%') AND
        -- Filtro por hotel (-1 ignora el filtro)
        (p_hotel_id = -1 OR h.id = p_hotel_id) AND
        -- Filtro por restaurante (-1 ignora el filtro)
        (p_restaurante_id = -1 OR r.id = p_restaurante_id) AND
        -- Filtro por menú (-1 ignora el filtro)
        (p_menu_id = -1 OR m.id = p_menu_id)
    ORDER BY
        p.nombre ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION buscar_platillos_listado(
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
    SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.tiempopreparacion,
        p.costototal,
        p.activo,
        h.id,
        h.nombre,
        r.id,
        r.nombre,
        m.id,
        m.nombre,
        p.imagen_url
    FROM platillos AS p
    LEFT JOIN platillosxmenu AS pxm ON p.id = pxm.platilloid
    LEFT JOIN menus AS m ON pxm.menuid = m.id
    LEFT JOIN restaurantes AS r ON m.restaurante_id = r.id
    LEFT JOIN hoteles AS h ON r.hotel_id = h.id
    WHERE
        (p.nombre ILIKE '%' || p_nombre || '%') AND
        (p_hotel_id = -1 OR h.id = p_hotel_id) AND
        (p_restaurante_id = -1 OR r.id = p_restaurante_id) AND
        (p_menu_id = -1 OR m.id = p_menu_id) AND
        p.activo = TRUE
    ORDER BY
        p.nombre ASC;
END;
$$ LANGUAGE plpgsql;

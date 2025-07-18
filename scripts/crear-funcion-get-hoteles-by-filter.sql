-- Función para filtrar hoteles según el rol del usuario
CREATE OR REPLACE FUNCTION get_hoteles_by_filter(p_aux_hotel_id INTEGER)
RETURNS TABLE(id INTEGER, nombre TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT h.id, h.nombre
    FROM hoteles h
    WHERE (h.id = p_aux_hotel_id OR p_aux_hotel_id = -1)
    ORDER BY h.nombre ASC;
END;
$$ LANGUAGE plpgsql;

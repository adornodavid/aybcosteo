-- Crear función para obtener hoteles filtrados con opción "Todos"
CREATE OR REPLACE FUNCTION get_filtered_hoteles_with_all(p_aux_hotel_id INTEGER)
RETURNS TABLE(id INTEGER, nombre TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT -1 as id, 'Todos'::TEXT as nombre
  UNION
  SELECT h.id, h.nombre
  FROM hoteles h
  WHERE (h.id = p_aux_hotel_id OR p_aux_hotel_id = -1)
  ORDER BY nombre ASC;
END;
$$ LANGUAGE plpgsql;

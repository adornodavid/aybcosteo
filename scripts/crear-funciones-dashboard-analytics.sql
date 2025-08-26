-- Función para obtener cambios significativos en costos de platillos
CREATE OR REPLACE FUNCTION obtener_cambios_costos_platillos()
RETURNS TABLE (
  nombre TEXT,
  costo_inicial NUMERIC,
  costo_actual NUMERIC,
  variacion_porcentaje NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH costos_platillos AS (
    SELECT 
      h.platilloid,
      p.nombre,
      FIRST_VALUE(h.costototal) OVER (PARTITION BY h.platilloid ORDER BY h.fechacreacion ASC) as costo_inicial,
      FIRST_VALUE(h.costototal) OVER (PARTITION BY h.platilloid ORDER BY h.fechacreacion DESC) as costo_actual,
      ROW_NUMBER() OVER (PARTITION BY h.platilloid ORDER BY h.fechacreacion DESC) as rn
    FROM historico h
    INNER JOIN platillos p ON h.platilloid = p.platilloid
    WHERE p.activo = true
  )
  SELECT 
    cp.nombre,
    cp.costo_inicial,
    cp.costo_actual,
    CASE 
      WHEN cp.costo_actual > 0 THEN 
        ((cp.costo_actual - cp.costo_inicial) / cp.costo_actual) * 100
      ELSE 0
    END as variacion_porcentaje
  FROM costos_platillos cp
  WHERE cp.rn = 1 
    AND cp.costo_inicial != cp.costo_actual
    AND ABS(((cp.costo_actual - cp.costo_inicial) / cp.costo_actual) * 100) >= 5
  ORDER BY ABS(((cp.costo_actual - cp.costo_inicial) / cp.costo_actual) * 100) DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener cambios significativos en costos de recetas
CREATE OR REPLACE FUNCTION obtener_cambios_costos_recetas()
RETURNS TABLE (
  nombre TEXT,
  costo_inicial NUMERIC,
  costo_actual NUMERIC,
  variacion_porcentaje NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH costos_recetas AS (
    SELECT 
      r.recetaid,
      r.nombre,
      FIRST_VALUE(r.costototal) OVER (PARTITION BY r.recetaid ORDER BY r.fechacreacion ASC) as costo_inicial,
      FIRST_VALUE(r.costototal) OVER (PARTITION BY r.recetaid ORDER BY r.fechaactualizacion DESC) as costo_actual,
      ROW_NUMBER() OVER (PARTITION BY r.recetaid ORDER BY r.fechaactualizacion DESC) as rn
    FROM recetas r
    WHERE r.activo = true
  )
  SELECT 
    cr.nombre,
    cr.costo_inicial,
    cr.costo_actual,
    CASE 
      WHEN cr.costo_actual > 0 THEN 
        ((cr.costo_actual - cr.costo_inicial) / cr.costo_actual) * 100
      ELSE 0
    END as variacion_porcentaje
  FROM costos_recetas cr
  WHERE cr.rn = 1 
    AND cr.costo_inicial != cr.costo_actual
    AND ABS(((cr.costo_actual - cr.costo_inicial) / cr.costo_actual) * 100) >= 5
  ORDER BY ABS(((cr.costo_actual - cr.costo_inicial) / cr.costo_actual) * 100) DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener ingredientes que aumentaron de precio
CREATE OR REPLACE FUNCTION obtener_ingredientes_aumento_precio()
RETURNS TABLE (
  codigo TEXT,
  nombre TEXT,
  costo_inicial NUMERIC,
  costo_actual NUMERIC,
  aumento_porcentaje NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH precios_ingredientes AS (
    SELECT 
      i.clave as codigo,
      i.descripcion as nombre,
      FIRST_VALUE(pu.precio) OVER (PARTITION BY pu.ingredienteid ORDER BY pu.fechainicio ASC) as costo_inicial,
      FIRST_VALUE(pu.precio) OVER (PARTITION BY pu.ingredienteid ORDER BY pu.fechainicio DESC) as costo_actual,
      ROW_NUMBER() OVER (PARTITION BY pu.ingredienteid ORDER BY pu.fechainicio DESC) as rn
    FROM precios_unitarios pu
    INNER JOIN ingredientes i ON pu.ingredienteid = i.ingredienteid
    WHERE i.activo = true
  )
  SELECT 
    pi.codigo,
    pi.nombre,
    pi.costo_inicial,
    pi.costo_actual,
    ((pi.costo_actual - pi.costo_inicial) / pi.costo_inicial) * 100 as aumento_porcentaje
  FROM precios_ingredientes pi
  WHERE pi.rn = 1 
    AND pi.costo_actual > pi.costo_inicial
    AND ((pi.costo_actual - pi.costo_inicial) / pi.costo_inicial) * 100 >= 5
  ORDER BY ((pi.costo_actual - pi.costo_inicial) / pi.costo_inicial) * 100 DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener ingredientes que disminuyeron de precio
CREATE OR REPLACE FUNCTION obtener_ingredientes_disminucion_precio()
RETURNS TABLE (
  codigo TEXT,
  nombre TEXT,
  costo_inicial NUMERIC,
  costo_actual NUMERIC,
  disminucion_porcentaje NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH precios_ingredientes AS (
    SELECT 
      i.clave as codigo,
      i.descripcion as nombre,
      FIRST_VALUE(pu.precio) OVER (PARTITION BY pu.ingredienteid ORDER BY pu.fechainicio ASC) as costo_inicial,
      FIRST_VALUE(pu.precio) OVER (PARTITION BY pu.ingredienteid ORDER BY pu.fechainicio DESC) as costo_actual,
      ROW_NUMBER() OVER (PARTITION BY pu.ingredienteid ORDER BY pu.fechainicio DESC) as rn
    FROM precios_unitarios pu
    INNER JOIN ingredientes i ON pu.ingredienteid = i.ingredienteid
    WHERE i.activo = true
  )
  SELECT 
    pi.codigo,
    pi.nombre,
    pi.costo_inicial,
    pi.costo_actual,
    ((pi.costo_inicial - pi.costo_actual) / pi.costo_inicial) * 100 as disminucion_porcentaje
  FROM precios_ingredientes pi
  WHERE pi.rn = 1 
    AND pi.costo_inicial > pi.costo_actual
    AND ((pi.costo_inicial - pi.costo_actual) / pi.costo_inicial) * 100 >= 5
  ORDER BY ((pi.costo_inicial - pi.costo_actual) / pi.costo_inicial) * 100 DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

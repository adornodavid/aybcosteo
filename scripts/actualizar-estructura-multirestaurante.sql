-- Rediseño de la estructura para un enfoque multi-restaurante

-- 1. Asegurarnos que tenemos las extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear o actualizar la tabla de restaurantes (entidad principal)
DROP TABLE IF EXISTS restaurantes CASCADE;
CREATE TABLE restaurantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  direccion TEXT,
  telefono VARCHAR(50),
  email VARCHAR(255),
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla de categorías por restaurante
DROP TABLE IF EXISTS categorias CASCADE;
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurante_id, nombre)
);

-- 4. Crear tabla de ingredientes por restaurante
DROP TABLE IF EXISTS ingredientes CASCADE;
CREATE TABLE ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  clave VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  unidad VARCHAR(50) NOT NULL, -- Unidad base (kg, litros, piezas)
  precio_unitario DECIMAL(12,4) NOT NULL DEFAULT 0, -- Precio por unidad base
  conversion_unidad VARCHAR(50), -- Unidad de conversión (g, ml, etc)
  factor_conversion DECIMAL(12,4), -- Factor para convertir (1kg = 1000g)
  precio_unitario_convertido DECIMAL(12,6), -- Precio por unidad convertida
  proveedor VARCHAR(255),
  marca VARCHAR(255),
  notas TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurante_id, clave)
);

-- 5. Crear tabla de platillos por restaurante
DROP TABLE IF EXISTS platillos CASCADE;
CREATE TABLE platillos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  instrucciones TEXT, -- Instrucciones de preparación
  imagen_url TEXT,
  costo_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  tiempo_preparacion INTEGER, -- En minutos
  porciones INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurante_id, nombre)
);

-- 6. Crear tabla de ingredientes por platillo
DROP TABLE IF EXISTS platillos_ingredientes CASCADE;
CREATE TABLE platillos_ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platillo_id UUID NOT NULL REFERENCES platillos(id) ON DELETE CASCADE,
  ingrediente_id UUID NOT NULL REFERENCES ingredientes(id) ON DELETE RESTRICT,
  cantidad DECIMAL(12,4) NOT NULL,
  unidad_porcion VARCHAR(50) NOT NULL, -- Unidad usada en la receta
  costo_parcial DECIMAL(12,2) NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platillo_id, ingrediente_id)
);

-- 7. Crear tabla de menús por restaurante
DROP TABLE IF EXISTS menus CASCADE;
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  imagen_url TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurante_id, nombre)
);

-- 8. Crear tabla de categorías de menú (entradas, platos fuertes, postres, etc.)
DROP TABLE IF EXISTS categorias_menu CASCADE;
CREATE TABLE categorias_menu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurante_id, nombre)
);

-- 9. Crear tabla de platillos en menú
DROP TABLE IF EXISTS menu_platillos CASCADE;
CREATE TABLE menu_platillos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  platillo_id UUID NOT NULL REFERENCES platillos(id) ON DELETE RESTRICT,
  categoria_menu_id UUID REFERENCES categorias_menu(id) ON DELETE SET NULL,
  precio_venta DECIMAL(12,2) NOT NULL,
  disponible BOOLEAN DEFAULT true,
  destacado BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_id, platillo_id)
);

-- 10. Crear tabla de historial de precios de ingredientes
DROP TABLE IF EXISTS historial_precios_ingredientes CASCADE;
CREATE TABLE historial_precios_ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingrediente_id UUID NOT NULL REFERENCES ingredientes(id) ON DELETE CASCADE,
  precio DECIMAL(12,4) NOT NULL,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Crear índices para mejorar el rendimiento
CREATE INDEX idx_ingredientes_restaurante ON ingredientes(restaurante_id);
CREATE INDEX idx_platillos_restaurante ON platillos(restaurante_id);
CREATE INDEX idx_categorias_restaurante ON categorias(restaurante_id);
CREATE INDEX idx_menus_restaurante ON menus(restaurante_id);
CREATE INDEX idx_platillos_ingredientes_platillo ON platillos_ingredientes(platillo_id);
CREATE INDEX idx_menu_platillos_menu ON menu_platillos(menu_id);
CREATE INDEX idx_historial_precios_ingrediente ON historial_precios_ingredientes(ingrediente_id);

-- 12. Crear vistas para facilitar consultas comunes
CREATE OR REPLACE VIEW vista_platillos_completos AS
SELECT 
  p.id,
  p.restaurante_id,
  p.nombre,
  p.descripcion,
  p.costo_total,
  r.nombre AS restaurante,
  COUNT(pi.id) AS num_ingredientes,
  p.created_at,
  p.updated_at
FROM platillos p
JOIN restaurantes r ON p.restaurante_id = r.id
LEFT JOIN platillos_ingredientes pi ON p.id = pi.platillo_id
GROUP BY p.id, r.nombre;

CREATE OR REPLACE VIEW vista_menu_completo AS
SELECT 
  mp.id,
  m.restaurante_id,
  m.nombre AS menu_nombre,
  p.nombre AS platillo_nombre,
  cm.nombre AS categoria_menu,
  mp.precio_venta,
  p.costo_total,
  (mp.precio_venta - p.costo_total) AS margen_bruto,
  CASE WHEN mp.precio_venta > 0 
       THEN ROUND(((mp.precio_venta - p.costo_total) / mp.precio_venta) * 100, 2)
       ELSE 0 
  END AS porcentaje_margen,
  mp.disponible,
  mp.destacado
FROM menu_platillos mp
JOIN menus m ON mp.menu_id = m.id
JOIN platillos p ON mp.platillo_id = p.id
LEFT JOIN categorias_menu cm ON mp.categoria_menu_id = cm.id;

-- 13. Crear función para calcular costo total de un platillo
CREATE OR REPLACE FUNCTION calcular_costo_platillo(platillo_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  costo_total DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(costo_parcial), 0)
  INTO costo_total
  FROM platillos_ingredientes
  WHERE platillo_id = platillo_uuid;
  
  UPDATE platillos
  SET costo_total = costo_total,
      updated_at = NOW()
  WHERE id = platillo_uuid;
  
  RETURN costo_total;
END;
$$ LANGUAGE plpgsql;

-- 14. Crear trigger para actualizar costo de platillo cuando se modifican ingredientes
CREATE OR REPLACE FUNCTION actualizar_costo_platillo_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calcular_costo_platillo(NEW.platillo_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_costo_platillo
AFTER INSERT OR UPDATE OR DELETE ON platillos_ingredientes
FOR EACH ROW EXECUTE FUNCTION actualizar_costo_platillo_trigger();

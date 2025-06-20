-- 1. Eliminar tablas existentes para recrearlas con la estructura correcta
DROP TABLE IF EXISTS restaurante_menus CASCADE;
DROP TABLE IF EXISTS menu_platillos CASCADE;
DROP TABLE IF EXISTS platillo_ingredientes CASCADE;
DROP TABLE IF EXISTS precios_unitarios CASCADE;
DROP TABLE IF EXISTS platillos CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS restaurantes CASCADE;
DROP TABLE IF EXISTS ingredientes CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

-- 2. Crear tabla de categorías
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla de ingredientes con la estructura correcta
CREATE TABLE ingredientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  unidad VARCHAR(50) NOT NULL, -- Unidad base (kg, litros, piezas)
  precio_unitario DECIMAL(10,4) NOT NULL DEFAULT 0, -- Precio por unidad base
  conversion_unidad VARCHAR(50), -- Unidad de conversión (gramos, ml, etc)
  factor_conversion DECIMAL(10,4), -- Factor para convertir (1kg = 1000g)
  precio_unitario_convertido DECIMAL(10,6), -- Precio por unidad convertida
  status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla de platillos
CREATE TABLE platillos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  instrucciones TEXT, -- Instrucciones de elaboración
  imagen_url TEXT,
  costo_total DECIMAL(10,4) NOT NULL DEFAULT 0, -- Calculado automáticamente
  tiempo_preparacion INTEGER, -- Tiempo en minutos
  porciones INTEGER DEFAULT 1, -- Número de porciones que rinde
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear tabla de ingredientes por platillo
CREATE TABLE platillo_ingredientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platillo_id UUID NOT NULL REFERENCES platillos(id) ON DELETE CASCADE,
  ingrediente_id UUID NOT NULL REFERENCES ingredientes(id) ON DELETE CASCADE,
  cantidad DECIMAL(10,4) NOT NULL, -- Cantidad en unidad de porción
  unidad_porcion VARCHAR(50) NOT NULL, -- Unidad usada en la receta
  costo_parcial DECIMAL(10,4) NOT NULL DEFAULT 0, -- Calculado automáticamente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platillo_id, ingrediente_id)
);

-- 6. Crear tabla de menús
CREATE TABLE menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Crear tabla de platillos por menú
CREATE TABLE menu_platillos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  platillo_id UUID NOT NULL REFERENCES platillos(id) ON DELETE CASCADE,
  precio_venta DECIMAL(10,2) NOT NULL, -- Precio que se cobra al cliente
  disponible BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0, -- Para ordenar los platillos en el menú
  categoria_menu VARCHAR(100), -- Entradas, Platos Fuertes, Postres, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_id, platillo_id)
);

-- 8. Crear tabla de restaurantes
CREATE TABLE restaurantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Crear tabla de menús por restaurante
CREATE TABLE restaurante_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT true,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurante_id, menu_id)
);

-- 10. Crear índices para mejorar el rendimiento
CREATE INDEX idx_ingredientes_categoria ON ingredientes(categoria_id);
CREATE INDEX idx_ingredientes_status ON ingredientes(status);
CREATE INDEX idx_ingredientes_clave ON ingredientes(clave);
CREATE INDEX idx_platillo_ingredientes_platillo ON platillo_ingredientes(platillo_id);
CREATE INDEX idx_platillo_ingredientes_ingrediente ON platillo_ingredientes(ingrediente_id);
CREATE INDEX idx_menu_platillos_menu ON menu_platillos(menu_id);
CREATE INDEX idx_menu_platillos_platillo ON menu_platillos(platillo_id);
CREATE INDEX idx_restaurante_menus_restaurante ON restaurante_menus(restaurante_id);
CREATE INDEX idx_restaurante_menus_menu ON restaurante_menus(menu_id);

-- 11. Crear funciones para cálculos automáticos
CREATE OR REPLACE FUNCTION calcular_costo_platillo(platillo_id_param UUID)
RETURNS DECIMAL(10,4) AS $$
DECLARE
  costo_total DECIMAL(10,4) := 0;
BEGIN
  SELECT COALESCE(SUM(pi.costo_parcial), 0)
  INTO costo_total
  FROM platillo_ingredientes pi
  WHERE pi.platillo_id = platillo_id_param;
  
  RETURN costo_total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calcular_costo_ingrediente(
  ingrediente_id_param UUID,
  cantidad_param DECIMAL(10,4),
  unidad_porcion_param VARCHAR(50)
)
RETURNS DECIMAL(10,4) AS $$
DECLARE
  precio_por_unidad DECIMAL(10,6) := 0;
  costo DECIMAL(10,4) := 0;
  ingrediente_record RECORD;
BEGIN
  SELECT * INTO ingrediente_record
  FROM ingredientes
  WHERE id = ingrediente_id_param;
  
  -- Si la unidad de porción coincide con la unidad base
  IF ingrediente_record.unidad = unidad_porcion_param THEN
    precio_por_unidad := ingrediente_record.precio_unitario;
  -- Si la unidad de porción coincide con la unidad de conversión
  ELSIF ingrediente_record.conversion_unidad = unidad_porcion_param THEN
    precio_por_unidad := ingrediente_record.precio_unitario_convertido;
  -- Si no coincide, usar precio base
  ELSE
    precio_por_unidad := ingrediente_record.precio_unitario;
  END IF;
  
  costo := cantidad_param * precio_por_unidad;
  RETURN costo;
END;
$$ LANGUAGE plpgsql;

-- 12. Crear triggers para actualizar costos automáticamente
CREATE OR REPLACE FUNCTION actualizar_costo_platillo_ingrediente()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular el costo parcial del ingrediente
  NEW.costo_parcial := calcular_costo_ingrediente(
    NEW.ingrediente_id,
    NEW.cantidad,
    NEW.unidad_porcion
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_costo_ingrediente
  BEFORE INSERT OR UPDATE ON platillo_ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_costo_platillo_ingrediente();

CREATE OR REPLACE FUNCTION actualizar_costo_total_platillo()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el costo total del platillo
  UPDATE platillos
  SET costo_total = calcular_costo_platillo(COALESCE(NEW.platillo_id, OLD.platillo_id)),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.platillo_id, OLD.platillo_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_costo_platillo
  AFTER INSERT OR UPDATE OR DELETE ON platillo_ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_costo_total_platillo();

-- 13. Insertar categorías por defecto
INSERT INTO categorias (nombre, descripcion) VALUES
('Aceites y Grasas', 'Aceites vegetales, mantequilla, margarina, etc.'),
('Harinas y Cereales', 'Harina de trigo, arroz, avena, quinoa, etc.'),
('Lácteos y Huevos', 'Leche, queso, yogurt, huevos, crema, etc.'),
('Verduras y Hortalizas', 'Tomate, cebolla, lechuga, zanahoria, etc.'),
('Frutas', 'Manzana, plátano, naranja, limón, etc.'),
('Carnes y Aves', 'Res, cerdo, pollo, pavo, etc.'),
('Pescados y Mariscos', 'Salmón, atún, camarón, pulpo, etc.'),
('Condimentos y Especias', 'Sal, pimienta, orégano, comino, etc.'),
('Leguminosas', 'Frijol, lenteja, garbanzo, etc.'),
('Bebidas', 'Agua, refrescos, jugos, etc.'),
('Panadería y Repostería', 'Pan, galletas, pasteles, etc.'),
('Conservas y Enlatados', 'Atún enlatado, chiles en vinagre, etc.'),
('Productos Congelados', 'Verduras congeladas, helados, etc.'),
('Otros', 'Productos que no encajan en otras categorías');

-- 14. Crear vista para análisis de costos y márgenes
CREATE OR REPLACE VIEW vista_analisis_menu AS
SELECT 
  r.nombre AS restaurante,
  m.nombre AS menu,
  p.nombre AS platillo,
  p.costo_total,
  mp.precio_venta,
  (mp.precio_venta - p.costo_total) AS ganancia_bruta,
  CASE 
    WHEN mp.precio_venta > 0 THEN 
      ROUND(((mp.precio_venta - p.costo_total) / mp.precio_venta * 100)::numeric, 2)
    ELSE 0 
  END AS margen_porcentaje,
  mp.disponible,
  mp.categoria_menu
FROM restaurantes r
JOIN restaurante_menus rm ON r.id = rm.restaurante_id
JOIN menus m ON rm.menu_id = m.id
JOIN menu_platillos mp ON m.id = mp.menu_id
JOIN platillos p ON mp.platillo_id = p.id
WHERE rm.activo = true AND mp.disponible = true
ORDER BY r.nombre, m.nombre, mp.categoria_menu, p.nombre;

-- 15. Verificar que todas las tablas se crearon correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('categorias', 'ingredientes', 'platillos', 'platillo_ingredientes', 'menus', 'menu_platillos', 'restaurantes', 'restaurante_menus')
ORDER BY table_name, ordinal_position;

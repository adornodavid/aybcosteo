-- =============================================
-- ESTRUCTURA CORRECTA PARA SISTEMA DE COSTEO
-- Siguiendo la lógica original del Excel y requerimientos
-- =============================================

-- 1. Limpiar tablas existentes
DROP TABLE IF EXISTS restaurante_menus CASCADE;
DROP TABLE IF EXISTS menu_platillos CASCADE;
DROP TABLE IF EXISTS platillo_ingredientes CASCADE;
DROP TABLE IF EXISTS platillos_ingredientes CASCADE;
DROP TABLE IF EXISTS precios_unitarios CASCADE;
DROP TABLE IF EXISTS platillos CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS restaurantes CASCADE;
DROP TABLE IF EXISTS ingredientes CASCADE;
DROP TABLE IF EXISTS ingredientes_restaurante CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

-- =============================================
-- TABLAS PRINCIPALES
-- =============================================

-- 1. Tabla de categorías (para clasificar ingredientes)
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de restaurantes/hoteles
CREATE TABLE restaurantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de ingredientes (estructura basada en Excel original)
CREATE TABLE ingredientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave VARCHAR(50) NOT NULL, -- Clave del Excel
  descripcion TEXT NOT NULL, -- Descripción del ingrediente
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  tipo VARCHAR(100), -- Tipo del Excel
  unidad_medida VARCHAR(50) NOT NULL, -- Unidad de medida del Excel
  cantidad_por_presentacion DECIMAL(10,4) DEFAULT 1.0, -- Cantidad por presentación
  conversion VARCHAR(50), -- Conversión del Excel (gramos, ml, etc.)
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar duplicados por restaurante
  UNIQUE(clave, restaurante_id)
);

-- 4. Tabla de precios unitarios (HISTÓRICO como especificaste)
CREATE TABLE precios_unitarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingrediente_id UUID NOT NULL REFERENCES ingredientes(id) ON DELETE CASCADE,
  precio DECIMAL(10,6) NOT NULL, -- Precio unitario (por unidad de conversión)
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE, -- NULL = precio actual vigente
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Solo un precio activo por ingrediente
  EXCLUDE USING gist (
    ingrediente_id WITH =,
    daterange(fecha_inicio, COALESCE(fecha_fin, 'infinity'::date), '[)') WITH &&
  )
);

-- 5. Tabla de platillos
CREATE TABLE platillos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  instrucciones TEXT, -- Instrucciones de elaboración
  imagen_url TEXT,
  costo_total DECIMAL(10,4) NOT NULL DEFAULT 0, -- Calculado automáticamente
  tiempo_preparacion INTEGER, -- Tiempo en minutos
  porciones INTEGER DEFAULT 1, -- Número de porciones
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de ingredientes por platillo
CREATE TABLE platillo_ingredientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platillo_id UUID NOT NULL REFERENCES platillos(id) ON DELETE CASCADE,
  ingrediente_id UUID NOT NULL REFERENCES ingredientes(id) ON DELETE CASCADE,
  cantidad DECIMAL(10,4) NOT NULL, -- Cantidad usada en la receta
  unidad_usada VARCHAR(50) NOT NULL, -- Unidad usada en la receta
  costo_parcial DECIMAL(10,4) NOT NULL DEFAULT 0, -- Calculado automáticamente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platillo_id, ingrediente_id)
);

-- 7. Tabla de menús
CREATE TABLE menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(nombre, restaurante_id)
);

-- 8. Tabla de platillos por menú
CREATE TABLE menu_platillos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  platillo_id UUID NOT NULL REFERENCES platillos(id) ON DELETE CASCADE,
  precio_venta DECIMAL(10,2) NOT NULL, -- Precio que se cobra al cliente
  categoria_menu VARCHAR(100), -- Entradas, Platos Fuertes, Postres, etc.
  orden INTEGER DEFAULT 0, -- Para ordenar en el menú
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(menu_id, platillo_id)
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_ingredientes_restaurante ON ingredientes(restaurante_id);
CREATE INDEX idx_ingredientes_categoria ON ingredientes(categoria_id);
CREATE INDEX idx_ingredientes_status ON ingredientes(status);
CREATE INDEX idx_precios_ingrediente_activo ON precios_unitarios(ingrediente_id) WHERE fecha_fin IS NULL;
CREATE INDEX idx_platillo_ingredientes_platillo ON platillo_ingredientes(platillo_id);
CREATE INDEX idx_menu_platillos_menu ON menu_platillos(menu_id);

-- =============================================
-- FUNCIONES PARA CÁLCULOS AUTOMÁTICOS
-- =============================================

-- Función para obtener precio actual de un ingrediente
CREATE OR REPLACE FUNCTION obtener_precio_actual(ingrediente_id_param UUID)
RETURNS DECIMAL(10,6) AS $$
DECLARE
  precio_actual DECIMAL(10,6) := 0;
BEGIN
  SELECT precio INTO precio_actual
  FROM precios_unitarios
  WHERE ingrediente_id = ingrediente_id_param
    AND fecha_fin IS NULL
  ORDER BY fecha_inicio DESC
  LIMIT 1;
  
  RETURN COALESCE(precio_actual, 0);
END;
$$ LANGUAGE plpgsql;

-- Función para calcular costo de ingrediente en platillo
CREATE OR REPLACE FUNCTION calcular_costo_ingrediente_platillo(
  ingrediente_id_param UUID,
  cantidad_param DECIMAL(10,4),
  unidad_usada_param VARCHAR(50)
)
RETURNS DECIMAL(10,4) AS $$
DECLARE
  precio_unitario DECIMAL(10,6);
  factor_conversion DECIMAL(10,4) := 1.0;
  costo_total DECIMAL(10,4);
  ingrediente_record RECORD;
BEGIN
  -- Obtener datos del ingrediente
  SELECT * INTO ingrediente_record
  FROM ingredientes
  WHERE id = ingrediente_id_param;
  
  -- Obtener precio actual
  precio_unitario := obtener_precio_actual(ingrediente_id_param);
  
  -- Calcular factor de conversión si es necesario
  IF unidad_usada_param != ingrediente_record.conversion THEN
    -- Aquí puedes agregar lógica de conversión más compleja
    -- Por ahora, asumimos que el precio ya está en la unidad correcta
    factor_conversion := 1.0;
  END IF;
  
  costo_total := cantidad_param * precio_unitario * factor_conversion;
  
  RETURN costo_total;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =============================================

-- Trigger para actualizar costo parcial en platillo_ingredientes
CREATE OR REPLACE FUNCTION actualizar_costo_parcial_ingrediente()
RETURNS TRIGGER AS $$
BEGIN
  NEW.costo_parcial := calcular_costo_ingrediente_platillo(
    NEW.ingrediente_id,
    NEW.cantidad,
    NEW.unidad_usada
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_costo_parcial
  BEFORE INSERT OR UPDATE ON platillo_ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_costo_parcial_ingrediente();

-- Trigger para actualizar costo total del platillo
CREATE OR REPLACE FUNCTION actualizar_costo_total_platillo()
RETURNS TRIGGER AS $$
DECLARE
  platillo_id_target UUID;
  nuevo_costo_total DECIMAL(10,4);
BEGIN
  -- Determinar el platillo afectado
  platillo_id_target := COALESCE(NEW.platillo_id, OLD.platillo_id);
  
  -- Calcular nuevo costo total
  SELECT COALESCE(SUM(costo_parcial), 0)
  INTO nuevo_costo_total
  FROM platillo_ingredientes
  WHERE platillo_id = platillo_id_target;
  
  -- Actualizar el platillo
  UPDATE platillos
  SET costo_total = nuevo_costo_total,
      updated_at = NOW()
  WHERE id = platillo_id_target;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_costo_platillo
  AFTER INSERT OR UPDATE OR DELETE ON platillo_ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_costo_total_platillo();

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Categorías básicas
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

-- Restaurante de ejemplo
INSERT INTO restaurantes (id, nombre, descripcion) VALUES
('eb492bec-f87a-4bda-917f-4e8109ec914c', 'Montana iStay', 'Hotel y restaurante principal');

-- =============================================
-- VISTA PARA ANÁLISIS
-- =============================================

CREATE OR REPLACE VIEW vista_ingredientes_completa AS
SELECT 
  i.id,
  i.clave,
  i.descripcion,
  i.status,
  i.tipo,
  i.unidad_medida,
  i.cantidad_por_presentacion,
  i.conversion,
  c.nombre as categoria_nombre,
  r.nombre as restaurante_nombre,
  p.precio as precio_actual,
  p.fecha_inicio as precio_fecha_inicio,
  i.created_at
FROM ingredientes i
LEFT JOIN categorias c ON i.categoria_id = c.id
LEFT JOIN restaurantes r ON i.restaurante_id = r.id
LEFT JOIN precios_unitarios p ON i.id = p.ingrediente_id AND p.fecha_fin IS NULL
ORDER BY i.descripcion;

COMMENT ON VIEW vista_ingredientes_completa IS 'Vista completa de ingredientes con precios actuales y relaciones';

-- Verificar estructura
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('categorias', 'restaurantes', 'ingredientes', 'precios_unitarios', 'platillos', 'platillo_ingredientes', 'menus', 'menu_platillos')
ORDER BY table_name, ordinal_position;

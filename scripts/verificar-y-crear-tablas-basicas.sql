-- Script para verificar y crear solo las tablas básicas necesarias
-- Sin relaciones complejas para empezar

-- 1. Crear tabla de restaurantes (hoteles)
CREATE TABLE IF NOT EXISTS restaurantes (
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

-- 2. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla de ingredientes (sin foreign keys por ahora)
CREATE TABLE IF NOT EXISTS ingredientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave VARCHAR(50) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria_id UUID,
  status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  tipo VARCHAR(100),
  unidad_medida VARCHAR(50) NOT NULL,
  cantidad_por_presentacion DECIMAL(10,4) DEFAULT 1.0,
  conversion VARCHAR(50),
  restaurante_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla de platillos (sin foreign keys por ahora)
CREATE TABLE IF NOT EXISTS platillos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  instrucciones TEXT,
  imagen_url TEXT,
  costo_total DECIMAL(10,4) NOT NULL DEFAULT 0,
  tiempo_preparacion INTEGER,
  porciones INTEGER DEFAULT 1,
  restaurante_id UUID,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insertar categorías básicas si no existen
INSERT INTO categorias (nombre, descripcion) VALUES
('Aceites y Grasas', 'Aceites vegetales, mantequilla, margarina, etc.'),
('Harinas y Cereales', 'Harina de trigo, arroz, avena, quinoa, etc.'),
('Lácteos y Huevos', 'Leche, queso, yogurt, huevos, crema, etc.'),
('Verduras y Hortalizas', 'Tomate, cebolla, lechuga, zanahoria, etc.'),
('Frutas', 'Manzana, plátano, naranja, limón, etc.'),
('Carnes y Aves', 'Res, cerdo, pollo, pavo, etc.'),
('Pescados y Mariscos', 'Salmón, atún, camarón, pulpo, etc.'),
('Condimentos y Especias', 'Sal, pimienta, orégano, comino, etc.'),
('Otros', 'Productos que no encajan en otras categorías')
ON CONFLICT (nombre) DO NOTHING;

-- 6. Insertar restaurante de ejemplo si no existe
INSERT INTO restaurantes (nombre, descripcion) VALUES
('Montana iStay', 'Hotel y restaurante principal')
ON CONFLICT DO NOTHING;

-- Verificar que las tablas se crearon correctamente
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('restaurantes', 'categorias', 'ingredientes', 'platillos')
ORDER BY table_name, ordinal_position;

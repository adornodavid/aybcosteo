-- Crear las tablas según la estructura requerida

-- 1. Tabla categorias (ya existe, pero verificamos)
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla ingredientes_restaurante
DROP TABLE IF EXISTS ingredientes_restaurante CASCADE;
CREATE TABLE ingredientes_restaurante (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  ingrediente VARCHAR(255),
  tipo VARCHAR(255),
  metrica VARCHAR(100),
  cantidad DECIMAL(12,4),
  conversion DECIMAL(12,4),
  metrica_conversion VARCHAR(100),
  cantidad_conversion DECIMAL(12,4),
  status VARCHAR(20) DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla precios_unitarios
DROP TABLE IF EXISTS precios_unitarios CASCADE;
CREATE TABLE precios_unitarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingrediente_id UUID REFERENCES ingredientes_restaurante(id) ON DELETE CASCADE,
  precio_total DECIMAL(12,2) NOT NULL,
  precio_unitario DECIMAL(12,6) NOT NULL,
  unidad VARCHAR(100) NOT NULL,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_ingredientes_restaurante_id ON ingredientes_restaurante(restaurante_id);
CREATE INDEX idx_ingredientes_categoria_id ON ingredientes_restaurante(categoria_id);
CREATE INDEX idx_precios_ingrediente_id ON precios_unitarios(ingrediente_id);
CREATE INDEX idx_precios_fecha_fin ON precios_unitarios(fecha_fin);

-- Verificar las estructuras creadas
SELECT 'ingredientes_restaurante' as tabla, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ingredientes_restaurante'
UNION ALL
SELECT 'precios_unitarios' as tabla, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'precios_unitarios'
ORDER BY tabla, column_name;

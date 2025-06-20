-- Actualizar la tabla ingredientes para coincidir exactamente con el archivo Excel

-- Primero, verificar la estructura actual
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ingredientes'
ORDER BY ordinal_position;

-- Recrear la tabla ingredientes con la estructura exacta del Excel
DROP TABLE IF EXISTS ingredientes CASCADE;

CREATE TABLE ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  id_excel VARCHAR(50), -- Campo "id" del Excel
  descripcion TEXT NOT NULL, -- Campo "descripcion" del Excel
  categoria VARCHAR(255), -- Campo "Categoria" del Excel
  ingrediente VARCHAR(255), -- Campo "Ingrediente" del Excel
  tipo VARCHAR(255), -- Campo "Tipo" del Excel
  metrica VARCHAR(100), -- Campo "Metrica" del Excel
  cantidad DECIMAL(12,4), -- Campo "Cantidad" del Excel
  conversion DECIMAL(12,4), -- Campo "Conversion" del Excel
  metrica_conversion VARCHAR(100), -- Campo "Metrica conversion" del Excel
  cantidad_conversion DECIMAL(12,4), -- Campo "Cantidad Conversion" del Excel
  precio_total DECIMAL(12,2), -- Campo "Precio total" del Excel
  precio_unitario DECIMAL(12,4), -- Campo "Precio Unitario" del Excel
  status VARCHAR(20) DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_ingredientes_restaurante_id ON ingredientes(restaurante_id);
CREATE INDEX idx_ingredientes_categoria ON ingredientes(categoria);
CREATE INDEX idx_ingredientes_id_excel ON ingredientes(id_excel);

-- Verificar la nueva estructura
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ingredientes'
ORDER BY ordinal_position;

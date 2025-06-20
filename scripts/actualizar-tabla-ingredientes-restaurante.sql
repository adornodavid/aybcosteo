-- Actualizar la tabla ingredientes_restaurante para incluir las nuevas columnas
ALTER TABLE ingredientes_restaurante 
ADD COLUMN IF NOT EXISTS clave_innsist VARCHAR(50),
ADD COLUMN IF NOT EXISTS clave_rapsodia VARCHAR(50),
ADD COLUMN IF NOT EXISTS precio_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(10,4);

-- Crear índices para mejorar el rendimiento en las búsquedas
CREATE INDEX IF NOT EXISTS idx_ingredientes_restaurante_clave_innsist 
ON ingredientes_restaurante(restaurante_id, clave_innsist);

CREATE INDEX IF NOT EXISTS idx_ingredientes_restaurante_clave_rapsodia 
ON ingredientes_restaurante(restaurante_id, clave_rapsodia);

CREATE INDEX IF NOT EXISTS idx_ingredientes_restaurante_descripcion 
ON ingredientes_restaurante(restaurante_id, descripcion);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN ingredientes_restaurante.clave_innsist IS 'Clave única del sistema Innsist';
COMMENT ON COLUMN ingredientes_restaurante.clave_rapsodia IS 'Clave única del sistema Rapsodia';
COMMENT ON COLUMN ingredientes_restaurante.precio_total IS 'Precio total de la presentación';
COMMENT ON COLUMN ingredientes_restaurante.precio_unitario IS 'Precio por unidad base';

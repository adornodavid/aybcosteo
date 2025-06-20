-- Primero, agregar la columna hotel_id a restaurantes si no existe
ALTER TABLE restaurantes 
ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES hoteles(id);

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_restaurantes_hotel_id ON restaurantes(hotel_id);

-- Actualizar los restaurantes existentes para asignarlos al hotel iStay
UPDATE restaurantes 
SET hotel_id = (SELECT id FROM hoteles WHERE nombre = 'iStay Monterrey Centro' LIMIT 1)
WHERE hotel_nombre = 'iStay Monterrey Centro' OR hotel_nombre = 'iStay';

-- Verificar que se actualizó correctamente
SELECT 
  r.nombre as restaurante,
  r.hotel_nombre,
  h.nombre as hotel_real
FROM restaurantes r
LEFT JOIN hoteles h ON r.hotel_id = h.id;

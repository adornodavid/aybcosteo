-- Añadir los campos faltantes a la tabla restaurantes
ALTER TABLE restaurantes 
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

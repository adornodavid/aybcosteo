-- Agregar columnas de fecha a la tabla recetas si no existen
ALTER TABLE recetas 
ADD COLUMN IF NOT EXISTS fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS fechamodificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Agregar columna imgurl si no existe
ALTER TABLE recetas 
ADD COLUMN IF NOT EXISTS imgurl TEXT;

-- Crear trigger para actualizar fechamodificacion automáticamente
CREATE OR REPLACE FUNCTION update_fechamodificacion_recetas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fechamodificacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS trigger_update_fechamodificacion_recetas ON recetas;
CREATE TRIGGER trigger_update_fechamodificacion_recetas
    BEFORE UPDATE ON recetas
    FOR EACH ROW
    EXECUTE FUNCTION update_fechamodificacion_recetas();

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'recetas'
ORDER BY ordinal_position;

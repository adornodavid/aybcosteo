-- Verificar estructura actual de restaurantes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'restaurantes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Agregar campos de hotel si no existen
DO $$ 
BEGIN
    -- Agregar campo hotel_nombre si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes' 
        AND column_name = 'hotel_nombre'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE restaurantes ADD COLUMN hotel_nombre VARCHAR(200);
    END IF;
    
    -- Agregar campo es_hotel si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurantes' 
        AND column_name = 'es_hotel'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE restaurantes ADD COLUMN es_hotel BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Mostrar estructura actualizada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'restaurantes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

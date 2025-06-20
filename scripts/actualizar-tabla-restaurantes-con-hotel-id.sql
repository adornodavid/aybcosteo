-- Agregar columna hotel_id a la tabla restaurantes si no existe
ALTER TABLE public.restaurantes 
ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hoteles(id) ON DELETE SET NULL;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_restaurantes_hotel_id ON public.restaurantes(hotel_id);

-- Eliminar la columna hotel_nombre si existe (ya no la necesitamos)
ALTER TABLE public.restaurantes 
DROP COLUMN IF EXISTS hotel_nombre;

-- Verificar la estructura actualizada
SELECT 'Tabla restaurantes actualizada correctamente' as mensaje;

-- Mostrar estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'restaurantes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

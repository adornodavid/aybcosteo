-- Crear tabla hoteles si no existe
CREATE TABLE IF NOT EXISTS public.hoteles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    shortname VARCHAR(50), -- Nombre corto para reportes
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_hoteles_nombre ON public.hoteles(nombre);
CREATE INDEX IF NOT EXISTS idx_hoteles_activo ON public.hoteles(activo);
CREATE INDEX IF NOT EXISTS idx_hoteles_shortname ON public.hoteles(shortname);

-- Insertar el hotel que ya tienes (iStay Monterrey Centro)
INSERT INTO public.hoteles (nombre, descripcion, activo)
SELECT 
    'iStay Monterrey Centro',
    'Hotel boutique en el centro de Monterrey',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.hoteles WHERE nombre = 'iStay Monterrey Centro'
);

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla hoteles creada exitosamente' as mensaje;
SELECT COUNT(*) as total_hoteles FROM public.hoteles;
SELECT nombre, created_at FROM public.hoteles ORDER BY created_at;

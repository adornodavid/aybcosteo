-- ===================================
-- CREAR TABLA HOTELES
-- ===================================
CREATE TABLE IF NOT EXISTS public.hoteles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    shortname VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para hoteles
CREATE INDEX IF NOT EXISTS idx_hoteles_nombre ON public.hoteles(nombre);
CREATE INDEX IF NOT EXISTS idx_hoteles_activo ON public.hoteles(activo);

-- ===================================
-- CREAR TABLA HOTELES_RESTAURANTES (RELACIÓN)
-- ===================================
CREATE TABLE IF NOT EXISTS public.hoteles_restaurantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID NOT NULL REFERENCES public.hoteles(id) ON DELETE CASCADE,
    restaurante_id UUID NOT NULL REFERENCES public.restaurantes(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Evitar duplicados: un restaurante solo puede estar asignado una vez a un hotel
    UNIQUE(hotel_id, restaurante_id)
);

-- Índices para la relación
CREATE INDEX IF NOT EXISTS idx_hoteles_restaurantes_hotel ON public.hoteles_restaurantes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hoteles_restaurantes_restaurante ON public.hoteles_restaurantes(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_hoteles_restaurantes_activo ON public.hoteles_restaurantes(activo);

-- ===================================
-- INSERTAR DATOS INICIALES
-- ===================================

-- Insertar tu hotel existente
INSERT INTO public.hoteles (nombre, descripcion, activo)
SELECT 
    'iStay Monterrey Centro',
    'Hotel boutique en el centro de Monterrey',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.hoteles WHERE nombre = 'iStay Monterrey Centro'
);

-- ===================================
-- VERIFICAR CREACIÓN
-- ===================================
SELECT 'Tablas creadas exitosamente' as mensaje;

-- Mostrar hoteles creados
SELECT 'HOTELES:' as tabla, COUNT(*) as total FROM public.hoteles;
SELECT nombre, created_at FROM public.hoteles ORDER BY created_at;

-- Mostrar estructura de relación
SELECT 'RELACIONES:' as tabla, COUNT(*) as total FROM public.hoteles_restaurantes;

-- Mostrar restaurantes disponibles para asignar
SELECT 'RESTAURANTES DISPONIBLES:' as info, COUNT(*) as total FROM public.restaurantes;
SELECT nombre, created_at FROM public.restaurantes ORDER BY created_at;

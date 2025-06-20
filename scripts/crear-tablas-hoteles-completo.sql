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

-- ===================================
-- CREAR TABLA RELACIÓN HOTELES-RESTAURANTES
-- ===================================
CREATE TABLE IF NOT EXISTS public.hoteles_restaurantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID NOT NULL REFERENCES public.hoteles(id) ON DELETE CASCADE,
    restaurante_id UUID NOT NULL REFERENCES public.restaurantes(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Evitar duplicados
    UNIQUE(hotel_id, restaurante_id)
);

-- ===================================
-- CREAR ÍNDICES PARA RENDIMIENTO
-- ===================================
CREATE INDEX IF NOT EXISTS idx_hoteles_nombre ON public.hoteles(nombre);
CREATE INDEX IF NOT EXISTS idx_hoteles_activo ON public.hoteles(activo);
CREATE INDEX IF NOT EXISTS idx_hoteles_shortname ON public.hoteles(shortname);

CREATE INDEX IF NOT EXISTS idx_hoteles_restaurantes_hotel ON public.hoteles_restaurantes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hoteles_restaurantes_restaurante ON public.hoteles_restaurantes(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_hoteles_restaurantes_activo ON public.hoteles_restaurantes(activo);

-- ===================================
-- INSERTAR DATOS INICIALES
-- ===================================
INSERT INTO public.hoteles (nombre, descripcion, shortname, activo)
VALUES 
    ('iStay Monterrey Centro', 'Hotel boutique en el centro de Monterrey', 'iStay-MTY', true),
    ('Hotel Ejemplo', 'Hotel de ejemplo para pruebas', 'Ejemplo', true)
ON CONFLICT (nombre) DO NOTHING;

-- ===================================
-- VERIFICAR CREACIÓN
-- ===================================
SELECT 'TABLAS CREADAS EXITOSAMENTE' as status;

-- Mostrar hoteles
SELECT 'HOTELES CREADOS:' as info;
SELECT id, nombre, shortname, activo, created_at FROM public.hoteles ORDER BY created_at;

-- Mostrar estructura de tablas
SELECT 'ESTRUCTURA HOTELES:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'hoteles' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'ESTRUCTURA HOTELES_RESTAURANTES:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'hoteles_restaurantes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar foreign keys
SELECT 'FOREIGN KEYS:' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'hoteles_restaurantes';

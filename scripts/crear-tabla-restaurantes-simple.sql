-- Crear tabla restaurantes si no existe
CREATE TABLE IF NOT EXISTS public.restaurantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    hotel_nombre VARCHAR(255), -- Guardamos el nombre del hotel como texto simple
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_restaurantes_nombre ON public.restaurantes(nombre);
CREATE INDEX IF NOT EXISTS idx_restaurantes_hotel ON public.restaurantes(hotel_nombre);
CREATE INDEX IF NOT EXISTS idx_restaurantes_activo ON public.restaurantes(activo);

-- Insertar algunos datos de ejemplo si la tabla está vacía
INSERT INTO public.restaurantes (nombre, descripcion, hotel_nombre, direccion, activo)
SELECT 
    'Restaurante Ejemplo',
    'Restaurante de ejemplo para probar el sistema',
    'N/A',
    'Dirección de ejemplo',
    true
WHERE NOT EXISTS (SELECT 1 FROM public.restaurantes LIMIT 1);

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla restaurantes creada exitosamente' as mensaje;
SELECT COUNT(*) as total_restaurantes FROM public.restaurantes;

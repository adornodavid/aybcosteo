-- Verificar estructura actual y corregir si es necesario

-- 1. Verificar que existe la tabla hoteles
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'hoteles' 
ORDER BY ordinal_position;

-- 2. Verificar que existe la tabla restaurantes
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'restaurantes' 
ORDER BY ordinal_position;

-- 3. Si no existe la tabla restaurantes, crearla
CREATE TABLE IF NOT EXISTS restaurantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    hotel_id UUID REFERENCES hoteles(id) ON DELETE SET NULL,
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_restaurantes_hotel_id ON restaurantes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_restaurantes_activo ON restaurantes(activo);

-- 5. Limpiar cualquier dato incorrecto que pueda existir
-- (Solo si hay datos mezclados)
DELETE FROM restaurantes WHERE nombre IN (
    SELECT nombre FROM hoteles
);

-- 6. Mostrar datos actuales
SELECT 'HOTELES' as tipo, id, nombre FROM hoteles
UNION ALL
SELECT 'RESTAURANTES' as tipo, id, nombre FROM restaurantes
ORDER BY tipo, nombre;

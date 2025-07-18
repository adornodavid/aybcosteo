-- Añadir la columna 'fechacreacion' si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platillos' AND column_name = 'fechacreacion') THEN
        ALTER TABLE public.platillos
        ADD COLUMN fechacreacion timestamp with time zone DEFAULT now();
    END IF;
END
$$;

-- Añadir la columna 'fechaactualizacion' si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platillos' AND column_name = 'fechaactualizacion') THEN
        ALTER TABLE public.platillos
        ADD COLUMN fechaactualizacion timestamp with time zone DEFAULT now();
    END IF;
END
$$;

-- Opcional: Crear o reemplazar una función para actualizar automáticamente 'fechaactualizacion'
CREATE OR REPLACE FUNCTION public.set_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fechaactualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Opcional: Crear un trigger para la tabla 'platillos' que use la función anterior
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_fecha_actualizacion_platillos') THEN
        CREATE TRIGGER set_fecha_actualizacion_platillos
        BEFORE UPDATE ON public.platillos
        FOR EACH ROW
        EXECUTE FUNCTION public.set_fecha_actualizacion();
    END IF;
END
$$;

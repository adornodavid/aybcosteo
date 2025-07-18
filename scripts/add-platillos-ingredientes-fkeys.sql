-- Asegurar que la tabla platillos_ingredientes exista (si no existe, se crearía en un script de migración anterior)
-- Este script solo añade las FKs si no existen.

-- Añadir clave foránea para ingrediente_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platillos_ingredientes_ingrediente_id_fkey' AND contype = 'f') THEN
        ALTER TABLE public.platillos_ingredientes
        ADD CONSTRAINT platillos_ingredientes_ingrediente_id_fkey
        FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id);
        RAISE NOTICE 'Clave foránea platillos_ingredientes_ingrediente_id_fkey añadida.';
    ELSE
        RAISE NOTICE 'Clave foránea platillos_ingredientes_ingrediente_id_fkey ya existe.';
    END IF;
END
$$;

-- Añadir clave foránea para platillo_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platillos_ingredientes_platillo_id_fkey' AND contype = 'f') THEN
        ALTER TABLE public.platillos_ingredientes
        ADD CONSTRAINT platillos_ingredientes_platillo_id_fkey
        FOREIGN KEY (platillo_id) REFERENCES public.platillos(id);
        RAISE NOTICE 'Clave foránea platillos_ingredientes_platillo_id_fkey añadida.';
    ELSE
        RAISE NOTICE 'Clave foránea platillos_ingredientes_platillo_id_fkey ya existe.';
    END IF;
END
$$;

-- Asegurar que la tabla platillos tenga una clave foránea a hoteles si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platillos_hotelid_fkey' AND contype = 'f') THEN
        ALTER TABLE public.platillos
        ADD CONSTRAINT platillos_hotelid_fkey
        FOREIGN KEY (hotelid) REFERENCES public.hoteles(id);
        RAISE NOTICE 'Clave foránea platillos_hotelid_fkey añadida.';
    ELSE
        RAISE NOTICE 'Clave foránea platillos_hotelid_fkey ya existe.';
    END IF;
END
$$;

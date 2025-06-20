-- Verificar si existe la tabla restaurante_menus
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'restaurante_menus';

-- Si no existe, crearla
CREATE TABLE IF NOT EXISTS public.restaurante_menus (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurante_id uuid REFERENCES public.restaurantes(id) ON DELETE CASCADE,
    menu_id uuid REFERENCES public.menus(id) ON DELETE CASCADE,
    activo boolean DEFAULT true,
    fecha_asignacion timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(restaurante_id, menu_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_restaurante_menus_restaurante_id ON public.restaurante_menus(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_restaurante_menus_menu_id ON public.restaurante_menus(menu_id);
CREATE INDEX IF NOT EXISTS idx_restaurante_menus_activo ON public.restaurante_menus(activo);

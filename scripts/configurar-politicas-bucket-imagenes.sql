-- Configurar políticas para el bucket "imagenes"
-- Ejecuta estos comandos en el SQL Editor de tu panel de Supabase

-- Primero, verificar si el bucket existe y habilitarle RLS
-- Asegúrate de que el bucket 'imagenes' exista. Si no, créalo primero.
-- Por ejemplo, en el panel de Supabase, ve a Storage -> New bucket, y nómbralo 'imagenes' (todo en minúsculas).
-- Luego, asegúrate de que RLS esté habilitado para este bucket.

UPDATE storage.buckets 
SET public = true 
WHERE id = 'imagenes';

-- Eliminar políticas existentes si las hay (para evitar conflictos)
DELETE FROM storage.policies WHERE bucket_id = 'imagenes';

-- 1. Política para permitir SELECT (leer archivos) - acceso público
-- Esto permite que cualquiera pueda ver las imágenes si conoce la URL.
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'imagenes_select_policy',
  'imagenes',
  'Allow public read access',
  'true',
  'true',
  'SELECT'
);

-- 2. Política para permitir INSERT (subir archivos) - para usuarios autenticados
-- Esto permite que cualquier usuario que haya iniciado sesión pueda subir archivos.
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'imagenes_insert_policy',
  'imagenes',
  'Allow authenticated users to upload',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'INSERT'
);

-- 3. Política para permitir UPDATE (actualizar archivos) - para usuarios autenticados
-- Esto permite que cualquier usuario que haya iniciado sesión pueda actualizar sus propios archivos.
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'imagenes_update_policy',
  'imagenes',
  'Allow authenticated users to update',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'UPDATE'
);

-- 4. Política para permitir DELETE (eliminar archivos) - para usuarios autenticados
-- Esto permite que cualquier usuario que haya iniciado sesión pueda eliminar sus propios archivos.
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'imagenes_delete_policy',
  'imagenes',
  'Allow authenticated users to delete',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'DELETE'
);

-- Verificar que las políticas se crearon correctamente
SELECT 
  id,
  bucket_id,
  name,
  definition,
  command
FROM storage.policies 
WHERE bucket_id = 'imagenes'
ORDER BY command;

-- Verificar el estado del bucket
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'imagenes';

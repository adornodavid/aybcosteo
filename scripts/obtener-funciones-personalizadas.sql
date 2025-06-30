-- Obtener solo las funciones personalizadas (no del sistema)
SELECT 
    schemaname,
    functionname,
    definition
FROM pg_get_functiondef(oid) f,
     pg_proc p,
     pg_namespace n
WHERE p.oid = f.oid
  AND p.pronamespace = n.oid
  AND n.nspname = 'public'
ORDER BY functionname;

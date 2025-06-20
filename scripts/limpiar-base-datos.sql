-- Limpiar todas las tablas en el orden correcto para evitar conflictos de foreign key

-- 1. Eliminar relaciones entre restaurantes y menús
DELETE FROM restaurante_menus;

-- 2. Eliminar relaciones entre menús y platillos
DELETE FROM menu_platillos;

-- 3. Eliminar ingredientes de platillos
DELETE FROM platillos_ingredientes;

-- 4. Eliminar platillos
DELETE FROM platillos;

-- 5. Eliminar menús
DELETE FROM menus;

-- 6. Eliminar restaurantes
DELETE FROM restaurantes;

-- 7. Eliminar precios unitarios
DELETE FROM precios_unitarios;

-- 8. Eliminar ingredientes
DELETE FROM ingredientes;

-- 9. Eliminar categorías
DELETE FROM categorias;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada correctamente' as mensaje;

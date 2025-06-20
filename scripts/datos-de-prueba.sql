-- Limpiar datos existentes (opcional)
DELETE FROM platillo_ingredientes;
DELETE FROM precios_unitarios;
DELETE FROM ingredientes;
DELETE FROM platillos;
DELETE FROM menus;
DELETE FROM restaurantes;
DELETE FROM categorias;
DELETE FROM hoteles;

-- Insertar hoteles de prueba
INSERT INTO hoteles (id, nombre, direccion, telefono, email, activo) VALUES
('hotel-1', 'Hotel Plaza Central', 'Av. Principal 123, Ciudad', '+52 55 1234-5678', 'contacto@plazacentral.com', true),
('hotel-2', 'Hotel Vista Mar', 'Blvd. Costero 456, Playa', '+52 998 8765-4321', 'info@vistmar.com', true),
('hotel-3', 'Hotel Montaña Verde', 'Carretera Nacional Km 15', '+52 777 5555-1234', 'reservas@montanaverde.com', true);

-- Insertar restaurantes de prueba
INSERT INTO restaurantes (id, nombre, hotel_id, tipo_cocina, capacidad, activo) VALUES
('rest-1', 'Restaurante Principal', 'hotel-1', 'Internacional', 120, true),
('rest-2', 'Café Terraza', 'hotel-1', 'Café & Snacks', 50, true),
('rest-3', 'Mariscos del Mar', 'hotel-2', 'Mariscos', 80, true),
('rest-4', 'Asador Montaña', 'hotel-3', 'Carnes', 60, true);

-- Insertar categorías de ingredientes
INSERT INTO categorias (id, nombre, descripcion, tipo, activo) VALUES
('cat-1', 'Carnes', 'Carnes rojas y blancas', 'ingrediente', true),
('cat-2', 'Pescados y Mariscos', 'Productos del mar', 'ingrediente', true),
('cat-3', 'Verduras', 'Vegetales frescos', 'ingrediente', true),
('cat-4', 'Lácteos', 'Productos lácteos', 'ingrediente', true),
('cat-5', 'Granos y Cereales', 'Arroz, pasta, legumbres', 'ingrediente', true),
('cat-6', 'Condimentos', 'Especias y condimentos', 'ingrediente', true);

-- Insertar ingredientes de prueba
INSERT INTO ingredientes (id, clave, descripcion, categoria_id, status, tipo, unidad_medida, cantidad_por_presentacion, conversion, restaurante_id) VALUES
-- Carnes
('ing-1', 'CAR001', 'Filete de Res Premium', 'cat-1', 'activo', 'Proteína', 'Kilogramo', 1.0, 'Gramo', 'rest-1'),
('ing-2', 'CAR002', 'Pechuga de Pollo', 'cat-1', 'activo', 'Proteína', 'Kilogramo', 1.0, 'Gramo', 'rest-1'),
('ing-3', 'CAR003', 'Lomo de Cerdo', 'cat-1', 'activo', 'Proteína', 'Kilogramo', 1.0, 'Gramo', 'rest-1'),

-- Pescados y Mariscos
('ing-4', 'MAR001', 'Salmón Fresco', 'cat-2', 'activo', 'Proteína', 'Kilogramo', 1.0, 'Gramo', 'rest-3'),
('ing-5', 'MAR002', 'Camarones Jumbo', 'cat-2', 'activo', 'Proteína', 'Kilogramo', 1.0, 'Gramo', 'rest-3'),
('ing-6', 'MAR003', 'Pulpo Fresco', 'cat-2', 'activo', 'Proteína', 'Kilogramo', 1.0, 'Gramo', 'rest-3'),

-- Verduras
('ing-7', 'VER001', 'Tomate Roma', 'cat-3', 'activo', 'Vegetal', 'Kilogramo', 1.0, 'Gramo', 'rest-1'),
('ing-8', 'VER002', 'Cebolla Blanca', 'cat-3', 'activo', 'Vegetal', 'Kilogramo', 1.0, 'Gramo', 'rest-1'),
('ing-9', 'VER003', 'Lechuga Romana', 'cat-3', 'activo', 'Vegetal', 'Pieza', 1.0, 'Hoja', 'rest-1'),

-- Lácteos
('ing-10', 'LAC001', 'Queso Manchego', 'cat-4', 'activo', 'Lácteo', 'Kilogramo', 1.0, 'Gramo', 'rest-1'),
('ing-11', 'LAC002', 'Crema Ácida', 'cat-4', 'activo', 'Lácteo', 'Litro', 1.0, 'Mililitro', 'rest-1'),
('ing-12', 'LAC003', 'Mantequilla', 'cat-4', 'activo', 'Lácteo', 'Kilogramo', 1.0, 'Gramo', 'rest-1'),

-- Granos y Cereales
('ing-13', 'GRA001', 'Arroz Blanco', 'cat-5', 'activo', 'Cereal', 'Kilogramo', 1.0, 'Gramo', 'rest-1'),
('ing-14', 'GRA002', 'Pasta Penne', 'cat-5', 'activo', 'Cereal', 'Kilogramo', 1.0, 'Gramo', 'rest-1'),
('ing-15', 'GRA003', 'Frijoles Negros', 'cat-5', 'activo', 'Legumbre', 'Kilogramo', 1.0, 'Gramo', 'rest-1');

-- Insertar precios unitarios
INSERT INTO precios_unitarios (id, ingrediente_id, precio_total, precio_unitario, fecha_inicio, fecha_fin, proveedor, notas) VALUES
-- Carnes
('pre-1', 'ing-1', 450.00, 0.45, '2024-01-01', NULL, 'Carnicería Premium', 'Precio por gramo'),
('pre-2', 'ing-2', 180.00, 0.18, '2024-01-01', NULL, 'Avícola Central', 'Precio por gramo'),
('pre-3', 'ing-3', 220.00, 0.22, '2024-01-01', NULL, 'Carnicería Premium', 'Precio por gramo'),

-- Pescados y Mariscos
('pre-4', 'ing-4', 380.00, 0.38, '2024-01-01', NULL, 'Pescadería del Puerto', 'Precio por gramo'),
('pre-5', 'ing-5', 520.00, 0.52, '2024-01-01', NULL, 'Mariscos Frescos SA', 'Precio por gramo'),
('pre-6', 'ing-6', 350.00, 0.35, '2024-01-01', NULL, 'Pescadería del Puerto', 'Precio por gramo'),

-- Verduras
('pre-7', 'ing-7', 25.00, 0.025, '2024-01-01', NULL, 'Mercado Central', 'Precio por gramo'),
('pre-8', 'ing-8', 18.00, 0.018, '2024-01-01', NULL, 'Mercado Central', 'Precio por gramo'),
('pre-9', 'ing-9', 15.00, 0.75, '2024-01-01', NULL, 'Verduras Frescas', 'Precio por hoja'),

-- Lácteos
('pre-10', 'ing-10', 280.00, 0.28, '2024-01-01', NULL, 'Lácteos La Vaca', 'Precio por gramo'),
('pre-11', 'ing-11', 45.00, 0.045, '2024-01-01', NULL, 'Lácteos La Vaca', 'Precio por ml'),
('pre-12', 'ing-12', 120.00, 0.12, '2024-01-01', NULL, 'Lácteos La Vaca', 'Precio por gramo'),

-- Granos y Cereales
('pre-13', 'ing-13', 32.00, 0.032, '2024-01-01', NULL, 'Abarrotes Mayoreo', 'Precio por gramo'),
('pre-14', 'ing-14', 55.00, 0.055, '2024-01-01', NULL, 'Abarrotes Mayoreo', 'Precio por gramo'),
('pre-15', 'ing-15', 48.00, 0.048, '2024-01-01', NULL, 'Abarrotes Mayoreo', 'Precio por gramo');

-- Insertar categorías de platillos
INSERT INTO categorias (id, nombre, descripcion, tipo, activo) VALUES
('cat-plat-1', 'Entradas', 'Platillos de entrada', 'platillo', true),
('cat-plat-2', 'Platos Fuertes', 'Platillos principales', 'platillo', true),
('cat-plat-3', 'Postres', 'Postres y dulces', 'platillo', true),
('cat-plat-4', 'Bebidas', 'Bebidas y cocteles', 'platillo', true);

-- Insertar platillos de prueba
INSERT INTO platillos (id, nombre, descripcion, categoria_id, precio_venta, tiempo_preparacion, porciones, activo, restaurante_id) VALUES
('plat-1', 'Filete de Res a la Parrilla', 'Filete de res premium con guarnición de verduras', 'cat-plat-2', 350.00, 25, 1, true, 'rest-1'),
('plat-2', 'Ensalada César', 'Lechuga romana con aderezo césar y queso', 'cat-plat-1', 120.00, 10, 1, true, 'rest-1'),
('plat-3', 'Salmón a la Plancha', 'Salmón fresco con arroz y verduras', 'cat-plat-2', 280.00, 20, 1, true, 'rest-3'),
('plat-4', 'Pasta Alfredo', 'Pasta penne con salsa alfredo y pollo', 'cat-plat-2', 180.00, 15, 1, true, 'rest-1');

-- Insertar ingredientes por platillo
INSERT INTO platillo_ingredientes (id, platillo_id, ingrediente_id, cantidad, unidad_medida, costo_unitario, costo_total, notas) VALUES
-- Filete de Res a la Parrilla
('pi-1', 'plat-1', 'ing-1', 250, 'gramo', 0.45, 112.50, 'Filete principal'),
('pi-2', 'plat-1', 'ing-7', 100, 'gramo', 0.025, 2.50, 'Guarnición'),
('pi-3', 'plat-1', 'ing-8', 50, 'gramo', 0.018, 0.90, 'Guarnición'),

-- Ensalada César
('pi-4', 'plat-2', 'ing-9', 8, 'hoja', 0.75, 6.00, 'Base de ensalada'),
('pi-5', 'plat-2', 'ing-10', 30, 'gramo', 0.28, 8.40, 'Queso rallado'),

-- Salmón a la Plancha
('pi-6', 'plat-3', 'ing-4', 200, 'gramo', 0.38, 76.00, 'Proteína principal'),
('pi-7', 'plat-3', 'ing-13', 100, 'gramo', 0.032, 3.20, 'Guarnición de arroz'),
('pi-8', 'plat-3', 'ing-7', 80, 'gramo', 0.025, 2.00, 'Verduras'),

-- Pasta Alfredo
('pi-9', 'plat-4', 'ing-14', 120, 'gramo', 0.055, 6.60, 'Pasta base'),
('pi-10', 'plat-4', 'ing-2', 100, 'gramo', 0.18, 18.00, 'Pollo'),
('pi-11', 'plat-4', 'ing-11', 50, 'mililitro', 0.045, 2.25, 'Crema para salsa');

-- Actualizar costos de platillos (trigger debería hacerlo automáticamente, pero por si acaso)
UPDATE platillos SET 
  costo_ingredientes = (
    SELECT COALESCE(SUM(costo_total), 0) 
    FROM platillo_ingredientes 
    WHERE platillo_id = platillos.id
  ),
  margen_utilidad = precio_venta - (
    SELECT COALESCE(SUM(costo_total), 0) 
    FROM platillo_ingredientes 
    WHERE platillo_id = platillos.id
  );

-- Insertar menús de prueba
INSERT INTO menus (id, nombre, descripcion, restaurante_id, activo, fecha_inicio, fecha_fin) VALUES
('menu-1', 'Menú Principal', 'Menú principal del restaurante', 'rest-1', true, '2024-01-01', NULL),
('menu-2', 'Menú de Mariscos', 'Especialidades del mar', 'rest-3', true, '2024-01-01', NULL);

-- Insertar platillos en menús
INSERT INTO menu_platillos (id, menu_id, platillo_id, categoria_menu, orden, activo) VALUES
('mp-1', 'menu-1', 'plat-2', 'Entradas', 1, true),
('mp-2', 'menu-1', 'plat-1', 'Platos Fuertes', 1, true),
('mp-3', 'menu-1', 'plat-4', 'Platos Fuertes', 2, true),
('mp-4', 'menu-2', 'plat-3', 'Especialidades', 1, true);

-- Mensaje de confirmación
SELECT 'Datos de prueba insertados correctamente' as mensaje;
SELECT 
  (SELECT COUNT(*) FROM hoteles) as hoteles_creados,
  (SELECT COUNT(*) FROM restaurantes) as restaurantes_creados,
  (SELECT COUNT(*) FROM categorias) as categorias_creadas,
  (SELECT COUNT(*) FROM ingredientes) as ingredientes_creados,
  (SELECT COUNT(*) FROM precios_unitarios) as precios_creados,
  (SELECT COUNT(*) FROM platillos) as platillos_creados,
  (SELECT COUNT(*) FROM platillo_ingredientes) as relaciones_creadas;

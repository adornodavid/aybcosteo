-- Insertar datos iniciales
USE SistemaCosteo;
GO

-- Insertar categorías básicas
INSERT INTO categorias (nombre, descripcion) VALUES
('Carnes', 'Carnes rojas, blancas y mariscos'),
('Verduras', 'Vegetales frescos y congelados'),
('Lácteos', 'Leche, quesos, cremas y derivados'),
('Granos', 'Cereales, legumbres y semillas'),
('Condimentos', 'Especias, hierbas y sazonadores'),
('Bebidas', 'Jugos, refrescos y bebidas alcohólicas'),
('Panadería', 'Panes, harinas y productos de panadería'),
('Aceites', 'Aceites, mantecas y grasas');

-- Insertar hotel de ejemplo
INSERT INTO hoteles (nombre, shortname, descripcion) VALUES
('Hotel Principal', 'HP', 'Hotel principal para pruebas del sistema');

-- Insertar restaurante de ejemplo
INSERT INTO restaurantes (hotel_id, nombre, descripcion) VALUES
(1, 'Restaurante Principal', 'Restaurante principal del hotel');

GO

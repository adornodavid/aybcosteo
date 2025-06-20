-- Usar la base de datos del sistema de costeo
USE SistemaCosteo;
GO

-- =============================================
-- TABLAS PRINCIPALES DEL SISTEMA DE COSTEO
-- =============================================

-- Tabla de Hoteles
CREATE TABLE hoteles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL,
    shortname NVARCHAR(50),
    descripcion NVARCHAR(MAX),
    direccion NVARCHAR(500),
    telefono NVARCHAR(20),
    email NVARCHAR(255),
    activo BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Tabla de Restaurantes
CREATE TABLE restaurantes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    hotel_id INT,
    nombre NVARCHAR(255) NOT NULL,
    descripcion NVARCHAR(MAX),
    direccion NVARCHAR(500),
    telefono NVARCHAR(20),
    email NVARCHAR(255),
    activo BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (hotel_id) REFERENCES hoteles(id)
);

-- Tabla de Categorías de Ingredientes
CREATE TABLE categorias (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL,
    descripcion NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Tabla de Ingredientes
CREATE TABLE ingredientes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    clave NVARCHAR(50) NOT NULL,
    descripcion NVARCHAR(255) NOT NULL,
    categoria_id INT,
    status NVARCHAR(20) DEFAULT 'activo',
    tipo NVARCHAR(100),
    unidad_medida NVARCHAR(50) NOT NULL,
    cantidad_por_presentacion DECIMAL(10,4) DEFAULT 1.0,
    conversion NVARCHAR(255),
    restaurante_id INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id)
);

-- Tabla de Precios Unitarios (Historial)
CREATE TABLE precios_unitarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ingrediente_id INT NOT NULL,
    precio DECIMAL(10,4) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    notas NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE
);

-- Tabla de Platillos
CREATE TABLE platillos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL,
    descripcion NVARCHAR(MAX),
    instrucciones NVARCHAR(MAX),
    imagen_url NVARCHAR(500),
    costo_total DECIMAL(10,4) DEFAULT 0,
    tiempo_preparacion INT,
    porciones INT DEFAULT 1,
    restaurante_id INT NOT NULL,
    activo BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id)
);

-- Tabla de Ingredientes por Platillo
CREATE TABLE platillo_ingredientes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    platillo_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    cantidad DECIMAL(10,4) NOT NULL,
    unidad_usada NVARCHAR(50) NOT NULL,
    costo_parcial DECIMAL(10,4) DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (platillo_id) REFERENCES platillos(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id)
);

-- Tabla de Menús
CREATE TABLE menus (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL,
    descripcion NVARCHAR(MAX),
    restaurante_id INT NOT NULL,
    imagen_url NVARCHAR(500),
    activo BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id)
);

-- Tabla de Platillos por Menú
CREATE TABLE menus_platillos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    menu_id INT NOT NULL,
    platillo_id INT NOT NULL,
    precio_venta DECIMAL(10,4) NOT NULL,
    disponible BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY (platillo_id) REFERENCES platillos(id)
);

-- Tabla de Relación Restaurante-Menús
CREATE TABLE menus_restaurantes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    restaurante_id INT NOT NULL,
    menu_id INT NOT NULL,
    activo BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id),
    FOREIGN KEY (menu_id) REFERENCES menus(id)
);

GO

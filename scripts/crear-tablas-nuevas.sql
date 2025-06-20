-- =============================================
-- Script para crear todas las tablas del sistema de costeo
-- CORREGIDO PARA POSTGRESQL/SUPABASE
-- =============================================

-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla CategoriaIngredientes
CREATE TABLE IF NOT EXISTS CategoriaIngredientes (
    Categoria_Id SERIAL PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL UNIQUE,
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE
);

-- 2. Tabla TipoUnidadMedida
CREATE TABLE IF NOT EXISTS TipoUnidadMedida (
    TipoUnidad_Id SERIAL PRIMARY KEY,
    DescripcionUnidad VARCHAR(50) NOT NULL UNIQUE,
    CalculoConversion DECIMAL(12,6) NOT NULL,
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE
);

-- 3. Tabla Hoteles
CREATE TABLE IF NOT EXISTS Hoteles (
    Id SERIAL PRIMARY KEY,
    Hotel_Id INTEGER NOT NULL UNIQUE,
    Nombre VARCHAR(255) NOT NULL,
    ShortName VARCHAR(50),
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE
);

-- 4. Tabla Roles
CREATE TABLE IF NOT EXISTS Roles (
    Id_Rol SERIAL PRIMARY KEY,
    NombreRol VARCHAR(100) NOT NULL UNIQUE,
    DescripcionRol VARCHAR(255),
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE
);

-- 5. Tabla Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    IdUsuario SERIAL PRIMARY KEY,
    Nombre_completo VARCHAR(255),
    Email VARCHAR(255) NOT NULL UNIQUE,
    Id_Rol INTEGER,
    Hotel_Id INTEGER,
    Activo BOOLEAN DEFAULT true,
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE,
    
    FOREIGN KEY (Id_Rol) REFERENCES Roles(Id_Rol),
    FOREIGN KEY (Hotel_Id) REFERENCES Hoteles(Id)
);

-- 6. Tabla Ingredientes
CREATE TABLE IF NOT EXISTS Ingredientes (
    Id_Ingredientes SERIAL PRIMARY KEY,
    CodigoIngrediente VARCHAR(50) NOT NULL,
    HotelID INTEGER NOT NULL,
    Nombre VARCHAR(255) NOT NULL,
    Categoria_id INTEGER,
    CostoIngrediente DECIMAL(12,4) NOT NULL,
    UnidadMedida_Id INTEGER NOT NULL,
    Año INTEGER NOT NULL,
    Mes INTEGER NOT NULL,
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE,
    ImagenURL VARCHAR(500),
    
    FOREIGN KEY (Categoria_id) REFERENCES CategoriaIngredientes(Categoria_Id),
    FOREIGN KEY (UnidadMedida_Id) REFERENCES TipoUnidadMedida(TipoUnidad_Id),
    FOREIGN KEY (HotelID) REFERENCES Hoteles(Id),
    
    -- Constraint para evitar duplicados por hotel/codigo/año/mes
    UNIQUE (CodigoIngrediente, HotelID, Año, Mes)
);

-- 7. Tabla CategoriaPlatillos
CREATE TABLE IF NOT EXISTS CategoriaPlatillos (
    CategoriaPlatillos_Id SERIAL PRIMARY KEY,
    Descripcion VARCHAR(255) NOT NULL UNIQUE,
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE
);

-- 8. Tabla Restaurantes
CREATE TABLE IF NOT EXISTS Restaurantes (
    Id SERIAL PRIMARY KEY,
    Hotel_Id INTEGER NOT NULL,
    NombreRestaurante VARCHAR(255) NOT NULL,
    Direccion VARCHAR(500),
    Activo BOOLEAN DEFAULT true,
    ImagenURL VARCHAR(500),
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE,
    
    FOREIGN KEY (Hotel_Id) REFERENCES Hoteles(Id),
    UNIQUE (Hotel_Id, NombreRestaurante)
);

-- 9. Tabla Platillos
CREATE TABLE IF NOT EXISTS Platillos (
    Id SERIAL PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL,
    CategoriaPlatillo_Id INTEGER,
    InstruccionesPreparacion TEXT,
    TiempoPreparacion VARCHAR(50),
    CostoTotal_Platillo DECIMAL(12,4) DEFAULT 0.00,
    Activo BOOLEAN DEFAULT true,
    CreadorUsuarioId INTEGER,
    ImagenURL VARCHAR(500),
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE,
    
    FOREIGN KEY (CategoriaPlatillo_Id) REFERENCES CategoriaPlatillos(CategoriaPlatillos_Id),
    FOREIGN KEY (CreadorUsuarioId) REFERENCES Usuarios(IdUsuario)
);

-- 10. Tabla PlatillosxIngredientes
CREATE TABLE IF NOT EXISTS PlatillosxIngredientes (
    Id SERIAL PRIMARY KEY,
    Platillo_Id INTEGER NOT NULL,
    Ingrediente_Id INTEGER NOT NULL,
    Cantidad_Ingredientes DECIMAL(10,4) NOT NULL,
    UnidadMedida VARCHAR(50),
    CostoParcial_Ingredientes DECIMAL(12,4) DEFAULT 0.00,
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE,
    
    FOREIGN KEY (Platillo_Id) REFERENCES Platillos(Id) ON DELETE CASCADE,
    FOREIGN KEY (Ingrediente_Id) REFERENCES Ingredientes(Id_Ingredientes),
    UNIQUE (Platillo_Id, Ingrediente_Id)
);

-- 11. Tabla Menu
CREATE TABLE IF NOT EXISTS Menu (
    Id SERIAL PRIMARY KEY,
    Restaurante_Id INTEGER NOT NULL,
    NombreMenu VARCHAR(255) NOT NULL,
    Descripcion TEXT,
    Activo BOOLEAN DEFAULT true,
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE,
    
    FOREIGN KEY (Restaurante_Id) REFERENCES Restaurantes(Id) ON DELETE CASCADE,
    UNIQUE (Restaurante_Id, NombreMenu)
);

-- 12. Tabla MenuXPlatillos
CREATE TABLE IF NOT EXISTS MenuXPlatillos (
    Id SERIAL PRIMARY KEY,
    Menu_Id INTEGER NOT NULL,
    Platillo_Id INTEGER NOT NULL,
    PreciodeVenta DECIMAL(12,4) NOT NULL,
    Activo BOOLEAN DEFAULT true,
    FechaCreacion DATE DEFAULT CURRENT_DATE,
    FechaActualizacion DATE DEFAULT CURRENT_DATE,
    
    FOREIGN KEY (Menu_Id) REFERENCES Menu(Id) ON DELETE CASCADE,
    FOREIGN KEY (Platillo_Id) REFERENCES Platillos(Id) ON DELETE CASCADE,
    UNIQUE (Menu_Id, Platillo_Id)
);

-- =============================================
-- Crear índices para mejorar performance
-- =============================================

CREATE INDEX IF NOT EXISTS IX_Ingredientes_Hotel_Codigo ON Ingredientes(HotelID, CodigoIngrediente);
CREATE INDEX IF NOT EXISTS IX_Ingredientes_Año_Mes ON Ingredientes(Año, Mes);
CREATE INDEX IF NOT EXISTS IX_PlatillosIngredientes_Platillo ON PlatillosxIngredientes(Platillo_Id);
CREATE INDEX IF NOT EXISTS IX_MenuPlatillos_Menu ON MenuXPlatillos(Menu_Id);
CREATE INDEX IF NOT EXISTS IX_Usuarios_Hotel ON Usuarios(Hotel_Id);

-- =============================================
-- Insertar datos iniciales básicos
-- =============================================

-- Categorías de ingredientes básicas
INSERT INTO CategoriaIngredientes (Nombre) VALUES 
('Lácteos'),
('Carnes'),
('Vegetales'),
('Frutas'),
('Abarrotes'),
('Bebidas'),
('Condimentos y Especias')
ON CONFLICT (Nombre) DO NOTHING;

-- Unidades de medida básicas
INSERT INTO TipoUnidadMedida (DescripcionUnidad, CalculoConversion) VALUES 
('Gramo', 1.0),
('Kilogramo', 1000.0),
('Mililitro', 1.0),
('Litro', 1000.0),
('Unidad', 1.0),
('Pieza', 1.0)
ON CONFLICT (DescripcionUnidad) DO NOTHING;

-- Categorías de platillos básicas
INSERT INTO CategoriaPlatillos (Descripcion) VALUES 
('Entradas'),
('Sopas'),
('Platos Fuertes'),
('Postres'),
('Bebidas'),
('Ensaladas')
ON CONFLICT (Descripcion) DO NOTHING;

-- Roles básicos
INSERT INTO Roles (NombreRol, DescripcionRol) VALUES 
('Administrador Global', 'Acceso completo a todos los hoteles y funciones'),
('Gerente Hotel', 'Acceso completo a su hotel asignado'),
('Chef', 'Gestión de platillos y recetas'),
('Contador', 'Acceso a reportes y análisis de costos')
ON CONFLICT (NombreRol) DO NOTHING;

-- Verificar que las tablas se crearon correctamente
DO $$
BEGIN
    RAISE NOTICE 'Tablas creadas exitosamente con datos iniciales';
    RAISE NOTICE 'Total de tablas creadas: %', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'categoriaingredientes', 'tipounidadmedida', 'hoteles', 'roles', 
            'usuarios', 'ingredientes', 'categoriaplatillos', 'restaurantes', 
            'platillos', 'platillosxingredientes', 'menu', 'menuxplatillos'
        )
    );
END $$;

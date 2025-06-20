-- Crear índices para mejorar el rendimiento
USE SistemaCosteo;
GO

-- Índices para ingredientes
CREATE INDEX IX_ingredientes_clave ON ingredientes(clave);
CREATE INDEX IX_ingredientes_restaurante ON ingredientes(restaurante_id);
CREATE INDEX IX_ingredientes_categoria ON ingredientes(categoria_id);
CREATE INDEX IX_ingredientes_status ON ingredientes(status);

-- Índices para precios
CREATE INDEX IX_precios_ingrediente ON precios_unitarios(ingrediente_id);
CREATE INDEX IX_precios_fecha_inicio ON precios_unitarios(fecha_inicio);
CREATE INDEX IX_precios_activo ON precios_unitarios(fecha_fin) WHERE fecha_fin IS NULL;

-- Índices para platillos
CREATE INDEX IX_platillos_restaurante ON platillos(restaurante_id);
CREATE INDEX IX_platillos_activo ON platillos(activo);

-- Índices para relaciones
CREATE INDEX IX_platillo_ingredientes_platillo ON platillo_ingredientes(platillo_id);
CREATE INDEX IX_platillo_ingredientes_ingrediente ON platillo_ingredientes(ingrediente_id);
CREATE INDEX IX_menus_platillos_menu ON menus_platillos(menu_id);
CREATE INDEX IX_menus_platillos_platillo ON menus_platillos(platillo_id);

GO

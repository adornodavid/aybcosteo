// =============================================
// ANÁLISIS COMPLETO: TYPESCRIPT vs BASE DE DATOS REAL
// Basado en la estructura exacta de Supabase
// =============================================

// =============================================
// 1. CATEGORIAINGREDIENTES
// =============================================
// BD Real: id (integer, NOT NULL), descripcion (text, nullable)
export interface CategoriaIngrediente {
  id: number // ✅ CORRECTO: integer NOT NULL
  descripcion?: string // ✅ CORRECTO: text nullable
}

// =============================================
// 2. HOTELES
// =============================================
// BD Real: id, acronimo, nombre, direccion, activo, fechacreacion
export interface Hotel {
  id: number // ✅ CORRECTO: integer NOT NULL
  acronimo?: string // ✅ CORRECTO: text nullable
  nombre?: string // ✅ CORRECTO: text nullable
  direccion?: string // ✅ CORRECTO: text nullable
  activo?: boolean // ✅ CORRECTO: boolean nullable, default true
  fechacreacion?: string // ✅ CORRECTO: date nullable
}

// =============================================
// 3. INGREDIENTES
// =============================================
// BD Real: id, codigo, nombre, categoriaid, costo, unidadmedidaid, hotelid, imgurl, cambio
export interface Ingrediente {
  id: number // ✅ CORRECTO: integer NOT NULL
  codigo?: string // ✅ CORRECTO: text nullable
  nombre?: string // ✅ CORRECTO: text nullable
  categoriaid?: number // ✅ CORRECTO: integer nullable
  costo?: number // ✅ CORRECTO: numeric nullable
  unidadmedidaid?: number // ✅ CORRECTO: integer nullable
  hotelid?: number // ✅ CORRECTO: integer nullable
  imgurl?: string // ✅ CORRECTO: text nullable
  cambio?: number // ✅ CORRECTO: integer nullable
  // Relaciones
  categoria?: CategoriaIngrediente
  hotel?: Hotel
  unidadmedida?: TipoUnidadMedida
}

// =============================================
// 4. TIPOUNIDADMEDIDA
// =============================================
// BD Real: id, descripcion, conversion
export interface TipoUnidadMedida {
  id: number // ✅ CORRECTO: integer NOT NULL
  descripcion?: string // ✅ CORRECTO: text nullable
  conversion?: number // ✅ CORRECTO: numeric nullable
}

// =============================================
// 5. RESTAURANTES
// =============================================
// BD Real: id, nombre, hotelid, direccion, activo, imgurl, fechacreacion
export interface Restaurante {
  id: number // ✅ CORRECTO: integer NOT NULL
  nombre?: string // ✅ CORRECTO: text nullable
  hotelid?: number // ✅ CORRECTO: integer nullable
  direccion?: string // ✅ CORRECTO: text nullable
  activo?: boolean // ✅ CORRECTO: boolean nullable, default true
  imgurl?: string // ✅ CORRECTO: text nullable
  fechacreacion?: string // ✅ CORRECTO: date nullable
  // Relaciones
  hotel?: Hotel
}

// =============================================
// 6. PLATILLOS
// =============================================
// BD Real: id, nombre, descripcion, instrucciones, costo, activo, imgurl, fechacreacion
export interface Platillo {
  id: number // ✅ CORRECTO: integer NOT NULL
  nombre?: string // ✅ CORRECTO: text nullable
  descripcion?: string // ✅ CORRECTO: text nullable
  instrucciones?: string // ✅ CORRECTO: text nullable
  costo?: number // ✅ CORRECTO: numeric nullable
  activo?: boolean // ✅ CORRECTO: boolean nullable, default true
  imgurl?: string // ✅ CORRECTO: text nullable
  fechacreacion?: string // ✅ CORRECTO: date nullable
  // Relaciones
  ingredientes?: IngredienteXPlatillo[]
}

// =============================================
// 7. INGREDIENTESXPLATILLO
// =============================================
// BD Real: id, platilloid, ingredienteid, cantidad, unidadmedida, costo
export interface IngredienteXPlatillo {
  id: number // ✅ CORRECTO: integer NOT NULL
  platilloid?: number // ✅ CORRECTO: integer nullable
  ingredienteid?: number // ✅ CORRECTO: integer nullable
  cantidad?: number // ✅ CORRECTO: numeric nullable
  unidadmedida?: string // ✅ CORRECTO: text nullable
  costo?: number // ✅ CORRECTO: numeric nullable
  // Relaciones
  platillo?: Platillo
  ingrediente?: Ingrediente
}

// =============================================
// 8. MENUS
// =============================================
// BD Real: id, nombre, descripcion, restauranteid, activo, fechacreacion
export interface Menu {
  id: number // ✅ CORRECTO: integer NOT NULL
  nombre?: string // ✅ CORRECTO: text nullable
  descripcion?: string // ✅ CORRECTO: text nullable
  restauranteid?: number // ✅ CORRECTO: integer nullable
  activo?: boolean // ✅ CORRECTO: boolean nullable, default true
  fechacreacion?: string // ✅ CORRECTO: date nullable
  // Relaciones
  restaurante?: Restaurante
  platillos?: PlatilloXMenu[]
}

// =============================================
// 9. PLATILLOSXMENU
// =============================================
// BD Real: id, menuid, platilloid, precio, activo
export interface PlatilloXMenu {
  id: number // ✅ CORRECTO: integer NOT NULL
  menuid?: number // ✅ CORRECTO: integer nullable
  platilloid?: number // ✅ CORRECTO: integer nullable
  precio?: number // ✅ CORRECTO: numeric nullable
  activo?: boolean // ✅ CORRECTO: boolean nullable, default true
  // Relaciones
  menu?: Menu
  platillo?: Platillo
}

// =============================================
// 10. USUARIOS
// =============================================
// BD Real: id, nombre, email, rolid, hotelid, activo, fechacreacion
export interface Usuario {
  id: number // ✅ CORRECTO: integer NOT NULL
  nombre?: string // ✅ CORRECTO: text nullable
  email?: string // ✅ CORRECTO: text nullable
  rolid?: number // ✅ CORRECTO: integer nullable
  hotelid?: number // ✅ CORRECTO: integer nullable
  activo?: boolean // ✅ CORRECTO: boolean nullable, default true
  fechacreacion?: string // ✅ CORRECTO: date nullable
  // Relaciones
  rol?: Rol
  hotel?: Hotel
}

// =============================================
// 11. ROLES
// =============================================
// BD Real: id, nombre, descripcion
export interface Rol {
  id: number // ✅ CORRECTO: integer NOT NULL
  nombre?: string // ✅ CORRECTO: text nullable
  descripcion?: string // ✅ CORRECTO: text nullable
}

// =============================================
// 12. RECETAS
// =============================================
// BD Real: id, nombre, descripcion, instrucciones, activo, fechacreacion
export interface Receta {
  id: number // ✅ CORRECTO: integer NOT NULL
  nombre?: string // ✅ CORRECTO: text nullable
  descripcion?: string // ✅ CORRECTO: text nullable
  instrucciones?: string // ✅ CORRECTO: text nullable
  activo?: boolean // ✅ CORRECTO: boolean nullable, default true
  fechacreacion?: string // ✅ CORRECTO: date nullable
}

// =============================================
// 13. INGREDIENTESXRECETA
// =============================================
// BD Real: id, recetaid, ingredienteid, cantidad, unidadmedida
export interface IngredienteXReceta {
  id: number // ✅ CORRECTO: integer NOT NULL
  recetaid?: number // ✅ CORRECTO: integer nullable
  ingredienteid?: number // ✅ CORRECTO: integer nullable
  cantidad?: number // ✅ CORRECTO: numeric nullable
  unidadmedida?: string // ✅ CORRECTO: text nullable
  // Relaciones
  receta?: Receta
  ingrediente?: Ingrediente
}

// =============================================
// 14. RECETASXPLATILLO
// =============================================
// BD Real: id, platilloid, recetaid, cantidad
export interface RecetaXPlatillo {
  id: number // ✅ CORRECTO: integer NOT NULL
  platilloid?: number // ✅ CORRECTO: integer nullable
  recetaid?: number // ✅ CORRECTO: integer nullable
  cantidad?: number // ✅ CORRECTO: numeric nullable
  // Relaciones
  platillo?: Platillo
  receta?: Receta
}

// =============================================
// 15. HISTORICO
// =============================================
// BD Real: idrec, hotelid, restauranteid, menuid, platilloid, ingredienteid, recetaid, cantidad, costo, activo, fechacreacion
export interface Historico {
  idrec: number // ✅ CORRECTO: integer NOT NULL (PK diferente)
  hotelid?: number // ✅ CORRECTO: integer nullable
  restauranteid?: number // ✅ CORRECTO: integer nullable
  menuid?: number // ✅ CORRECTO: integer nullable
  platilloid?: number // ✅ CORRECTO: integer nullable
  ingredienteid?: number // ✅ CORRECTO: integer nullable
  recetaid?: number // ✅ CORRECTO: integer nullable
  cantidad?: number // ✅ CORRECTO: numeric nullable
  costo?: number // ✅ CORRECTO: numeric nullable
  activo?: boolean // ✅ CORRECTO: boolean nullable, default true
  fechacreacion?: string // ✅ CORRECTO: date nullable
}

// =============================================
// 16. PERMISOS
// =============================================
// BD Real: id, nombre, descripcion
export interface Permiso {
  id: number // ✅ CORRECTO: integer NOT NULL
  nombre?: string // ✅ CORRECTO: text nullable
  descripcion?: string // ✅ CORRECTO: text nullable
}

// =============================================
// 17. PERMISOSXROL
// =============================================
// BD Real: id, rolid, permisoid
export interface PermisoXRol {
  id: number // ✅ CORRECTO: integer NOT NULL
  rolid?: number // ✅ CORRECTO: integer nullable
  permisoid?: number // ✅ CORRECTO: integer nullable
  // Relaciones
  rol?: Rol
  permiso?: Permiso
}

// =============================================
// TIPOS PARA FORMULARIOS (BASADOS EN ESTRUCTURA REAL)
// =============================================

export interface CrearIngredienteData {
  codigo?: string
  nombre?: string
  categoriaid?: number
  costo?: number
  unidadmedidaid?: number
  hotelid?: number
  imgurl?: string
  cambio?: number
}

export interface CrearPlatilloData {
  nombre?: string
  descripcion?: string
  instrucciones?: string
  imgurl?: string
  ingredientes: Array<{
    ingredienteid: number
    cantidad: number
    unidadmedida?: string
  }>
}

export interface CrearMenuData {
  nombre?: string
  descripcion?: string
  restauranteid?: number
  platillos: Array<{
    platilloid: number
    precio: number
  }>
}

export interface CrearRestauranteData {
  nombre?: string
  hotelid?: number
  direccion?: string
  imgurl?: string
}

export interface CrearHotelData {
  acronimo?: string
  nombre?: string
  direccion?: string
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

export const calcularMargenUtilidad = (
  precioVenta: number,
  costoTotal: number,
): { margen: number; porcentaje: number } => {
  const margen = precioVenta - costoTotal
  const porcentaje = precioVenta > 0 ? (margen / precioVenta) * 100 : 0
  return { margen, porcentaje }
}

export const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

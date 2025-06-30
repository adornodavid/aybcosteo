import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =============================================
// TIPOS BASADOS EN TUS 17 TABLAS REALES
// =============================================

// 1. CATEGORIAINGREDIENTES (2 columnas)
export interface CategoriaIngrediente {
  id: number // integer, NOT NULL
  descripcion?: string // text, nullable
}

// 2. HOTELES (6 columnas)
export interface Hotel {
  id: number // integer, NOT NULL
  acronimo?: string // text, nullable
  nombre?: string // text, nullable
  direccion?: string // text, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
}

// 3. TIPOUNIDADMEDIDA (4 columnas)
export interface TipoUnidadMedida {
  id: number // integer, NOT NULL
  descripcion?: string // text, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
}

// 4. INGREDIENTES (12 columnas)
export interface Ingrediente {
  id: number // integer, NOT NULL
  codigo?: string // text, nullable
  nombre?: string // text, nullable
  categoriaid?: number // integer, nullable
  costo?: number // numeric, nullable
  unidadmedidaid?: number // integer, nullable
  hotelid?: number // integer, nullable
  imgurl?: string // text, nullable
  cambio?: number // integer, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  fechamodificacion?: string // date, nullable
  // Relaciones
  categoria?: CategoriaIngrediente
  hotel?: Hotel
  unidadmedida?: TipoUnidadMedida
}

// 5. RESTAURANTES (6 columnas)
export interface Restaurante {
  id: number // integer, NOT NULL
  hotelid?: number // integer, nullable
  nombre?: string // text, nullable
  descripcion?: string // text, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  // Relaciones
  hotel?: Hotel
}

// 6. RECETAS (6 columnas)
export interface Receta {
  id: number // integer, NOT NULL
  nombre?: string // text, nullable
  notaspreparacion?: string // text, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  fechamodificacion?: string // date, nullable
}

// 7. PLATILLOS (9 columnas)
export interface Platillo {
  id: number // integer, NOT NULL
  nombre?: string // text, nullable
  descripcion?: string // text, nullable
  instruccionespreparacion?: string // text, nullable
  tiempopreparacion?: string // text, nullable
  costototal?: number // numeric, nullable
  imgurl?: string // text, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  // Relaciones
  ingredientes?: IngredienteXPlatillo[]
  recetas?: RecetaXPlatillo[]
}

// 8. INGREDIENTESXRECETA (8 columnas)
export interface IngredienteXReceta {
  id: number // integer, NOT NULL
  recetaid?: number // integer, nullable
  ingredienteid?: number // integer, nullable
  cantidad?: number // numeric, nullable
  ingredientecostoparcial?: number // numeric, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  fechamodificacion?: string // date, nullable
  // Relaciones
  receta?: Receta
  ingrediente?: Ingrediente
}

// 9. INGREDIENTESXPLATILLO (8 columnas)
export interface IngredienteXPlatillo {
  id: number // integer, NOT NULL
  platilloid?: number // integer, nullable
  ingredienteid?: number // integer, nullable
  cantidad?: number // numeric, nullable
  ingredientecostoparcial?: number // numeric, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  fechamodificacion?: string // date, nullable
  // Relaciones
  platillo?: Platillo
  ingrediente?: Ingrediente
}

// 10. RECETASXPLATILLO (6 columnas)
export interface RecetaXPlatillo {
  id: number // integer, NOT NULL
  platilloid?: number // integer, nullable
  recetaid?: number // integer, nullable
  cantidad?: number // numeric, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  // Relaciones
  platillo?: Platillo
  receta?: Receta
}

// 11. MENUS (8 columnas)
export interface Menu {
  id: number // integer, NOT NULL
  restauranteid?: number // integer, nullable
  nombre?: string // text, nullable
  descripcion?: string // text, nullable
  imgurl?: string // text, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  fechamodificacion?: string // date, nullable
  // Relaciones
  restaurante?: Restaurante
  platillos?: PlatilloXMenu[]
}

// 12. PLATILLOSXMENU (7 columnas)
export interface PlatilloXMenu {
  id: number // integer, NOT NULL
  menuid?: number // integer, nullable
  platilloid?: number // integer, nullable
  precioventa?: number // numeric, nullable
  margenutilidad?: number // numeric, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  // Relaciones
  menu?: Menu
  platillo?: Platillo
}

// 13. ROLES (5 columnas)
export interface Rol {
  id: number // integer, NOT NULL
  nombre?: string // text, nullable
  descripcion?: string // text, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
}

// 14. USUARIOS (6 columnas)
export interface Usuario {
  id: number // integer, NOT NULL
  nombre?: string // text, nullable
  email?: string // text, nullable
  password?: string // text, nullable
  rolid?: number // integer, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  // Relaciones
  rol?: Rol
}

// 15. PERMISOS (5 columnas)
export interface Permiso {
  id: number // integer, NOT NULL
  funcion?: string // text, nullable
  descripcion?: string // text, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
}

// 16. PERMISOSXROL (5 columnas)
export interface PermisoXRol {
  id: number // integer, NOT NULL
  rolid?: number // integer, nullable
  permisoid?: number // integer, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
  // Relaciones
  rol?: Rol
  permiso?: Permiso
}

// 17. HISTORICO (11 columnas)
export interface Historico {
  idrec: number // integer, NOT NULL (PK diferente)
  hotelid?: number // integer, nullable
  restauranteid?: number // integer, nullable
  menuid?: number // integer, nullable
  platilloid?: number // integer, nullable
  ingredienteid?: number // integer, nullable
  recetaid?: number // integer, nullable
  cantidad?: number // numeric, nullable
  costo?: number // numeric, nullable
  activo?: boolean // boolean, nullable
  fechacreacion?: string // date, nullable
}

// =============================================
// TIPOS PARA FORMULARIOS
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
  instruccionespreparacion?: string
  tiempopreparacion?: string
  imgurl?: string
  ingredientes: Array<{
    ingredienteid: number
    cantidad: number
  }>
  recetas: Array<{
    recetaid: number
    cantidad: number
  }>
}

export interface CrearMenuData {
  restauranteid?: number
  nombre?: string
  descripcion?: string
  imgurl?: string
  platillos: Array<{
    platilloid: number
    precioventa: number
  }>
}

export interface CrearRestauranteData {
  hotelid?: number
  nombre?: string
  descripcion?: string
}

export interface CrearHotelData {
  acronimo?: string
  nombre?: string
  direccion?: string
}

export interface CrearRecetaData {
  nombre?: string
  notaspreparacion?: string
  ingredientes: Array<{
    ingredienteid: number
    cantidad: number
  }>
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
  precioventa: number,
  costototal: number,
): { margen: number; porcentaje: number } => {
  const margen = precioventa - costototal
  const porcentaje = precioventa > 0 ? (margen / precioventa) * 100 : 0
  return { margen, porcentaje }
}

export const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://nxtrsibnomdqmzcrwedc.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54dHJzaWJub21kcW16Y3J3ZWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Nzk0MDYsImV4cCI6MjA2NTI1NTQwNn0.sEnRjfodiruQFsHL_roHB78eJG9UJva1U9RNgELIot8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =============================================
// TIPOS TYPESCRIPT BASADOS EN ESTRUCTURA REAL
// =============================================

export interface CategoriaIngrediente {
  id: number
  descripcion: string
}

export interface TipoUnidadMedida {
  id: number
  descripcion: string
  conversion: number
}

export interface Hotel {
  id: number
  acronimo?: string
  nombre: string
  direccion?: string
  activo: boolean
  fechacreacion?: string
}

export interface Ingrediente {
  id: number
  codigo: string
  nombre: string
  categoriaid?: number
  costo: number
  unidadmedidaid?: number
  hotelid?: number
  imgurl?: string
  cambio?: number
  // Relaciones
  categoria?: CategoriaIngrediente
  hotel?: Hotel
  unidadmedida?: TipoUnidadMedida
}

export interface Restaurante {
  id: number
  nombre: string
  hotelid?: number
  direccion?: string
  activo: boolean
  imgurl?: string
  fechacreacion?: string
  // Relaciones
  hotel?: Hotel
}

export interface Platillo {
  id: number
  nombre: string
  descripcion?: string
  instrucciones?: string
  costo: number
  activo: boolean
  imgurl?: string
  fechacreacion?: string
  // Relaciones
  ingredientes?: IngredienteXPlatillo[]
}

export interface IngredienteXPlatillo {
  id: number
  platilloid: number
  ingredienteid: number
  cantidad: number
  unidadmedida?: string
  costo: number
  // Relaciones
  platillo?: Platillo
  ingrediente?: Ingrediente
}

export interface Menu {
  id: number
  nombre: string
  descripcion?: string
  restauranteid?: number
  activo: boolean
  fechacreacion?: string
  // Relaciones
  restaurante?: Restaurante
  platillos?: PlatilloXMenu[]
}

export interface PlatilloXMenu {
  id: number
  menuid: number
  platilloid: number
  precio: number
  activo: boolean
  // Relaciones
  menu?: Menu
  platillo?: Platillo
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  rolid?: number
  hotelid?: number
  activo: boolean
  fechacreacion?: string
}

export interface Rol {
  id: number
  nombre: string
  descripcion?: string
}

// =============================================
// TIPOS PARA FORMULARIOS
// =============================================

export interface CrearIngredienteData {
  codigo: string
  nombre: string
  categoriaid?: number
  costo: number
  unidadmedidaid?: number
  hotelid?: number
  imgurl?: string
}

export interface CrearPlatilloData {
  nombre: string
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
  nombre: string
  descripcion?: string
  restauranteid?: number
  platillos: Array<{
    platilloid: number
    precio: number
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
  precioVenta: number,
  costoTotal: number,
): { margen: number; porcentaje: number } => {
  const margen = precioVenta - costoTotal
  const porcentaje = precioVenta > 0 ? (margen / precioVenta) * 100 : 0
  return { margen, porcentaje }
}

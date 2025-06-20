import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =============================================
// Tipos TypeScript para las nuevas tablas
// =============================================

export interface CategoriaIngrediente {
  Categoria_Id: number
  Nombre: string
  FechaCreacion: string
  FechaActualizacion: string
}

export interface TipoUnidadMedida {
  TipoUnidad_Id: number
  DescripcionUnidad: string
  CalculoConversion: number
  FechaCreacion: string
  FechaActualizacion: string
}

export interface Hotel {
  Id: number
  Hotel_Id: number
  Nombre: string
  ShortName?: string
  FechaCreacion: string
  FechaActualizacion: string
}

export interface Rol {
  Id_Rol: number
  NombreRol: string
  DescripcionRol?: string
  FechaCreacion: string
  FechaActualizacion: string
}

export interface Usuario {
  IdUsuario: number
  Nombre_completo?: string
  Email: string
  Id_Rol?: number
  Hotel_Id?: number
  Activo: boolean
  FechaCreacion: string
  FechaActualizacion: string
  // Relaciones
  rol?: Rol
  hotel?: Hotel
}

export interface Ingrediente {
  Id_Ingredientes: number
  CodigoIngrediente: string
  HotelID: number
  Nombre: string
  Categoria_id?: number
  CostoIngrediente: number
  UnidadMedida_Id: number
  Año: number
  Mes: number
  FechaCreacion: string
  FechaActualizacion: string
  ImagenURL?: string
  // Relaciones
  categoria?: CategoriaIngrediente
  unidadMedida?: TipoUnidadMedida
  hotel?: Hotel
}

export interface CategoriaPlatillo {
  CategoriaPlatillos_Id: number
  Descripcion: string
  FechaCreacion: string
  FechaActualizacion: string
}

export interface Restaurante {
  Id: number
  Hotel_Id: number
  NombreRestaurante: string
  Direccion?: string
  Activo: boolean
  ImagenURL?: string
  FechaCreacion: string
  FechaActualizacion: string
  // Relaciones
  hotel?: Hotel
}

export interface Platillo {
  Id: number
  Nombre: string
  CategoriaPlatillo_Id?: number
  InstruccionesPreparacion?: string
  TiempoPreparacion?: string
  CostoTotal_Platillo: number
  Activo: boolean
  CreadorUsuarioId?: number
  ImagenURL?: string
  FechaCreacion: string
  FechaActualizacion: string
  // Relaciones
  categoria?: CategoriaPlatillo
  creador?: Usuario
  ingredientes?: PlatilloIngrediente[]
}

export interface PlatilloIngrediente {
  Id: number
  Platillo_Id: number
  Ingrediente_Id: number
  Cantidad_Ingredientes: number
  UnidadMedida: string
  CostoParcial_Ingredientes: number
  FechaCreacion: string
  FechaActualizacion: string
  // Relaciones
  platillo?: Platillo
  ingrediente?: Ingrediente
}

export interface Menu {
  Id: number
  Restaurante_Id: number
  NombreMenu: string
  Descripcion?: string
  Activo: boolean
  FechaCreacion: string
  FechaActualizacion: string
  // Relaciones
  restaurante?: Restaurante
  platillos?: MenuPlatillo[]
}

export interface MenuPlatillo {
  Id: number
  Menu_Id: number
  Platillo_Id: number
  PreciodeVenta: number
  Activo: boolean
  FechaCreacion: string
  FechaActualizacion: string
  // Relaciones
  menu?: Menu
  platillo?: Platillo
  // Campos calculados
  margen_utilidad?: number
  porcentaje_margen?: number
}

// =============================================
// Tipos para formularios y operaciones
// =============================================

export interface CrearIngredienteData {
  CodigoIngrediente: string
  HotelID: number
  Nombre: string
  Categoria_id?: number
  CostoIngrediente: number
  UnidadMedida_Id: number
  Año: number
  Mes: number
  ImagenURL?: string
}

export interface CrearPlatilloData {
  Nombre: string
  CategoriaPlatillo_Id?: number
  InstruccionesPreparacion?: string
  TiempoPreparacion?: string
  CreadorUsuarioId?: number
  ImagenURL?: string
  ingredientes: Array<{
    Ingrediente_Id: number
    Cantidad_Ingredientes: number
    UnidadMedida: string
  }>
}

export interface CrearMenuData {
  Restaurante_Id: number
  NombreMenu: string
  Descripcion?: string
  platillos: Array<{
    Platillo_Id: number
    PreciodeVenta: number
  }>
}

// =============================================
// Tipos para análisis y reportes
// =============================================

export interface AnalisisPlatillo {
  platillo: Platillo
  costo_total: number
  precio_venta_promedio: number
  margen_promedio: number
  porcentaje_margen_promedio: number
  ingredientes_count: number
  menus_count: number
}

export interface AnalisisRestaurante {
  restaurante: Restaurante
  total_platillos: number
  total_menus: number
  costo_promedio_platillos: number
  precio_venta_promedio: number
  margen_promedio: number
  platillos_mas_costosos: AnalisisPlatillo[]
  platillos_mas_rentables: AnalisisPlatillo[]
}

export interface AnalisisHotel {
  hotel: Hotel
  total_restaurantes: number
  total_ingredientes: number
  total_platillos: number
  costo_total_inventario: number
  restaurantes: AnalisisRestaurante[]
}

// =============================================
// Funciones de utilidad para cálculos
// =============================================

export const calcularCostoParcialIngrediente = (
  cantidad: number,
  costoUnitario: number,
  factorConversion = 1,
): number => {
  return cantidad * costoUnitario * factorConversion
}

export const calcularMargenUtilidad = (
  precioVenta: number,
  costoTotal: number,
): { margen: number; porcentaje: number } => {
  const margen = precioVenta - costoTotal
  const porcentaje = precioVenta > 0 ? (margen / precioVenta) * 100 : 0
  return { margen, porcentaje }
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

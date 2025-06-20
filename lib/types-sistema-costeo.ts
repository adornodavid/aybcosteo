// =============================================
// TIPOS TYPESCRIPT PARA EL SISTEMA DE COSTEO
// Basados en la estructura SQL corregida
// =============================================

export interface CategoriaIngrediente {
  categoria_id: number
  nombre: string
  fechacreacion: string
  fechaactualizacion: string
}

export interface TipoUnidadMedida {
  tipounidad_id: number
  descripcionunidad: string
  calculoconversion: number
  fechacreacion: string
  fechaactualizacion: string
}

export interface Hotel {
  id: number
  hotel_id: number
  nombre: string
  shortname?: string
  fechacreacion: string
  fechaactualizacion: string
}

export interface Rol {
  id_rol: number
  nombrerol: string
  descripcionrol?: string
  fechacreacion: string
  fechaactualizacion: string
}

export interface Usuario {
  idusuario: number
  nombre_completo?: string
  email: string
  id_rol?: number
  hotel_id?: number
  activo: boolean
  fechacreacion: string
  fechaactualizacion: string
  // Relaciones
  rol?: Rol
  hotel?: Hotel
}

export interface Ingrediente {
  id_ingredientes: number
  codigoingrediente: string
  hotelid: number
  nombre: string
  categoria_id?: number
  costoingrediente: number
  unidadmedida_id: number
  año: number
  mes: number
  fechacreacion: string
  fechaactualizacion: string
  imagenurl?: string
  // Relaciones
  categoria?: CategoriaIngrediente
  hotel?: Hotel
  unidad_medida?: TipoUnidadMedida
}

export interface CategoriaPlatillo {
  categoriaplatillos_id: number
  descripcion: string
  fechacreacion: string
  fechaactualizacion: string
}

export interface Restaurante {
  id: number
  hotel_id: number
  nombrerestaurante: string
  direccion?: string
  activo: boolean
  imagenurl?: string
  fechacreacion: string
  fechaactualizacion: string
  // Relaciones
  hotel?: Hotel
}

export interface Platillo {
  id: number
  nombre: string
  categoriaplatillo_id?: number
  instruccionespreparacion?: string
  tiempopreparacion?: string
  costototal_platillo: number
  activo: boolean
  creadorusuarioid?: number
  imagenurl?: string
  fechacreacion: string
  fechaactualizacion: string
  // Relaciones
  categoria?: CategoriaPlatillo
  creador?: Usuario
  ingredientes?: PlatilloIngrediente[]
}

export interface PlatilloIngrediente {
  id: number
  platillo_id: number
  ingrediente_id: number
  cantidad_ingredientes: number
  unidadmedida?: string
  costoparcial_ingredientes: number
  fechacreacion: string
  fechaactualizacion: string
  // Relaciones
  platillo?: Platillo
  ingrediente?: Ingrediente
}

export interface Menu {
  id: number
  restaurante_id: number
  nombremenu: string
  descripcion?: string
  activo: boolean
  fechacreacion: string
  fechaactualizacion: string
  // Relaciones
  restaurante?: Restaurante
  platillos?: MenuPlatillo[]
}

export interface MenuPlatillo {
  id: number
  menu_id: number
  platillo_id: number
  preciodeventa: number
  activo: boolean
  fechacreacion: string
  fechaactualizacion: string
  // Relaciones
  menu?: Menu
  platillo?: Platillo
}

// =============================================
// TIPOS PARA FORMULARIOS
// =============================================

export interface CrearHotelData {
  hotel_id: number
  nombre: string
  shortname?: string
}

export interface CrearIngredienteData {
  codigoingrediente: string
  nombre: string
  categoria_id?: number
  costoingrediente: number
  unidadmedida_id: number
  año: number
  mes: number
  hotelid: number
  imagenurl?: string
}

export interface CrearPlatilloData {
  nombre: string
  categoriaplatillo_id?: number
  instruccionespreparacion?: string
  tiempopreparacion?: string
  imagenurl?: string
  creadorusuarioid?: number
  ingredientes: Array<{
    ingrediente_id: number
    cantidad_ingredientes: number
    unidadmedida?: string
  }>
}

export interface CrearRestauranteData {
  hotel_id: number
  nombrerestaurante: string
  direccion?: string
  imagenurl?: string
}

export interface CrearMenuData {
  restaurante_id: number
  nombremenu: string
  descripcion?: string
  platillos: Array<{
    platillo_id: number
    preciodeventa: number
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

// Función para obtener el año y mes actual
export const obtenerPeriodoActual = () => {
  const fecha = new Date()
  return {
    año: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
  }
}

// Función para formatear fecha
export const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

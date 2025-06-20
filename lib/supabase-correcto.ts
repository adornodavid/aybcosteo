import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =============================================
// TIPOS TYPESCRIPT CORRECTOS
// Basados en la estructura real de Supabase
// =============================================

export interface Categoria {
  id: string
  nombre: string
  descripcion?: string
  created_at: string
  updated_at: string
}

export interface Restaurante {
  id: string
  nombre: string
  descripcion?: string
  direccion?: string
  telefono?: string
  email?: string
  imagen_url?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Ingrediente {
  id: string
  clave: string
  descripcion: string
  categoria_id?: string
  status: "activo" | "inactivo"
  tipo?: string
  unidad_medida: string
  cantidad_por_presentacion: number
  conversion?: string
  restaurante_id: string
  created_at: string
  updated_at: string
  // Relaciones
  categoria?: Categoria
  restaurante?: Restaurante
  precio_actual?: PrecioUnitario
}

export interface PrecioUnitario {
  id: string
  ingrediente_id: string
  precio: number
  fecha_inicio: string
  fecha_fin?: string
  notas?: string
  created_at: string
  // Relaciones
  ingrediente?: Ingrediente
}

export interface Platillo {
  id: string
  nombre: string
  descripcion?: string
  instrucciones?: string
  imagen_url?: string
  costo_total: number
  tiempo_preparacion?: number
  porciones: number
  restaurante_id: string
  activo: boolean
  created_at: string
  updated_at: string
  // Relaciones
  restaurante?: Restaurante
  ingredientes?: PlatilloIngrediente[]
}

export interface PlatilloIngrediente {
  id: string
  platillo_id: string
  ingrediente_id: string
  cantidad: number
  unidad_usada: string
  costo_parcial: number
  created_at: string
  // Relaciones
  platillo?: Platillo
  ingrediente?: Ingrediente
}

export interface Menu {
  id: string
  nombre: string
  descripcion?: string
  restaurante_id: string
  imagen_url?: string
  activo: boolean
  created_at: string
  updated_at: string
  // Relaciones
  restaurante?: Restaurante
  platillos?: MenuPlatillo[]
}

export interface MenuPlatillo {
  id: string
  menu_id: string
  platillo_id: string
  precio_venta: number
  categoria_menu?: string
  orden: number
  disponible: boolean
  created_at: string
  // Relaciones
  menu?: Menu
  platillo?: Platillo
  // Campos calculados
  margen_utilidad?: number
  porcentaje_margen?: number
}

// =============================================
// TIPOS PARA FORMULARIOS
// =============================================

export interface CrearIngredienteData {
  clave: string
  descripcion: string
  categoria_id?: string
  status?: "activo" | "inactivo"
  tipo?: string
  unidad_medida: string
  cantidad_por_presentacion?: number
  conversion?: string
  restaurante_id: string
  precio_inicial: number // Para crear el primer precio
}

export interface CrearPlatilloData {
  nombre: string
  descripcion?: string
  instrucciones?: string
  imagen_url?: string
  tiempo_preparacion?: number
  porciones?: number
  restaurante_id: string
  ingredientes: Array<{
    ingrediente_id: string
    cantidad: number
    unidad_usada: string
  }>
}

export interface CrearMenuData {
  nombre: string
  descripcion?: string
  restaurante_id: string
  imagen_url?: string
  platillos: Array<{
    platillo_id: string
    precio_venta: number
    categoria_menu?: string
    orden?: number
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

// Función para convertir unidades (lógica del Excel)
export const convertirUnidades = (cantidad: number, unidadOrigen: string, unidadDestino: string): number => {
  // Conversiones básicas basadas en el Excel original
  const conversiones: Record<string, Record<string, number>> = {
    Kilo: { Gramo: 1000, Kilo: 1 },
    Gramo: { Kilo: 0.001, Gramo: 1 },
    Litro: { Mililitro: 1000, Litro: 1 },
    Mililitro: { Litro: 0.001, Mililitro: 1 },
    Pieza: { Pieza: 1, Docena: 1 / 12 },
    Docena: { Pieza: 12, Docena: 1 },
  }

  const factor = conversiones[unidadOrigen]?.[unidadDestino] || 1
  return cantidad * factor
}

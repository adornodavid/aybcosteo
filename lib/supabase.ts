import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para uso en el navegador
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para server actions
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// SOLO LAS 17 TABLAS REALES DE TU BD
export interface CategoriaIngrediente {
  id: number
  descripcion?: string
}

export interface Hotel {
  id: number
  acronimo?: string
  nombre?: string
  direccion?: string
  activo?: boolean
  fechacreacion?: string
}

export interface TipoUnidadMedida {
  id: number
  descripcion?: string
  activo?: boolean
  fechacreacion?: string
}

export interface Ingrediente {
  id: number
  codigo?: string
  nombre?: string
  categoriaid?: number
  costo?: number
  unidadmedidaid?: number
  hotelid?: number
  imgurl?: string
  cambio?: number
  activo?: boolean
  fechacreacion?: string
  fechamodificacion?: string
  categoria?: CategoriaIngrediente
  hotel?: Hotel
  unidadmedida?: TipoUnidadMedida
}

export interface Restaurante {
  id: number
  hotelid?: number
  nombre?: string
  descripcion?: string
  activo?: boolean
  fechacreacion?: string
  hotel?: Hotel
}

export interface Platillo {
  id: number
  nombre?: string
  descripcion?: string
  instruccionespreparacion?: string
  tiempopreparacion?: string
  costototal?: number
  imgurl?: string
  activo?: boolean
  fechacreacion?: string
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

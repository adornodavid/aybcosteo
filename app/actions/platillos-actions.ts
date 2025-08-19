"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function crearPlatillo(platilloData: {
  nombre: string
  descripcion?: string | null
  instruccionespreparacion?: string | null
  tiempopreparacion?: string | null
  costototal?: number | null
  imgurl?: string | null
  activo?: boolean
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("platillos")
      .insert({
        ...platilloData,
        fechacreacion: new Date().toISOString(),
        fechaactualizacion: new Date().toISOString(),
        activo: platilloData.activo ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creando platillo:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/platillos")
    return { success: true, data }
  } catch (error) {
    console.error("Error en crearPlatillo:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function actualizarPlatillo(
  id: number,
  platilloData: {
    nombre?: string
    descripcion?: string | null
    instruccionespreparacion?: string | null
    tiempopreparacion?: string | null
    costototal?: number | null
    imgurl?: string | null
    activo?: boolean
  },
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("platillos")
      .update({
        ...platilloData,
        fechaactualizacion: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error actualizando platillo:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/platillos")
    revalidatePath(`/platillos/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Error en actualizarPlatillo:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function obtenerPlatillos() {
  try {
    const { data, error } = await supabaseAdmin
      .from("platillos")
      .select("*")
      .eq("activo", true)
      .order("fechacreacion", { ascending: false })

    if (error) {
      console.error("Error obteniendo platillos:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerPlatillos:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function obtenerPlatilloPorId(id: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("platillos")
      .select(`
        *,
        platillo_ingredientes (
          id,
          cantidad,
          ingredientes (
            id,
            nombre,
            costo,
            tipounidadmedida (
              descripcion
            )
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error obteniendo platillo:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerPlatilloPorId:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Nueva función para calcular el costo porcentual
export function calcularCostoPorcentual(costoTotal: number, precioVenta: number): number {
  if (precioVenta === 0) {
  return 0
  }
  else {
  //const Costoporcentual = (costoTotal / precioVenta) * 100
  return  (costoTotal / precioVenta) * 100
  }
}

// Nueva función para calcular el precio con IVA
export function calcularPrecioConIVA(precioVenta: number): number {
  return precioVenta * 0.16 + precioVenta
}

"use server"

import { createServerSupabaseClientWrapper } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function crearMenuRestaurante(prevState: any, formData: FormData) {
  try {
    const nombre = formData.get("nombre") as string
    const restaurante_id = formData.get("restaurante_id") as string
    const platillo_id = formData.get("platillo_id") as string

    if (!nombre || nombre.trim() === "") {
      return { success: false, error: "El nombre del menú es requerido." }
    }
    if (!restaurante_id || restaurante_id.trim() === "") {
      return { success: false, error: "El restaurante es requerido." }
    }
    if (!platillo_id || platillo_id.trim() === "") {
      return { success: false, error: "El platillo es requerido." }
    }

    const supabase = createServerSupabaseClientWrapper(cookies())
    const { data, error } = await supabase
      .from("menus_restaurantes")
      .insert({
        nombre: nombre.trim(),
        restaurante_id: Number(restaurante_id),
        platillo_id: Number(platillo_id),
        activo: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error al crear menú de restaurante:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/menus")
    return { success: true, message: `Menú "${nombre}" creado exitosamente.`, data }
  } catch (error: any) {
    console.error("Error en crearMenuRestaurante:", error)
    return { success: false, error: `Error al crear menú de restaurante: ${error.message}` }
  }
}

export async function obtenerMenusRestaurante() {
  const supabase = createServerSupabaseClientWrapper(cookies())
  try {
    const { data, error } = await supabase
      .from("menus_restaurantes")
      .select("*, restaurantes(nombre), platillos(nombre)")
      .eq("activo", true)
      .order("nombre")

    if (error) {
      console.error("Error obteniendo menús de restaurante:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error en obtenerMenusRestaurante:", error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function actualizarMenuRestaurante(id: number, prevState: any, formData: FormData) {
  try {
    const nombre = formData.get("nombre") as string
    const restaurante_id = formData.get("restaurante_id") as string
    const platillo_id = formData.get("platillo_id") as string

    if (!nombre || nombre.trim() === "") {
      return { success: false, error: "El nombre del menú es requerido." }
    }
    if (!restaurante_id || restaurante_id.trim() === "") {
      return { success: false, error: "El restaurante es requerido." }
    }
    if (!platillo_id || platillo_id.trim() === "") {
      return { success: false, error: "El platillo es requerido." }
    }

    const supabase = createServerSupabaseClientWrapper(cookies())
    const { error } = await supabase
      .from("menus_restaurantes")
      .update({
        nombre: nombre.trim(),
        restaurante_id: Number(restaurante_id),
        platillo_id: Number(platillo_id),
      })
      .eq("id", id)

    if (error) {
      console.error("Error al actualizar menú de restaurante:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/menus")
    return { success: true, message: `Menú "${nombre}" actualizado exitosamente.` }
  } catch (error: any) {
    console.error("Error en actualizarMenuRestaurante:", error)
    return { success: false, error: `Error al actualizar menú de restaurante: ${error.message}` }
  }
}

export async function eliminarMenuRestaurante(id: number) {
  try {
    const supabase = createServerSupabaseClientWrapper(cookies())
    const { error } = await supabase.from("menus_restaurantes").update({ activo: false }).eq("id", id)

    if (error) {
      console.error("Error al eliminar menú de restaurante:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/menus")
    return { success: true, message: "Menú de restaurante eliminado exitosamente." }
  } catch (error: any) {
    console.error("Error en eliminarMenuRestaurante:", error)
    return { success: false, error: `Error al eliminar menú de restaurante: ${error.message}` }
  }
}

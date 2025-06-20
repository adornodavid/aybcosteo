"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function asignarMenuARestaurante(restauranteId: string, menuId: string, activo = true) {
  try {
    // Verificar si ya existe esta relación
    const { data: existente, error: errorBusqueda } = await supabase
      .from("menus_restaurantes")
      .select("id")
      .eq("restaurante_id", restauranteId)
      .eq("menu_id", menuId)
      .maybeSingle()

    if (errorBusqueda) {
      console.error("Error al verificar menú en restaurante:", errorBusqueda)
      return { success: false, error: errorBusqueda.message }
    }

    // Si ya existe, actualizar
    if (existente) {
      const { error: errorActualizar } = await supabase
        .from("menus_restaurantes")
        .update({
          activo: activo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existente.id)

      if (errorActualizar) {
        console.error("Error al actualizar menú en restaurante:", errorActualizar)
        return { success: false, error: errorActualizar.message }
      }
    } else {
      // Si no existe, insertar
      const { error: errorInsertar } = await supabase.from("menus_restaurantes").insert({
        restaurante_id: restauranteId,
        menu_id: menuId,
        activo: activo,
        created_at: new Date().toISOString(),
      })

      if (errorInsertar) {
        console.error("Error al asignar menú a restaurante:", errorInsertar)
        return { success: false, error: errorInsertar.message }
      }
    }

    revalidatePath(`/restaurantes/${restauranteId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error en asignarMenuARestaurante:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarMenuDeRestaurante(restauranteMenuId: string, restauranteId: string) {
  try {
    const { error } = await supabase.from("menus_restaurantes").delete().eq("id", restauranteMenuId)

    if (error) {
      console.error("Error al eliminar menú del restaurante:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/restaurantes/${restauranteId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error en eliminarMenuDeRestaurante:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarEstadoMenu(restauranteMenuId: string, activo: boolean, restauranteId: string) {
  try {
    const { error } = await supabase
      .from("menus_restaurantes")
      .update({
        activo: activo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", restauranteMenuId)

    if (error) {
      console.error("Error al actualizar estado del menú:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/restaurantes/${restauranteId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error en actualizarEstadoMenu:", error)
    return { success: false, error: error.message }
  }
}

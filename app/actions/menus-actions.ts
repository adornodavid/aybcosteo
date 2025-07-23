"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function obtenerMenus() {
  try {
    const { data, error } = await supabase.from("menus").select("*").order("nombre", { ascending: true })

    if (error) {
      console.error("Error al obtener menús:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en obtenerMenus:", error)
    return { data: null, error: error.message }
  }
}

export async function crearMenu(menuData: {
  nombre: string
  descripcion?: string
  restauranteid: number
  activo?: boolean
}) {
  try {
    const { data, error } = await supabase
      .from("menus")
      .insert([
        {
          nombre: menuData.nombre,
          descripcion: menuData.descripcion || null,
          restauranteid: menuData.restauranteid,
          activo: menuData.activo ?? true,
          // Se han eliminado 'fechacreacion' y 'fechaactualizacion'
          // para evitar errores si no existen en la tabla o si se manejan
          // con valores por defecto/triggers en la base de datos.
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error al crear menú:", error)
      return { data: null, error: error.message }
    }

    revalidatePath("/menus")
    return { data, success: true, error: null }
  } catch (error: any) {
    console.error("Error en crearMenu:", error)
    return { data: null, error: error.message }
  }
}

export async function actualizarMenu(
  id: number,
  menuData: {
    nombre?: string
    descripcion?: string
    restauranteid?: number
    activo?: boolean
  },
) {
  try {
    const { data, error } = await supabase
      .from("menus")
      .update({
        ...menuData,
        // Se ha eliminado 'fechaactualizacion' de la actualización
        // para evitar errores si no existe en la tabla.
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar menú:", error)
      return { data: null, error: error.message }
    }

    revalidatePath("/menus")
    return { data, error: null }
  } catch (error: any) {
    console.error("Error en actualizarMenu:", error)
    return { data: null, error: error.message }
  }
}

export async function obtenerMenuPorId(id: number) {
  try {
    const { data, error } = await supabase
      .from("menus")
      .select(`
        *,
        restaurantes (
          id,
          nombre,
          hoteles (
            id,
            nombre
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error al obtener menú:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en obtenerMenuPorId:", error)
    return { data: null, error: error.message }
  }
}

export async function eliminarMenu(menuId: string) {
  try {
    // 1. Eliminar las relaciones en menu_platillos
    const { error: deleteMenuPlatillosError } = await supabase.from("menu_platillos").delete().eq("menu_id", menuId)

    if (deleteMenuPlatillosError) {
      console.error("Error al eliminar relaciones menu_platillos:", deleteMenuPlatillosError)
      return { success: false, error: deleteMenuPlatillosError.message }
    }

    // 2. Eliminar las relaciones en restaurante_menus
    const { error: deleteRestauranteMenusError } = await supabase
      .from("restaurante_menus")
      .delete()
      .eq("menu_id", menuId)

    if (deleteRestauranteMenusError) {
      console.error("Error al eliminar relaciones restaurante_menus:", deleteRestauranteMenusError)
      return { success: false, error: deleteRestauranteMenusError.message }
    }

    // 3. Eliminar el menú
    const { error } = await supabase.from("menus").delete().eq("id", menuId)

    if (error) {
      console.error("Error al eliminar menú:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/menus")
    return { success: true }
  } catch (error: any) {
    console.error("Error en eliminarMenu:", error)
    return { success: false, error: error.message }
  }
}

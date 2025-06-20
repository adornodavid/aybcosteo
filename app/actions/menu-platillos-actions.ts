"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function agregarPlatilloAMenu(menuId: string, platilloId: string, precioVenta: number, disponible = true) {
  try {
    // Verificar si ya existe esta relación
    const { data: existente, error: errorBusqueda } = await supabase
      .from("menus_platillos")
      .select("id")
      .eq("menu_id", menuId)
      .eq("platillo_id", platilloId)
      .maybeSingle()

    if (errorBusqueda) {
      console.error("Error al verificar platillo en menú:", errorBusqueda)
      return { success: false, error: errorBusqueda.message }
    }

    // Si ya existe, actualizar
    if (existente) {
      const { error: errorActualizar } = await supabase
        .from("menus_platillos")
        .update({
          precio_venta: precioVenta,
          disponible: disponible,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existente.id)

      if (errorActualizar) {
        console.error("Error al actualizar platillo en menú:", errorActualizar)
        return { success: false, error: errorActualizar.message }
      }
    } else {
      // Si no existe, insertar
      const { error: errorInsertar } = await supabase.from("menus_platillos").insert({
        menu_id: menuId,
        platillo_id: platilloId,
        precio_venta: precioVenta,
        disponible: disponible,
        created_at: new Date().toISOString(),
      })

      if (errorInsertar) {
        console.error("Error al agregar platillo a menú:", errorInsertar)
        return { success: false, error: errorInsertar.message }
      }
    }

    revalidatePath(`/menus/${menuId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error en agregarPlatilloAMenu:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarPlatilloDeMenu(menuPlatilloId: string, menuId: string) {
  try {
    const { error } = await supabase.from("menus_platillos").delete().eq("id", menuPlatilloId)

    if (error) {
      console.error("Error al eliminar platillo del menú:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/menus/${menuId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error en eliminarPlatilloDeMenu:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarDisponibilidadPlatillo(menuPlatilloId: string, disponible: boolean, menuId: string) {
  try {
    const { error } = await supabase
      .from("menus_platillos")
      .update({
        disponible: disponible,
        updated_at: new Date().toISOString(),
      })
      .eq("id", menuPlatilloId)

    if (error) {
      console.error("Error al actualizar disponibilidad:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/menus/${menuId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error en actualizarDisponibilidadPlatillo:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarPrecioVenta(menuPlatilloId: string, precioVenta: number, menuId: string) {
  try {
    const { error } = await supabase
      .from("menus_platillos")
      .update({
        precio_venta: precioVenta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", menuPlatilloId)

    if (error) {
      console.error("Error al actualizar precio de venta:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/menus/${menuId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error en actualizarPrecioVenta:", error)
    return { success: false, error: error.message }
  }
}

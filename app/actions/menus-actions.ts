"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

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

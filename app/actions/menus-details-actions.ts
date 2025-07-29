"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function getMenuDetails(menuId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Consulta para obtener los detalles básicos del menú, restaurante y hotel
    const { data: menuData, error: menuError } = await supabase
      .from("menus")
      .select(
        `
        id,
        nombre,
        descripcion,
        activo,
        fechacreacion,
        restaurante:restauranteid(
          id,
          nombre,
          hotel:hotelid(
            id,
            nombre
          )
        )
      `,
      )
      .eq("id", menuId)
      .single()

    if (menuError) {
      console.error("Error al obtener detalles del menú:", menuError)
      return { menu: null, platillos: null, error: menuError.message }
    }

    // Consulta para obtener los platillos asignados a este menú
    const { data: platillosData, error: platillosError } = await supabase
      .from("platillosxmenu")
      .select(
        `
        id,
        precioventa,
        margenutilidad,
        platillo:platilloid(
          nombre,
          costototal,
          costoadministrativo,
          imgurl
        )
      `,
      )
      .eq("menuid", menuId)

    if (platillosError) {
      console.error("Error al obtener platillos del menú:", platillosError)
      return { menu: null, platillos: null, error: platillosError.message }
    }

    return { menu: menuData, platillos: platillosData, error: null }
  } catch (error: any) {
    console.error("Error en getMenuDetails:", error)
    return { menu: null, platillos: null, error: error.message }
  }
}

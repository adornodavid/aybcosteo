"use server"

import { createServerComponentClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function getMenuDetails(id: number) {
  const supabase = createServerComponentClient({ cookies })
  try {
    const { data, error } = await supabase
      .from("menus")
      .select(
        `
        id,
        nombre,
        descripcion,
        restaurante_id,
        updated_at,
        restaurantes (
          id,
          nombre,
          hotel_id,
          hoteles (
            id,
            nombre
          )
        )
      `,
      )
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching menu details:", error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getMenuDetails:", error)
    return { data: null, error: error.message }
  }
}

export async function getHotelsForDropdown(rolId: number, userHotelId: number | null) {
  const supabase = createServerComponentClient({ cookies })
  let auxHotelid = -1
  if (![1, 2, 3, 4].includes(rolId)) {
    auxHotelid = userHotelId || -1
  }

  try {
    const { data, error } = await supabase
      .from("hoteles")
      .select("id, nombre")
      .or(`id.eq.${auxHotelid},id.eq.-1`) // Corrected OR clause for Supabase
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching hotels:", error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getHotelsForDropdown:", error)
    return { data: null, error: error.message }
  }
}

export async function getRestaurantsForDropdown(hotelId: number) {
  const supabase = createServerComponentClient({ cookies })
  try {
    const { data, error } = await supabase
      .from("restaurantes")
      .select("id, nombre")
      .eq("hotel_id", hotelId)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching restaurants:", error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getRestaurantsForDropdown:", error)
    return { data: null, error: error.message }
  }
}

export async function getAvailablePlatillos() {
  const supabase = createServerComponentClient({ cookies })
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select("id, nombre, costo_total, imagen_url") // Include costo_total for display
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching available platillos:", error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getAvailablePlatillos:", error)
    return { data: null, error: error.message }
  }
}

export async function updateMenuBasicInfo(
  id: number,
  data: { restaurante_id: number; nombre: string; descripcion: string },
) {
  const supabase = createServerComponentClient({ cookies })
  try {
    const { error } = await supabase
      .from("menus")
      .update({
        restaurante_id: data.restaurante_id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        updated_at: new Date().toISOString(), // Explicitly update timestamp
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating menu basic info:", error)
      return { success: false, error: error.message }
    }
    revalidatePath(`/menus/${id}/editar`)
    revalidatePath("/menus")
    return { success: true }
  } catch (error: any) {
    console.error("Error in updateMenuBasicInfo:", error)
    return { success: false, error: error.message }
  }
}

export async function addPlatilloToMenu(menuId: number, platilloId: number, precioVenta: number) {
  const supabase = createServerComponentClient({ cookies })
  try {
    // Check if platillo is already in menu
    const { data: existingPlatillo, error: existingError } = await supabase
      .from("menus_platillos")
      .select("id")
      .eq("menu_id", menuId)
      .eq("platillo_id", platilloId)
      .single()

    if (existingError && existingError.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error("Error checking existing platillo in menu:", existingError)
      return { success: false, error: "Error al verificar platillo existente en el menú." }
    }

    if (existingPlatillo) {
      return { success: false, error: "Este platillo ya está en el menú." }
    }

    const { data, error } = await supabase
      .from("menus_platillos")
      .insert({
        menu_id: menuId,
        platillo_id: platilloId,
        precio_venta: precioVenta,
        disponible: true, // Maps to 'activo' in user's SQL
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding platillo to menu:", error)
      return { success: false, error: error.message }
    }
    revalidatePath(`/menus/${menuId}/editar`)
    return { success: true, data }
  } catch (error: any) {
    console.error("Error in addPlatilloToMenu:", error)
    return { success: false, error: error.message }
  }
}

export async function getPlatillosInMenu(menuId: number) {
  const supabase = createServerComponentClient({ cookies })
  try {
    const { data, error } = await supabase
      .from("menus_platillos")
      .select(
        `
        id,
        platillo_id,
        precio_venta,
        disponible,
        platillos (
          id,
          nombre,
          costo_total, // Assuming this is available via join/view as per previous page
          imagen_url
        )
      `,
      )
      .eq("menu_id", menuId)
      .order("id")

    if (error) {
      console.error("Error fetching platillos in menu:", error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getPlatillosInMenu:", error)
    return { data: null, error: error.message }
  }
}

"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getMenuDetails(id: number) {
  try {
    const { data, error } = await createServerSupabaseClient
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
      console.error("Error fetching menu details:", error.message)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getMenuDetails:", error.message)
    return { data: null, error: error.message }
  }
}

export async function getHotelsForDropdown(rolId: number, sessionHotelId: string | null) {
  try {
    let query = supabase.from("hoteles").select("id, nombre")

    if (rolId !== 1 && rolId !== 2 && rolId !== 3 && rolId !== 4) {
      query = query.eq("id", sessionHotelId || "")
    }

    const { data, error } = await query.order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching hotels for dropdown:", error.message)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Exception fetching hotels for dropdown:", error.message)
    return { data: null, error: error.message }
  }
}

export async function getRestaurantsForDropdown(hotelId: number) {
  try {
    const { data, error } = await supabase
      .from("restaurantes")
      .select("id, nombre")
      .eq("hotelid", hotelId)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching restaurants for dropdown:", error.message)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Exception fetching restaurants for dropdown:", error.message)
    return { data: null, error: error.message }
  }
}

export async function getAvailablePlatillos() {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select("id, nombre, costo_total, imagen_url")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching available platillos:", error.message)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getAvailablePlatillos:", error.message)
    return { success: false, error: error.message }
  }
}

export async function updateMenuBasicInfo(
  id: number,
  data: { restaurante_id: number; nombre: string; descripcion: string },
) {
  try {
    const { error } = await supabase
      .from("menus")
      .update({
        restaurante_id: data.restaurante_id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating menu basic info:", error.message)
      return { success: false, error: error.message }
    }
    revalidatePath(`/menus/${id}/editar`)
    revalidatePath("/menus")
    return { success: true }
  } catch (error: any) {
    console.error("Error in updateMenuBasicInfo:", error.message)
    return { success: false, error: error.message }
  }
}

export async function addPlatilloToMenu(menuId: number, platilloId: number, precioVenta: number) {
  try {
    const { data: existingPlatillo, error: existingError } = await supabase
      .from("menus_platillos")
      .select("id")
      .eq("menu_id", menuId)
      .eq("platillo_id", platilloId)
      .single()

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Error checking existing platillo in menu:", existingError.message)
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
        disponible: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding platillo to menu:", error.message)
      return { success: false, error: error.message }
    }
    revalidatePath(`/menus/${menuId}/editar`)
    return { success: true, data }
  } catch (error: any) {
    console.error("Error in addPlatilloToMenu:", error.message)
    return { success: false, error: error.message }
  }
}

export async function getPlatillosInMenu(menuId: number) {
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
      costo_total,
      imagen_url
    )
  `,
      )
      .eq("menu_id", menuId)
      .order("id")

    if (error) {
      console.error("Error fetching platillos in menu:", error.message)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    console.error("Error in getPlatillosInMenu:", error.message)
    return { data: null, error: error.message }
  }
}

export async function updateMenu(menuId: string, formData: FormData) {
  const nombre = formData.get("nombre") as string
  const descripcion = formData.get("descripcion") as string
  const activo = formData.get("activo") === "true"
  const restauranteid = formData.get("restauranteid") as string

  if (!nombre || nombre.trim() === "") {
    return { success: false, error: "El nombre del menú es requerido." }
  }
  if (!restauranteid || restauranteid === "-1") {
    return { success: false, error: "Debe seleccionar un restaurante." }
  }

  try {
    const { error } = await supabase
      .from("menus")
      .update({
        nombre: nombre,
        descripcion: descripcion,
        activo: activo,
        restauranteid: restauranteid,
      })
      .eq("id", menuId)

    if (error) {
      console.error("Error updating menu:", error.message)
      return { success: false, error: error.message }
    }

    return { success: true, message: "Menú actualizado correctamente." }
  } catch (error: any) {
    console.error("Exception updating menu:", error.message)
    return { success: false, error: "Ocurrió un error inesperado al actualizar el menú." }
  }
}

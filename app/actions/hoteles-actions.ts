"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { registrarBitacora } from "@/app/actions/bitacora-actions"
import { BITACORA_ACTIVIDADES, BITACORA_MODULOS } from "@/lib/bitacora-actividades"

function createServerSupabaseClientWrapper() {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle cookies errors in Server Actions
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // Handle cookies errors in Server Actions
        }
      },
    },
  })
}

export async function obtenerHotelesFiltrados(acronimo = "", nombre = "", page = 1, limit = 20) {
  const supabase = createServerSupabaseClientWrapper()
  const offset = (page - 1) * limit

  try {
    // Usar el query builder de Supabase para replicar la consulta SQL exacta
    let supabaseQuery = supabase
      .from("hoteles")
      .select("id, acronimo, nombre, direccion, activo", { count: "exact" })
      .order("nombre", { ascending: true })

    // Aplicar filtros exactamente como en el SQL especificado:
    // WHERE (acronimo like '%' || [txtHotelAcronimo.value] || '%' or [txtHotelAcronimo.value] = '')
    // AND (nombre like '%' || [txtHotelNombre.value] || '%' or [txtHotelNombre.value] = '')

    // Solo aplicar filtro de acronimo si tiene valor (no está vacío)
    if (acronimo && acronimo.trim() !== "") {
      supabaseQuery = supabaseQuery.ilike("acronimo", `%${acronimo}%`)
    }

    // Solo aplicar filtro de nombre si tiene valor (no está vacío)
    if (nombre && nombre.trim() !== "") {
      supabaseQuery = supabaseQuery.ilike("nombre", `%${nombre}%`)
    }

    const { data: queryData, error: queryError, count } = await supabaseQuery.range(offset, offset + limit - 1)

    if (queryError) {
      console.error("Error al obtener hoteles:", queryError)
      return { data: null, error: queryError.message, totalCount: 0 }
    }

    // Mapear los datos para que coincidan exactamente con los nombres de columna del SQL
    // SELECT id as Folio, acronimo as Acronimo, nombre as Nombre, direccion as Direccion, activo as Estatus
    const mappedData =
      queryData?.map((hotel) => ({
        Folio: hotel.id,
        Acronimo: hotel.acronimo,
        Nombre: hotel.nombre,
        Direccion: hotel.direccion,
        Estatus: hotel.activo,
      })) || []

    return { data: mappedData, error: null, totalCount: count || 0 }
  } catch (error: any) {
    console.error("Error en obtenerHotelesFiltrados:", error)
    return { data: null, error: error.message, totalCount: 0 }
  }
}

export async function obtenerTotalHoteles() {
  const supabase = createServerSupabaseClientWrapper()
  try {
    const { count, error } = await supabase.from("hoteles").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error al obtener total de hoteles:", error)
      return { total: 0, error: error.message }
    }

    return { total: count || 0, error: null }
  } catch (error: any) {
    console.error("Error en obtenerTotalHoteles:", error)
    return { total: 0, error: error.message }
  }
}

export async function crearHotel(hotelData: {
  nombre: string
  acronimo?: string
  direccion?: string
  telefono?: string
}) {
  const supabase = createServerSupabaseClientWrapper()
  try {
    const { data, error } = await supabase
      .from("hoteles")
      .insert([
        {
          nombre: hotelData.nombre,
          acronimo: hotelData.acronimo || null,
          direccion: hotelData.direccion || null,
          telefono: hotelData.telefono || null,
          activo: true, // Default to active
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error al crear hotel:", error)
      return { data: null, error: error.message }
    }

    revalidatePath("/hoteles")

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.CREAR_HOTEL,
      observaciones: `Creó hotel «${hotelData.nombre}»${hotelData.acronimo ? ` (acrónimo «${hotelData.acronimo}»)` : ""}.`,
      modulo: BITACORA_MODULOS.HOTELES,
      recursoid: data?.id ? Number(data.id) : null,
    })

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en crearHotel:", error)
    return { data: null, error: error.message }
  }
}

export async function actualizarHotel(
  id: number,
  hotelData: { nombre?: string; acronimo?: string; direccion?: string; telefono?: string; activo?: boolean },
) {
  const supabase = createServerSupabaseClientWrapper()
  try {
    const { data, error } = await supabase
      .from("hoteles")
      .update({
        ...hotelData,
        updated_at: new Date().toISOString(), // Update timestamp
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar hotel:", error)
      return { data: null, error: error.message }
    }

    revalidatePath("/hoteles")

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.ACTUALIZAR_HOTEL,
      observaciones: `Actualizó hotel «${data?.nombre ?? hotelData.nombre ?? "?"}» (id ${id}).`,
      modulo: BITACORA_MODULOS.HOTELES,
      recursoid: id,
    })

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en actualizarHotel:", error)
    return { data: null, error: error.message }
  }
}

export async function eliminarHotel(id: number) {
  const supabase = createServerSupabaseClientWrapper()
  try {
    // Capturar nombre del hotel antes de eliminarlo para que el log sea legible.
    const { data: prevHotel } = await supabase
      .from("hoteles")
      .select("nombre, acronimo")
      .eq("id", id)
      .single()

    // Check for associated restaurants first
    const { data: restaurantes, error: restaurantesError } = await supabase
      .from("restaurantes")
      .select("id")
      .eq("hotel_id", id)

    if (restaurantesError) {
      console.error("Error checking associated restaurants:", restaurantesError)
      return { success: false, error: "Error al verificar restaurantes asociados." }
    }

    if (restaurantes && restaurantes.length > 0) {
      return {
        success: false,
        error: "No se puede eliminar el hotel porque tiene restaurantes asociados.",
      }
    }

    const { error } = await supabase.from("hoteles").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar hotel:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/hoteles")

    const nomHotel = (prevHotel as any)?.nombre ?? "(sin nombre)"
    const acrHotel = (prevHotel as any)?.acronimo ?? ""
    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.ELIMINAR_HOTEL,
      observaciones: `Eliminó hotel «${nomHotel}»${acrHotel ? ` (acrónimo «${acrHotel}»)` : ""} (id ${id}).`,
      modulo: BITACORA_MODULOS.HOTELES,
      recursoid: id,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error en eliminarHotel:", error)
    return { success: false, error: error.message }
  }
}

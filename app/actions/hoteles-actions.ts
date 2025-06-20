"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function obtenerHoteles() {
  try {
    // CORREGIDO: Consultar tabla 'hoteles' no 'restaurantes'
    const { data, error } = await supabase.from("hoteles").select("*").order("nombre")

    if (error) {
      console.error("Error obteniendo hoteles:", error)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo hoteles:", error)
    return { success: true, data: [] }
  }
}

export async function obtenerHotelPorId(id: string) {
  try {
    // CORREGIDO: Consultar tabla 'hoteles' no 'restaurantes'
    const { data, error } = await supabase.from("hoteles").select("*").eq("id", id).single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    console.error("Error obteniendo hotel:", error)
    return { success: false, error: error.message }
  }
}

// AGREGADA: Función faltante para obtener restaurantes
export async function obtenerRestaurantes() {
  try {
    const { data, error } = await supabase
      .from("restaurantes")
      .select(`
        *,
        hoteles:hotel_id (
          id,
          nombre,
          shortname
        )
      `)
      .order("nombre")

    if (error) {
      console.error("Error obteniendo restaurantes:", error)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo restaurantes:", error)
    return { success: true, data: [] }
  }
}

// AGREGADA: Función para obtener restaurantes por hotel
export async function obtenerRestaurantesPorHotel(hotelId: string) {
  try {
    const { data, error } = await supabase
      .from("restaurantes")
      .select("*")
      .eq("hotel_id", hotelId)
      .eq("activo", true)
      .order("nombre")

    if (error) {
      console.error("Error obteniendo restaurantes por hotel:", error)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo restaurantes por hotel:", error)
    return { success: true, data: [] }
  }
}

export async function crearHotel(prevState: any, formData: FormData) {
  try {
    // Extraer datos del FormData
    const nombre = formData.get("nombre") as string
    const descripcion = formData.get("descripcion") as string
    const direccion = formData.get("direccion") as string
    const telefono = formData.get("telefono") as string
    const email = formData.get("email") as string
    const shortname = formData.get("shortname") as string

    // Validar campos requeridos
    if (!nombre || nombre.trim() === "") {
      return { success: false, error: "El nombre del hotel es obligatorio" }
    }

    console.log("Creando hotel con datos:", {
      nombre,
      descripcion,
      direccion,
      telefono,
      email,
      shortname,
    })

    // CORREGIDO: Insertar en tabla 'hoteles' no 'restaurantes'
    const { data, error } = await supabase
      .from("hoteles")
      .insert([
        {
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          direccion: direccion?.trim() || null,
          telefono: telefono?.trim() || null,
          email: email?.trim() || null,
          shortname: shortname?.trim() || null,
          activo: true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error de Supabase:", error)
      throw error
    }

    console.log("Hotel creado exitosamente:", data)

    revalidatePath("/hoteles")

    return {
      success: true,
      data,
      message: "Hotel creado exitosamente",
    }
  } catch (error: any) {
    console.error("Error creando hotel:", error)
    return {
      success: false,
      error: error.message || "Error al crear el hotel",
    }
  }
}

export async function actualizarHotel(id: string, formData: FormData) {
  try {
    const nombre = formData.get("nombre") as string
    const descripcion = formData.get("descripcion") as string
    const direccion = formData.get("direccion") as string
    const telefono = formData.get("telefono") as string
    const email = formData.get("email") as string
    const shortname = formData.get("shortname") as string

    if (!nombre || nombre.trim() === "") {
      return { success: false, error: "El nombre del hotel es obligatorio" }
    }

    // CORREGIDO: Actualizar tabla 'hoteles' no 'restaurantes'
    const { data, error } = await supabase
      .from("hoteles")
      .update({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        direccion: direccion?.trim() || null,
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        shortname: shortname?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/hoteles")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error actualizando hotel:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarHotel(id: string) {
  try {
    // CORREGIDO: Eliminar de tabla 'hoteles' no 'restaurantes'
    const { error } = await supabase.from("hoteles").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/hoteles")
    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando hotel:", error)
    return { success: false, error: error.message }
  }
}

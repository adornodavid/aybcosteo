"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Hotel, CrearHotelData } from "@/lib/types-sistema-costeo"

export async function obtenerHoteles() {
  try {
    const { data, error } = await supabase.from("hoteles").select("*").order("nombre")

    if (error) throw error
    return { success: true, data: data as Hotel[] }
  } catch (error: any) {
    console.error("Error obteniendo hoteles:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerHotelPorId(id: number) {
  try {
    const { data, error } = await supabase.from("hoteles").select("*").eq("id", id).single()

    if (error) throw error
    return { success: true, data: data as Hotel }
  } catch (error: any) {
    console.error("Error obteniendo hotel:", error)
    return { success: false, error: error.message }
  }
}

export async function crearHotel(hotelData: CrearHotelData) {
  try {
    const { data, error } = await supabase.from("hoteles").insert([hotelData]).select().single()

    if (error) throw error

    revalidatePath("/hoteles")
    return { success: true, data: data as Hotel }
  } catch (error: any) {
    console.error("Error creando hotel:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarHotel(id: number, hotelData: Partial<CrearHotelData>) {
  try {
    const updateData = {
      ...hotelData,
      fechaactualizacion: new Date().toISOString().split("T")[0],
    }

    const { data, error } = await supabase.from("hoteles").update(updateData).eq("id", id).select().single()

    if (error) throw error

    revalidatePath("/hoteles")
    return { success: true, data: data as Hotel }
  } catch (error: any) {
    console.error("Error actualizando hotel:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarHotel(id: number) {
  try {
    // Verificar si tiene restaurantes asociados
    const { count, error: countError } = await supabase
      .from("restaurantes")
      .select("*", { count: "exact", head: true })
      .eq("hotel_id", id)

    if (countError) throw countError

    if (count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar el hotel porque tiene ${count} restaurante(s) asociado(s)`,
      }
    }

    const { error } = await supabase.from("hoteles").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/hoteles")
    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando hotel:", error)
    return { success: false, error: error.message }
  }
}

"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function obtenerHoteles() {
  try {
    const { data, error } = await supabase.from("hoteles").select("*").eq("activo", true).order("nombre")

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

export async function crearHotel(hotelData: any) {
  try {
    const { data, error } = await supabase
      .from("hoteles")
      .insert([
        {
          acronimo: hotelData.acronimo,
          nombre: hotelData.nombre,
          direccion: hotelData.direccion,
          activo: true,
          fechacreacion: new Date().toISOString().split("T")[0],
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/hoteles")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error creando hotel:", error)
    return { success: false, error: error.message }
  }
}

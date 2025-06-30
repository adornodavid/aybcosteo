"use server"

import { supabase } from "@/lib/supabase"

export async function obtenerPlatillos() {
  try {
    const { data, error } = await supabase.from("platillos").select("*").eq("activo", true).order("nombre")

    if (error) {
      console.error("Error obteniendo platillos:", error)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo platillos:", error)
    return { success: true, data: [] }
  }
}

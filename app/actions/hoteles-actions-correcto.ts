"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

const getSupabaseClient = () => {
  return createClient(cookies())
}

export async function obtenerHoteles() {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase.from("hoteles").select("id, nombre").order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching hoteles:", error.message)
      return { data: null, error }
    }
    return { data, error: null }
  } catch (e: any) {
    console.error("Exception fetching hoteles:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

export async function crearHotel(nombre: string) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("hoteles")
      .insert({ nombre: nombre, fechacreacion: new Date().toISOString() })
      .select()
      .single()

    if (error) {
      console.error("Error creating hotel:", error.message)
      return { success: false, error }
    }
    revalidatePath("/hoteles")
    return { success: true, data, error: null }
  } catch (e: any) {
    console.error("Exception creating hotel:", e)
    return { success: false, error: { message: e.message || "An unexpected error occurred" } }
  }
}

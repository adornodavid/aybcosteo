"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

export async function obtenerResumenesDashboard() {
  try {
    const supabase = createSupabaseServerClient()

    // Obtener conteo de hoteles activos
    const { count: hotelesCount, error: hotelesError } = await supabase
      .from("hoteles")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (hotelesError) {
      console.error("Error obteniendo hoteles:", hotelesError)
    }

    // Obtener conteo de restaurantes activos
    const { count: restaurantesCount, error: restaurantesError } = await supabase
      .from("restaurantes")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (restaurantesError) {
      console.error("Error obteniendo restaurantes:", restaurantesError)
    }

    // Obtener conteo de menús activos
    const { count: menusCount, error: menusError } = await supabase
      .from("menus_restaurantes")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (menusError) {
      console.error("Error obteniendo menús:", menusError)
    }

    // Obtener conteo de platillos activos
    const { count: platillosCount, error: platillosError } = await supabase
      .from("platillos")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (platillosError) {
      console.error("Error obteniendo platillos:", platillosError)
    }

    // Obtener conteo de ingredientes activos
    const { count: ingredientesCount, error: ingredientesError } = await supabase
      .from("ingredientes")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (ingredientesError) {
      console.error("Error obteniendo ingredientes:", ingredientesError)
    }

    return {
      success: true,
      data: {
        hoteles: hotelesCount || 0,
        restaurantes: restaurantesCount || 0,
        menus: menusCount || 0,
        platillos: platillosCount || 0,
        ingredientes: ingredientesCount || 0,
      },
    }
  } catch (error) {
    console.error("Error en obtenerResumenesDashboard:", error)
    return {
      success: false,
      error: "Error al obtener resúmenes del dashboard",
      data: {
        hoteles: 0,
        restaurantes: 0,
        menus: 0,
        platillos: 0,
        ingredientes: 0,
      },
    }
  }
}

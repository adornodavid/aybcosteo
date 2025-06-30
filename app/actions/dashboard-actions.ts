"use server"

import { supabase } from "@/lib/supabase"

export interface DashboardStats {
  totalHoteles: number
  totalRestaurantes: number
  totalMenus: number
  totalPlatillos: number
  totalIngredientes: number
}

export async function obtenerResumenesDashboard(): Promise<{
  success: boolean
  data?: DashboardStats
  error?: string
}> {
  try {
    console.log("Obteniendo resúmenes del dashboard...")

    // Obtener conteos de cada tabla
    const [
      { count: hotelesCount },
      { count: restaurantesCount },
      { count: menusCount },
      { count: platillosCount },
      { count: ingredientesCount },
    ] = await Promise.all([
      supabase.from("hoteles").select("*", { count: "exact", head: true }),
      supabase.from("restaurantes").select("*", { count: "exact", head: true }),
      supabase.from("menus").select("*", { count: "exact", head: true }),
      supabase.from("platillos").select("*", { count: "exact", head: true }),
      supabase.from("ingredientes").select("*", { count: "exact", head: true }),
    ])

    const stats: DashboardStats = {
      totalHoteles: hotelesCount || 0,
      totalRestaurantes: restaurantesCount || 0,
      totalMenus: menusCount || 0,
      totalPlatillos: platillosCount || 0,
      totalIngredientes: ingredientesCount || 0,
    }

    console.log("Resúmenes obtenidos:", stats)

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error("Error obteniendo resúmenes:", error)
    return {
      success: false,
      error: "Error al obtener los resúmenes del dashboard",
    }
  }
}

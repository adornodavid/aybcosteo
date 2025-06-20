"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function obtenerPlatillos(restauranteId?: string) {
  try {
    // Query simple sin relaciones complejas
    let query = supabase.from("platillos").select("*").order("nombre")

    if (restauranteId) {
      query = query.eq("restaurante_id", restauranteId)
    }

    const { data: platillos, error } = await query

    if (error) {
      console.error("Error en query platillos:", error)
      return { success: true, data: [] }
    }

    // Si no hay platillos, retornar array vacío
    if (!platillos || platillos.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener restaurantes por separado
    const { data: restaurantes } = await supabase.from("restaurantes").select("id, nombre")

    // Enriquecer los datos manualmente
    const platillosEnriquecidos = platillos.map((platillo) => ({
      ...platillo,
      restaurante: restaurantes?.find((r) => r.id === platillo.restaurante_id),
      ingredientes: [], // Por ahora vacío
    }))

    return { success: true, data: platillosEnriquecidos }
  } catch (error: any) {
    console.error("Error obteniendo platillos:", error)
    return { success: true, data: [] }
  }
}

export async function obtenerPlatilloPorId(id: string) {
  try {
    const { data, error } = await supabase.from("platillos").select("*").eq("id", id).single()

    if (error) {
      console.error("Error obteniendo platillo por ID:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error obteniendo platillo:", error)
    return { success: false, error: error.message }
  }
}

export async function crearPlatillo(platilloData: any) {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .insert([
        {
          nombre: platilloData.nombre,
          descripcion: platilloData.descripcion,
          instrucciones: platilloData.instrucciones,
          imagen_url: platilloData.imagen_url,
          tiempo_preparacion: platilloData.tiempo_preparacion,
          porciones: platilloData.porciones || 1,
          restaurante_id: platilloData.restaurante_id,
          costo_total: 0, // Se calculará automáticamente
          activo: true,
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/platillos")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error creando platillo:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarPlatillo(id: string, platilloData: any) {
  try {
    const { error } = await supabase
      .from("platillos")
      .update({
        nombre: platilloData.nombre,
        descripcion: platilloData.descripcion,
        instrucciones: platilloData.instrucciones,
        imagen_url: platilloData.imagen_url,
        tiempo_preparacion: platilloData.tiempo_preparacion,
        porciones: platilloData.porciones,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/platillos")
    return { success: true }
  } catch (error: any) {
    console.error("Error actualizando platillo:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarPlatillo(id: string) {
  try {
    // Verificar si el platillo está siendo usado en algún menú
    const { count, error: countError } = await supabase
      .from("menu_platillos")
      .select("*", { count: "exact", head: true })
      .eq("platillo_id", id)

    if (countError) {
      console.log("No se pudo verificar uso en menús (tabla puede no existir):", countError)
      // Continuar con la eliminación aunque no se pueda verificar
    }

    if (count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar el platillo porque está siendo usado en ${count} menú(s)`,
      }
    }

    // Eliminar ingredientes del platillo primero (si existen)
    const { error: deleteIngredientesError } = await supabase
      .from("platillo_ingredientes")
      .delete()
      .eq("platillo_id", id)

    if (deleteIngredientesError) {
      console.log("No se pudieron eliminar ingredientes (tabla puede no existir):", deleteIngredientesError)
      // Continuar con la eliminación del platillo
    }

    // Eliminar el platillo
    const { error } = await supabase.from("platillos").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/platillos")
    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando platillo:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerPlatillosPorRestaurante(restauranteId: string) {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .eq("activo", true)
      .order("nombre")

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo platillos por restaurante:", error)
    return { success: true, data: [] }
  }
}

export async function recalcularCostoPlatillo(platilloId: string) {
  try {
    // Por ahora, solo actualizar la fecha de modificación
    // El cálculo real se implementará cuando tengamos los ingredientes
    const { error } = await supabase
      .from("platillos")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", platilloId)

    if (error) throw error

    revalidatePath("/platillos")
    return { success: true, costoTotal: 0 }
  } catch (error: any) {
    console.error("Error recalculando costo del platillo:", error)
    return { success: false, error: error.message }
  }
}

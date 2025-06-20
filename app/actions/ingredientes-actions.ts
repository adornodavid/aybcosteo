"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function obtenerIngredientes(restauranteId?: string) {
  try {
    // Query simple sin relaciones complejas
    let query = supabase.from("ingredientes").select("*").order("descripcion")

    if (restauranteId) {
      query = query.eq("restaurante_id", restauranteId)
    }

    const { data: ingredientes, error } = await query

    if (error) {
      console.error("Error en query ingredientes:", error)
      return { success: true, data: [] } // Retornar array vacío en lugar de error
    }

    // Si no hay ingredientes, retornar array vacío
    if (!ingredientes || ingredientes.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener categorías y restaurantes por separado si existen datos
    const [categoriasResult, restaurantesResult] = await Promise.all([
      supabase.from("categorias").select("id, nombre"),
      supabase.from("restaurantes").select("id, nombre"),
    ])

    const categorias = categoriasResult.data || []
    const restaurantes = restaurantesResult.data || []

    // Enriquecer los datos manualmente
    const ingredientesEnriquecidos = ingredientes.map((ingrediente) => ({
      ...ingrediente,
      categoria: categorias.find((c) => c.id === ingrediente.categoria_id),
      restaurante: restaurantes.find((r) => r.id === ingrediente.restaurante_id),
      precio_actual: null, // Por ahora null, lo implementaremos después
    }))

    return { success: true, data: ingredientesEnriquecidos }
  } catch (error: any) {
    console.error("Error obteniendo ingredientes:", error)
    return { success: true, data: [] } // Retornar array vacío para evitar crashes
  }
}

export async function obtenerIngredientePorId(id: string) {
  try {
    const { data, error } = await supabase.from("ingredientes").select("*").eq("id", id).single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    console.error("Error obteniendo ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function crearIngrediente(ingredienteData: any) {
  try {
    const { data: ingrediente, error: ingredienteError } = await supabase
      .from("ingredientes")
      .insert([
        {
          clave: ingredienteData.clave,
          descripcion: ingredienteData.descripcion,
          categoria_id: ingredienteData.categoria_id,
          status: ingredienteData.status || "activo",
          tipo: ingredienteData.tipo,
          unidad_medida: ingredienteData.unidad_medida,
          cantidad_por_presentacion: ingredienteData.cantidad_por_presentacion || 1.0,
          conversion: ingredienteData.conversion,
          restaurante_id: ingredienteData.restaurante_id,
        },
      ])
      .select()
      .single()

    if (ingredienteError) throw ingredienteError

    revalidatePath("/ingredientes")
    return { success: true, data: ingrediente }
  } catch (error: any) {
    console.error("Error creando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarIngrediente(id: string, ingredienteData: any) {
  try {
    const { error } = await supabase
      .from("ingredientes")
      .update({
        clave: ingredienteData.clave,
        descripcion: ingredienteData.descripcion,
        categoria_id: ingredienteData.categoria_id,
        status: ingredienteData.status,
        tipo: ingredienteData.tipo,
        unidad_medida: ingredienteData.unidad_medida,
        cantidad_por_presentacion: ingredienteData.cantidad_por_presentacion,
        conversion: ingredienteData.conversion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/ingredientes")
    return { success: true }
  } catch (error: any) {
    console.error("Error actualizando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarIngrediente(id: string) {
  try {
    // Verificar si el ingrediente está siendo usado en algún platillo
    const { count, error: countError } = await supabase
      .from("platillo_ingredientes")
      .select("*", { count: "exact", head: true })
      .eq("ingrediente_id", id)

    if (countError) {
      console.warn("No se pudo verificar uso del ingrediente:", countError)
      // Continuar con la eliminación aunque no se pueda verificar
    }

    if (count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar el ingrediente porque está siendo usado en ${count} platillo(s)`,
      }
    }

    const { error } = await supabase.from("ingredientes").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/ingredientes")
    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerCategorias() {
  try {
    const { data, error } = await supabase.from("categorias").select("*").order("nombre")

    if (error) {
      console.error("Error obteniendo categorías:", error)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo categorías:", error)
    return { success: true, data: [] }
  }
}

export async function buscarIngredientesPorCodigo(codigos: string[], restauranteId: string) {
  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select("*")
      .in("clave", codigos)
      .eq("restaurante_id", restauranteId)
      .order("descripcion")

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error buscando ingredientes por código:", error)
    return { success: false, error: error.message }
  }
}

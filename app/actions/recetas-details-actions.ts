"use server"

import { supabase } from "@/lib/supabase"

interface RecetaDetalle {
  id: number
  nombre: string
  notaspreparacion: string
  costo: number
  activo: boolean
  fechacreacion: string
  imgurl: string | null
}

interface IngredienteReceta {
  id: number
  Ingrediente: string
  cantidad: number
  ingredientecostoparcial: number
}

interface PlatilloReceta {
  id: number
  Platillo: string
  imgurl: string | null
}

interface RecetaCompleta {
  receta: RecetaDetalle | null
  ingredientes: IngredienteReceta[]
  platillos: PlatilloReceta[]
  error?: string
}

export async function getRecetaDetails(recetaId: number): Promise<RecetaCompleta> {
  try {
    // Consulta 1: Detalles de la Receta
    const { data: recetaData, error: recetaError } = await supabase
      .from("recetas")
      .select("id, nombre, notaspreparacion, costo, activo, fechacreacion, imgurl")
      .eq("id", recetaId)
      .single()

    if (recetaError) {
      console.error("Error al obtener detalles de la receta:", recetaError)
      return {
        receta: null,
        ingredientes: [],
        platillos: [],
        error: `Error al obtener detalles de la receta: ${recetaError.message}`,
      }
    }

    // Consulta 2: Ingredientes de la Receta
    const { data: ingredientesRelacion, error: ingredientesRelacionError } = await supabase
      .from("ingredientesxreceta")
      .select("id, cantidad, ingredientecostoparcial, elementoid")
      .eq("recetaid", recetaId)
      .eq("tiposegmentoid", 1)

    if (ingredientesRelacionError) {
      console.error("Error al obtener relación ingredientes de la receta:", ingredientesRelacionError)
      return {
        receta: recetaData,
        ingredientes: [],
        platillos: [],
        error: `Error al obtener relación ingredientes de la receta: ${ingredientesRelacionError.message}`,
      }
    }

    let ingredientesFormateados: IngredienteReceta[] = []

    if (ingredientesRelacion && ingredientesRelacion.length > 0) {
      // Obtener los IDs de los ingredientes
      const ingredienteIds = ingredientesRelacion.map((item) => item.elementoid)

      // Consultar los ingredientes por separado
      const { data: ingredientesData, error: ingredientesDataError } = await supabase
        .from("ingredientes")
        .select("id, nombre")
        .in("id", ingredienteIds)

      if (ingredientesDataError) {
        console.error("Error al obtener datos de ingredientes:", ingredientesDataError)
        return {
          receta: recetaData,
          ingredientes: [],
          platillos: [],
          error: `Error al obtener datos de ingredientes: ${ingredientesDataError.message}`,
        }
      }

      // Combinar los datos
      ingredientesFormateados = ingredientesRelacion.map((item: any) => {
        const ingrediente = ingredientesData?.find((ing) => ing.id === item.elementoid)
        return {
          id: item.id,
          Ingrediente: ingrediente?.nombre || "Ingrediente no encontrado",
          cantidad: item.cantidad,
          ingredientecostoparcial: item.ingredientecostoparcial,
        }
      })
    }

    // Consulta 3: Platillos que usan esta Receta
    const { data: platillosData, error: platillosError } = await supabase
      .from("recetasxplatillo")
      .select(`
        id,
        platillos (
          nombre,
          imgurl
        )
      `)
      .eq("recetaid", recetaId)

    if (platillosError) {
      console.error("Error al obtener platillos que usan la receta:", platillosError)
      return {
        receta: recetaData,
        ingredientes: ingredientesFormateados,
        platillos: [],
        error: `Error al obtener platillos que usan la receta: ${platillosError.message}`,
      }
    }

    const platillosFormateados: PlatilloReceta[] = (platillosData || []).map((item: any) => ({
      id: item.id,
      Platillo: item.platillos?.nombre || "N/A",
      imgurl: item.platillos?.imgurl || null,
    }))

    return {
      receta: recetaData,
      ingredientes: ingredientesFormateados,
      platillos: platillosFormateados,
    }
  } catch (err: any) {
    console.error("Error general en getRecetaDetails:", err)
    return {
      receta: null,
      ingredientes: [],
      platillos: [],
      error: `Error inesperado: ${err.message}`,
    }
  }
}

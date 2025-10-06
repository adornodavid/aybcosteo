"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { IngredienteReceta } from "@/lib/types-sistema-costeo"

// Helper to get Supabase client with cookies
const getSupabaseClient = () => {
  return createClient(cookies())
}

// Función para obtener detalles de una receta específica
export async function getRecetaDetails(recetaId: string) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase.from("recetas").select("*").eq("id", recetaId).single()

    if (error) {
      console.error("Error fetching receta details:", error.message)
      return { data: null, error }
    }
    return { data, error: null }
  } catch (e: any) {
    console.error("Exception fetching receta details:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para actualizar la información básica de la receta
export async function updateRecetaBasicInfo(
  recetaId: string,
  nombre: string,
  notasPreparacion: string | null,
  imgUrl: string | null,
) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("recetas")
      .update({
        nombre: nombre,
        notaspreparacion: notasPreparacion,
        imgurl: imgUrl,
      })
      .eq("id", recetaId)
      .select()

    if (error) {
      console.error("Error updating receta basic info:", error.message)
      return { success: false, error }
    }
    revalidatePath(`/recetas/${recetaId}/editar`)
    revalidatePath("/recetas")
    return { success: true, data, error: null }
  } catch (e: any) {
    console.error("Exception updating receta basic info:", e)
    return { success: false, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para obtener ingredientes de una receta para la tabla
export async function getIngredientesByRecetaId(recetaId: string) {
  const supabase = getSupabaseClient()
  try {
    // Primero obtenemos los elementos de la receta que son ingredientes (tiposegmentoid = 1)
    const { data: elementosReceta, error: elementosError } = await supabase
      .from("ingredientesxreceta")
      .select("id, cantidad, ingredientecostoparcial, elementoid")
      .eq("recetaid", recetaId)
      .eq("tiposegmentoid", 1)
      .order("id", { ascending: true })

    if (elementosError) {
      console.error("Error fetching elementos by receta ID:", elementosError.message)
      return { data: null, error: elementosError }
    }

    if (!elementosReceta || elementosReceta.length === 0) {
      return { data: [], error: null }
    }

    // Obtenemos los IDs de los ingredientes
    const ingredienteIds = elementosReceta.map((item) => item.elementoid)

    // Consultamos los ingredientes por separado
    const { data: ingredientesData, error: ingredientesError } = await supabase
      .from("ingredientes")
      .select(`
        id,
        nombre,
        unidadmedidaid,
        tipounidadmedida (
          descripcion
        )
      `)
      .in("id", ingredienteIds)

    if (ingredientesError) {
      console.error("Error fetching ingredientes data:", ingredientesError.message)
      return { data: null, error: ingredientesError }
    }

    // Combinamos los datos
    const formattedData: IngredienteReceta[] = elementosReceta.map((item: any) => {
      const ingrediente = ingredientesData?.find((ing) => ing.id === item.elementoid)
      return {
        id: item.elementoid,
        cantidad: item.cantidad,
        ingredientecostoparcial: item.ingredientecostoparcial,
        ingredienteid: item.elementoid,
        nombre: ingrediente?.nombre || "Ingrediente no encontrado",
        unidadmedidaid: ingrediente?.unidadmedidaid || null,
        unidadmedidadescripcion: ingrediente?.tipounidadmedida?.descripcion || "N/A",
      }
    })

    return { data: formattedData, error: null }
  } catch (e: any) {
    console.error("Exception fetching ingredientes by receta ID:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para obtener Hotel ID directamente de la tabla recetas
export async function getHotelIdFromRecetaIngredients(recetaId: string) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase.from("recetas").select("hotelid").eq("id", recetaId).single()

    if (error) {
      console.error("Error in getHotelIdFromRecetaIngredients:", error.message)
      return { data: null, error }
    }

    return { data: data?.hotelid ? { id: data.hotelid } : null, error: null }
  } catch (e: any) {
    console.error("Exception in getHotelIdFromRecetaIngredients:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para obtener ingredientes para el dropdown (filtrado por hotel)
export async function getIngredientesForDropdown(hotelId: number) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select("id, nombre, codigo, costo") // Incluir codigo y costo
      .eq("hotelid", hotelId)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching ingredientes for dropdown:", error.message)
      return { data: null, error }
    }
    return { data, error: null }
  } catch (e: any) {
    console.error("Exception in getIngredientesForDropdown:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// NUEVA FUNCIÓN: Buscar ingredientes por término de búsqueda (para recetas/editar)
export async function searchIngredientes(
  hotelId: number,
  searchTerm: string,
): Promise<{ id: number; nombre: string; codigo: string; costo: number | null; unidadmedidaid: number | null }[]> {
  // Added unidadmedidaid to return type
  const supabase = getSupabaseClient()
  let query = supabase.from("ingredientes").select("id, nombre, codigo, costo, unidadmedidaid").eq("hotelid", hotelId) // Added unidadmedidaid to select

  if (searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    query = query.or(`nombre.ilike.%${lowerCaseSearchTerm}%,codigo.ilike.%${lowerCaseSearchTerm}%`)
  }

  const { data, error } = await query.order("nombre", { ascending: true })
  if (error) {
    console.error("Error searching ingredientes:", error)
    return []
  }
  return data || []
}

// Función para obtener la unidad de medida de un ingrediente
export async function getUnidadMedidaForDropdown() {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("tipounidadmedida")
      .select(
        `
      id,
      descripcion,
      calculoconversion
    `,
      )
      .order("descripcion", { ascending: true })

    if (error) {
      console.error("Error fetching unidad de medida for dropdown:", error.message)
      return { data: null, error }
    }

    return { data: data, error: null }
  } catch (e: any) {
    console.error("Exception fetching unidad de medida for dropdown:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para obtener el costo de un ingrediente
export async function getCostoIngrediente(ingredienteId: number) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase.from("ingredientes").select("costo").eq("id", ingredienteId).single()

    if (error) {
      console.error("Error fetching costo ingrediente from 'ingredientes' table:", error.message)
      return { data: null, error }
    }
    return { data: { costo: data?.costo || 0 }, error: null }
  } catch (e: any) {
    console.error("Exception fetching costo ingrediente:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para verificar si un ingrediente ya existe en la receta
export async function checkIngredienteExistsInReceta(recetaId: string, ingredienteId: number) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("ingredientesxreceta")
      .select("id")
      .eq("recetaid", recetaId)
      .eq("elementoid", ingredienteId)
      .eq("tiposegmentoid", 1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means "No rows found"
      console.error("Error checking existing ingredient in receta:", error.message)
      return { data: null, error }
    }
    return { data: data, error: null }
  } catch (e: any) {
    console.error("Exception checking existing ingredient in receta:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para agregar ingrediente a la receta
export async function addIngredienteToReceta(
  recetaId: string,
  ingredienteId: number,
  cantidad: number,
  unidadMedidaId: string,
  costoUnitario: number,
) {
  const supabase = getSupabaseClient()
  try {
    const { data: unidadData, error: unidadError } = await supabase
      .from("tipounidadmedida")
      .select("calculoconversion")
      .eq("id", Number(unidadMedidaId))
      .single()
    if (unidadError || !unidadData) throw new Error("No se encontró la unidad de medida o su conversión.")

    const calculoConversion = unidadData.calculoconversion || 1
    const ingredientecostoparcial = cantidad * calculoConversion * costoUnitario

    const { data, error } = await supabase
      .from("ingredientesxreceta")
      .insert({
        recetaid: recetaId,
        elementoid: ingredienteId,
        tiposegmentoid: 1,
        cantidad: cantidad,
        ingredientecostoparcial: ingredientecostoparcial,
        fechacreacion: new Date().toISOString(),
        fechamodificacion: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error adding ingrediente to receta:", error.message)
      return { success: false, error }
    }
    revalidatePath(`/recetas/${recetaId}/editar`)
    return { success: true, data, error: null }
  } catch (e: any) {
    console.error("Exception adding ingrediente to receta:", e)
    return { success: false, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para eliminar ingrediente de la receta
export async function deleteIngredienteFromReceta(elementoId: number, recetaId: string) {
  const supabase = getSupabaseClient()
  try {
    const { error } = await supabase
      .from("ingredientesxreceta")
      .delete()
      .eq("elementoid", elementoId)
      .eq("recetaid", recetaId)
      .eq("tiposegmentoid", 1)

    if (error) {
      console.error("Error deleting ingrediente from receta:", error.message)
      return { success: false, error }
    }
    revalidatePath(`/recetas/${recetaId}/editar`)
    return { success: true, error: null }
  } catch (e: any) {
    console.error("Exception deleting ingrediente from receta:", e)
    return { success: false, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para obtener detalles de ubicación (hotel, restaurante, menú) para un platillo
async function getPlatilloLocationDetails(platilloId: number) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("platillosxmenu")
      .select(
        `
        precioventa,
        menuid,
        menus!inner(
          restauranteid,
          restaurantes!inner(
            hotelid
          )
        )
      `,
      )
      .eq("platilloid", platilloId)
    // REMOVED: .limit(1)
    // REMOVED: .single()

    if (error) {
      console.error(`Error fetching location details for platillo ${platilloId}:`, error.message)
      return [] // Return an empty array on error
    }

    // Map the data to the desired structure, ensuring it's an array of objects
    const formattedData =
      data?.map((item: any) => ({
        hotelid: item.menus.restaurantes.hotelid,
        restauranteid: item.menus.restaurantes.id,
        menuid: item.menuid,
        precioventa: item.precioventa,
      })) || []

    return formattedData // Return the array of formatted data
  } catch (e: any) {
    console.error(`Exception fetching location details for platillo ${platilloId}:`, e)
    return [] // Return an empty array on exception
  }
}

// Función para obtener recetas disponibles para agregar a una receta (excluyendo la receta actual)
export async function getRecetasForRecetaDropdown(hotelId: number, currentRecetaId: string) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("recetas")
      .select("id, nombre, costo, cantidad, unidadbaseid")
      .eq("hotelid", hotelId)
      .eq("activo", true)
      .neq("id", currentRecetaId) // Excluir la receta actual
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching recetas for dropdown:", error.message)
      return { data: null, error }
    }
    return { data, error: null }
  } catch (e: any) {
    console.error("Exception in getRecetasForRecetaDropdown:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para obtener sub-recetas de una receta para la tabla
export async function getSubRecetasByRecetaId(recetaId: string) {
  const supabase = getSupabaseClient()
  try {
    // Primero obtenemos los elementos de la receta que son sub-recetas (tiposegmentoid = 2)
    const { data: elementosReceta, error: elementosError } = await supabase
      .from("ingredientesxreceta")
      .select("id, cantidad, ingredientecostoparcial, elementoid")
      .eq("recetaid", recetaId)
      .eq("tiposegmentoid", 2)
      .order("id", { ascending: true })

    if (elementosError) {
      console.error("Error fetching sub-recetas by receta ID:", elementosError.message)
      return { data: null, error: elementosError }
    }

    if (!elementosReceta || elementosReceta.length === 0) {
      return { data: [], error: null }
    }

    // Obtenemos los IDs de las sub-recetas
    const subRecetaIds = elementosReceta.map((item) => item.elementoid)

    // Consultamos las sub-recetas por separado
    const { data: subRecetasData, error: subRecetasError } = await supabase
      .from("recetas")
      .select("id, nombre, costo")
      .in("id", subRecetaIds)

    if (subRecetasError) {
      console.error("Error fetching sub-recetas data:", subRecetasError.message)
      return { data: null, error: subRecetasError }
    }

    // Combinamos los datos
    const formattedData = elementosReceta.map((item: any) => {
      const subReceta = subRecetasData?.find((rec) => rec.id === item.elementoid)
      return {
        id: item.id,
        recetaId: item.elementoid,
        nombre: subReceta?.nombre || "Sub-receta no encontrada",
        cantidad: item.cantidad,
        costototal: subReceta?.costo || 0,
        ingredientecostoparcial: item.ingredientecostoparcial,
      }
    })

    return { data: formattedData, error: null }
  } catch (e: any) {
    console.error("Exception fetching sub-recetas by receta ID:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para verificar si una sub-receta ya existe en la receta
export async function checkSubRecetaExistsInReceta(recetaId: string, subRecetaId: number) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("ingredientesxreceta")
      .select("id")
      .eq("recetaid", recetaId)
      .eq("elementoid", subRecetaId)
      .eq("tiposegmentoid", 2)
      .maybeSingle() // Cambiado de .single() a .maybeSingle()

    if (error) {
      console.error("Error checking existing sub-receta in receta:", error.message)
      return { data: null, error }
    }
    return { data: data, error: null }
  } catch (e: any) {
    console.error("Exception checking existing sub-receta in receta:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para agregar sub-receta a la receta
export async function addSubRecetaToReceta(
  recetaId: string,
  subRecetaId: number,
  cantidad: number,
  costoSubReceta: number,
  cantidadMaximaSubReceta: number,
) {
  const supabase = getSupabaseClient()
  try {
    const costoParcial = (costoSubReceta / cantidadMaximaSubReceta) * cantidad

    const { data, error } = await supabase
      .from("ingredientesxreceta")
      .insert({
        recetaid: recetaId,
        elementoid: subRecetaId,
        tiposegmentoid: 2, // 2 para sub-recetas
        cantidad: cantidad,
        ingredientecostoparcial: costoParcial,
        fechacreacion: new Date().toISOString(),
        fechamodificacion: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error adding sub-receta to receta:", error.message)
      return { success: false, error }
    }
    revalidatePath(`/recetas/${recetaId}/editar`)
    return { success: true, data, error: null }
  } catch (e: any) {
    console.error("Exception adding sub-receta to receta:", e)
    return { success: false, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para eliminar sub-receta de la receta
export async function deleteSubRecetaFromReceta(subRecetaId: number, recetaId: string) {
  const supabase = getSupabaseClient()
  try {
    const { error } = await supabase
      .from("ingredientesxreceta")
      .delete()
      .eq("elementoid", subRecetaId)
      .eq("recetaid", recetaId)
      .eq("tiposegmentoid", 2)

    if (error) {
      console.error("Error deleting sub-receta from receta:", error.message)
      return { success: false, error }
    }
    revalidatePath(`/recetas/${recetaId}/editar`)
    return { success: true, error: null }
  } catch (e: any) {
    console.error("Exception deleting sub-receta from receta:", e)
    return { success: false, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// Función para actualizar el costo total de la receta y el histórico
export async function updateRecetaCostoAndHistorico(recetaId: string) {
  const supabase = getSupabaseClient()
  try {
    // 1. Actualizar costo de la receta en la tabla 'recetas'
    // SQL: update recetas a set costo = (select sum(b.ingredientecostoparcial) from ingredientesxreceta b where a.id = b.recetaid) where a.id = [recetaId]
    const { data: sumIngredientesReceta, error: sumIngredientesError } = await supabase
      .from("ingredientesxreceta")
      .select("ingredientecostoparcial")
      .eq("recetaid", recetaId)

    if (sumIngredientesError) {
      console.error("Error calculating sum of ingredientecostoparcial for receta:", sumIngredientesError.message)
      return { success: false, error: sumIngredientesError }
    }
    const costoRecetaCalculado = sumIngredientesReceta.reduce(
      (sum, item) => sum + (item.ingredientecostoparcial || 0),
      0,
    )

    const { error: updateRecetaCostoError } = await supabase
      .from("recetas")
      .update({ costo: costoRecetaCalculado })
      .eq("id", recetaId)

    if (updateRecetaCostoError) {
      console.error("Error updating receta.costo:", updateRecetaCostoError.message)
      return { success: false, error: updateRecetaCostoError }
    }

    // 2. Actualizar recetacostoparcial en 'recetasxplatillo'
    // SQL: update recetasxplatillo a set recetacostoparcial = (select costo from recetas b where b.id = [recetaId] ) where a.recetaid = [recetaId]
    const { data: recetaCostoActual, error: getRecetaCostoError } = await supabase
      .from("recetas")
      .select("costo")
      .eq("id", recetaId)
      .single()

    if (getRecetaCostoError) {
      console.error("Error fetching current receta.costo:", getRecetaCostoError.message)
      return { success: false, error: getRecetaCostoError }
    }
    const costoParaRecetasXPlatillo = recetaCostoActual?.costo || 0

    const { error: updateRecetasXPlatilloError } = await supabase
      .from("recetasxplatillo")
      .update({ recetacostoparcial: costoParaRecetasXPlatillo })
      .eq("recetaid", recetaId)

    if (updateRecetasXPlatilloError) {
      console.error("Error updating recetasxplatillo.recetacostoparcial:", updateRecetasXPlatilloError.message)
      return { success: false, error: updateRecetasXPlatilloError }
    }

    // 3. Obtener PlatilloArrayid y actualizar platillos.costototal y platillosxmenu.margenutilidad
    // SQL: select platilloid from recetasxplatillo where recetaid = [recetaId]
    const { data: platillosAsociados, error: getPlatillosError } = await supabase
      .from("recetasxplatillo")
      .select("platilloid")
      .eq("recetaid", recetaId)

    if (getPlatillosError) {
      console.error("Error fetching associated platillos:", getPlatillosError.message)
      return { success: false, error: getPlatillosError }
    }

    const PlatilloArrayid = platillosAsociados.map((p) => p.platilloid)

    for (const platilloId of PlatilloArrayid) {
      // SQL: update platillos a set costototal = (select sum(b.ingredientecostoparcial) from ingredientesxplatillo b where a.id = b.platilloid) + (select sum(c.recetacostoparcial) from recetasxplatillo c where a.id = c.platilloid) where a.id = [platilloId]
      const { data: ingCostPlatillo, error: ingCostPlatilloError } = await supabase
        .from("ingredientesxplatillo")
        .select("ingredientecostoparcial")
        .eq("platilloid", platilloId)

      if (ingCostPlatilloError) {
        console.error(`Error calculating ingredient cost for platillo ${platilloId}:`, ingCostPlatilloError.message)
        return { success: false, error: ingCostPlatilloError }
      }
      const totalIngredienteCost = ingCostPlatillo.reduce((sum, item) => sum + (item.ingredientecostoparcial || 0), 0)

      const { data: recCostPlatillo, error: recCostPlatilloError } = await supabase
        .from("recetasxplatillo")
        .select("recetacostoparcial")
        .eq("platilloid", platilloId)

      if (recCostPlatilloError) {
        console.error(`Error calculating receta cost for platillo ${platilloId}:`, recCostPlatilloError.message)
        return { success: false, error: recCostPlatilloError }
      }
      const totalRecetaCost = recCostPlatillo.reduce((sum, item) => sum + (item.recetacostoparcial || 0), 0)

      const totalPlatilloCost = totalIngredienteCost + totalRecetaCost

      const { error: updatePlatilloCostError } = await supabase
        .from("platillos")
        .update({ costototal: totalPlatilloCost })
        .eq("id", platilloId)

      if (updatePlatilloCostError) {
        console.error(`Error updating platillo.costototal for ${platilloId}:`, updatePlatilloCostError.message)
        return { success: false, error: updatePlatilloCostError }
      }

      // INICIO DE LA NUEVA LÓGICA PARA costoadministrativo (después de la línea 403)
      // 1. Obtener valorfloat de configuraciones
      const { data: configData, error: configError } = await supabase
        .from("configuraciones")
        .select("valorfloat")
        .eq("id", 1)
        .single()

      if (configError || !configData) {
        console.error("Error fetching valorfloat from configuraciones:", configError?.message || "Config not found")
        return { success: false, error: configError || { message: "Configuracion with ID 1 not found" } }
      }
      const valorFloatConfig = configData.valorfloat || 0

      // 2. Calcular costoadministrativo
      const costoAdministrativoCalculado = totalPlatilloCost * valorFloatConfig + totalPlatilloCost

      // 3. Actualizar platillos.costoadministrativo
      const { error: updateCostoAdministrativoError } = await supabase
        .from("platillos")
        .update({ costoadministrativo: costoAdministrativoCalculado })
        .eq("id", platilloId)

      if (updateCostoAdministrativoError) {
        console.error(
          `Error updating costoadministrativo for platillo ${platilloId}:`,
          updateCostoAdministrativoError.message,
        )
        return { success: false, error: updateCostoAdministrativoError }
      }
      // FIN DE LA NUEVA LÓGICA PARA costoadministrativo

      // NUEVA LÓGICA: Actualizar margenutilidad en platillosxmenu
      // SQL: select id, precioventa from platillosxmenu where platilloid = [platilloId]
      const { data: platillosxMenuRecords, error: platillosxMenuError } = await supabase
        .from("platillosxmenu")
        .select("id, precioventa")
        .eq("platilloid", platilloId)

      if (platillosxMenuError) {
        console.error(`Error fetching platillosxmenu records for platillo ${platilloId}:`, platillosxMenuError.message)
        return { success: false, error: platillosxMenuError }
      }

      for (const pxmRecord of platillosxMenuRecords) {
        const margenUtilidad = (pxmRecord.precioventa || 0) - costoAdministrativoCalculado
        const { error: updateMargenUtilidadError } = await supabase
          .from("platillosxmenu")
          .update({ margenutilidad: margenUtilidad })
          .eq("id", pxmRecord.id)

        if (updateMargenUtilidadError) {
          console.error(
            `Error updating margenutilidad for platillosxmenu ID ${pxmRecord.id}:`,
            updateMargenUtilidadError.message,
          )
          return { success: false, error: updateMargenUtilidadError }
        }
      }
    }

    // 4. Insertar en la tabla 'historico' (primera inserción - costos de receta por platillo)
    const historicoRecetaInserts = []
    for (const rxp of platillosAsociados) {
      const locationDetailsArray = await getPlatilloLocationDetails(rxp.platilloid) // Ahora devuelve un array
      if (locationDetailsArray && locationDetailsArray.length > 0) {
        // Verificar si el array no está vacío
        for (const locationDetail of locationDetailsArray) {
          // Nuevo bucle para cada ubicación
          const { data: recetaCostoDataArray, error: recetaCostoDataError } = await supabase
            .from("recetasxplatillo")
            .select("recetaid, recetacostoparcial")
            .eq("recetaid", recetaId)
            .eq("platilloid", rxp.platilloid)
          // .single() // Eliminado

          if (recetaCostoDataError) {
            console.error(
              `Error fetching recetacostoparcial for historico (recetasxplatillo) for platillo ${rxp.platilloid}:`,
              recetaCostoDataError.message,
            )
            return { success: false, error: recetaCostoDataError }
          }

          // Acceder al primer elemento del array, o null si el array está vacío
          const recetaCostoData =
            recetaCostoDataArray && recetaCostoDataArray.length > 0 ? recetaCostoDataArray[0] : null

          if (!recetaCostoData) {
            console.error(`No receta cost data found for receta ${recetaId} and platillo ${rxp.platilloid}`)
            return { success: false, error: { message: "No receta cost data found" } }
          }

          historicoRecetaInserts.push({
            hotelid: locationDetail.hotelid,
            restauranteid: locationDetail.restauranteid,
            menuid: locationDetail.menuid,
            platilloid: rxp.platilloid,
            ingredienteid: null,
            recetaid: recetaCostoData.recetaid,
            cantidad: null,
            costo: recetaCostoData.recetacostoparcial,
            activo: true,
            fechacreacion: new Date().toISOString(),
            precioventa: locationDetail.precioventa,
          })
        } // Fin del nuevo bucle for (locationDetail)
      }
    }

    // INSERCIÓN DE HISTORICO RECETA: Este es el bloque que mencioné.
    if (historicoRecetaInserts.length > 0) {
      const { error: insertHistoricoRecetaError } = await supabase.from("historico").insert(historicoRecetaInserts)
      if (insertHistoricoRecetaError) {
        console.error("Error inserting historico (recetasxplatillo):", insertHistoricoRecetaError.message)
        return { success: false, error: insertHistoricoRecetaError }
      }
    }

    // 5. Insertar en la tabla 'historico' (segunda inserción - costos de ingredientes por platillo)
    const historicoIngredienteInserts = []
    for (const platilloId of PlatilloArrayid) {
      const locationDetailsArray = await getPlatilloLocationDetails(platilloId) // Ahora devuelve un array
      if (locationDetailsArray && locationDetailsArray.length > 0) {
        // Verificar si el array no está vacío
        for (const locationDetail of locationDetailsArray) {
          // Nuevo bucle para cada ubicación
          const { data: ingredientesPlatillo, error: ingredientesPlatilloError } = await supabase
            .from("ingredientesxplatillo")
            .select("ingredienteid, cantidad, ingredientecostoparcial")
            .eq("platilloid", platilloId)

          if (ingredientesPlatilloError) {
            console.error(
              `Error fetching ingredientesxplatillo for historico for platillo ${platilloId}:`,
              ingredientesPlatilloError.message,
            )
            return { success: false, error: ingredientesPlatilloError }
          }

          for (const ingrediente of ingredientesPlatillo) {
            historicoIngredienteInserts.push({
              hotelid: locationDetail.hotelid, // Usar locationDetail
              restauranteid: locationDetail.restauranteid, // Usar locationDetail
              menuid: locationDetail.menuid, // Usar locationDetail
              platilloid: platilloId,
              ingredienteid: ingrediente.ingredienteid,
              recetaid: null,
              cantidad: ingrediente.cantidad,
              costo: ingrediente.ingredientecostoparcial,
              activo: true,
              fechacreacion: new Date().toISOString(),
              precioventa: locationDetail.precioventa, // Usar locationDetail
            })
          }
        } // Fin del nuevo bucle for (locationDetail)
      }
    }

    // INSERCIÓN DE HISTORICO INGREDIENTE: Este es el bloque para la segunda inserción.
    if (historicoIngredienteInserts.length > 0) {
      const { error: insertHistoricoIngredienteError } = await supabase
        .from("historico")
        .insert(historicoIngredienteInserts)
      if (insertHistoricoIngredienteError) {
        console.error("Error inserting historico (ingredientesxplatillo):", insertHistoricoIngredienteError.message)
        return { success: false, error: insertHistoricoIngredienteError }
      }
    }

    revalidatePath(`/recetas/${recetaId}/editar`)
    revalidatePath("/recetas")
    revalidatePath("/historico")
    revalidatePath("/platillos")
    return { success: true, error: null }
  } catch (e: any) {
    console.error("Exception in updateRecetaCostoAndHistorico:", e)
    return { success: false, error: { message: e.message || "An unexpected error occurred" } }
  }
}

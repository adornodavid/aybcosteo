"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { IngredienteReceta, UnidadMedidaDropdown } from "@/lib/types-sistema-costeo"

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
    const { data, error } = await supabase
      .from("ingredientesxreceta")
      .select(
        `
      id,
      cantidad,
      ingredientecostoparcial,
      ingredientes (
        id,
        nombre,
        unidadmedidaid,
        tipounidadmedida (
          descripcion
        )
      )
    `,
      )
      .eq("recetaid", recetaId)
      .order("id", { ascending: true })

    if (error) {
      console.error("Error fetching ingredientes by receta ID:", error.message)
      return { data: null, error }
    }

    const formattedData: IngredienteReceta[] = data.map((item: any) => ({
      id: item.id,
      cantidad: item.cantidad,
      ingredientecostoparcial: item.ingredientecostoparcial,
      ingredienteid: item.ingredientes.id,
      nombre: item.ingredientes.nombre,
      unidadmedidaid: item.ingredientes.unidadmedidaid,
      unidadmedidadescripcion: item.ingredientes.tipounidadmedida.descripcion,
    }))

    return { data: formattedData, error: null }
  } catch (e: any) {
    console.error("Exception fetching ingredientes by receta ID:", e)
    return { data: null, error: { message: e.message || "An unexpected error occurred" } }
  }
}

// NEW FUNCTION: Get Hotel ID from recipe's ingredients
export async function getHotelIdFromRecetaIngredients(recetaId: string) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("ingredientesxreceta")
      .select("ingredientes!inner(hoteles!inner(id))")
      .eq("recetaid", recetaId)

    if (error) {
      console.error("Error in getHotelIdFromRecetaIngredients:", error.message)
      return { data: null, error }
    }

    const hotelIds = data.map((item: any) => item.ingredientes.hoteles.id).filter((id: any) => id !== null)
    const distinctHotelIds = [...new Set(hotelIds)]

    return { data: distinctHotelIds.length > 0 ? { id: distinctHotelIds[0] } : null, error: null }
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
      .select("id, nombre")
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

// Función para obtener la unidad de medida de un ingrediente
export async function getUnidadMedidaForDropdown(ingredienteId: number) {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select(
        `
      unidadmedidaid,
      tipounidadmedida (
        id,
        descripcion
      )
    `,
      )
      .eq("id", ingredienteId)
      .single()

    if (error) {
      console.error("Error fetching unidad de medida for dropdown:", error.message)
      return { data: null, error }
    }

    const formattedData: UnidadMedidaDropdown[] = data.tipounidadmedida
      ? [{ id: data.tipounidadmedida.id, descripcion: data.tipounidadmedida.descripcion }]
      : []

    return { data: formattedData, error: null }
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
    const ingredientecostoparcial = cantidad * costoUnitario

    const { data, error } = await supabase
      .from("ingredientesxreceta")
      .insert({
        recetaid: recetaId,
        ingredienteid: ingredienteId,
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
export async function deleteIngredienteFromReceta(id: number, recetaId: string) {
  const supabase = getSupabaseClient()
  try {
    const { error } = await supabase.from("ingredientesxreceta").delete().eq("id", id).eq("recetaid", recetaId)

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

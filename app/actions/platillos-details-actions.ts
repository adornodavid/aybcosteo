"use server"

import { createClient } from "@supabase/supabase-js"
//import { getSession } from "@/lib/session" // Usando la misma lógica de sesión

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getIngredientesByPlatillo(platilloId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("ingredientesxplatillo")
      .select(`
        cantidad,
        ingredientecostoparcial,
        ingredientes!inner (
          codigo,
          nombre,
          tipounidadmedida!inner (
            descripcion
          )
        )
      `)
      .eq("platilloid", platilloId)

    if (error) {
      console.error("Error fetching ingredientes:", error)
      return { success: false, error: error.message, data: [] }
    }

    const transformedData = (data || []).map((item: any) => ({
      codigo: item.ingredientes.codigo,
      nombre: item.ingredientes.nombre,
      descripcion: item.ingredientes.tipounidadmedida.descripcion,
      cantidad: item.cantidad,
      ingredientecostoparcial: item.ingredientecostoparcial,
    }))

    return { success: true, data: transformedData }
  } catch (error: any) {
    console.error("Error en getIngredientesByPlatillo:", error)
    return { success: false, error: error.message, data: [] }
  }
}

async function getSubrecetasByPlatillo(platilloId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("recetasxplatillo")
      .select(`
        cantidad,
        recetacostoparcial,
        recetas!inner (
          id,
          nombre,
          tipounidadmedida!inner (
            descripcion
          )
        )
      `)
      .eq("platilloid", platilloId)

    if (error) {
      console.error("Error fetching subrecetas:", error)
      return { success: false, error: error.message, data: [] }
    }

    const transformedData = (data || []).map((item: any) => ({
      id: item.recetas.id,
      nombre: item.recetas.nombre,
      descripcion: item.recetas.tipounidadmedida.descripcion,
      cantidad: item.cantidad,
      recetacostoparcial: item.recetacostoparcial,
    }))

    return { success: true, data: transformedData }
  } catch (error: any) {
    console.error("Error en getSubrecetasByPlatillo:", error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function getPlatilloDetailsForModal(platilloId: number) {
  try {
    // Obtener el valorfloat de configuraciones para el Precio Sugerido
    const { data: configData, error: configError } = await supabaseAdmin
      .from("configuraciones")
      .select("valorfloat")
      .eq("id", 2)
      .single()

    if (configError) {
      console.error("Error fetching configuracion for Precio Sugerido:", configError)
    }

    const factorPrecioSugerido = configData?.valorfloat || 0.3

    // Obtener datos del platillo
    const { data, error } = await supabaseAdmin
      .from("platillos")
      .select(
        `
        id,
        nombre,
        descripcion,
        instruccionespreparacion,
        tiempopreparacion,
        imgurl,
        costototal,
        costoadministrativo,
        platillosxmenu (
          precioventa,
          precioconiva,
          margenutilidad,
          menus (
            nombre,
            restaurantes (
              nombre,
              hoteles (
                nombre
              )
            )
          )
        )
      `,
      )
      .eq("id", platilloId)

    if (error) {
      console.error("Error fetching platillo details:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [], ingredientes: [], subrecetas: [] }
    }

    // Obtener ingredientes y subrecetas
    const ingredientesResult = await getIngredientesByPlatillo(platilloId)
    const subrecetasResult = await getSubrecetasByPlatillo(platilloId)

    // Transformar datos del platillo
    const transformedData = data.flatMap((platillo: any) => {
      const costoAdministrativo = platillo.costoadministrativo
      const precioSugerido = costoAdministrativo / factorPrecioSugerido

      if (platillo.platillosxmenu && platillo.platillosxmenu.length > 0) {
        return platillo.platillosxmenu.map((pxm: any) => ({
          id: platillo.id,
          Hotel: pxm.menus?.restaurantes?.hoteles?.nombre || "N/A",
          Restaurante: pxm.menus?.restaurantes?.nombre || "N/A",
          Menu: pxm.menus?.nombre || "N/A",
          Platillo: platillo.nombre,
          descripcion: platillo.descripcion,
          instruccionespreparacion: platillo.instruccionespreparacion,
          tiempopreparacion: platillo.tiempopreparacion,
          imgurl: platillo.imgurl,
          CostoElaboracion: platillo.costototal,
          precioventa: pxm.precioventa,
          margenutilidad: pxm.margenutilidad,
          CostoTotal: costoAdministrativo,
          PrecioSugerido: precioSugerido,
          CostoPorcentual: (platillo.costototal / pxm.precioventa) * 100,
          PrecioconIva: pxm.precioconiva,
        }))
      } else {
        return [
          {
            id: platillo.id,
            Hotel: "N/A",
            Restaurante: "N/A",
            Menu: "N/A",
            Platillo: platillo.nombre,
            descripcion: platillo.descripcion,
            instruccionespreparacion: platillo.instruccionespreparacion,
            tiempopreparacion: platillo.tiempopreparacion,
            imgurl: platillo.imgurl,
            CostoElaboracion: platillo.costototal,
            precioventa: null,
            margenutilidad: null,
            CostoTotal: costoAdministrativo,
            PrecioSugerido: precioSugerido,
            CostoPorcentual: null,
            PrecioconIva: null,
          },
        ]
      }
    })

    return {
      success: true,
      data: transformedData,
      ingredientes: ingredientesResult.data || [],
      subrecetas: subrecetasResult.data || [],
    }
  } catch (error: any) {
    console.error("Error en getPlatilloDetailsForModal:", error)
    return { success: false, error: error.message || "Error interno del servidor" }
  }
}

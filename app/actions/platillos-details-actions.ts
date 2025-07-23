"use server"

import { createClient } from "@supabase/supabase-js"
//import { getSession } from "@/lib/session" // Usando la misma lógica de sesión

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function getPlatilloDetailsForModal(platilloId: number) {
  try {
    // Usar la misma lógica de sesión que en platillos-actions.ts
    /*const session = await getSession()
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" }
    }*/

    // Obtener el valorfloat de configuraciones para el Precio Sugerido
    const { data: configData, error: configError } = await supabaseAdmin
      .from("configuraciones")
      .select("valorfloat")
      .eq("id", 2)
      .single()

    if (configError) {
      console.error("Error fetching configuracion for Precio Sugerido:", configError)
      // Continuar sin precio sugerido si hay error en la configuración
    }
   
    const factorPrecioSugerido = configData.valorfloat || 0.25 // Usar .25 como fallback si no se encuentra la configuración

    // La consulta SQL proporcionada por el usuario implica que un platillo puede estar
    // asociado a múltiples menús, restaurantes y hoteles, lo que resultaría en múltiples filas
    // si el platillo aparece en varios menús. Por lo tanto, no usamos .single() aquí.
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
      return { success: true, data: [] } // Retornar array vacío si no se encuentra data
    }

    // Transformar y aplanar los datos para que coincidan con los alias y la estructura deseada
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
          CostoTotal: costoAdministrativo, // Ya es el costo administrativo
          PrecioSugerido: precioSugerido, // precioSugerido, // Nuevo campo
        }))
      } else {
        // Caso donde el platillo no está asociado a ningún menú, pero queremos mostrar sus detalles principales
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
            CostoTotal: costoAdministrativo, // Ya es el costo administrativo
            PrecioSugerido:  precioSugerido, //precioSugerido, // Nuevo campo
          },
        ]
      }
    })

    return { success: true, data: transformedData }
  } catch (error: any) {
    console.error("Error en getPlatilloDetailsForModal:", error)
    return { success: false, error: error.message || "Error interno del servidor" }
  }
}

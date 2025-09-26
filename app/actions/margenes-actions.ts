"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface MenuOption {
  id: number
  nombre: string
}

interface PlatilloOption {
  id: number
  nombre: string
}

interface CostHistoryItem {
  fechacreacion: string
  costo: number
}

export interface PlatilloMargin {
  id: number
  nombre: string
  costo: number
  precio_venta: number
  margen_utilidad: number
}

// Nueva interfaz para los datos del gráfico de barras comparativo
export interface PlatilloComparisonData {
  platilloNombre: string
  costoTotal: number
  precioVenta: number
  margenUtilidad: number
}

// NUEVAS INTERFACES PARA LAS TABLAS DE MÁRGENES
export interface MarginPlatilloSummary {
  id: number
  Platillo: string
  Menu: string
  margenutilidad: number
  MenuId: number // Aseguramos que MenuId esté presente para el tooltip
}

export interface PlatilloDetail {
  id: number
  Restaurante: string
  Menu: string
  Platillo: string
  CostoElaboracion: number
  precioventa: number
  margenutilidad: number
}

// Nueva interfaz para el reporte de recetas
export interface ReporteReceta {
  id: number
  nombre: string
  descripcion: string
  hotel: string
  costototal: number
  costoadministrativo: number
  fechacreacion: string
  fechaactualizacion: string
  imgurl?: string
  categoria?: string
  estado?: string
}

export async function getMenusForDropdown(): Promise<MenuOption[]> {
  try {
    const { data, error } = await supabaseAdmin.from("menus").select("id, nombre").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching menus:", error)
      return []
    }

    const menus = data.map((menu: any) => ({
      id: menu.id,
      nombre: menu.nombre,
    }))

    return [{ id: -1, nombre: "Todos" }, ...menus]
  } catch (error) {
    console.error("Unexpected error fetching menus:", error)
    return []
  }
}

export async function getPlatillosForDropdown(menuId: number, searchTerm: string): Promise<PlatilloOption[]> {
  try {
    let query = supabaseAdmin.from("platillos").select("id, nombre")

    if (menuId !== -1) {
      query = query.in("id", supabaseAdmin.from("platillosxmenu").select("platilloid").eq("menuid", menuId))
    }

    if (searchTerm) {
      query = query.ilike("nombre", `%${searchTerm}%`)
    }

    const { data, error } = await query.order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching platillos for dropdown:", error)
      return []
    }

    const platillos = data.map((platillo: any) => ({
      id: platillo.id,
      nombre: platillo.nombre,
    }))

    return platillos
  } catch (error) {
    console.error("Unexpected error fetching platillos for dropdown:", error)
    return []
  }
}

export async function getPlatilloCostHistory(
  platilloId: number,
  fechaInicial: string,
  fechaFinal: string,
): Promise<CostHistoryItem[]> {
  console.log("Fetching cost history for:", { platilloId, fechaInicial, fechaFinal })
  try {
    const { data, error } = await supabaseAdmin
      .from("historico")
      .select("fechacreacion, costo")
      .eq("platilloid", platilloId)
      .gte("fechacreacion", fechaInicial)
      .lte("fechacreacion", fechaFinal)
      .order("fechacreacion", { ascending: true })

    if (error) {
      console.error("Error fetching platillo cost history from Supabase:", error)
      return []
    }

    console.log("Raw data from historico:", data)

    const aggregatedData: { [key: string]: number } = {}
    data.forEach((item: any) => {
      const date = item.fechacreacion.split("T")[0]
      aggregatedData[date] = (aggregatedData[date] || 0) + item.costo
    })

    const result = Object.keys(aggregatedData).map((date) => ({
      fechacreacion: date,
      costo: aggregatedData[date],
    }))

    console.log("Aggregated cost history data:", result)
    return result
  } catch (error) {
    console.error("Unexpected error fetching platillo cost history:", error)
    return []
  }
}

export async function getPlatillosWithMargins(): Promise<PlatilloMargin[]> {
  try {
    const { data, error } = await supabaseAdmin.from("platillos").select("id, nombre")

    if (error) {
      console.error("Error fetching platillos with margins:", error)
      return []
    }

    return data.map((platillo: any) => {
      return {
        id: platillo.id,
        nombre: platillo.nombre,
        costo: 0,
        precio_venta: 0,
        margen_utilidad: 0,
      }
    })
  } catch (error) {
    console.error("Unexpected error fetching platillos with margins:", error)
    return []
  }
}

export async function getPlatilloComparisonData(platilloId: number): Promise<PlatilloComparisonData | null> {
  try {
    // Ejecuta la consulta SQL proporcionada por el usuario
    const { data, error } = await supabaseAdmin
      .from("platillos")
      .select(
        `
        id,
        nombre,
        costototal,
        platillosxmenu!inner(precioventa, margenutilidad)
      `,
      )
      .eq("id", platilloId)
      .single() // Usamos .single() porque esperamos un solo platillo por ID

    if (error) {
      console.error("Error fetching platillo comparison data:", error)
      return null
    }

    if (!data) {
      return null
    }

    // platillosxmenu puede ser un array si un platillo está en múltiples menús.
    // Para este gráfico, tomaremos el primer conjunto de datos de platillosxmenu encontrado.
    const platilloMenuData = Array.isArray(data.platillosxmenu) ? data.platillosxmenu[0] : data.platillosxmenu

    if (!platilloMenuData) {
      console.warn(`No platillosxmenu data found for platillo ID: ${platilloId}`)
      return {
        platilloNombre: data.nombre,
        costoTotal: data.costototal || 0,
        precioVenta: 0, // Valor predeterminado si no hay datos de platillosxmenu
        margenUtilidad: 0, // Valor predeterminado si no hay datos de platillosxmenu
      }
    }

    return {
      platilloNombre: data.nombre,
      costoTotal: data.costototal || 0,
      precioVenta: platilloMenuData.precioventa || 0,
      margenUtilidad: platilloMenuData.margenutilidad || 0,
    }
  } catch (error) {
    console.error("Unexpected error fetching platillo comparison data:", error)
    return null
  }
}

// NUEVAS FUNCIONES PARA LAS TABLAS DE MÁRGENES
export async function getTopMarginPlatillos(): Promise<MarginPlatilloSummary[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc("gettopplatillos")
    /*
    const { data, error } = await supabaseAdmin
      .from("platillos")
      .select(
        `
        id,
        nombre,
        platillosxmenu!inner(margenutilidad, menus!inner(nombre, id))
        `,
      )
      .order("margenutilidad", { descending: true, foreignTable: "platillosxmenu" })
      .limit(10)
*/
    if (error) {
      console.error("Error fetching top margin platillos:", error)
      return []
    }
    const result = data.map((p: any) => ({
      id: p.platilloid,
      Platillo: p.platillonombre,
      Menu: p.menunombre || "N/A",
      MenuId: p.menuId || 0,
      margenutilidad: p.margenutilidad || 0,
    }))

    /*
    const result = data.map((p: any) => ({
      id: p.id,
      Platillo: p.nombre,
      Menu: p.platillosxmenu[0]?.menus?.nombre || "N/A", // Corregido el acceso al nombre del menú
      MenuId: p.platillosxmenu[0]?.menus?.id || 0, // Aseguramos que MenuId esté presente
      margenutilidad: p.platillosxmenu[0]?.margenutilidad || 0,
    }))
*/
    return result
  } catch (error) {
    console.error("Unexpected error fetching top margin platillos:", error)
    return []
  }
}

export async function getBottomMarginPlatillos(): Promise<MarginPlatilloSummary[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("platillos")
      .select(
        `
        id,
        nombre,
        platillosxmenu!inner(margenutilidad, menus!inner(nombre, id))
        `,
      )
      .order("margenutilidad", { ascending: true, foreignTable: "platillosxmenu" })
      .limit(10)

    if (error) {
      console.error("Error fetching bottom margin platillos:", error)
      return []
    }

    const result = data.map((p: any) => ({
      id: p.id,
      Platillo: p.nombre,
      Menu: p.platillosxmenu[0]?.menus?.nombre || "N/A", // Corregido el acceso al nombre del menú
      MenuId: p.platillosxmenu[0]?.menus?.id || 0, // Aseguramos que MenuId esté presente
      margenutilidad: p.platillosxmenu[0]?.margenutilidad || 0,
    }))

    return result
  } catch (error) {
    console.error("Unexpected error fetching bottom margin platillos:", error)
    return []
  }
}

export async function getPlatilloDetailsForTooltip(platilloId: number, MenuId: number): Promise<PlatilloDetail | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("platillos")
      .select(
        `
        id,
        nombre,
        costototal,
        platillosxmenu!inner(precioventa, margenutilidad, menuid, menus!inner(nombre, restaurantes!inner(nombre)))
        `,
      )
      .eq("id", platilloId)
      .eq("platillosxmenu.menuid", MenuId) // Aplicar el filtro por menuid aquí
      .single()

    if (error) {
      console.error(`Error fetching platillo details for ID ${platilloId}:`, error)
      return null
    }

    if (!data) {
      return null
    }

    // Como ahora filtramos por platillosxmenu.menuid en la consulta,
    // data.platillosxmenu debería contener solo la entrada relevante (o estar vacío si no hay coincidencia).
    const platilloMenuData = Array.isArray(data.platillosxmenu) ? data.platillosxmenu[0] : data.platillosxmenu

    const menuData = platilloMenuData?.menus
    const restauranteData = menuData?.restaurantes

    return {
      id: data.id,
      Restaurante: restauranteData?.nombre || "N/A",
      Menu: menuData?.nombre || "N/A",
      Platillo: data.nombre,
      CostoElaboracion: data.costototal || 0,
      precioventa: platilloMenuData?.precioventa || 0,
      margenutilidad: platilloMenuData?.margenutilidad || 0,
    }
  } catch (error) {
    console.error(`Unexpected error fetching platillo details for ID ${platilloId}:`, error)
    return null
  }
}

// Nueva función para obtener el reporte de recetas
export async function obtenerReporteRecetas(hotelId: number, mes: number, año: number): Promise<ReporteReceta[]> {
  try {
    console.log("Obteniendo reporte de recetas con parámetros:", { hotelId, mes, año })

    const { data, error } = await supabaseAdmin.rpc("reportelistadorecetas", {
      hotelesid: hotelId,
      mes: mes,
      year: año,
    })

    if (error) {
      console.error("Error fetching reporte recetas:", error)
      return []
    }

    console.log("Datos del reporte de recetas:", data)

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching reporte recetas:", error)
    return []
  }
}

// Nueva función para obtener cambios significativos en costos de platillos usando función de Supabase
export async function obtenerCambiosCostosPlatillos(mes: number, año: number, hotelId: number) {
  try {
    // Llamar a la función de Supabase con RPC
    const { data: platillosCostos, error } = await supabaseAdmin.rpc("sellistadocostoplatillos", {
      mes: mes,
      year: año,
      hotelesid: hotelId,
    })

    if (error) {
      console.error("Error obteniendo costos de platillos:", error)
      return { success: false, data: [] }
    }

    if (!platillosCostos || platillosCostos.length === 0) {
      return { success: true, data: [] }
    }

    // Procesar datos para calcular variaciones
    const cambiosSignificativos = []

    platillosCostos.forEach((platillo) => {
      const costoInicial = platillo.costohistorico || platillo.costo_inicial
      const costoActual = platillo.costoactual || platillo.costo_actual

      // Verificar que ambos costos sean válidos
      if (costoInicial && costoActual && costoInicial > 0) {
        const variacion = ((costoActual - costoInicial) / costoInicial) * 100

        // Filtrar cambios significativos (≥5%)
        if (Math.abs(variacion) >= 0) {
          cambiosSignificativos.push({
            id: platillo.id || platillo.platilloid,
            nombre: platillo.nombre,
            costo_inicial: costoInicial,
            costo_actual: costoActual,
            variacion_porcentaje: variacion,
          })
        }
      }
    })

    // Ordenar por variación más significativa y tomar top 5
    const resultado = cambiosSignificativos
      .sort((a, b) => Math.abs(b.variacion_porcentaje) - Math.abs(a.variacion_porcentaje))
      .slice(0, 50)

    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error en obtenerCambiosCostosPlatillos:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener ingredientes que aumentaron de precio
export async function obtenerIngredientesAumentoPrecio(mes: number, año: number, hotelId: number) {
  try {
    const { data: ingredientesCostos, error } = await supabaseAdmin.rpc("sellistadocostoingredientes", {
      mes: mes,
      year: año,
      hotelesid: hotelId,
    })

    if (error) {
      console.error("Error obteniendo costos de ingredientes:", error)
      return { success: false, data: [] }
    }

    if (!ingredientesCostos || ingredientesCostos.length === 0) {
      return { success: true, data: [] }
    }

    // Procesar datos para calcular aumentos
    const aumentosSignificativos = []

    ingredientesCostos.forEach((ingrediente) => {
      const costoHistorico = ingrediente.costohistorico
      const costoActual = ingrediente.costoactual

      // Verificar que ambos costos sean válidos y que haya un aumento
      if (costoHistorico && costoActual && costoHistorico > 0 && costoActual > costoHistorico) {
        const aumentoPorcentaje = ((costoActual - costoHistorico) / costoHistorico) * 100

        // Filtrar aumentos significativos (≥2%)
        if (aumentoPorcentaje >= 2) {
          aumentosSignificativos.push({
            codigo: ingrediente.codigo || "",
            nombre: ingrediente.nombre,
            costo_inicial: costoHistorico,
            costo_actual: costoActual,
            aumento_porcentaje: aumentoPorcentaje,
          })
        }
      }
    })

    // Ordenar por aumento más significativo y tomar top 10
    const resultado = aumentosSignificativos.sort((a, b) => b.aumento_porcentaje - a.aumento_porcentaje).slice(0, 10)

    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error en obtenerIngredientesAumentoPrecio:", error)
    return { success: false, data: [] }
  }
}

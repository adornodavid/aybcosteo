"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase" // Usamos el cliente de Supabase para el usuario

// Tipos para los datos que se devolverán
export type MenuItem = {
  id: number
  nombre: string
}

export type PlatilloItem = {
  id: number
  nombre: string
}

export type CostHistoryItem = {
  fechacreacion: string
  fechacreacionOriginal: string // Agregamos la fecha original sin formatear
  platilloid: number // Cambiado a number para coincidir con el tipo de id de platillo
  costo: number
  precioventa: number
  margenutilidad: number // Aseguramos que el tipo incluya margenutilidad
  costoporcentual: number
  nombreplatillo: string // Nombre del platillo
  nombremenu: string // Nombre del menú
}

export type IngredienteDetalle = {
  id: number
  nombre: string
  cantidad: number
  costo: number
  unidadmedida: string
}

export type RecetaDetalle = {
  id: number
  nombre: string
  cantidad: number
  costo: number
}

export type PlatilloTooltipDetail = {
  id: number // Cambiado a number
  Restaurante: string
  Menu: string
  Platillo: string
  CostoElaboracion: number
  PrecioVenta: number
  MargenUtilidad: number
  CostoPorcentual: number
  Ingredientes: IngredienteDetalle[]
  Recetas: RecetaDetalle[]
  FechaHistorico?: string
}

// Nuevos tipos para las tarjetas comparativas
export type PlatilloActualInfo = {
  id: number
  imgurl: string | null
  nombre: string
  menu: string
  costototal: number
  fechacreacion: string
  precioventa: number
  margenutilidad: number
}

export type PlatilloHistoricoInfo = {
  platillo: string
  costototal: number
  precioventa: number
  margenutilidad: number
  costoporcentual: number
}

// Función para obtener los menús para el dropdown
export async function getMenusForAnalisis(): Promise<MenuItem[]> {
  const supabase = createClient(cookies()) // Cliente de Supabase para la consulta de datos

  let auxHotelid = -1 // Variable auxiliar para el hotelId

  // 1. Obtener RolId y HotelId directamente de las cookies
  const allCookies = cookies()
  const rolIdCookie = allCookies.get("RolId")
  const hotelIdCookie = allCookies.get("HotelId")

  let rolId = 0
  let hotelId = 0

  if (rolIdCookie && !isNaN(Number.parseInt(rolIdCookie.value))) {
    rolId = Number.parseInt(rolIdCookie.value)
  } else {
    console.warn("RolId cookie not found or invalid, defaulting to 0.")
  }

  if (hotelIdCookie && !isNaN(Number.parseInt(hotelIdCookie.value))) {
    hotelId = Number.parseInt(hotelIdCookie.value)
  } else {
    console.warn("HotelId cookie not found or invalid, defaulting to 0.")
  }

  // 2. Asignar valor a auxHotelid según el RolId obtenido de la cookie
  if (rolId !== 1 && rolId !== 2 && rolId !== 3 && rolId !== 4) {
    auxHotelid = hotelId
  } else {
    auxHotelid = -1
  }

  try {
    // 3. Ejecutar la consulta SQL adaptada a Supabase Client
    let query = supabase
      .from("menus")
      .select(`
        id,
        nombre,
        restaurantes!inner(
          hoteles!inner(
            id
          )
        )
      `)
      .order("id", { ascending: true })

    // Aplicar el filtro si auxHotelid no es -1
    if (auxHotelid !== -1) {
      query = query.eq("restaurantes.hoteles.id", auxHotelid)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching menus:", error.message)
      return [{ id: -1, nombre: "Todos" }]
    }

    // 4. Formatear las opciones de la lista desplegable
    const menuItems: MenuItem[] = [
      { id: -1, nombre: "Todos" }, // Añadir la opción "Todos" al inicio
      ...data.map((menu: any) => ({
        id: menu.id,
        nombre: menu.nombre,
      })),
    ]

    return menuItems
  } catch (error) {
    console.error("Exception fetching menus:", error)
    return [{ id: -1, nombre: "Todos" }]
  }
}

// Función para obtener platillos basados en el menú seleccionado y un término de búsqueda
export async function getPlatillosForAnalisis(menuId: number, searchTerm = ""): Promise<PlatilloItem[]> {
  const supabase = createClient(cookies())

  try {
    let query = supabase.from("platillos").select(`
      id,
      nombre,
      platillosxmenu!inner(
        menuid
      )
    `)

    if (menuId !== -1) {
      query = query.eq("platillosxmenu.menuid", menuId)
    }

    if (searchTerm) {
      query = query.ilike("nombre", `%${searchTerm}%`) // 'ilike' para búsqueda insensible a mayúsculas/minúsculas
    }

    const { data, error } = await query.order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching platillos:", error.message)
      return []
    }

    const platilloItems: PlatilloItem[] = data.map((platillo: any) => ({
      id: platillo.id,
      nombre: platillo.nombre,
    }))

    return platilloItems
  } catch (error) {
    console.error("Exception fetching platillos:", error)
    return []
  }
}

// Función para obtener el historial de costos de un platillo
export async function getPlatilloCostHistory(
  platilloId: number,
  fechaInicial: string,
  fechaFinal: string,
): Promise<CostHistoryItem[]> {
  const supabase = createClient(cookies())
  console.log("Fetching cost history for:", { platilloId, fechaInicial, fechaFinal })

  try {
    // 1. Obtener datos del histórico con join directo a platillos y menus
    const { data, error } = await supabase
      .from("historico")
      .select(`
        fechacreacion, 
        platilloid, 
        menuid,
        costo, 
        precioventa, 
        costoporcentual,
        platillos!inner(
          nombre
        ),
        menus!inner(
          nombre
        )
      `)
      .eq("platilloid", platilloId)
      .gte("fechacreacion", fechaInicial)
      .lte("fechacreacion", fechaFinal)
      .order("fechacreacion", { ascending: true }) // Ordenar por fecha para el gráfico

    if (error) {
      console.error("Error fetching platillo cost history:", error.message)
      return []
    }

    console.log("Raw data from historico:", data)

    // 2. Agrupar y sumar costos por fecha y platillo
    const groupedData = data.reduce((acc: any, item: any) => {
      const key = `${item.fechacreacion}-${item.platilloid}`
      if (!acc[key]) {
        acc[key] = {
          fechacreacion: item.fechacreacion,
          fechacreacionOriginal: item.fechacreacion, // Guardamos la fecha original en formato YYYY-MM-DD
          platilloid: item.platilloid,
          costo: 0,
          precioventa: item.precioventa, // Tomar el primer precio de venta encontrado para esa fecha/platillo
          margenutilidad: 0, // Inicializar, se calculará después
          costoporcentual: item.costoporcentual,
          nombreplatillo: item.platillos?.nombre || "N/A", // Nombre del platillo
          nombremenu: item.menus?.nombre || "N/A", // Nombre del menú desde join directo
        }
      }
      acc[key].costo += item.costo
      return acc
    }, {})

    const chartData = Object.values(groupedData).map((item: any) => ({
      fechacreacion: item.fechacreacion, // Mantenemos como string en formato YYYY-MM-DD
      fechacreacionOriginal: item.fechacreacion, // Fecha original para consultas en formato YYYY-MM-DD
      costo: item.costo,
      precioventa: item.precioventa,
      platilloid: item.platilloid,
      margenutilidad: item.precioventa - item.costo, // Calcular el margen de utilidad
      costoporcentual: item.costoporcentual,
      nombreplatillo: item.nombreplatillo, // Nombre del platillo
      nombremenu: item.nombremenu, // Nombre del menú
    }))

    console.log("Processed chart data:", chartData)
    return chartData
  } catch (error) {
    console.error("Exception fetching platillo cost history:", error)
    return []
  }
}

// Función para obtener detalles completos del platillo para el tooltip incluyendo histórico
export async function getPlatilloDetailsForTooltip(
  platilloId: number,
  menuId?: number,
  fecha?: string,
): Promise<PlatilloTooltipDetail | null> {
  const supabase = createClient(cookies())

  try {
    // 1. Obtener información básica del platillo
    const { data: platilloData, error: platilloError } = await supabase
      .from("platillos")
      .select(`
        id,
        nombre,
        costototal,
        platillosxmenu!inner(
          precioventa,
          margenutilidad,
          menuid,
          menus!inner(
            nombre,
            restaurantes!inner(
              nombre
            )
          )
        )
      `)
      .eq("id", platilloId)

    if (platilloError) {
      console.error("Error fetching platillo details:", platilloError.message)
      return null
    }

    if (!platilloData || platilloData.length === 0) {
      return null
    }

    const platillo = platilloData[0]

    // 2. Obtener datos del histórico si se proporciona fecha
    let historicoData = null
    if (fecha) {
      const { data: historico, error: historicoError } = await supabase
        .from("historico")
        .select("costo, precioventa, costoporcentual, fechacreacion")
        .eq("platilloid", platilloId)
        .eq("fechacreacion", fecha)
        .single()

      if (!historicoError && historico) {
        historicoData = historico
      }
    }

    // 3. Obtener ingredientes del platillo
    const { data: ingredientesData, error: ingredientesError } = await supabase
      .from("platillosingredientes")
      .select(`
        cantidad,
        ingredientes!inner(
          id,
          nombre,
          unidadmedida,
          preciounitario
        )
      `)
      .eq("platilloid", platilloId)

    const ingredientes: IngredienteDetalle[] =
      ingredientesData?.map((item: any) => ({
        id: item.ingredientes.id,
        nombre: item.ingredientes.nombre,
        cantidad: item.cantidad,
        costo: item.cantidad * item.ingredientes.preciounitario,
        unidadmedida: item.ingredientes.unidadmedida,
      })) || []

    // 4. Obtener recetas del platillo
    const { data: recetasData, error: recetasError } = await supabase
      .from("platillosrecetas")
      .select(`
        cantidad,
        recetas!inner(
          id,
          nombre,
          costototal
        )
      `)
      .eq("platilloid", platilloId)

    const recetas: RecetaDetalle[] =
      recetasData?.map((item: any) => ({
        id: item.recetas.id,
        nombre: item.recetas.nombre,
        cantidad: item.cantidad,
        costo: item.cantidad * item.recetas.costototal,
      })) || []

    // 5. Calcular costo total
    const costoIngredientes = ingredientes.reduce((sum, ing) => sum + ing.costo, 0)
    const costoRecetas = recetas.reduce((sum, rec) => sum + rec.costo, 0)
    const costoTotal = costoIngredientes + costoRecetas

    // 6. Usar datos del histórico si están disponibles, sino usar datos actuales
    const precioVenta = historicoData?.precioventa || platillo.platillosxmenu[0]?.precioventa || 0
    const costoPorcentual = historicoData?.costoporcentual || (costoTotal / precioVenta) * 100 || 0
    const margenUtilidad = precioVenta - costoTotal

    const details: PlatilloTooltipDetail = {
      id: platillo.id,
      Restaurante: platillo.platillosxmenu[0]?.menus?.restaurantes?.nombre || "N/A",
      Menu: platillo.platillosxmenu[0]?.menus?.nombre || "N/A",
      Platillo: platillo.nombre,
      CostoElaboracion: costoTotal,
      PrecioVenta: precioVenta,
      MargenUtilidad: margenUtilidad,
      CostoPorcentual: costoPorcentual,
      Ingredientes: ingredientes,
      Recetas: recetas,
      FechaHistorico: fecha,
    }

    return details
  } catch (error) {
    console.error("Exception fetching platillo details for tooltip:", error)
    return null
  }
}

// Nueva función para obtener información actual del platillo
export async function getPlatilloActualInfo(platilloId: number, menuId: number): Promise<PlatilloActualInfo | null> {
  const supabase = createClient(cookies())

  try {
    const { data, error } = await supabase
      .from("platillos")
      .select(`
        id,
        imgurl,
        nombre,
        costototal,
        fechacreacion,
        platillosxmenu!inner(
          precioventa,
          margenutilidad,
          menuid,
          menus!inner(
            nombre
          )
        )
      `)
      .eq("id", platilloId)
      .eq("platillosxmenu.menuid", menuId)
      .order("fechacreacion", { ascending: false }) // Tomar el más reciente
      .limit(1) // Limitar a 1 resultado en lugar de usar .single()

    if (error) {
      console.error("Error fetching platillo actual info:", error.message)
      return null
    }

    // Verificar que tengamos datos
    if (!data || data.length === 0) {
      console.warn("No data found for platillo:", platilloId, "menu:", menuId)
      return null
    }

    const platilloData = data[0] // Tomar el primer (y único) resultado

    const platilloActual: PlatilloActualInfo = {
      id: platilloData.id,
      imgurl: platilloData.imgurl,
      nombre: platilloData.nombre,
      menu: platilloData.platillosxmenu[0]?.menus?.nombre || "N/A",
      costototal: platilloData.costototal || 0,
      fechacreacion: platilloData.fechacreacion,
      precioventa: platilloData.platillosxmenu[0]?.precioventa || 0,
      margenutilidad: platilloData.platillosxmenu[0]?.margenutilidad || 0,
    }

    return platilloActual
  } catch (error) {
    console.error("Exception fetching platillo actual info:", error)
    return null
  }
}

// Nueva función para obtener información histórica del platillo
export async function getPlatilloHistoricoInfo(
  platilloId: number,
  fecha: string,
): Promise<PlatilloHistoricoInfo | null> {
  const supabase = createClient(cookies())

  // Validar que la fecha no sea undefined o null
  if (!fecha || fecha === "undefined" || fecha === "null") {
    console.error("Invalid fecha provided to getPlatilloHistoricoInfo:", fecha)
    return null
  }

  // Validar formato de fecha (YYYY-MM-DD)
  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!fechaRegex.test(fecha)) {
    console.error("Invalid fecha format provided to getPlatilloHistoricoInfo:", fecha)
    return null
  }

  try {
    console.log("Fetching historico info for platillo:", platilloId, "fecha:", fecha)

    const { data, error } = await supabase
      .from("historico")
      .select(`
        costo,
        precioventa,
        costoporcentual,
        platillos!inner(
          nombre
        )
      `)
      .eq("platilloid", platilloId)
      .eq("fechacreacion", fecha)

    if (error) {
      console.error("Error fetching platillo historico info:", error.message)
      return null
    }

    if (!data || data.length === 0) {
      console.warn("No historico data found for platillo:", platilloId, "fecha:", fecha)
      return null
    }

    // Agrupar y sumar costos
    const costototal = data.reduce((sum, item) => sum + item.costo, 0)
    const precioventa = data[0].precioventa
    const margenutilidad = precioventa - costototal
    const costoporcentual = data[0].costoporcentual

    const platilloHistorico: PlatilloHistoricoInfo = {
      platillo: data[0].platillos?.nombre || "N/A",
      costototal: costototal,
      precioventa: precioventa,
      margenutilidad: margenutilidad,
      costoporcentual: costoporcentual,
    }

    console.log("Historico info fetched successfully:", platilloHistorico)
    return platilloHistorico
  } catch (error) {
    console.error("Exception fetching platillo historico info:", error)
    return null
  }
}

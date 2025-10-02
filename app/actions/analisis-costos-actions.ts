"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase" // Usamos el cliente de Supabase para el usuario

// Tipos para los datos que se devolverán
export type HotelItem = {
  id: number
  nombre: string
}

export type RestauranteItem = {
  id: number
  nombre: string
}

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

// Nueva función para obtener hoteles (sin "Todos")
export async function getHotelesForAnalisis(): Promise<HotelItem[]> {
  const supabase = createClient(cookies())

  // Obtener RolId de las cookies
  const allCookies = cookies()
  const rolIdCookie = allCookies.get("RolId")
  const hotelIdCookie = allCookies.get("HotelId")

  let rolId = 0
  let hotelId = 0

  if (rolIdCookie && !isNaN(Number.parseInt(rolIdCookie.value))) {
    rolId = Number.parseInt(rolIdCookie.value)
  }

  if (hotelIdCookie && !isNaN(Number.parseInt(hotelIdCookie.value))) {
    hotelId = Number.parseInt(hotelIdCookie.value)
  }

  try {
    let query = supabase.from("hoteles").select("id, nombre").order("id", { ascending: true })

    // Si el rol no es 1, 2, 3 o 4, filtrar por el hotel del usuario
    if (rolId !== 1 && rolId !== 2 && rolId !== 3 && rolId !== 4) {
      query = query.eq("id", hotelId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching hoteles:", error.message)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching hoteles:", error)
    return []
  }
}

// Nueva función para obtener restaurantes basados en el hotel seleccionado (sin "Todos")
export async function getRestaurantesForAnalisis(hotelId: number): Promise<RestauranteItem[]> {
  const supabase = createClient(cookies())

  try {
    let query = supabase.from("restaurantes").select("id, nombre").order("nombre", { ascending: true })

    if (hotelId !== -1) {
      query = query.eq("hotelid", hotelId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching restaurantes:", error.message)
      return []
    }

    return data.map((restaurante: any) => ({
      id: restaurante.id,
      nombre: restaurante.nombre,
    }))
  } catch (error) {
    console.error("Exception fetching restaurantes:", error)
    return []
  }
}

// Función modificada para obtener los menús basados en el restaurante seleccionado (sin "Todos")
export async function getMenusForAnalisis(restauranteId: number): Promise<MenuItem[]> {
  const supabase = createClient(cookies())

  try {
    let query = supabase.from("menus").select("id, nombre").order("nombre", { ascending: true })

    if (restauranteId !== -1) {
      query = query.eq("restauranteid", restauranteId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching menus:", error.message)
      return []
    }

    return data.map((menu: any) => ({
      id: menu.id,
      nombre: menu.nombre,
    }))
  } catch (error) {
    console.error("Exception fetching menus:", error)
    return []
  }
}

// Función modificada para obtener platillos basados en el menú seleccionado y un término de búsqueda
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
      query = query.ilike("nombre", `%${searchTerm}%`)
    }

    const { data, error } = await query.order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching platillos:", error.message)
      return [{ id: -1, nombre: "Todos" }]
    }

    const platilloItems: PlatilloItem[] = [
      { id: -1, nombre: "Todos" }, // Agregar "Todos" como primer elemento
      ...data.map((platillo: any) => ({
        id: platillo.id,
        nombre: platillo.nombre,
      })),
    ]

    return platilloItems
  } catch (error) {
    console.error("Exception fetching platillos:", error)
    return [{ id: -1, nombre: "Todos" }]
  }
}

// Función modificada para obtener el historial de costos usando la función de Supabase
export async function getPlatilloCostHistory(
  platilloId: number,
  fechaInicial: string,
  fechaFinal: string,
  menuId: number,
  restauranteId: number,
  hotelId: number,
): Promise<CostHistoryItem[]> {
  const supabase = createClient(cookies())
  console.log("Fetching cost history with params:", {
    platilloId,
    fechaInicial,
    fechaFinal,
    menuId,
    restauranteId,
    hotelId,
  })

  try {
    // Llamar a la función de Supabase
    const { data, error } = await supabase.rpc("selhistoricocostoporcentual", {
      platillosid: platilloId,
      fechainicial: fechaInicial,
      fechafinal: fechaFinal,
      menusid: menuId,
      restaurantesid: restauranteId,
      hotelesid: hotelId,
    })

    if (error) {
      console.error("Error calling selhistoricocostoporcentual:", error.message)
      return []
    }

    console.log("Raw data from selhistoricocostoporcentual:", data)

    if (!data || data.length === 0) {
      console.log("No data returned from function")
      return []
    }

    // Transformar los datos para el formato esperado
    const chartData = data.map((item: any) => ({
      fechacreacion: item.fechacreacion, // Mantener como string en formato YYYY-MM-DD
      fechacreacionOriginal: item.fechacreacion, // Fecha original para consultas
      platilloid: item.platilloid || item.platillosid,
      costo: item.costoelaboracion || 0,
      precioventa: item.precioventa || 0,
      margenutilidad: (item.precioventa || 0) - (item.costo || 0), // Calcular margen
      costoporcentual: item.costoporcentual || 0,
      nombreplatillo: item.nombre || item.platillo || "N/A",
      nombremenu: item.nombremenu || item.menu || "N/A",
      menuid:  item.menuid || "N/A", 
    }))

    console.log("Processed chart data:", chartData)
    return chartData
  } catch (error) {
    console.error("Exception calling selhistoricocostoporcentual:", error)
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
      .order("fechacreacion", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching platillo actual info:", error.message)
      return null
    }

    if (!data || data.length === 0) {
      console.warn("No data found for platillo:", platilloId, "menu:", menuId)
      return null
    }

    const platilloData = data[0]

    const platilloActual: PlatilloActualInfo = {
      id: platilloData.id,
      imgurl: platilloData.imgurl,
      nombre: platilloData.nombre,
      menu: platilloData.platillosxmenu[0]?.menus?.nombre || "N/A",
      costototal: platilloData.costototal || 0,
      fechacreacion: platilloData.fechacreacion,
      precioventa: platilloData.platillosxmenu[0]?.precioventa || 0,
      costoporcentual: (platilloData.costototal / platilloData.platillosxmenu[0]?.precioventa) * 100 || 0,
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
  menu: number,
): Promise<PlatilloHistoricoInfo | null> {
  const supabase = createClient(cookies())

  if (!fecha || fecha === "undefined" || fecha === "null") {
    console.error("Invalid fecha provided to getPlatilloHistoricoInfo:", fecha)
    return null
  }

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
      .eq("menuid", menu)

    if (error) {
      console.error("Error fetching platillo historico info:", error.message)
      return null
    }

    if (!data || data.length === 0) {
      console.warn("No historico data found for platillo:", platilloId, "fecha:", fecha)
      return null
    }

    const costototal = data.reduce((sum, item) => sum + item.costo, 0)
    const precioventa = data[0].precioventa
    const margenutilidad = precioventa - ((costototal * 0.05) + costototal)
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

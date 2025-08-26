"use server"

/* ==================================================
  Imports
================================================== */
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

/* ==================================================
  Funciones
  --------------------
	* INSERTS
		- insXXXXX
	* SELECTS
		- selXXXXX
	* UPDATES
		- updXXXXX
	* DELETES
		- delXXXXX
	* SPECIALS
		- xxxXXXXX
================================================== */
export async function obtenerResumenesDashboard() {
  try {
    const supabase = createSupabaseServerClient()

    // Obtener conteo de hoteles activos
    const { count: hotelesCount, error: hotelesError } = await supabase
      .from("hoteles")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (hotelesError) {
      console.error("Error obteniendo hoteles:", hotelesError)
    }

    // Obtener conteo de restaurantes activos
    const { count: restaurantesCount, error: restaurantesError } = await supabase
      .from("restaurantes")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (restaurantesError) {
      console.error("Error obteniendo restaurantes:", restaurantesError)
    }

    // Obtener conteo de menús activos
    const { count: menusCount, error: menusError } = await supabase
      .from("menus")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (menusError) {
      console.error("Error obteniendo menús:", menusError)
    }

    // Obtener conteo de platillos activos
    const { count: platillosCount, error: platillosError } = await supabase
      .from("platillos")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (platillosError) {
      console.error("Error obteniendo platillos:", platillosError)
    }

    // Obtener conteo de ingredientes activos
    const { count: ingredientesCount, error: ingredientesError } = await supabase
      .from("ingredientes")
      .select("*", { count: "exact", head: true })
      .eq("activo", true)

    if (ingredientesError) {
      console.error("Error obteniendo ingredientes:", ingredientesError)
    }

    return {
      success: true,
      data: {
        hoteles: hotelesCount || 0,
        restaurantes: restaurantesCount || 0,
        menus: menusCount || 0,
        platillos: platillosCount || 0,
        ingredientes: ingredientesCount || 0,
      },
    }
  } catch (error) {
    console.error("Error en obtenerResumenesDashboard:", error)
    return {
      success: false,
      error: "Error al obtener resúmenes del dashboard",
      data: {
        hoteles: 0,
        restaurantes: 0,
        menus: 0,
        platillos: 0,
        ingredientes: 0,
      },
    }
  }
}

// Nueva función para obtener cambios significativos en costos de platillos usando función de Supabase
export async function obtenerCambiosCostosPlatillos(mes: number, año: number, hotelId: number) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase con RPC
    const { data: platillosCostos, error } = await supabase.rpc("sellistadocostoplatillos", {
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
        const variacion = ((costoActual - costoInicial) / costoActual) * 100

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
      .slice(0, 5)

    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error en obtenerCambiosCostosPlatillos:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener cambios significativos en costos de recetas usando función de Supabase
export async function obtenerCambiosCostosRecetas(mes: number, año: number, hotelId: number) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase con RPC
    const { data: recetasCostos, error } = await supabase.rpc("sellistadocostorecetas", {
      mes: mes,
      year: año,
      hotelesid: hotelId,
    })

    if (error) {
      console.error("Error obteniendo costos de recetas:", error)
      return { success: false, data: [] }
    }

    if (!recetasCostos || recetasCostos.length === 0) {
      return { success: true, data: [] }
    }

    // Procesar datos para calcular variaciones
    const cambiosSignificativos = []

    recetasCostos.forEach((receta) => {
      const costoInicial = receta.costohistorico || receta.costo_inicial
      const costoActual = receta.costoactual || receta.costo_actual

      // Verificar que ambos costos sean válidos
      if (costoInicial && costoActual && costoInicial > 0) {
        const variacion = ((costoActual - costoInicial) / costoActual) * 100

        // Filtrar cambios significativos (≥5%)
        if (variacion >= 0) {
          cambiosSignificativos.push({
            nombre: receta.nombre,
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
      .slice(0, 5)

    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error en obtenerCambiosCostosRecetas:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener mejores márgenes de utilidad
export async function obtenerMejoresMargenesUtilidad() {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("platillosxmenu")
      .select(`
        platilloid,
        precioventa,
        platillos!inner(nombre, costototal),
        menus!inner(
          nombre,
          restauranteid,
          restaurantes!inner(
          hotelid,
          hoteles!inner(nombre)
          )
        )
      `)
      .not("precioventa", "is", null)
      .not("platillos.costototal", "is", null)
      .eq("activo", true)
      .eq("platillos.activo", true)

    if (error) {
      console.error("Error obteniendo mejores márgenes:", error)
      return { success: false, data: [] }
    }

    // Calcular márgenes y ordenar
    const margenesCalculados = (data || [])
      .map((item) => {
        const margenUtilidad = ((item.precioventa - item.platillos.costototal) / item.precioventa) * 100
        return {
          nombrePlatillo: item.platillos.nombre,
          nombreHotel: item.menus.restaurantes.hoteles.nombre,
          nombreMenu: item.menus.nombre,
          margenUtilidad: margenUtilidad,
        }
      })
      .sort((a, b) => b.margenUtilidad - a.margenUtilidad)
      .slice(0, 5)

    return { success: true, data: margenesCalculados }
  } catch (error) {
    console.error("Error en obtenerMejoresMargenesUtilidad:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener peores márgenes de utilidad
export async function obtenerPeoresMargenesUtilidad() {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("platillosxmenu")
      .select(`
        platilloid,
        precioventa,
        platillos!inner(nombre, costototal),
        menus!inner(
          nombre,
          restauranteid,
          restaurantes!inner(
          hotelid,
          hoteles!inner(nombre)
          )
        )
      `)
      .not("precioventa", "is", null)
      .not("platillos.costototal", "is", null)
      .eq("activo", true)
      .eq("platillos.activo", true)

    if (error) {
      console.error("Error obteniendo peores márgenes:", error)
      return { success: false, data: [] }
    }

    // Calcular márgenes y ordenar (peores primero)
    const margenesCalculados = (data || [])
      .map((item) => {
        const margenUtilidad = ((item.precioventa - item.platillos.costototal) / item.precioventa) * 100
        return {
          nombrePlatillo: item.platillos.nombre,
          nombreHotel: item.menus.restaurantes.hoteles.nombre,
          nombreMenu: item.menus.nombre,
          margenUtilidad: margenUtilidad,
        }
      })
      .sort((a, b) => a.margenUtilidad - b.margenUtilidad)
      .slice(0, 5)

    return { success: true, data: margenesCalculados }
  } catch (error) {
    console.error("Error en obtenerPeoresMargenesUtilidad:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener alertas de costo porcentual
export async function obtenerAlertasCostoPorcentual() {
  try {
    const supabase = createSupabaseServerClient()

    // Calcular fechas del mes anterior
    const fechaActual = new Date()
    const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1)
    const finMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 0)

    const inicioMesAnterior = mesAnterior.toISOString().split("T")[0]
    const finMesAnteriorStr = finMesAnterior.toISOString().split("T")[0]

    // Obtener todos los registros históricos del mes anterior
    const { data: historicos, error: errorHistorico } = await supabase
      .from("historico")
      .select(`
        platilloid,
        menuid,
        costoporcentual,
        fechacreacion,
        platillos!inner(id, nombre, activo)
      `)
      .eq("platillos.activo", true)
      .gte("fechacreacion", inicioMesAnterior)
      .lte("fechacreacion", finMesAnteriorStr)
      .order("fechacreacion", { ascending: false })

    if (errorHistorico) {
      console.error("Error obteniendo histórico:", errorHistorico)
      return { success: false, data: [] }
    }

    if (!historicos || historicos.length === 0) {
      return { success: true, data: [] }
    }

    // Procesar para obtener el último registro por platillo/menú del mes anterior
    const ultimosRegistros = new Map()

    historicos.forEach((registro) => {
      const key = `${registro.platilloid}-${registro.menuid}`

      if (!ultimosRegistros.has(key)) {
        ultimosRegistros.set(key, registro)
      } else {
        const registroExistente = ultimosRegistros.get(key)
        // Si este registro es más reciente, reemplazar
        if (new Date(registro.fechacreacion) > new Date(registroExistente.fechacreacion)) {
          ultimosRegistros.set(key, registro)
        }
      }
    })

    // Filtrar por costo porcentual ≥ 25% y obtener información adicional
    const alertas = []

    for (const [key, registro] of ultimosRegistros) {
      if (registro.costoporcentual >= 30) {
        const { data: platilloMenu, error: errorPlatilloMenu } = await supabase
          .from("platillosxmenu")
          .select(`
            precioventa,
            menus!inner(
              nombre,
              restauranteid,
              restaurantes!inner(
                nombre,
                hotelid,
                hoteles!inner(nombre)
              )
            )
          `)
          .eq("platilloid", registro.platilloid)
          .eq("menuid", registro.menuid)
          .eq("activo", true)
          .single()

        if (!errorPlatilloMenu && platilloMenu) {
          alertas.push({
            nombrePlatillo: registro.platillos.nombre,
            nombreHotel: platilloMenu.menus.restaurantes.hoteles.nombre,
            nombreRestaurante: platilloMenu.menus.restaurantes.nombre,
            nombreMenu: platilloMenu.menus.nombre,
            precioVenta: platilloMenu.precioventa,
            costoPorcentual: registro.costoporcentual,
          })
        }
      }
    }

    // Ordenar por costo porcentual más alto y tomar top 10
    const resultado = alertas.sort((a, b) => b.costoPorcentual - a.costoPorcentual).slice(0, 10)

    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error en obtenerAlertasCostoPorcentual:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener ingredientes que aumentaron de precio
export async function obtenerIngredientesAumentoPrecio(mes: number, año: number, hotelId: number) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase para obtener listado de costos de ingredientes
    const { data: ingredientesCostos, error } = await supabase.rpc("sellistadocostoingredientes", {
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
        const aumentoPorcentaje = ((costoActual - costoHistorico) / costoActual) * 100

        // Filtrar aumentos significativos (≥5%)
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

// Nueva función para obtener ingredientes que disminuyeron de precio usando función de Supabase
export async function obtenerIngredientesDisminucionPrecio(mes: number, año: number, hotelId: number) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase para obtener listado de costos de ingredientes
    const { data: ingredientesCostos, error } = await supabase.rpc("sellistadocostoingredientes", {
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

    // Procesar datos para obtener solo las disminuciones
    const disminucionesSignificativas = []

    ingredientesCostos.forEach((ingrediente) => {
      const costoHistorico = ingrediente.costohistorico
      const costoActual = ingrediente.costoactual

      // Verificar que ambos costos sean válidos y que haya una disminución
      if (costoHistorico && costoActual && costoHistorico > 0 && costoActual < costoHistorico) {
        const disminucionPorcentaje = ((costoActual - costoHistorico) / costoActual) * 100

        // Filtrar disminuciones significativas (≥5%)
        if (disminucionPorcentaje <= 0) {
          disminucionesSignificativas.push({
            codigo: ingrediente.codigo || "",
            nombre: ingrediente.nombre,
            costo_inicial: costoHistorico,
            costo_actual: costoActual,
            disminucion_porcentaje: disminucionPorcentaje,
          })
        }
      }
    })

    // Ordenar por disminución más significativa y tomar top 10
    const resultado = disminucionesSignificativas
      .sort((a, b) => b.disminucion_porcentaje - a.disminucion_porcentaje)
      .slice(0, 10)

    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error en obtenerIngredientesDisminucionPrecio:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener hoteles filtrados por rol
export async function obtenerHotelesPorRol() {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase.from("hoteles").select("id, nombre").eq("activo", true).order("nombre")

    if (error) {
      console.error("Error obteniendo hoteles:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en obtenerHotelesPorRol:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener restaurantes por hotel
export async function obtenerRestaurantesPorHotel(hotelId: number) {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("restaurantes")
      .select("id, nombre")
      .eq("hotelid", hotelId)
      .eq("activo", true)
      .order("nombre")

    if (error) {
      console.error("Error obteniendo restaurantes:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en obtenerRestaurantesPorHotel:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener menús por restaurante
export async function obtenerMenusPorRestaurante(restauranteId: number) {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("menus")
      .select("id, nombre")
      .eq("restauranteid", restauranteId)
      .eq("activo", true)
      .order("nombre")

    if (error) {
      console.error("Error obteniendo menús:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en obtenerMenusPorRestaurante:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener platillos por menú
export async function obtenerPlatillosPorMenu(menuId: number) {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("platillosxmenu")
      .select(`
        platilloid,
        platillos!inner(id, nombre, activo)
      `)
      .eq("menuid", menuId)
      .eq("activo", true)
      .eq("platillos.activo", true)
      .order("platillos(nombre)")

    if (error) {
      console.error("Error obteniendo platillos:", error)
      return { success: false, data: [] }
    }

    const platillos = (data || []).map((item) => ({
      id: item.platillos.id,
      nombre: item.platillos.nombre,
    }))

    return { success: true, data: platillos }
  } catch (error) {
    console.error("Error en obtenerPlatillosPorMenu:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener histórico de costeo usando función de Supabase
export async function obtenerHistoricoCosteo(
  hotelId: number,
  restauranteId: number,
  platilloId: number,
  menuId: number,
) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase con RPC
    const { data: historicos, error } = await supabase.rpc("selcostoplatilloshistorico", {
      hotelesid: hotelId,
      restaurantesid: restauranteId,
      platillosid: platilloId,
      menus: menuId,
    })

    if (error) {
      console.error("Error obteniendo histórico:", error)
      return { success: false, data: [] }
    }

    if (!historicos || historicos.length === 0) {
      return { success: true, data: [] }
    }

    // Procesar datos por mes
    const datosPorMes = new Map()

    // Inicializar todos los meses con 0
    const fechaActual = new Date()
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
      const mesNombre = fecha.toLocaleDateString("es-ES", { month: "short", year: "numeric" })

      datosPorMes.set(mesKey, {
        mes: mesNombre,
        costo: 0,
        fechaUltima: null,
      })
    }

    // Procesar registros históricos
    historicos.forEach((registro) => {
      const fechaRegistro = new Date(registro.fechacreacion)
      const mesKey = `${fechaRegistro.getFullYear()}-${String(fechaRegistro.getMonth() + 1).padStart(2, "0")}`

      if (datosPorMes.has(mesKey)) {
        const mesData = datosPorMes.get(mesKey)

        // Si no hay fecha previa o esta fecha es más reciente
        if (!mesData.fechaUltima || new Date(registro.fechacreacion) > new Date(mesData.fechaUltima)) {
          mesData.fechaUltima = registro.fechacreacion
          mesData.costo = registro.costohistorico || 0
        }
      }
    })

    // Convertir a array y ordenar cronológicamente
    const resultado = Array.from(datosPorMes.values()).reverse() // Para mostrar del más antiguo al más reciente

    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error en obtenerHistoricoCosteo:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener top ingredientes por costo usando función de Supabase
export async function obtenerTopIngredientesPorCosto(mes: number, año: number, hotelId: number) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase con RPC
    const { data: topIngredientes, error } = await supabase.rpc("selingredientestotalcostosmes", {
      mes: mes,
      year: año,
      hotelesid: hotelId,
    })

    if (error) {
      console.error("Error obteniendo top ingredientes:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: topIngredientes || [] }
  } catch (error) {
    console.error("Error en obtenerTopIngredientesPorCosto:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para buscar platillos por nombre
export async function buscarPlatillosPorNombre(nombre: string, hotelId: number) {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("platillos")
      .select("id, nombre")
      .eq("activo", true)
      //.eq("hotelid", hotelId)
      .ilike("nombre", `%${nombre}%`)
      .order("nombre")
      .limit(10)

    if (error) {
      console.error("Error buscando platillos:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en buscarPlatillosPorNombre:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para buscar recetas por nombre
export async function buscarRecetasPorNombre(nombre: string, hotelId: number) {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("recetas")
      .select("id, nombre")
      .eq("activo", true)
      .eq("hotelid", hotelId)
      .ilike("nombre", `%${nombre}%`)
      .order("nombre")
      .limit(10)

    if (error) {
      console.error("Error buscando recetas:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en buscarRecetasPorNombre:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener histórico de costeo de recetas usando función de Supabase
export async function obtenerHistoricoCosteoRecetas(hotelId: number, recetaId: number) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase con RPC
    const { data: historicos, error } = await supabase.rpc("selcostosubrecetashistorico", {
      hotelesid: hotelId,
      recetasid: recetaId,
    })

    if (error) {
      console.error("Error obteniendo histórico de recetas:", error)
      return { success: false, data: [] }
    }

    if (!historicos || historicos.length === 0) {
      return { success: true, data: [] }
    }

    // Procesar datos por mes
    const datosPorMes = new Map()

    // Inicializar todos los meses con 0
    const fechaActual = new Date()
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
      const mesNombre = fecha.toLocaleDateString("es-ES", { month: "short", year: "numeric" })

      datosPorMes.set(mesKey, {
        mes: mesNombre,
        costo: 0,
        fechaUltima: null,
      })
    }

    // Procesar registros históricos
    historicos.forEach((registro) => {
      const fechaRegistro = new Date(registro.fechacreacion)
      const mesKey = `${fechaRegistro.getFullYear()}-${String(fechaRegistro.getMonth() + 1).padStart(2, "0")}`

      if (datosPorMes.has(mesKey)) {
        const mesData = datosPorMes.get(mesKey)

        // Si no hay fecha previa o esta fecha es más reciente
        if (!mesData.fechaUltima || new Date(registro.fechacreacion) > new Date(mesData.fechaUltima)) {
          mesData.fechaUltima = registro.fechacreacion
          mesData.costo = registro.costohistorico || 0
        }
      }
    })

    // Convertir a array y ordenar cronológicamente
    const resultado = Array.from(datosPorMes.values()).reverse() // Para mostrar del más antiguo al más reciente

    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error en obtenerHistoricoCosteoRecetas:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener detalles actuales del platillo
export async function obtenerDetallesPlatilloActual(platilloId: number) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase con RPC
    const { data: detalles, error } = await supabase.rpc("selplatillodetalles", {
      platillosid: platilloId,
    })

    if (error) {
      console.error("Error obteniendo detalles del platillo:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: detalles || [] }
  } catch (error) {
    console.error("Error en obtenerDetallesPlatilloActual:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener detalles históricos de ingredientes del platillo
export async function obtenerDetallesPlatilloIngredientesHistorico(
  platilloId: number,
  hotelId: number,
  mes: number,
  año: number,
) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase con RPC
    const { data: detalles, error } = await supabase.rpc("selplatillodetallesingredienteshistorico", {
      platillosid: platilloId,
      hotelesid: hotelId,
      mes: mes,
      year: año,
    })

    if (error) {
      console.error("Error obteniendo detalles históricos de ingredientes:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: detalles || [] }
  } catch (error) {
    console.error("Error en obtenerDetallesPlatilloIngredientesHistorico:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener detalles históricos de recetas del platillo
export async function obtenerDetallesPlatilloRecetasHistorico(
  platilloId: number,
  hotelId: number,
  mes: number,
  año: number,
) {
  try {
    const supabase = createSupabaseServerClient()

    // Llamar a la función de Supabase con RPC
    const { data: detalles, error } = await supabase.rpc("selplatillodetallesrecetashistorico", {
      platillosid: platilloId,
      hotelesid: hotelId,
      mes: mes,
      year: año,
    })

    if (error) {
      console.error("Error obteniendo detalles históricos de recetas:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: detalles || [] }
  } catch (error) {
    console.error("Error en obtenerDetallesPlatilloRecetasHistorico:", error)
    return { success: false, data: [] }
  }
}

// Nueva función para obtener detalles del platillo para tooltip
export async function obtenerDetallesPlatilloTooltip(platilloId: number) {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("platillos")
      .select(`
        id,
        imgurl,
        nombre,
        costototal,
        costoadministrativo
      `)
      .eq("id", platilloId)
      .eq("activo", true)
      .single()

    if (error) {
      console.error("Error obteniendo detalles del platillo para tooltip:", error)
      return { success: false, data: null }
    }

    if (!data) {
      return { success: false, data: null }
    }

    // Transformar los datos para que coincidan con la estructura esperada
    const detallesTransformados = {
      id: data.id,
      imgurl: data.imgurl,
      //hotel: data.platillosxmenu?.menus?.restaurantes?.hoteles?.nombre,
      //restaurante: data.platillosxmenu?.menus?.restaurantes?.nombre,
      //menu: data.platillosxmenu?.menus?.nombre,
      nombre: data.nombre,
      costototal: data.costototal,
      costoadministrativo: data.costoadministrativo,
      //precioconiva: data.platillosxmenu?.precioconiva,
      //margenutilidad: data.platillosxmenu?.margenutilidad,
    }
    
    
    
    return { success: true, data: detallesTransformados}
  } catch (error) {
    console.error("Error en obtenerDetallesPlatilloTooltip:", error)
    return { success: false, data: null }
  }
}

// Nueva función para obtener detalles de la receta para tooltip
export async function obtenerDetallesRecetaTooltip(recetaId: number) {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("recetas")
      .select(`
        id,
        imgurl,
        nombre,
        costo,
        cantidad,
        tipounidadmedida!inner(descripcion),
        hoteles!inner(nombre)
      `)
      .eq("id", recetaId)
      .eq("activo", true)
      .single()

    if (error) {
      console.error("Error obteniendo detalles de la receta para tooltip:", error)
      return { success: false, data: null }
    }

    if (!data) {
      return { success: false, data: null }
    }

    // Transformar los datos para que coincidan con la estructura esperada
    const detallesTransformados = {
      id: data.id,
      imgurl: data.imgurl,
      hotel: data.hoteles.nombre,
      nombre: data.nombre,
      costo: data.costo,
      cantidad: data.cantidad,
      unidadbase: data.tipounidadmedida.descripcion,
    }

    return { success: true, data: detallesTransformados }
  } catch (error) {
    console.error("Error en obtenerDetallesRecetaTooltip:", error)
    return { success: false, data: null }
  }
}

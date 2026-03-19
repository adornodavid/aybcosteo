"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function importarIngredientesAction(datos: any[]) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en server actions
            }
          },
        },
      }
    )

    // Mapear los datos del Excel a las columnas de la tabla cargaingredientes
    const datosFormateados = datos.map((fila) => {
      const nuevoObjeto: any = {}

      // Mapeo dinámico de columnas del Excel a la tabla
      Object.keys(fila).forEach((clave) => {
        const claveNormalizada = clave.toLowerCase().trim()
        const valor = fila[clave]

        // Mapeo de columnas posibles del Excel a la tabla cargaingredientes
        if (
          claveNormalizada.includes("mes") ||
          claveNormalizada === "mes"
        ) {
          nuevoObjeto.mes = valor ? Number.parseInt(String(valor)) : null
        } else if (
          claveNormalizada.includes("subfamilia") ||
          claveNormalizada === "subfamilia"
        ) {
          nuevoObjeto.subfamilia = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("unidad") ||
          claveNormalizada === "unidad"
        ) {
          nuevoObjeto.unidad = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("precio") ||
          claveNormalizada === "precio"
        ) {
          nuevoObjeto.precio = valor ? Number.parseFloat(String(valor)) : null
        } else if (
          claveNormalizada.includes("familia") ||
          claveNormalizada === "familia"
        ) {
          nuevoObjeto.familia = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("hotel") ||
          claveNormalizada === "hotel"
        ) {
          nuevoObjeto.hotel = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("codigorapsodia") ||
          claveNormalizada === "codigorapsodia"
        ) {
          nuevoObjeto.codigorapsodia = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("year") ||
          claveNormalizada === "year"
        ) {
          nuevoObjeto.year = valor ? Number.parseInt(String(valor)) : null
        } else if (
          claveNormalizada.includes("cantidad") ||
          claveNormalizada === "cantidad"
        ) {
          nuevoObjeto.cantidad = valor ? Number.parseFloat(String(valor)) : null
        } else if (
          claveNormalizada.includes("articulo") ||
          claveNormalizada === "articulo"
        ) {
          nuevoObjeto.articulo = valor ? String(valor) : null
        }
      })

      return nuevoObjeto
    })

    // Filtrar solo los objetos que tienen al menos un campo con valor
    const datosValidos = datosFormateados.filter(
      (obj) => Object.keys(obj).length > 0
    )

    if (datosValidos.length === 0) {
      throw new Error("No hay datos válidos para importar")
    }

    // Realizar el INSERT a la tabla cargaingredientes
    const { data, error } = await supabase
      .from("cargaingredientes")
      .insert(datosValidos)
      .select()

    if (error) {
      throw new Error(`Error al importar: ${error.message}`)
    }

    return {
      success: true,
      message: `Se importaron ${data?.length || 0} registros correctamente`,
      recordsInserted: data?.length || 0,
    }
  } catch (error: any) {
    console.error("[v0] Error en importarIngredientesAction:", error)
    return {
      success: false,
      message: error.message || "Error al importar los datos",
      recordsInserted: 0,
    }
  }
}

export async function verificarYObtenerConteo() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en server actions
            }
          },
        },
      }
    )

    const { count, error } = await supabase
      .from("cargaingredientes")
      .select("*", { count: "exact", head: true })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      hasData: count && count > 0,
      count: count || 0,
    }
  } catch (error: any) {
    console.error("[v0] Error en verificarYObtenerConteo:", error)
    return {
      success: false,
      hasData: false,
      count: 0,
    }
  }
}

export async function buscarIngredientesExistentes(datos: any[]) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en server actions
            }
          },
        },
      }
    )

    // DEBUG: ver las columnas que vienen del Excel
    console.log("[DEBUG] Columnas del primer registro:", Object.keys(datos[0]))
    console.log("[DEBUG] Primer registro completo:", datos[0])

    // 1. Extraer acrónimos únicos de hotel del listado (buscar columna sin importar mayúsculas)
    const getColumnValue = (fila: any, ...possibleNames: string[]) => {
      for (const name of possibleNames) {
        const key = Object.keys(fila).find(k => k.toLowerCase().trim() === name.toLowerCase())
        if (key && fila[key] !== undefined && fila[key] !== null && String(fila[key]).trim() !== "") {
          return String(fila[key]).trim()
        }
      }
      return ""
    }

    const acronimosUnicos = [...new Set(
      datos.map((fila) => getColumnValue(fila, "hotel")).filter(Boolean)
    )]

    console.log("[DEBUG] Acrónimos únicos encontrados:", acronimosUnicos)

    if (acronimosUnicos.length === 0) {
      return { success: true, data: [], message: "No se encontraron hoteles en los datos" }
    }

    // 2. Buscar los hoteles por acrónimo para obtener sus IDs
    const { data: hoteles, error: errorHoteles } = await supabase
      .from("hoteles")
      .select("id, acronimo")
      .in("acronimo", acronimosUnicos)

    if (errorHoteles) {
      throw new Error(`Error al buscar hoteles: ${errorHoteles.message}`)
    }

    console.log("[DEBUG] Hoteles encontrados en BD:", hoteles)

    if (!hoteles || hoteles.length === 0) {
      return { success: true, data: [], message: "No se encontraron hoteles con esos acrónimos" }
    }

    // Mapa acrónimo -> hotelid
    const mapaHoteles: Record<string, number> = {}
    hoteles.forEach((h) => {
      if (h.acronimo) mapaHoteles[h.acronimo.trim()] = h.id
    })

    console.log("[DEBUG] Mapa hoteles (acronimo -> id):", mapaHoteles)

    // 3. Extraer códigos únicos por hotel
    const busquedas: { hotelid: number; codigos: string[] }[] = []
    const codigosPorHotel: Record<number, Set<string>> = {}

    datos.forEach((fila) => {
      const hotel = getColumnValue(fila, "hotel")
      const codigo = getColumnValue(fila, "codigorapsodia", "codigo")
      const hotelid = mapaHoteles[hotel]

      if (hotelid && codigo) {
        if (!codigosPorHotel[hotelid]) codigosPorHotel[hotelid] = new Set()
        codigosPorHotel[hotelid].add(codigo)
      }
    })

    Object.entries(codigosPorHotel).forEach(([hotelid, codigos]) => {
      busquedas.push({ hotelid: Number(hotelid), codigos: [...codigos] })
    })

    console.log("[DEBUG] Búsquedas a realizar:", busquedas.map(b => ({ hotelid: b.hotelid, totalCodigos: b.codigos.length, primeros5: b.codigos.slice(0, 5) })))

    // 4. Buscar ingredientes existentes por hotelid + codigorapsodia
    const ingredientesEncontrados: any[] = []

    for (const busqueda of busquedas) {
      console.log(`[DEBUG] Buscando en ingredientes: hotelid=${busqueda.hotelid}, codigos (${busqueda.codigos.length}):`, busqueda.codigos.slice(0, 5))

      const { data: ingredientes, error: errorIng } = await supabase
        .from("ingredientes")
        .select("*")
        .eq("hotelid", busqueda.hotelid)
        .in("codigorapsodia", busqueda.codigos)

      console.log(`[DEBUG] Resultado: ${ingredientes?.length || 0} ingredientes encontrados, error:`, errorIng)

      if (errorIng) {
        throw new Error(`Error al buscar ingredientes: ${errorIng.message}`)
      }

      if (ingredientes) {
        ingredientesEncontrados.push(...ingredientes)
      }
    }

    console.log(`[DEBUG] Total ingredientes encontrados: ${ingredientesEncontrados.length}`)

    return {
      success: true,
      data: ingredientesEncontrados,
      message: `Se encontraron ${ingredientesEncontrados.length} ingredientes existentes`,
    }
  } catch (error: any) {
    console.error("[v0] Error en buscarIngredientesExistentes:", error)
    return {
      success: false,
      data: [],
      message: error.message || "Error al buscar ingredientes existentes",
    }
  }
}

export async function buscarRecetasAfectadas(ingredienteIds: number[]) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en server actions
            }
          },
        },
      }
    )

    if (ingredienteIds.length === 0) {
      return { success: true, data: [], message: "No hay ingredientes con cambios" }
    }

    // Buscar en lotes para evitar límites de query
    const resultados: any[] = []
    const batchSize = 50

    for (let i = 0; i < ingredienteIds.length; i += batchSize) {
      const batch = ingredienteIds.slice(i, i + batchSize)

      const { data, error } = await supabase
        .rpc('buscar_recetas_por_ingredientes', { ingrediente_ids: batch })

      if (error) {
        // Si no existe el RPC, usar queries manuales
        console.log("[DEBUG] RPC no disponible, usando queries manuales")

        // Query manual: ingredientesxreceta -> recetas -> hoteles
        const { data: ixr, error: ixrError } = await supabase
          .from("ingredientesxreceta")
          .select("recetaid, elementoid, cantidad, ingredientecostoparcial")
          .in("elementoid", batch)
          .eq("tiposegmentoid", 1)

        if (ixrError) {
          throw new Error(`Error buscando ingredientesxreceta: ${ixrError.message}`)
        }

        if (!ixr || ixr.length === 0) continue

        // Obtener recetas únicas
        const recetaIds = [...new Set(ixr.map((r: any) => r.recetaid))]
        const { data: recetas, error: recError } = await supabase
          .from("recetas")
          .select("id, nombre, costo, cantidad, hotelid")
          .in("id", recetaIds)

        if (recError) {
          throw new Error(`Error buscando recetas: ${recError.message}`)
        }

        // Obtener hoteles
        const hotelIds = [...new Set((recetas || []).map((r: any) => r.hotelid).filter(Boolean))]
        const { data: hoteles, error: hotError } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .in("id", hotelIds)

        if (hotError) {
          throw new Error(`Error buscando hoteles: ${hotError.message}`)
        }

        // Obtener nombres de ingredientes
        const { data: ingredientes, error: ingError } = await supabase
          .from("ingredientes")
          .select("id, nombre")
          .in("id", batch)

        if (ingError) {
          throw new Error(`Error buscando ingredientes: ${ingError.message}`)
        }

        // Mapas
        const recetaMap: Record<number, any> = {}
        ;(recetas || []).forEach((r: any) => { recetaMap[r.id] = r })
        const hotelMap: Record<number, string> = {}
        ;(hoteles || []).forEach((h: any) => { hotelMap[h.id] = h.nombre })
        const ingMap: Record<number, string> = {}
        ;(ingredientes || []).forEach((ing: any) => { ingMap[ing.id] = ing.nombre })

        // Combinar resultados
        ixr.forEach((item: any) => {
          const receta = recetaMap[item.recetaid]
          if (receta) {
            resultados.push({
              ingredienteid: item.elementoid,
              ingrediente: ingMap[item.elementoid] || "",
              recetaid: receta.id,
              receta: receta.nombre || "",
              costoreceta: receta.costo,
              cantidadreceta: receta.cantidad,
              hotelid: receta.hotelid,
              hotel: hotelMap[receta.hotelid] || "",
              cantidad: item.cantidad,
              ingredientecostoparcial: item.ingredientecostoparcial,
            })
          }
        })

        continue
      }

      if (data) {
        resultados.push(...data)
      }
    }

    return {
      success: true,
      data: resultados,
      message: `Se encontraron ${resultados.length} recetas afectadas`,
    }
  } catch (error: any) {
    console.error("[v0] Error en buscarRecetasAfectadas:", error)
    return {
      success: false,
      data: [],
      message: error.message || "Error al buscar recetas afectadas",
    }
  }
}

export async function obtenerSumaCostoParcial(pares: { recetaid: number; ingredienteid: number }[]) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )

    const resultados: Record<string, number> = {}

    for (const par of pares) {
      const key = `${par.recetaid}_${par.ingredienteid}`
      if (resultados[key] !== undefined) continue

      const { data, error } = await supabase
        .from("ingredientesxreceta")
        .select("ingredientecostoparcial")
        .eq("recetaid", par.recetaid)
        .neq("elementoid", par.ingredienteid)

      if (error) {
        console.error(`Error sumando costoparcial para receta ${par.recetaid}:`, error.message)
        resultados[key] = 0
        continue
      }

      const suma = (data || []).reduce((acc: number, row: any) => {
        const val = parseFloat(String(row.ingredientecostoparcial ?? "0"))
        return acc + (isNaN(val) ? 0 : val)
      }, 0)

      resultados[key] = suma
    }

    return { success: true, data: resultados }
  } catch (error: any) {
    console.error("[v0] Error en obtenerSumaCostoParcial:", error)
    return { success: false, data: {}, message: error.message }
  }
}

export async function limpiarCargaIngredientes() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en server actions
            }
          },
        },
      }
    )

    const { error } = await supabase
      .from("cargaingredientes")
      .delete()
      .gt("id", 0)

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      message: "Datos eliminados correctamente",
    }
  } catch (error: any) {
    console.error("[v0] Error en limpiarCargaIngredientes:", error)
    return {
      success: false,
      message: error.message || "Error al eliminar los datos",
    }
  }
}

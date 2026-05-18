"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { registrarBitacora } from "@/app/actions/bitacora-actions"
import { BITACORA_ACTIVIDADES, BITACORA_MODULOS } from "@/lib/bitacora-actividades"

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
      return { success: true, data: [], notFound: [...datos], message: "No se encontraron hoteles en los datos" }
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
      return { success: true, data: [], notFound: [...datos], message: "No se encontraron hoteles con esos acrónimos" }
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
      // Prioridad: "codigo" (donde está el rapsodia) > "codigorapsodia" > "codigosecundario" (corto)
      const codigo = getColumnValue(fila, "codigo", "codigorapsodia", "codigosecundario")
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
    //    Los códigos del Excel son códigos Rapsodia largos que matchean ingredientes.codigorapsodia
    //    Lotes de 200 para no exceder el límite de 16KB en headers HTTP
    const ingredientesEncontrados: any[] = []
    const BATCH_SIZE = 200

    for (const busqueda of busquedas) {
      console.log(`[DEBUG] Buscando en ingredientes: hotelid=${busqueda.hotelid}, codigos (${busqueda.codigos.length}):`, busqueda.codigos.slice(0, 5))

      for (let i = 0; i < busqueda.codigos.length; i += BATCH_SIZE) {
        const lote = busqueda.codigos.slice(i, i + BATCH_SIZE)

        const { data: ingredientes, error: errorIng } = await supabase
          .from("ingredientes")
          .select("*")
          .eq("hotelid", busqueda.hotelid)
          .in("codigorapsodia", lote)

        console.log(`[DEBUG] Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${ingredientes?.length || 0} ingredientes encontrados (codigos ${i + 1}-${i + lote.length}), error:`, errorIng)

        if (errorIng) {
          throw new Error(`Error al buscar ingredientes: ${errorIng.message}`)
        }

        if (ingredientes) {
          ingredientesEncontrados.push(...ingredientes)
        }
      }
    }

    console.log(`[DEBUG] Total ingredientes encontrados: ${ingredientesEncontrados.length}`)

    // Construir set de keys encontradas (hotelid|codigorapsodia) para detectar
    // qué filas de input no tienen contraparte en `ingredientes`. Estos son
    // potenciales nuevos insumos que el usuario podrá revisar aparte.
    const matchedKeys = new Set<string>()
    ingredientesEncontrados.forEach((ing: any) => {
      if (ing.hotelid && ing.codigorapsodia) {
        matchedKeys.add(`${ing.hotelid}|${String(ing.codigorapsodia).trim()}`)
      }
    })

    const notFound: any[] = []
    datos.forEach((fila: any) => {
      const hotel = getColumnValue(fila, "hotel")
      const codigo = getColumnValue(fila, "codigo", "codigorapsodia", "codigosecundario")
      const hotelid = mapaHoteles[hotel]
      if (!hotelid || !codigo) {
        // Sin hotel resuelto o sin codigo: lo marcamos como no-encontrado
        // (no pudo siquiera intentar el match).
        notFound.push({ ...fila, _hotelid: hotelid ?? null })
        return
      }
      const key = `${hotelid}|${codigo}`
      if (!matchedKeys.has(key)) {
        notFound.push({ ...fila, _hotelid: hotelid })
      }
    })

    console.log(`[DEBUG] Total no-encontrados: ${notFound.length}`)

    return {
      success: true,
      data: ingredientesEncontrados,
      notFound,
      message: `Se encontraron ${ingredientesEncontrados.length} ingredientes existentes${notFound.length > 0 ? ` y ${notFound.length} no encontrados` : ""}`,
    }
  } catch (error: any) {
    console.error("[v0] Error en buscarIngredientesExistentes:", error)
    return {
      success: false,
      data: [],
      notFound: [],
      message: error.message || "Error al buscar ingredientes existentes",
    }
  }
}

export async function buscarRecetasAfectadas(ingredienteIds: number[], hotelIdsFiltro: number[] = []) {
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

    console.log(`[DEBUG-RECETAS] inicio: ${ingredienteIds.length} ingrediente(s) con cambio, hotelIdsFiltro=${JSON.stringify(hotelIdsFiltro)}`)

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

        // Obtener recetas únicas (filtradas por hotel cuando aplica)
        const recetaIds = [...new Set(ixr.map((r: any) => r.recetaid))]
        console.log(`[DEBUG-RECETAS] batch: ixr=${ixr.length} filas, recetaIds únicos=${recetaIds.length}`)

        let recetasQuery = supabase
          .from("recetas")
          .select("id, nombre, costo, cantidad, hotelid")
          .in("id", recetaIds)
        if (hotelIdsFiltro.length > 0) {
          recetasQuery = recetasQuery.in("hotelid", hotelIdsFiltro)
        }
        const { data: recetas, error: recError } = await recetasQuery

        if (recError) {
          throw new Error(`Error buscando recetas: ${recError.message}`)
        }

        console.log(`[DEBUG-RECETAS] batch: recetas tras filtro hotel=${(recetas || []).length} (de ${recetaIds.length} candidatas)`)
        if ((recetas || []).length < recetaIds.length) {
          // Mostrar cuáles fueron excluidas para entender si es por hotel
          const incluidas = new Set((recetas || []).map((r: any) => r.id))
          const excluidas = recetaIds.filter(id => !incluidas.has(id))
          console.log(`[DEBUG-RECETAS] excluidas (${excluidas.length}):`, excluidas.slice(0, 20))
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

    // Modelo BD: tabla `recetas` = subrecetas (componentes), tabla `platillos` = recetas top-level.
    // Por tanto TODAS las entradas de `resultados` (que vienen de `recetas`) son subrecetas.
    resultados.forEach((r: any) => {
      r.essubreceta = true
    })

    // Subrecetas afectadas = todas las recetas del resultado (todas son subrecetas)
    const subrecetasAfectadas = [...new Set(resultados.map((r: any) => r.recetaid).filter(Boolean))]
    const cascading: any[] = []
    if (subrecetasAfectadas.length > 0) {
      const BATCH = 200
      const parentLinks: any[] = []
      for (let i = 0; i < subrecetasAfectadas.length; i += BATCH) {
        const lote = subrecetasAfectadas.slice(i, i + BATCH)
        const { data: links, error: linkErr } = await supabase
          .from("ingredientesxreceta")
          .select("recetaid, elementoid, cantidad, ingredientecostoparcial")
          .in("elementoid", lote)
          .eq("tiposegmentoid", 2)
        if (linkErr) {
          console.error("[DEBUG] Error buscando links cascade:", linkErr)
          continue
        }
        if (links) parentLinks.push(...links)
      }

      if (parentLinks.length > 0) {
        const parentRecetaIds = [...new Set(parentLinks.map((p: any) => p.recetaid))]
        const subIds = [...new Set(parentLinks.map((p: any) => p.elementoid))]

        // Padres filtrados por hotel cuando aplica (las subrecetas ya quedan acotadas
        // porque solo se buscan a partir de las afectadas, que ya pasaron el filtro)
        let parentRecetasQuery = supabase
          .from("recetas")
          .select("id, nombre, costo, cantidad, hotelid")
          .in("id", parentRecetaIds)
        if (hotelIdsFiltro.length > 0) {
          parentRecetasQuery = parentRecetasQuery.in("hotelid", hotelIdsFiltro)
        }
        const [parentRecetasRes, subrecetasRes] = await Promise.all([
          parentRecetasQuery,
          supabase.from("recetas").select("id, nombre, costo, cantidad").in("id", subIds),
        ])
        const parentRecetas = parentRecetasRes.data || []
        const subrecetasInfo = subrecetasRes.data || []

        const hotelIdsParent = [...new Set(parentRecetas.map((r: any) => r.hotelid).filter(Boolean))]
        const { data: hotelesParent } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .in("id", hotelIdsParent)

        const parentMap: Record<number, any> = {}
        parentRecetas.forEach((r: any) => { parentMap[r.id] = r })
        const subMap: Record<number, any> = {}
        subrecetasInfo.forEach((s: any) => { subMap[s.id] = s })
        const hotelMapParent: Record<number, string> = {}
        ;(hotelesParent || []).forEach((h: any) => { hotelMapParent[h.id] = h.nombre })

        // Los padres del cascade vía ingredientesxreceta segmentoid=2 también son
        // entradas de la tabla `recetas` → siempre son subrecetas.

        parentLinks.forEach((link: any) => {
          const padre = parentMap[link.recetaid]
          const sub = subMap[link.elementoid]
          if (padre && sub) {
            cascading.push({
              recetaid: padre.id,
              receta: padre.nombre,
              costoreceta: padre.costo,
              hotelid: padre.hotelid,
              hotel: hotelMapParent[padre.hotelid] || "",
              padreEsSubreceta: true,
              // info de la subreceta causante
              subrecetaid: sub.id,
              subreceta: sub.nombre,
              subrecetacostoActual: sub.costo,
              subrecetaBaseCantidad: sub.cantidad,
              // info del link en la receta padre
              cantidadEnPadre: link.cantidad,
              costoparcialActualEnPadre: link.ingredientecostoparcial,
            })
          }
        })
      }
    }

    // CASCADE PLATILLOS: platillos que usan subrecetas afectadas (vía recetasxplatillo)
    const cascadingPlatillos: any[] = []
    if (subrecetasAfectadas.length > 0) {
      const BATCH = 200
      const platLinks: any[] = []
      for (let i = 0; i < subrecetasAfectadas.length; i += BATCH) {
        const lote = subrecetasAfectadas.slice(i, i + BATCH)
        const { data: links, error: linkErr } = await supabase
          .from("recetasxplatillo")
          .select("platilloid, recetaid, cantidad, recetacostoparcial")
          .in("recetaid", lote)
        if (linkErr) {
          console.error("[DEBUG] Error buscando recetasxplatillo cascade:", linkErr)
          continue
        }
        if (links) platLinks.push(...links)
      }

      if (platLinks.length > 0) {
        const platilloIds = [...new Set(platLinks.map((p: any) => p.platilloid))]
        const subIdsP = [...new Set(platLinks.map((p: any) => p.recetaid))]

        let platillosQuery = supabase
          .from("platillos")
          .select("id, nombre, costototal, hotelid")
          .in("id", platilloIds)
        if (hotelIdsFiltro.length > 0) {
          platillosQuery = platillosQuery.in("hotelid", hotelIdsFiltro)
        }
        const [platillosRes, subrecetasResP] = await Promise.all([
          platillosQuery,
          supabase.from("recetas").select("id, nombre, costo, cantidad").in("id", subIdsP),
        ])
        const platillos = platillosRes.data || []
        const subrecetasInfoP = subrecetasResP.data || []

        const hotelIdsPlat = [...new Set(platillos.map((p: any) => p.hotelid).filter(Boolean))]
        const { data: hotelesPlat } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .in("id", hotelIdsPlat)

        const platMap: Record<number, any> = {}
        platillos.forEach((p: any) => { platMap[p.id] = p })
        const subMapPlat: Record<number, any> = {}
        subrecetasInfoP.forEach((s: any) => { subMapPlat[s.id] = s })
        const hotelMapPlat: Record<number, string> = {}
        ;(hotelesPlat || []).forEach((h: any) => { hotelMapPlat[h.id] = h.nombre })

        platLinks.forEach((link: any) => {
          const plat = platMap[link.platilloid]
          const sub = subMapPlat[link.recetaid]
          if (plat && sub) {
            cascadingPlatillos.push({
              platilloid: plat.id,
              platillo: plat.nombre,
              costototal: plat.costototal,
              hotelid: plat.hotelid,
              hotel: hotelMapPlat[plat.hotelid] || "",
              subrecetaid: sub.id,
              subreceta: sub.nombre,
              subrecetacostoActual: sub.costo,
              subrecetaBaseCantidad: sub.cantidad,
              cantidadEnPlatillo: link.cantidad,
              costoparcialActualEnPlatillo: link.recetacostoparcial,
            })
          }
        })
      }
    }

    // DIRECT: ingredientes directamente en platillos (vía ingredientesxplatillo)
    const directPlatillos: any[] = []
    {
      const BATCH = 50
      const ixp: any[] = []
      for (let i = 0; i < ingredienteIds.length; i += BATCH) {
        const lote = ingredienteIds.slice(i, i + BATCH)
        const { data: ixpRows, error: ixpErr } = await supabase
          .from("ingredientesxplatillo")
          .select("platilloid, ingredienteid, cantidad, ingredientecostoparcial")
          .in("ingredienteid", lote)
        if (ixpErr) {
          console.error("[DEBUG] Error buscando ingredientesxplatillo:", ixpErr)
          continue
        }
        if (ixpRows) ixp.push(...ixpRows)
      }

      if (ixp.length > 0) {
        const platilloIdsDirect = [...new Set(ixp.map((r: any) => r.platilloid))]
        const ingIdsDirect = [...new Set(ixp.map((r: any) => r.ingredienteid))]

        let platDirectQuery = supabase
          .from("platillos")
          .select("id, nombre, costototal, hotelid")
          .in("id", platilloIdsDirect)
        if (hotelIdsFiltro.length > 0) {
          platDirectQuery = platDirectQuery.in("hotelid", hotelIdsFiltro)
        }

        const [platDirectRes, ingDirectRes] = await Promise.all([
          platDirectQuery,
          supabase.from("ingredientes").select("id, nombre").in("id", ingIdsDirect),
        ])
        const platsDirect = platDirectRes.data || []
        const ingsDirect = ingDirectRes.data || []

        const hotelIdsDirect = [...new Set(platsDirect.map((p: any) => p.hotelid).filter(Boolean))]
        const { data: hotelesDirect } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .in("id", hotelIdsDirect)

        const platMapDirect: Record<number, any> = {}
        platsDirect.forEach((p: any) => { platMapDirect[p.id] = p })
        const ingMapDirect: Record<number, string> = {}
        ingsDirect.forEach((i: any) => { ingMapDirect[i.id] = i.nombre })
        const hotelMapDirect: Record<number, string> = {}
        ;(hotelesDirect || []).forEach((h: any) => { hotelMapDirect[h.id] = h.nombre })

        ixp.forEach((item: any) => {
          const plat = platMapDirect[item.platilloid]
          if (plat) {
            directPlatillos.push({
              platilloid: plat.id,
              platillo: plat.nombre,
              costototal: plat.costototal,
              hotelid: plat.hotelid,
              hotel: hotelMapDirect[plat.hotelid] || "",
              ingredienteid: item.ingredienteid,
              ingrediente: ingMapDirect[item.ingredienteid] || "",
              cantidad: item.cantidad,
              ingredientecostoparcial: item.ingredientecostoparcial,
            })
          }
        })
      }
    }

    // Enriquecer cascadingPlatillos + directPlatillos con precioventa desde
    // platillosxmenu (primer match por platilloid). Misma logica que en
    // respaldarHistoricoRecetas: costoporcentual = (costo / precioventa) * 100.
    // Se hace UNA sola query con todos los platilloIds unicos para reducir RTT.
    const todosPlatilloIds = Array.from(new Set([
      ...cascadingPlatillos.map((c: any) => c.platilloid),
      ...directPlatillos.map((d: any) => d.platilloid),
    ].filter((id: any) => id != null)))
    const precioventaMap: Record<number, number> = {}
    if (todosPlatilloIds.length > 0) {
      const { data: pxmRows, error: pxmErr } = await supabase
        .from("platillosxmenu")
        .select("platilloid, precioventa")
        .in("platilloid", todosPlatilloIds)
      if (pxmErr) {
        console.error("[DEBUG] Error buscando precioventa en platillosxmenu:", pxmErr)
      } else if (pxmRows) {
        for (const row of pxmRows as any[]) {
          if (precioventaMap[row.platilloid] === undefined && row.precioventa != null) {
            precioventaMap[row.platilloid] = Number(row.precioventa)
          }
        }
      }
    }
    cascadingPlatillos.forEach((c: any) => { c.precioventa = precioventaMap[c.platilloid] ?? null })
    directPlatillos.forEach((d: any) => { d.precioventa = precioventaMap[d.platilloid] ?? null })

    const recetasUnicas = new Set(resultados.map((r: any) => r.recetaid)).size
    const subrecetasCount = resultados.filter((r: any) => r.essubreceta).length
    const platillosUnicos = new Set(cascadingPlatillos.map((c: any) => c.platilloid)).size
    const platillosDirectosUnicos = new Set(directPlatillos.map((c: any) => c.platilloid)).size
    console.log(`[DEBUG-RECETAS] FINAL: filas=${resultados.length}, recetas únicas=${recetasUnicas}, marcadas como subreceta=${subrecetasCount}, cascading_recetas=${cascading.length}, cascading_platillos=${cascadingPlatillos.length} (platillos únicos=${platillosUnicos}), direct_platillos=${directPlatillos.length} (platillos únicos=${platillosDirectosUnicos}), precioventa_resuelto=${Object.keys(precioventaMap).length}/${todosPlatilloIds.length}`)

    return {
      success: true,
      data: resultados,
      cascading,
      cascadingPlatillos,
      directPlatillos,
      message: `Se encontraron ${resultados.length} ingredientes-en-subrecetas, ${cascading.length} cascadas a recetas, ${platillosUnicos} platillos vía cascade, ${platillosDirectosUnicos} platillos directos`,
    }
  } catch (error: any) {
    console.error("[v0] Error en buscarRecetasAfectadas:", error)
    return {
      success: false,
      data: [],
      cascading: [],
      cascadingPlatillos: [],
      directPlatillos: [],
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

export async function obtenerHotelesActivos() {
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

    const { data, error } = await supabase
      .from("hoteles")
      .select("id, acronimo, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) throw new Error(error.message)
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Error en obtenerHotelesActivos:", error)
    return { success: false, data: [], message: error.message || "Error obteniendo hoteles" }
  }
}

export async function obtenerExcelCargaNuevoPorHotel(hotelid: number) {
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

    // Resolver acrónimo
    const { data: hotelRow, error: hotelErr } = await supabase
      .from("hoteles")
      .select("acronimo")
      .eq("id", hotelid)
      .single()
    if (hotelErr || !hotelRow) {
      return { success: false, data: [], message: "Hotel no encontrado" }
    }

    const { data, error } = await supabase
      .from("excel_carga_nuevo")
      .select("*")
      .eq("hotel", hotelRow.acronimo)
      .eq("activo", true)
      .order("id", { ascending: true })

    if (error) throw new Error(error.message)
    console.log(`[DEBUG-HOTEL] Fetch por hotel ${hotelRow.acronimo}: ${(data || []).length} registros`)
    return { success: true, data: data || [], message: `${(data || []).length} registros` }
  } catch (error: any) {
    console.error("[v0] Error en obtenerExcelCargaNuevoPorHotel:", error)
    return { success: false, data: [], message: error.message || "Error obteniendo registros" }
  }
}

export async function actualizarCostoUnitarioMasivo(
  updates: {
    hotelid: number;
    codigorapsodia: string;
    codigosecundario?: string | null;
    costounitario: number | null;
    conversion?: number | null;
    porcentajemerma?: number | null;
    cantidadproducto?: number | null;
    // Filtros opcionales — cuando se proveen, el UPDATE solo afecta la fila del
    // (year, mes) correspondiente. Sin estos, agarra la primera por id ascending
    // (comportamiento legacy: rompía si había múltiples cargas mes-a-mes).
    year?: number | null;
    mes?: number | null;
    // Cuando se provee, también se hace UPDATE en ingredientes.{costo,conversion,porcentajemerma,cantidadproducto}
    // filtrando por este id — usado por la edición inline en /importar/importaringredientes.
    ingredienteid?: number;
  }[]
) {
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

    if (!updates || updates.length === 0) {
      return { success: true, count: 0, message: "Sin actualizaciones" }
    }

    // Resolver acrónimos de hoteles en una sola query
    const hotelIds = [...new Set(updates.map((u) => u.hotelid).filter(Boolean))]
    if (hotelIds.length === 0) {
      return { success: false, count: 0, message: "No se proveyó hotelid" }
    }
    const { data: hoteles, error: hotelErr } = await supabase
      .from("hoteles")
      .select("id, acronimo")
      .in("id", hotelIds)
    if (hotelErr) throw new Error(hotelErr.message)

    const hotelMap: Record<number, string> = {}
    ;(hoteles || []).forEach((h: any) => { hotelMap[h.id] = h.acronimo })

    // Agrupar por (hotelid, codigorapsodia, year, mes) — si un mismo codigorapsodia trae
    // múltiples codigosecundario distintos (ingredientes con misma rapsodia pero codigo
    // distinto en BD), se hará 1 UPDATE para el primero y N-1 INSERTs clonando la fila
    // original. El year/mes en la key evita que un update aplique a la fila incorrecta
    // cuando hay múltiples cargas mes-a-mes para el mismo (hotel, codigo).
    const grupos = new Map<string, typeof updates>()
    updates.forEach((u) => {
      if (!u.codigorapsodia) return
      const yearPart = u.year ?? ""
      const mesPart = u.mes ?? ""
      const key = `${u.hotelid}|${u.codigorapsodia}|${yearPart}|${mesPart}`
      if (!grupos.has(key)) grupos.set(key, [])
      grupos.get(key)!.push(u)
    })

    // Procesar grupos en lotes paralelos
    const BATCH = 20
    let totalUpdated = 0
    let totalInserted = 0
    let errores = 0
    const insertedRows: any[] = []
    const grupoEntries = [...grupos.entries()]

    for (let i = 0; i < grupoEntries.length; i += BATCH) {
      const lote = grupoEntries.slice(i, i + BATCH)
      const promises = lote.map(async ([key, ups]) => {
        const [hotelidStr, codigorapsodia, yearStr, mesStr] = key.split("|")
        const acronimo = hotelMap[Number(hotelidStr)]
        if (!acronimo) return { updated: 0, inserted: 0, errors: 0, newRows: [] as any[] }

        // Obtener la fila original — filtrando por year/mes cuando vienen, para que el
        // update solo afecte la carga del mes correcto.
        let selectQuery = supabase
          .from("excel_carga_nuevo")
          .select("*")
          .eq("hotel", acronimo)
          .eq("codigo", codigorapsodia)
        if (yearStr !== "") selectQuery = selectQuery.eq("year", Number(yearStr))
        if (mesStr !== "") selectQuery = selectQuery.eq("mes", Number(mesStr))
        const { data: originals, error: selErr } = await selectQuery
          .order("id", { ascending: true })
          .limit(1)

        if (selErr) {
          console.error(`[DEBUG] Error fetching ${acronimo}/${codigorapsodia} y=${yearStr} m=${mesStr}:`, selErr.message)
          return { updated: 0, inserted: 0, errors: 1, newRows: [] }
        }
        if (!originals || originals.length === 0) {
          return { updated: 0, inserted: 0, errors: 0, newRows: [] }
        }

        const original = originals[0]

        // First update: la fila existente se actualiza con el primer codigosecundario
        const first = ups[0]
        const updateObj: Record<string, any> = { costounitario: first.costounitario }
        if (first.codigosecundario !== undefined) updateObj.codigosecundario = first.codigosecundario
        if (first.conversion !== undefined) updateObj.conversion = first.conversion
        if (first.porcentajemerma !== undefined) updateObj.porcentajemerma = first.porcentajemerma
        if (first.cantidadproducto !== undefined) updateObj.cantidadproducto = first.cantidadproducto
        const { error: updErr, count: updCount } = await supabase
          .from("excel_carga_nuevo")
          .update(updateObj, { count: "exact" })
          .eq("id", original.id)
        if (updErr) {
          console.error(`[DEBUG] Error update id=${original.id}:`, updErr.message)
          return { updated: 0, inserted: 0, errors: 1, newRows: [] }
        }
        const updatedC = updCount ?? 0

        // Adicionales: INSERT clones para los codigosecundario extra
        let insertedC = 0
        let newRowsLocal: any[] = []
        if (ups.length > 1) {
          const clones = ups.slice(1).map((u) => {
            const { id: _omitId, ...rest } = original
            const clone: Record<string, any> = {
              ...rest,
              codigosecundario: u.codigosecundario,
              costounitario: u.costounitario,
            }
            if (u.conversion !== undefined) clone.conversion = u.conversion
            if (u.porcentajemerma !== undefined) clone.porcentajemerma = u.porcentajemerma
            if (u.cantidadproducto !== undefined) clone.cantidadproducto = u.cantidadproducto
            return clone
          })
          const { data: ins, error: insErr } = await supabase
            .from("excel_carga_nuevo")
            .insert(clones)
            .select()
          if (insErr) {
            console.error(`[DEBUG] Error clone ${acronimo}/${codigorapsodia}:`, insErr.message)
            return { updated: updatedC, inserted: 0, errors: 1, newRows: [] }
          }
          insertedC = ins?.length ?? 0
          newRowsLocal = ins ?? []
          console.log(`[DEBUG-DUPLICADOS] ${acronimo}/${codigorapsodia}: ${insertedC} clon(es) insertados con codigosecundarios:`, ups.slice(1).map((u) => u.codigosecundario))
        }

        return { updated: updatedC, inserted: insertedC, errors: 0, newRows: newRowsLocal }
      })

      const results = await Promise.all(promises)
      results.forEach((r) => {
        totalUpdated += r.updated
        totalInserted += r.inserted
        errores += r.errors
        if (r.newRows.length > 0) insertedRows.push(...r.newRows)
      })
    }

    // Sincronizar también la tabla `ingredientes` para las filas que traen ingredienteid.
    // Mapea: costo ← costounitario, conversion ← conversion, porcentajemerma ← porcentajemerma.
    let ingActualizados = 0
    let ingErrores = 0
    const ingUpdates = updates.filter((u) => Number.isFinite(u.ingredienteid) && (u.ingredienteid as number) > 0)
    if (ingUpdates.length > 0) {
      const fechaHoy = new Date().toISOString().split("T")[0]
      const ING_BATCH = 20
      for (let i = 0; i < ingUpdates.length; i += ING_BATCH) {
        const lote = ingUpdates.slice(i, i + ING_BATCH)
        const promises = lote.map(async (u) => {
          const updateObj: Record<string, any> = { fechamodificacion: fechaHoy }
          if (u.costounitario !== null && u.costounitario !== undefined) updateObj.costo = u.costounitario
          if (u.conversion !== undefined) updateObj.conversion = u.conversion
          if (u.porcentajemerma !== undefined) updateObj.porcentajemerma = u.porcentajemerma
          if (u.cantidadproducto !== undefined) updateObj.cantidadproducto = u.cantidadproducto
          if (Object.keys(updateObj).length <= 1) return { ok: true } // solo fechamodificacion → no hay nada útil que actualizar

          const { error } = await supabase
            .from("ingredientes")
            .update(updateObj)
            .eq("id", u.ingredienteid as number)
          if (error) {
            console.error(`[DEBUG] Error update ingrediente id=${u.ingredienteid}:`, error.message)
            return { ok: false }
          }
          return { ok: true }
        })
        const results = await Promise.all(promises)
        results.forEach((r) => {
          if (r.ok) ingActualizados++
          else ingErrores++
        })
      }
    }

    console.log(`[DEBUG-COSTOUNITARIO] Updates: ${updates.length} solicitados, ${grupos.size} grupos, ${totalUpdated} actualizados, ${totalInserted} clonados, ${errores} errores | ingredientes: ${ingActualizados}/${ingUpdates.length} ok, ${ingErrores} errores`)
    return {
      success: true,
      count: totalUpdated,
      inserted: totalInserted,
      insertedRows,
      errores,
      ingActualizados,
      ingErrores,
      message: `${totalUpdated} actualizado(s)${totalInserted > 0 ? `, ${totalInserted} clonado(s) por duplicidad de codigosecundario` : ""}${errores > 0 ? ` (${errores} errores)` : ""}${ingActualizados > 0 ? ` | ingredientes: ${ingActualizados}` : ""}`,
    }
  } catch (error: any) {
    console.error("[v0] Error en actualizarCostoUnitarioMasivo:", error)
    return { success: false, count: 0, inserted: 0, insertedRows: [] as any[], errores: 0, message: error.message || "Error actualizando costounitario" }
  }
}

export async function eliminarExcelCargaNuevoById(id: number) {
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

    const { error, count } = await supabase
      .from("excel_carga_nuevo")
      .delete({ count: "exact" })
      .eq("id", id)

    if (error) throw new Error(error.message)
    return { success: true, count: count ?? 0, message: `${count ?? 0} registro(s) eliminado(s)` }
  } catch (error: any) {
    console.error("[v0] Error eliminarExcelCargaNuevoById:", error)
    return { success: false, count: 0, message: error.message || "Error eliminando registro" }
  }
}

export async function eliminarExcelCargaNuevoByIngrediente(hotelid: number, codigorapsodia: string) {
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

    // Resolver acrónimo del hotel a partir del hotelid del ingrediente
    const { data: hotelRow, error: hotelErr } = await supabase
      .from("hoteles")
      .select("acronimo")
      .eq("id", hotelid)
      .single()

    if (hotelErr || !hotelRow) {
      return { success: false, count: 0, message: "Hotel no encontrado" }
    }

    const { error, count } = await supabase
      .from("excel_carga_nuevo")
      .delete({ count: "exact" })
      .eq("hotel", hotelRow.acronimo)
      .eq("codigo", codigorapsodia)

    if (error) throw new Error(error.message)
    return {
      success: true,
      count: count ?? 0,
      message: `${count ?? 0} registro(s) eliminado(s) de excel_carga_nuevo (${hotelRow.acronimo} / ${codigorapsodia})`,
    }
  } catch (error: any) {
    console.error("[v0] Error eliminarExcelCargaNuevoByIngrediente:", error)
    return { success: false, count: 0, message: error.message || "Error eliminando registro" }
  }
}

export async function guardarExcelCargaNuevo(filas: any[]) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    if (!filas || filas.length === 0) {
      return { success: false, data: [], message: "No hay filas que cargar" }
    }

    // Helper: lookup case-insensitive con trim, acepta varios alias
    const get = (fila: any, ...names: string[]) => {
      for (const name of names) {
        const k = Object.keys(fila).find(
          (kk) => kk.toLowerCase().trim() === name.toLowerCase()
        )
        if (k && fila[k] !== undefined && fila[k] !== null && String(fila[k]).trim() !== "") {
          return fila[k]
        }
      }
      return null
    }
    const toStr = (v: any) => (v != null ? String(v).trim() : null)
    const toInt = (v: any) => {
      if (v == null) return null
      const n = Number.parseInt(String(v))
      return Number.isNaN(n) ? null : n
    }
    const toFloat = (v: any) => {
      if (v == null) return null
      const n = Number.parseFloat(String(v))
      return Number.isNaN(n) ? null : n
    }

    const fechaHoy = new Date().toISOString().slice(0, 10)
    const filasMapeadas = filas.map((fila) => ({
      codigo: toStr(get(fila, "codigo")),
      hotel: toStr(get(fila, "hotel")),
      // BD codigosecundario solo se llena si el Excel trae explícitamente esa columna
      // (sin fallback a "codigo"). El valor del Excel "codigo" se guarda solo en BD codigo.
      codigosecundario: toStr(get(fila, "codigosecundario", "codigorapsodia")),
      articulo: toStr(get(fila, "articulo")),
      categoria: toStr(get(fila, "categoria")),
      unidad: toStr(get(fila, "unidad")),
      year: toInt(get(fila, "year")),
      mes: toInt(get(fila, "mes")),
      cantidad: toFloat(get(fila, "cantidad")),
      precio: toFloat(get(fila, "precio")),
      unidadbase: toStr(get(fila, "unidadbase")),
      conversion: toFloat(get(fila, "conversion")),
      costounitario: toFloat(get(fila, "costounitario")),
      familia: toStr(get(fila, "familia")),
      porcentajemerma: toFloat(get(fila, "porcentajemerma", "merma")),
      subfamilia: toStr(get(fila, "subfamilia")),
      cantidadproducto: toInt(get(fila, "cantidadproducto")),
      fechacarga: fechaHoy,
      activo: true,
    }))

    // Detectar combinaciones únicas (hotel, year, mes) de la carga actual y eliminar
    // los registros previos que coincidan, antes de insertar los nuevos.
    const combosSet = new Set<string>()
    const combosUnicos: { hotel: string; year: number; mes: number }[] = []
    filasMapeadas.forEach((f) => {
      if (f.hotel && f.year != null && f.mes != null) {
        const k = `${f.hotel}|${f.year}|${f.mes}`
        if (!combosSet.has(k)) {
          combosSet.add(k)
          combosUnicos.push({ hotel: f.hotel, year: f.year, mes: f.mes })
        }
      }
    })

    let deletedCount = 0
    for (const combo of combosUnicos) {
      const { error: delErr, count } = await supabase
        .from("excel_carga_nuevo")
        .delete({ count: "exact" })
        .eq("hotel", combo.hotel)
        .eq("year", combo.year)
        .eq("mes", combo.mes)
      if (delErr) {
        console.error(`[DEBUG] Error eliminando combo ${combo.hotel}/${combo.year}/${combo.mes}:`, delErr)
        throw new Error(`Error eliminando datos previos: ${delErr.message}`)
      }
      const c = count ?? 0
      deletedCount += c
      console.log(`[DEBUG] Eliminados ${c} registros previos para hotel=${combo.hotel} year=${combo.year} mes=${combo.mes}`)
    }

    // Insert en lotes de 500 para evitar timeouts
    const BATCH = 500
    const inserted: any[] = []
    for (let i = 0; i < filasMapeadas.length; i += BATCH) {
      const lote = filasMapeadas.slice(i, i + BATCH)
      const { data, error } = await supabase
        .from("excel_carga_nuevo")
        .insert(lote)
        .select()
      if (error) {
        console.error(`[DEBUG] Error insertando lote ${i + 1}-${i + lote.length}:`, error)
        throw new Error(`Error al guardar en excel_carga_nuevo: ${error.message}`)
      }
      if (data) inserted.push(...data)
      console.log(`[DEBUG] Lote excel_carga_nuevo ${i + 1}-${i + lote.length}: ${data?.length || 0} insertados`)
    }

    // Hidratar conversion + porcentajemerma en excel_carga_nuevo desde ingredientes.
    // Match: excel_carga_nuevo.codigo = ingredientes.codigorapsodia (con hotel resuelto a hotelid).
    // Sobreescribe lo que vino del Excel (la fuente autoritativa son las recetas).
    let hidratados = 0
    try {
      const acronimosIns = [...new Set(inserted.map((r: any) => r.hotel).filter(Boolean))]
      if (acronimosIns.length > 0) {
        const { data: hotelesIns, error: hotErr } = await supabase
          .from("hoteles")
          .select("id, acronimo")
          .in("acronimo", acronimosIns)
        if (!hotErr && hotelesIns && hotelesIns.length > 0) {
          const acrToHotelid: Record<string, number> = {}
          hotelesIns.forEach((h: any) => { if (h.acronimo) acrToHotelid[String(h.acronimo).trim()] = h.id })

          // Agrupar codigos por hotelid para query batched a ingredientes
          const codigosPorHotelid: Record<number, Set<string>> = {}
          inserted.forEach((r: any) => {
            const hid = acrToHotelid[String(r.hotel ?? "").trim()]
            const cod = String(r.codigo ?? "").trim()
            if (hid && cod) {
              if (!codigosPorHotelid[hid]) codigosPorHotelid[hid] = new Set()
              codigosPorHotelid[hid].add(cod)
            }
          })

          // Lookup en ingredientes (key: hotelid|codigorapsodia → {conversion, porcentajemerma, cantidadproducto})
          const ingMap: Record<string, { conversion: number | null; porcentajemerma: number | null; cantidadproducto: number | null }> = {}
          const LOOKUP_BATCH = 200
          for (const [hidStr, codSet] of Object.entries(codigosPorHotelid)) {
            const hid = Number(hidStr)
            const codigos = [...codSet]
            for (let i = 0; i < codigos.length; i += LOOKUP_BATCH) {
              const lote = codigos.slice(i, i + LOOKUP_BATCH)
              const { data: ings, error: ingErr } = await supabase
                .from("ingredientes")
                .select("codigorapsodia, conversion, porcentajemerma, cantidadproducto")
                .eq("hotelid", hid)
                .in("codigorapsodia", lote)
              if (ingErr) {
                console.error(`[DEBUG] Error lookup ingredientes hotelid=${hid}:`, ingErr.message)
                continue
              }
              ;(ings || []).forEach((ing: any) => {
                const k = `${hid}|${String(ing.codigorapsodia ?? "").trim()}`
                ingMap[k] = {
                  conversion: ing.conversion ?? null,
                  porcentajemerma: ing.porcentajemerma ?? null,
                  cantidadproducto: ing.cantidadproducto ?? null,
                }
              })
            }
          }

          // UPDATE batched en excel_carga_nuevo por id con los valores de ingredientes
          const UPDATE_BATCH = 20
          for (let i = 0; i < inserted.length; i += UPDATE_BATCH) {
            const lote = inserted.slice(i, i + UPDATE_BATCH)
            const promises = lote.map(async (r: any) => {
              const hid = acrToHotelid[String(r.hotel ?? "").trim()]
              const cod = String(r.codigo ?? "").trim()
              if (!hid || !cod) return false
              const match = ingMap[`${hid}|${cod}`]
              if (!match) return false
              const { error } = await supabase
                .from("excel_carga_nuevo")
                .update({ conversion: match.conversion, porcentajemerma: match.porcentajemerma, cantidadproducto: match.cantidadproducto })
                .eq("id", r.id)
              if (error) {
                console.error(`[DEBUG] Error hidratando id=${r.id}:`, error.message)
                return false
              }
              // Reflejar el nuevo valor en el objeto inserted que devolvemos al cliente
              r.conversion = match.conversion
              r.porcentajemerma = match.porcentajemerma
              r.cantidadproducto = match.cantidadproducto
              return true
            })
            const res = await Promise.all(promises)
            hidratados += res.filter(Boolean).length
          }
          console.log(`[DEBUG] Hidratados conversion+porcentajemerma+cantidadproducto desde ingredientes: ${hidratados}/${inserted.length}`)
        }
      }
    } catch (hidErr: any) {
      console.error("[DEBUG] Hidratación conversion+porcentajemerma falló (no bloquea carga):", hidErr.message)
    }

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.IMPORTAR_INSUMOS_CARGA,
      observaciones:
        `Cargó archivo de costos a excel_carga_nuevo: ${inserted.length} registros guardados` +
        (deletedCount > 0 ? `, ${deletedCount} previos reemplazados.` : "."),
      modulo: BITACORA_MODULOS.IMPORTAR,
    })

    return {
      success: true,
      data: inserted,
      deletedCount,
      combosReemplazados: combosUnicos,
      message: deletedCount > 0
        ? `Se reemplazaron ${deletedCount} registros previos y se guardaron ${inserted.length} nuevos`
        : `Se guardaron ${inserted.length} registros en excel_carga_nuevo`,
    }
  } catch (error: any) {
    console.error("[v0] Error en guardarExcelCargaNuevo:", error)
    return {
      success: false,
      data: [],
      deletedCount: 0,
      combosReemplazados: [],
      message: error.message || "Error al guardar en excel_carga_nuevo",
    }
  }
}

export type ActualizarIngredientesResult = {
  success: boolean
  totalActualizados: number
  totalErrores: number
  error?: string
}

// Aplica UPDATEs en `ingredientes` con el costo/year/mes provenientes de la pestaña 2.
// Se invoca como segundo paso del flujo de "Actualizar nuevos costos" — solo si el
// snapshot a historicoingredientes terminó exitosamente.
export async function actualizarIngredientesDesdeConversion(
  rows: { id: number; costounitario: number | null; year: number | null; mes: number | null }[]
): Promise<ActualizarIngredientesResult> {
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

    const filtradas = rows.filter((r) => Number.isFinite(r.id) && r.id > 0)
    if (filtradas.length === 0) {
      return { success: true, totalActualizados: 0, totalErrores: 0 }
    }

    const BATCH = 20
    let totalActualizados = 0
    let totalErrores = 0
    const erroresMsg: string[] = []
    const ahoraDate = new Date().toISOString().slice(0, 10)

    for (let i = 0; i < filtradas.length; i += BATCH) {
      const lote = filtradas.slice(i, i + BATCH)
      const results = await Promise.all(lote.map(async (r) => {
        const updateObj: Record<string, any> = {}
        if (r.costounitario !== null && r.costounitario !== undefined) updateObj.costo = r.costounitario
        if (r.year !== null && r.year !== undefined) updateObj.year = r.year
        if (r.mes !== null && r.mes !== undefined) updateObj.mes = r.mes
        if (Object.keys(updateObj).length === 0) {
          return { ok: false, msg: `id=${r.id} sin campos` }
        }
        updateObj.fechamodificacion = ahoraDate
        const { error } = await supabase
          .from("ingredientes")
          .update(updateObj)
          .eq("id", r.id)
        if (error) return { ok: false, msg: `id=${r.id}: ${error.message}` }
        return { ok: true }
      }))

      results.forEach((res) => {
        if (res.ok) totalActualizados++
        else {
          totalErrores++
          if (res.msg && erroresMsg.length < 5) erroresMsg.push(res.msg)
        }
      })
    }

    if (totalActualizados > 0) {
      await registrarBitacora({
        actividad: BITACORA_ACTIVIDADES.IMPORTAR_INSUMOS_INGREDIENTES,
        observaciones: `Actualizó costos de ingredientes desde conversión: ${totalActualizados} actualizados${totalErrores > 0 ? `, ${totalErrores} fallidos.` : "."}`,
        modulo: BITACORA_MODULOS.IMPORTAR,
      })
    }

    return {
      success: totalErrores === 0,
      totalActualizados,
      totalErrores,
      error: totalErrores > 0 ? `${totalErrores} actualizaciones fallaron${erroresMsg.length ? ` — ${erroresMsg.join("; ")}` : ""}` : undefined,
    }
  } catch (error: any) {
    console.error("[v0] Error en actualizarIngredientesDesdeConversion:", error)
    return {
      success: false,
      totalActualizados: 0,
      totalErrores: rows.length,
      error: error.message || "Error inesperado al actualizar ingredientes",
    }
  }
}

export type ActualizarHistoricoResult = {
  success: boolean
  hotelesProcesados: number
  totalInsertados: number
  totalEliminados: number
  periodos: { hotelid: number; year: number; mes: number; count: number }[]
  error?: string
}

// Toma un snapshot de `ingredientes` para los hoteles dados y lo carga en
// `historicoingredientes` agrupado por (hotelid, year, mes).
// Si ya existen registros para esa combinación, se reemplazan.
export async function actualizarHistoricoIngredientes(hotelIds: number[]): Promise<ActualizarHistoricoResult> {
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

    const hotelesUnicos = [...new Set(hotelIds.filter((h) => Number.isFinite(h) && h > 0))]
    if (hotelesUnicos.length === 0) {
      return {
        success: false,
        hotelesProcesados: 0,
        totalInsertados: 0,
        totalEliminados: 0,
        periodos: [],
        error: "No se proporcionaron hoteles válidos.",
      }
    }

    let totalInsertados = 0
    let totalEliminados = 0
    const periodos: { hotelid: number; year: number; mes: number; count: number }[] = []

    for (const hotelid of hotelesUnicos) {
      // 1) Leer todos los ingredientes del hotel con year/mes definidos.
      const { data: ingredientes, error: ingErr } = await supabase
        .from("ingredientes")
        .select(
          "codigo, nombre, categoriaid, costo, unidadmedidaid, hotelid, codigorapsodia, cambio, activo, fechacreacion, fechamodificacion, conversion, porcentajemerma, year, mes"
        )
        .eq("hotelid", hotelid)
        .not("year", "is", null)
        .not("mes", "is", null)

      if (ingErr) {
        return {
          success: false,
          hotelesProcesados: 0,
          totalInsertados,
          totalEliminados,
          periodos,
          error: `Error leyendo ingredientes del hotel ${hotelid}: ${ingErr.message}`,
        }
      }

      if (!ingredientes || ingredientes.length === 0) continue

      // 2) Agrupar por (year, mes) para conocer los periodos a reemplazar.
      const periodosHotel = new Map<string, { year: number; mes: number; count: number }>()
      ingredientes.forEach((r: any) => {
        const k = `${r.year}-${r.mes}`
        const prev = periodosHotel.get(k)
        if (prev) prev.count += 1
        else periodosHotel.set(k, { year: Number(r.year), mes: Number(r.mes), count: 1 })
      })

      // 3) Borrar registros previos en historicoingredientes para cada (hotelid, year, mes).
      for (const { year, mes } of periodosHotel.values()) {
        const { count: delCount, error: delErr } = await supabase
          .from("historicoingredientes")
          .delete({ count: "exact" })
          .eq("hotelid", hotelid)
          .eq("year", year)
          .eq("mes", mes)
        if (delErr) {
          return {
            success: false,
            hotelesProcesados: 0,
            totalInsertados,
            totalEliminados,
            periodos,
            error: `Error borrando histórico para hotel ${hotelid} ${year}-${mes}: ${delErr.message}`,
          }
        }
        totalEliminados += delCount ?? 0
      }

      // 4) Insertar el snapshot fresco. Lotes de 500 para evitar payloads grandes.
      const BATCH = 500
      for (let i = 0; i < ingredientes.length; i += BATCH) {
        const lote = ingredientes.slice(i, i + BATCH)
        const { error: insErr, count: insCount } = await supabase
          .from("historicoingredientes")
          .insert(lote, { count: "exact" })
        if (insErr) {
          return {
            success: false,
            hotelesProcesados: 0,
            totalInsertados,
            totalEliminados,
            periodos,
            error: `Error insertando histórico (hotel ${hotelid}, lote ${i / BATCH + 1}): ${insErr.message}`,
          }
        }
        totalInsertados += insCount ?? lote.length
      }

      periodosHotel.forEach(({ year, mes, count }) => {
        periodos.push({ hotelid, year, mes, count })
      })
    }

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.IMPORTAR_INSUMOS_HISTORICO,
      observaciones: `Snapshot a historicoingredientes: ${hotelesUnicos.length} hotel(es), ${totalInsertados} insertados, ${totalEliminados} reemplazados.`,
      modulo: BITACORA_MODULOS.IMPORTAR,
    })

    return {
      success: true,
      hotelesProcesados: hotelesUnicos.length,
      totalInsertados,
      totalEliminados,
      periodos,
    }
  } catch (error: any) {
    console.error("[v0] Error en actualizarHistoricoIngredientes:", error)
    return {
      success: false,
      hotelesProcesados: 0,
      totalInsertados: 0,
      totalEliminados: 0,
      periodos: [],
      error: error.message || "Error inesperado al actualizar histórico",
    }
  }
}

export type RespaldarHistoricoResult = {
  success: boolean
  totalPlatillos: number
  totalRecetas: number
  totalRowsInsertados: number
  totalRowsEliminados: number
  saltados: number
  error?: string
}

// Backup en `historico` de la composición actual de cada platillo y subreceta del
// hotel (paso 3 del flujo "Actualizar nuevos costos"). Si ya existen filas para el
// mismo platilloid/recetaid en el mismo mes/año (basado en fechacreacion), se borran
// y se reinsertan con la información actual.
//   - fechacreacion del histórico = platillos.fechamodificacion (para platillos)
//                                 = recetas.fechamodificacion   (para subrecetas)
//   - Componentes: ingredientesxplatillo para platillos
//                  ingredientesxreceta WHERE tiposegmentoid=1 para subrecetas
export async function respaldarHistoricoRecetas(hotelIds: number[]): Promise<RespaldarHistoricoResult> {
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

    const hotelesUnicos = [...new Set(hotelIds.filter((h) => Number.isFinite(h) && h > 0))]
    if (hotelesUnicos.length === 0) {
      return {
        success: false,
        totalPlatillos: 0,
        totalRecetas: 0,
        totalRowsInsertados: 0,
        totalRowsEliminados: 0,
        saltados: 0,
        error: "No se proporcionaron hoteles válidos.",
      }
    }

    // Helpers para construir el rango [inicio_mes, inicio_siguiente_mes) usado en
    // los DELETE — Supabase JS no soporta EXTRACT en filtros, así que se filtra por rango.
    const monthRange = (fechaIso: string): { start: string; end: string; year: number; month: number } => {
      const d = new Date(fechaIso)
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      const start = `${y}-${String(m).padStart(2, "0")}-01`
      const end = m === 12
        ? `${y + 1}-01-01`
        : `${y}-${String(m + 1).padStart(2, "0")}-01`
      return { start, end, year: y, month: m }
    }

    let totalPlatillos = 0
    let totalRecetas = 0
    let totalRowsInsertados = 0
    let totalRowsEliminados = 0
    let saltados = 0

    for (const hotelid of hotelesUnicos) {
      // === PLATILLOS ===
      // Se trae también costototal porque se usa para calcular costoporcentual
      // como (costototal / precioventa) * 100 — misma fórmula que el resto del
      // sistema (analisis-costos-actions.ts, platillos-details-actions.ts, etc.).
      const { data: platillos, error: platErr } = await supabase
        .from("platillos")
        .select("id, fechamodificacion, fechacreacion, costototal")
        .eq("hotelid", hotelid)
        .eq("activo", true)
      if (platErr) throw new Error(`Error leyendo platillos: ${platErr.message}`)

      for (const p of platillos || []) {
        // Si fechamodificacion es null, se usa fechacreacion del propio platillo.
        const fechaMod = (p as any).fechamodificacion
        const fechaCre = (p as any).fechacreacion
        const fecha = fechaMod !== null && fechaMod !== undefined ? fechaMod : fechaCre
        if (!fecha) { saltados += 1; continue }

        const { data: comps, error: compErr } = await supabase
          .from("ingredientesxplatillo")
          .select("ingredienteid, cantidad, ingredientecostoparcial")
          .eq("platilloid", p.id)
        if (compErr) throw new Error(`Error leyendo ingredientesxplatillo (platillo ${p.id}): ${compErr.message}`)
        if (!comps || comps.length === 0) { saltados += 1; continue }

        // precioventa: lookup en platillosxmenu por platilloid. Si el platillo
        // está en varios menús se toma el primero (mismo criterio que
        // analisis-costos-actions.ts:471 → platillosxmenu[0]?.precioventa).
        // Si no hay registro, se deja null (el platillo no está vendiéndose en
        // ningún menú).
        const { data: pxmRows, error: pxmErr } = await supabase
          .from("platillosxmenu")
          .select("precioventa")
          .eq("platilloid", p.id)
          .limit(1)
        if (pxmErr) throw new Error(`Error leyendo platillosxmenu (platillo ${p.id}): ${pxmErr.message}`)

        const precioventa: number | null =
          pxmRows && pxmRows.length > 0 && pxmRows[0].precioventa != null
            ? Number(pxmRows[0].precioventa)
            : null
        const costototal = (p as any).costototal != null ? Number((p as any).costototal) : null
        // costoporcentual = (costototal / precioventa) * 100. Si falta cualquiera
        // de los dos, o precioventa = 0, se deja null para no insertar Infinity/NaN.
        const costoporcentual: number | null =
          precioventa != null && precioventa > 0 && costototal != null
            ? (costototal / precioventa) * 100
            : null

        const { start, end } = monthRange(String(fecha))

        const { count: delCount, error: delErr } = await supabase
          .from("historico")
          .delete({ count: "exact" })
          .eq("platilloid", p.id)
          .gte("fechacreacion", start)
          .lt("fechacreacion", end)
        if (delErr) throw new Error(`Error borrando histórico previo (platillo ${p.id}): ${delErr.message}`)
        totalRowsEliminados += delCount ?? 0

        const inserts = comps.map((c: any) => ({
          hotelid,
          restauranteid: null,
          menuid: null,
          platilloid: p.id,
          ingredienteid: c.ingredienteid,
          recetaid: null,
          cantidad: c.cantidad,
          costo: c.ingredientecostoparcial,
          activo: true,
          fechacreacion: fecha,
          precioventa,
          costoporcentual,
        }))

        const { error: insErr, count: insCount } = await supabase
          .from("historico")
          .insert(inserts, { count: "exact" })
        if (insErr) throw new Error(`Error insertando histórico (platillo ${p.id}): ${insErr.message}`)
        totalRowsInsertados += insCount ?? inserts.length
        totalPlatillos += 1
      }

      // === RECETAS (subrecetas) ===
      const { data: recetas, error: recErr } = await supabase
        .from("recetas")
        .select("id, fechamodificacion, fechacreacion")
        .eq("hotelid", hotelid)
        .eq("activo", true)
      if (recErr) throw new Error(`Error leyendo recetas: ${recErr.message}`)

      for (const r of recetas || []) {
        // Si fechamodificacion es null, se usa fechacreacion de la propia receta.
        const fechaMod = (r as any).fechamodificacion
        const fechaCre = (r as any).fechacreacion
        const fecha = fechaMod !== null && fechaMod !== undefined ? fechaMod : fechaCre
        if (!fecha) { saltados += 1; continue }

        const { data: comps, error: compErr } = await supabase
          .from("ingredientesxreceta")
          .select("elementoid, cantidad, ingredientecostoparcial")
          .eq("recetaid", r.id)
          .eq("tiposegmentoid", 1)
        if (compErr) throw new Error(`Error leyendo ingredientesxreceta (receta ${r.id}): ${compErr.message}`)
        if (!comps || comps.length === 0) { saltados += 1; continue }

        const { start, end } = monthRange(String(fecha))

        const { count: delCount, error: delErr } = await supabase
          .from("historico")
          .delete({ count: "exact" })
          .is("platilloid", null)
          .eq("recetaid", r.id)
          .gte("fechacreacion", start)
          .lt("fechacreacion", end)
        if (delErr) throw new Error(`Error borrando histórico previo (receta ${r.id}): ${delErr.message}`)
        totalRowsEliminados += delCount ?? 0

        const inserts = comps.map((c: any) => ({
          hotelid,
          restauranteid: null,
          menuid: null,
          platilloid: null,
          ingredienteid: c.elementoid,
          recetaid: r.id,
          cantidad: c.cantidad,
          costo: c.ingredientecostoparcial,
          activo: true,
          fechacreacion: fecha,
          precioventa: null,
          costoporcentual: null,
        }))

        const { error: insErr, count: insCount } = await supabase
          .from("historico")
          .insert(inserts, { count: "exact" })
        if (insErr) throw new Error(`Error insertando histórico (receta ${r.id}): ${insErr.message}`)
        totalRowsInsertados += insCount ?? inserts.length
        totalRecetas += 1
      }
    }

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.IMPORTAR_INSUMOS_RESPALDO,
      observaciones: `Respaldó histórico de recetas: ${totalPlatillos} platillo(s), ${totalRecetas} subreceta(s), ${totalRowsInsertados} filas insertadas en historico.`,
      modulo: BITACORA_MODULOS.IMPORTAR,
    })

    return {
      success: true,
      totalPlatillos,
      totalRecetas,
      totalRowsInsertados,
      totalRowsEliminados,
      saltados,
    }
  } catch (error: any) {
    console.error("[v0] Error en respaldarHistoricoRecetas:", error)
    return {
      success: false,
      totalPlatillos: 0,
      totalRecetas: 0,
      totalRowsInsertados: 0,
      totalRowsEliminados: 0,
      saltados: 0,
      error: error.message || "Error inesperado al respaldar histórico",
    }
  }
}

export type RegistrarInsumosResult = {
  success: boolean
  inserted: number
  errors: number
  errorMessages: string[]
  insertedIds: number[]
}

// Inserta nuevos insumos en `ingredientes`. Cada fila viene de la sub-pestaña
// "Nuevos / No encontrados" y debe traer hotelid resuelto, codigo (=codigosecundario
// del Excel), nombre (=articulo), codigorapsodia (=codigo del Excel), y los
// metadatos numéricos (costo/conversion/porcentajemerma/year/mes).
export async function registrarInsumosNuevos(
  filas: {
    hotelid: number
    codigo: string
    nombre: string
    codigorapsodia: string
    costo: number | null
    conversion: number | null
    porcentajemerma: number | null
    cantidadproducto: number | null
    year: number | null
    mes: number | null
  }[]
): Promise<RegistrarInsumosResult> {
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

    if (filas.length === 0) {
      return { success: true, inserted: 0, errors: 0, errorMessages: [], insertedIds: [] }
    }

    const ahora = new Date().toISOString().slice(0, 10)
    const payload = filas.map((f) => ({
      hotelid: f.hotelid,
      codigo: f.codigo,
      nombre: f.nombre,
      codigorapsodia: f.codigorapsodia,
      costo: f.costo,
      conversion: f.conversion,
      porcentajemerma: f.porcentajemerma,
      cantidadproducto: f.cantidadproducto,
      year: f.year,
      mes: f.mes,
      activo: true,
      fechacreacion: ahora,
      fechamodificacion: ahora,
    }))

    // Insert en lote único — si falla, devolvemos el error completo.
    const { data: inserted, error } = await supabase
      .from("ingredientes")
      .insert(payload)
      .select("id")

    if (error) {
      return {
        success: false,
        inserted: 0,
        errors: filas.length,
        errorMessages: [error.message],
        insertedIds: [],
      }
    }

    const insertedIds = (inserted || []).map((r: any) => r.id)

    if (insertedIds.length > 0) {
      await registrarBitacora({
        actividad: BITACORA_ACTIVIDADES.IMPORTAR_INSUMOS_REGISTRO,
        observaciones: `Registró ${insertedIds.length} insumo(s) nuevo(s) desde la pestaña de no encontrados.`,
        modulo: BITACORA_MODULOS.IMPORTAR,
      })
    }

    return {
      success: true,
      inserted: insertedIds.length,
      errors: 0,
      errorMessages: [],
      insertedIds,
    }
  } catch (error: any) {
    console.error("[v0] Error en registrarInsumosNuevos:", error)
    return {
      success: false,
      inserted: 0,
      errors: filas.length,
      errorMessages: [error?.message || "Error inesperado al registrar insumos"],
      insertedIds: [],
    }
  }
}

export type RecalcularCostosCascadaResult = {
  success: boolean
  ingredientesXRecetaUpdated: number
  ingredientesXPlatilloUpdated: number
  recetasUpdated: number
  recetasXPlatilloUpdated: number
  platillosUpdated: number
  saltados: number
  error?: string
}

// PASO 4: Recalcular costos en cascada después de actualizar ingredientes.costo.
// Estrategia: ratio (new = old * newCost/oldCost). Conserva el factor de conversión
// implícito en el costoparcial existente sin necesitar consultar tipounidadmedida.
// Cascada:
//   ingredientesxreceta (parciales) →
//   recetas.costo (suma de parciales) →
//   recetasxplatillo (parciales basados en nueva recetas.costo) →
//   ingredientesxplatillo (parciales directos) →
//   platillos.costototal (suma de ambas tablas).
// Limitación: sub-sub-recetas (ingredientesxreceta segmentoid=2) NO se cascadean
// hacia el cost padre — consistente con paso 3.
export async function recalcularCostosCascada(
  cambios: { ingredienteid: number; oldCosto: number; newCosto: number }[],
  hotelIds: number[]
): Promise<RecalcularCostosCascadaResult> {
  const baseResult: RecalcularCostosCascadaResult = {
    success: false,
    ingredientesXRecetaUpdated: 0,
    ingredientesXPlatilloUpdated: 0,
    recetasUpdated: 0,
    recetasXPlatilloUpdated: 0,
    platillosUpdated: 0,
    saltados: 0,
  }

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

    // Mapa ingredienteid -> nuevo costo unitario. Fórmula simple usada por
    // pestaña 3 y por recalcularCostosPlatillo: parcial = cantidad × costoUnit.
    const costoNuevoMap: Record<number, number> = {}
    let saltados = 0
    for (const c of cambios) {
      if (!Number.isFinite(c.newCosto)) {
        saltados++
        continue
      }
      costoNuevoMap[c.ingredienteid] = c.newCosto
    }

    const ingredienteIds = Object.keys(costoNuevoMap).map(Number)
    if (ingredienteIds.length === 0) {
      return { ...baseResult, success: true, saltados }
    }

    const ahora = new Date().toISOString()
    const ahoraDate = ahora.slice(0, 10)

    // ----- Paso 4.1: Actualizar ingredientesxreceta (segmentoid=1) -----
    // Solo rows cuya recetaid pertenezca a un hotel válido.
    let recetasValidasIds: number[] = []
    {
      let q = supabase.from("recetas").select("id").in("hotelid", hotelIds.length > 0 ? hotelIds : [-1])
      if (hotelIds.length === 0) q = supabase.from("recetas").select("id")
      const { data: rec, error: recErr } = await q
      if (recErr) return { ...baseResult, error: `Error leyendo recetas: ${recErr.message}` }
      recetasValidasIds = (rec || []).map((r: any) => r.id)
    }

    let ingredientesXRecetaUpdated = 0
    if (recetasValidasIds.length > 0) {
      const BATCH_IDS = 500
      const ixrAfectados: any[] = []
      for (let i = 0; i < ingredienteIds.length; i += 100) {
        const ingBatch = ingredienteIds.slice(i, i + 100)
        for (let j = 0; j < recetasValidasIds.length; j += BATCH_IDS) {
          const recBatch = recetasValidasIds.slice(j, j + BATCH_IDS)
          const { data, error } = await supabase
            .from("ingredientesxreceta")
            .select("id, recetaid, elementoid, cantidad, ingredientecostoparcial")
            .in("elementoid", ingBatch)
            .in("recetaid", recBatch)
            .eq("tiposegmentoid", 1)
          if (error) return { ...baseResult, error: `Error leyendo ingredientesxreceta: ${error.message}` }
          if (data) ixrAfectados.push(...data)
        }
      }

      // Actualizar en paralelo en lotes de 20.
      const PARALLEL = 20
      for (let i = 0; i < ixrAfectados.length; i += PARALLEL) {
        const lote = ixrAfectados.slice(i, i + PARALLEL)
        const updates = await Promise.all(lote.map(async (row: any) => {
          const costoUnit = costoNuevoMap[row.elementoid] ?? 0
          const cant = parseFloat(String(row.cantidad ?? "0")) || 0
          const nuevo = cant * costoUnit
          const { error } = await supabase
            .from("ingredientesxreceta")
            .update({ ingredientecostoparcial: nuevo, fechamodificacion: ahoraDate })
            .eq("id", row.id)
          return error ? 0 : 1
        }))
        ingredientesXRecetaUpdated += updates.reduce((s, n) => s + n, 0)
      }
    }

    // ----- Paso 4.2: Recalcular recetas.costo de subrecetas afectadas -----
    // Subrecetas afectadas = aquellas cuyo elementoid coincide con cambios + las
    // recetasValidasIds que tengan rows tocadas en 4.1.
    let recetasUpdated = 0
    const recetasAfectadasIds = new Set<number>()
    if (recetasValidasIds.length > 0) {
      // Obtener recetaids de ingredientesxreceta donde se aplicó cambio
      const BATCH_IDS = 500
      for (let j = 0; j < recetasValidasIds.length; j += BATCH_IDS) {
        const recBatch = recetasValidasIds.slice(j, j + BATCH_IDS)
        const { data, error } = await supabase
          .from("ingredientesxreceta")
          .select("recetaid")
          .in("elementoid", ingredienteIds)
          .in("recetaid", recBatch)
          .eq("tiposegmentoid", 1)
        if (error) return { ...baseResult, error: `Error releyendo ingredientesxreceta: ${error.message}` }
        ;(data || []).forEach((r: any) => recetasAfectadasIds.add(r.recetaid))
      }
    }

    // Para cada subreceta afectada, sumar TODAS sus parciales (segmentoid 1+2)
    // y actualizar recetas.costo.
    const recetasAfectadasArr = Array.from(recetasAfectadasIds)
    const newRecetasCostMap: Record<number, number> = {}
    if (recetasAfectadasArr.length > 0) {
      const BATCH = 100
      for (let i = 0; i < recetasAfectadasArr.length; i += BATCH) {
        const lote = recetasAfectadasArr.slice(i, i + BATCH)
        const { data, error } = await supabase
          .from("ingredientesxreceta")
          .select("recetaid, ingredientecostoparcial")
          .in("recetaid", lote)
        if (error) return { ...baseResult, error: `Error sumando parciales: ${error.message}` }
        ;(data || []).forEach((r: any) => {
          const v = parseFloat(String(r.ingredientecostoparcial ?? "0")) || 0
          newRecetasCostMap[r.recetaid] = (newRecetasCostMap[r.recetaid] ?? 0) + v
        })
      }

      const PARALLEL = 20
      const ids = Object.keys(newRecetasCostMap).map(Number)
      for (let i = 0; i < ids.length; i += PARALLEL) {
        const lote = ids.slice(i, i + PARALLEL)
        const updates = await Promise.all(lote.map(async (recId) => {
          const nuevoCosto = newRecetasCostMap[recId]
          const { error } = await supabase
            .from("recetas")
            .update({ costo: nuevoCosto, fechamodificacion: ahoraDate })
            .eq("id", recId)
          return error ? 0 : 1
        }))
        recetasUpdated += updates.reduce((s, n) => s + n, 0)
      }
    }

    // ----- Paso 4.3: Actualizar recetasxplatillo (parcial = costo/cant_base * cant_uso) -----
    let recetasXPlatilloUpdated = 0
    const platillosAfectadosIds = new Set<number>()
    if (recetasAfectadasArr.length > 0) {
      // Obtener cantidad base de cada subreceta
      const subrecetasInfo: Record<number, { costo: number; cantidad: number }> = {}
      const BATCH = 200
      for (let i = 0; i < recetasAfectadasArr.length; i += BATCH) {
        const lote = recetasAfectadasArr.slice(i, i + BATCH)
        const { data, error } = await supabase
          .from("recetas")
          .select("id, costo, cantidad")
          .in("id", lote)
        if (error) return { ...baseResult, error: `Error leyendo recetas: ${error.message}` }
        ;(data || []).forEach((r: any) => {
          subrecetasInfo[r.id] = {
            costo: parseFloat(String(r.costo ?? "0")) || 0,
            cantidad: parseFloat(String(r.cantidad ?? "1")) || 1,
          }
        })
      }

      // Buscar links recetasxplatillo de subrecetas afectadas, restringidos a hoteles válidos
      let platillosValidosIds: number[] = []
      {
        let q = supabase.from("platillos").select("id").in("hotelid", hotelIds.length > 0 ? hotelIds : [-1])
        if (hotelIds.length === 0) q = supabase.from("platillos").select("id")
        const { data, error } = await q
        if (error) return { ...baseResult, error: `Error leyendo platillos: ${error.message}` }
        platillosValidosIds = (data || []).map((p: any) => p.id)
      }

      const rxpAfectados: any[] = []
      if (platillosValidosIds.length > 0) {
        for (let i = 0; i < recetasAfectadasArr.length; i += 100) {
          const recBatch = recetasAfectadasArr.slice(i, i + 100)
          for (let j = 0; j < platillosValidosIds.length; j += 500) {
            const platBatch = platillosValidosIds.slice(j, j + 500)
            const { data, error } = await supabase
              .from("recetasxplatillo")
              .select("id, platilloid, recetaid, cantidad, recetacostoparcial")
              .in("recetaid", recBatch)
              .in("platilloid", platBatch)
            if (error) return { ...baseResult, error: `Error leyendo recetasxplatillo: ${error.message}` }
            if (data) rxpAfectados.push(...data)
          }
        }
      }

      const PARALLEL = 20
      for (let i = 0; i < rxpAfectados.length; i += PARALLEL) {
        const lote = rxpAfectados.slice(i, i + PARALLEL)
        const updates = await Promise.all(lote.map(async (row: any) => {
          const info = subrecetasInfo[row.recetaid]
          if (!info || info.cantidad === 0) return 0
          const cant = parseFloat(String(row.cantidad ?? "0")) || 0
          const nuevoParcial = (info.costo / info.cantidad) * cant
          platillosAfectadosIds.add(row.platilloid)
          const { error } = await supabase
            .from("recetasxplatillo")
            .update({ recetacostoparcial: nuevoParcial, fechamodificacion: ahoraDate })
            .eq("id", row.id)
          return error ? 0 : 1
        }))
        recetasXPlatilloUpdated += updates.reduce((s, n) => s + n, 0)
      }
    }

    // ----- Paso 4.4: Actualizar ingredientesxplatillo (ingredientes directos) -----
    let ingredientesXPlatilloUpdated = 0
    let platillosValidosIdsForDirect: number[] = []
    {
      let q = supabase.from("platillos").select("id").in("hotelid", hotelIds.length > 0 ? hotelIds : [-1])
      if (hotelIds.length === 0) q = supabase.from("platillos").select("id")
      const { data, error } = await q
      if (error) return { ...baseResult, error: `Error leyendo platillos directos: ${error.message}` }
      platillosValidosIdsForDirect = (data || []).map((p: any) => p.id)
    }

    if (platillosValidosIdsForDirect.length > 0) {
      const ixpAfectados: any[] = []
      for (let i = 0; i < ingredienteIds.length; i += 100) {
        const ingBatch = ingredienteIds.slice(i, i + 100)
        for (let j = 0; j < platillosValidosIdsForDirect.length; j += 500) {
          const platBatch = platillosValidosIdsForDirect.slice(j, j + 500)
          const { data, error } = await supabase
            .from("ingredientesxplatillo")
            .select("id, platilloid, ingredienteid, cantidad, ingredientecostoparcial")
            .in("ingredienteid", ingBatch)
            .in("platilloid", platBatch)
          if (error) return { ...baseResult, error: `Error leyendo ingredientesxplatillo: ${error.message}` }
          if (data) ixpAfectados.push(...data)
        }
      }

      const PARALLEL = 20
      for (let i = 0; i < ixpAfectados.length; i += PARALLEL) {
        const lote = ixpAfectados.slice(i, i + PARALLEL)
        const updates = await Promise.all(lote.map(async (row: any) => {
          const costoUnit = costoNuevoMap[row.ingredienteid] ?? 0
          const cant = parseFloat(String(row.cantidad ?? "0")) || 0
          const nuevo = cant * costoUnit
          platillosAfectadosIds.add(row.platilloid)
          const { error } = await supabase
            .from("ingredientesxplatillo")
            .update({ ingredientecostoparcial: nuevo, fechamodificacion: ahoraDate })
            .eq("id", row.id)
          return error ? 0 : 1
        }))
        ingredientesXPlatilloUpdated += updates.reduce((s, n) => s + n, 0)
      }
    }

    // ----- Paso 4.5: Recalcular platillos.costototal -----
    let platillosUpdated = 0
    const platillosAfectadosArr = Array.from(platillosAfectadosIds)
    if (platillosAfectadosArr.length > 0) {
      const newCostoTotalMap: Record<number, number> = {}
      const BATCH = 100
      for (let i = 0; i < platillosAfectadosArr.length; i += BATCH) {
        const lote = platillosAfectadosArr.slice(i, i + BATCH)
        const [ixpRes, rxpRes] = await Promise.all([
          supabase.from("ingredientesxplatillo").select("platilloid, ingredientecostoparcial").in("platilloid", lote),
          supabase.from("recetasxplatillo").select("platilloid, recetacostoparcial").in("platilloid", lote),
        ])
        if (ixpRes.error) return { ...baseResult, error: `Error sumando ingxplat: ${ixpRes.error.message}` }
        if (rxpRes.error) return { ...baseResult, error: `Error sumando rxplat: ${rxpRes.error.message}` }
        ;(ixpRes.data || []).forEach((r: any) => {
          const v = parseFloat(String(r.ingredientecostoparcial ?? "0")) || 0
          newCostoTotalMap[r.platilloid] = (newCostoTotalMap[r.platilloid] ?? 0) + v
        })
        ;(rxpRes.data || []).forEach((r: any) => {
          const v = parseFloat(String(r.recetacostoparcial ?? "0")) || 0
          newCostoTotalMap[r.platilloid] = (newCostoTotalMap[r.platilloid] ?? 0) + v
        })
      }

      // Paso 5: costoadministrativo = costototal * (1 + porcentajeAdmin).
      // Se aplica en el mismo UPDATE que costototal para garantizar consistencia
      // por fila (evita estado intermedio donde costototal y costoadministrativo
      // no concuerdan).
      const PORCENTAJE_ADMINISTRATIVO = 0.05
      const FACTOR_ADMIN = 1 + PORCENTAJE_ADMINISTRATIVO

      const PARALLEL = 20
      const ids = Object.keys(newCostoTotalMap).map(Number)
      for (let i = 0; i < ids.length; i += PARALLEL) {
        const lote = ids.slice(i, i + PARALLEL)
        const updates = await Promise.all(lote.map(async (platId) => {
          const nuevoTotal = newCostoTotalMap[platId]
          const nuevoCostoAdmin = nuevoTotal * FACTOR_ADMIN
          const { error } = await supabase
            .from("platillos")
            .update({
              costototal: nuevoTotal,
              costoadministrativo: nuevoCostoAdmin,
              fechamodificacion: ahoraDate,
            })
            .eq("id", platId)
          return error ? 0 : 1
        }))
        platillosUpdated += updates.reduce((s, n) => s + n, 0)
      }
    }

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.IMPORTAR_INSUMOS_RECALCULO,
      observaciones:
        `Recalculó costos en cascada: ${ingredientesXPlatilloUpdated} ingredientesxplatillo, ` +
        `${ingredientesXRecetaUpdated} ingredientesxreceta, ${recetasUpdated} recetas, ` +
        `${platillosUpdated} platillos actualizados.`,
      modulo: BITACORA_MODULOS.IMPORTAR,
    })

    return {
      success: true,
      ingredientesXRecetaUpdated,
      ingredientesXPlatilloUpdated,
      recetasUpdated,
      recetasXPlatilloUpdated,
      platillosUpdated,
      saltados,
    }
  } catch (error: any) {
    console.error("[v0] Error en recalcularCostosCascada:", error)
    return {
      ...baseResult,
      error: error?.message || "Error inesperado al recalcular costos en cascada",
    }
  }
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Loader2,
  Tag,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  ListChecks,
  Eraser,
  Link2,
} from "lucide-react"
import { obtenerHotelesActivos } from "@/app/actions/importar"
import {
  obtenerComparativoPlatillosCodigos,
  buscarCoincidenciasFuzzy,
  asignarCodigoAPlatillo,
  asignarCodigosAutomaticosBulk,
  type PlatilloComparativo,
  type CandidatoCargaventa,
  type CargaventaMatch,
} from "@/app/actions/cargaventas"

type FiltroEstado = "todos" | "sin_codigo" | "con_codigo" | "auto_disponible"

export default function CargaVentasPage() {
  const { toast } = useToast()

  const [hotelesList, setHotelesList] = useState<{ id: number; acronimo: string; nombre: string }[]>([])
  const [hotelSeleccionadoId, setHotelSeleccionadoId] = useState<string>("")
  const [hotelCargado, setHotelCargado] = useState<number | null>(null)

  const [loadingHoteles, setLoadingHoteles] = useState(true)
  const [loadingComparativo, setLoadingComparativo] = useState(false)
  const [aplicandoBulk, setAplicandoBulk] = useState(false)
  const [aplicandoIds, setAplicandoIds] = useState<Set<number>>(new Set())
  const [confirmAsociarTodos, setConfirmAsociarTodos] = useState(false)
  const [aplicandoAsociarTodos, setAplicandoAsociarTodos] = useState(false)

  const [platillos, setPlatillos] = useState<PlatilloComparativo[]>([])
  const [totalCargaventas, setTotalCargaventas] = useState(0)

  // Filtros sobre la tabla
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos")
  const [filtroMatch, setFiltroMatch] = useState<"todos" | "con_match" | "sin_match">("todos")

  // Dialog de búsqueda manual
  const [dialogPlatillo, setDialogPlatillo] = useState<PlatilloComparativo | null>(null)
  const [dialogCandidatos, setDialogCandidatos] = useState<CandidatoCargaventa[]>([])
  const [dialogLoading, setDialogLoading] = useState(false)
  const [dialogTotal, setDialogTotal] = useState(0)
  const [dialogFiltroTexto, setDialogFiltroTexto] = useState("")

  useEffect(() => {
    obtenerHotelesActivos()
      .then((res) => {
        if (res.success) setHotelesList(res.data as any[])
      })
      .finally(() => setLoadingHoteles(false))
  }, [])

  const cargarComparativo = async () => {
    const hid = parseInt(hotelSeleccionadoId)
    if (!hid) {
      toast({
        title: "Selecciona un hotel",
        description: "Debes elegir un hotel del listado.",
        variant: "destructive",
      })
      return
    }
    try {
      setLoadingComparativo(true)
      const res = await obtenerComparativoPlatillosCodigos(hid)
      if (!res.success) {
        toast({
          title: "Error cargando comparativo",
          description: res.message || "Error inesperado",
          variant: "destructive",
        })
        setPlatillos([])
        setTotalCargaventas(0)
        setHotelCargado(null)
        return
      }
      setPlatillos(res.data)
      setTotalCargaventas(res.totalCargaventas)
      setHotelCargado(hid)
      const hotelLabel = hotelesList.find((h) => h.id === hid)
      const auto = res.data.filter((p) => p.match_codigo && !p.codigo).length
      toast({
        title: "Comparativo cargado",
        description: `${res.data.length} platillos · ${res.totalCargaventas} códigos en cargaventas${hotelLabel ? ` (${hotelLabel.acronimo})` : ""}. ${auto} match(es) auto disponibles.`,
      })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error inesperado", variant: "destructive" })
    } finally {
      setLoadingComparativo(false)
    }
  }

  const abrirBuscadorManual = async (platillo: PlatilloComparativo) => {
    setDialogPlatillo(platillo)
    setDialogCandidatos([])
    setDialogTotal(0)
    setDialogFiltroTexto("")
    setDialogLoading(true)
    try {
      const res = await buscarCoincidenciasFuzzy(platillo.hotelid ?? 0, platillo.nombre, 100)
      if (!res.success) {
        toast({
          title: "Error buscando coincidencias",
          description: res.message || "Error inesperado",
          variant: "destructive",
        })
        return
      }
      setDialogCandidatos(res.data)
      setDialogTotal(res.total ?? res.data.length)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error inesperado", variant: "destructive" })
    } finally {
      setDialogLoading(false)
    }
  }

  const aplicarCodigo = async (platilloId: number, codigo: string | null, opts?: { silent?: boolean }) => {
    setAplicandoIds((s) => new Set(s).add(platilloId))
    try {
      const res = await asignarCodigoAPlatillo(platilloId, codigo)
      if (!res.success) {
        toast({
          title: "No se pudo asignar",
          description: res.message || "Error inesperado",
          variant: "destructive",
        })
        return false
      }
      setPlatillos((prev) =>
        prev.map((p) => (p.id === platilloId ? { ...p, codigo: res.codigo ?? null } : p)),
      )
      if (!opts?.silent) {
        toast({
          title: codigo ? "Código asignado" : "Código removido",
          description: codigo ? `Código ${codigo} guardado.` : "Se quitó el código del platillo.",
        })
      }
      return true
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error inesperado", variant: "destructive" })
      return false
    } finally {
      setAplicandoIds((s) => {
        const n = new Set(s)
        n.delete(platilloId)
        return n
      })
    }
  }

  const seleccionarCandidato = async (cand: CandidatoCargaventa) => {
    if (!dialogPlatillo) return
    const ok = await aplicarCodigo(dialogPlatillo.id, cand.codigo, { silent: true })
    if (ok) {
      toast({
        title: "Código asignado",
        description: `${dialogPlatillo.nombre} → ${cand.codigo} (${cand.descripcion}).`,
      })
      setDialogPlatillo(null)
    }
  }

  // Asocia el match_codigo a TODOS los platillos con match (sobrescribe los que
  // ya tengan otro código distinto). Disparado desde el filtro "Con match".
  const ejecutarAsociarTodosConMatch = async () => {
    const objetivos = elegiblesAsociarTodos.map((p) => ({
      platilloId: p.id,
      codigo: p.match_codigo as string,
    }))
    if (objetivos.length === 0) {
      toast({
        title: "Nada para asociar",
        description: "Todos los platillos con match ya tienen el código asignado.",
      })
      setConfirmAsociarTodos(false)
      return
    }
    try {
      setAplicandoAsociarTodos(true)
      const res = await asignarCodigosAutomaticosBulk(objetivos)
      if (res.actualizados > 0) {
        const mapaCodigos = new Map(objetivos.map((o) => [o.platilloId, o.codigo]))
        setPlatillos((prev) =>
          prev.map((p) =>
            mapaCodigos.has(p.id) ? { ...p, codigo: mapaCodigos.get(p.id) ?? p.codigo } : p,
          ),
        )
      }
      if (res.fallidos > 0) {
        toast({
          title: `Asociado parcialmente (${res.actualizados}/${objetivos.length})`,
          description: `${res.fallidos} fallaron. Primer error: ${res.errores[0] ?? ""}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Códigos asociados",
          description: `${res.actualizados} platillo(s) actualizados con el código de su match.`,
        })
      }
      setConfirmAsociarTodos(false)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error inesperado", variant: "destructive" })
    } finally {
      setAplicandoAsociarTodos(false)
    }
  }

  const aplicarTodosLosMatchesAuto = async () => {
    const elegibles = platillos
      .filter((p) => p.match_codigo && !p.codigo)
      .map((p) => ({ platilloId: p.id, codigo: p.match_codigo as string }))
    if (elegibles.length === 0) {
      toast({
        title: "Sin matches por aplicar",
        description: "Todos los platillos con match exacto ya tienen código asignado.",
      })
      return
    }
    try {
      setAplicandoBulk(true)
      const res = await asignarCodigosAutomaticosBulk(elegibles)
      if (res.actualizados > 0) {
        const setIds = new Set(elegibles.map((e) => e.platilloId))
        setPlatillos((prev) =>
          prev.map((p) =>
            setIds.has(p.id) && p.match_codigo ? { ...p, codigo: p.match_codigo } : p,
          ),
        )
      }
      if (res.fallidos > 0) {
        toast({
          title: `Aplicado parcialmente (${res.actualizados}/${elegibles.length})`,
          description: `${res.fallidos} fallaron. Primer error: ${res.errores[0] ?? ""}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Matches aplicados",
          description: `${res.actualizados} código(s) asignado(s) automáticamente.`,
        })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error inesperado", variant: "destructive" })
    } finally {
      setAplicandoBulk(false)
    }
  }

  // ---------- Derivados / métricas ----------

  const metrics = useMemo(() => {
    const total = platillos.length
    const conCodigo = platillos.filter((p) => !!p.codigo).length
    const sinCodigo = total - conCodigo
    const matchAutoDisponible = platillos.filter(
      (p) => (p.match_count ?? 0) === 1 && !p.codigo,
    ).length
    const conMatch = platillos.filter((p) => (p.match_count ?? 0) > 0).length
    const ambiguos = platillos.filter((p) => (p.match_count ?? 0) > 1).length
    return { total, conCodigo, sinCodigo, matchAutoDisponible, conMatch, ambiguos }
  }, [platillos])

  // Para "Asociar todos los códigos" del filtro Con match: SOLO platillos con
  // exactamente 1 match cuyo código difiere del actual. Los ambiguos
  // (match_count > 1) requieren decisión manual y se excluyen del bulk.
  const elegiblesAsociarTodos = useMemo(
    () =>
      platillos.filter(
        (p) => (p.match_count ?? 0) === 1 && p.match_codigo && p.match_codigo !== p.codigo,
      ),
    [platillos],
  )
  const elegiblesSobrescribir = useMemo(
    () => elegiblesAsociarTodos.filter((p) => !!p.codigo).length,
    [elegiblesAsociarTodos],
  )
  // Platillos ambiguos cuyo código actual NO coincide con ninguno de sus matches
  // (todavía requieren decisión humana). Se reportan en el banner del bulk.
  const omitidosPorAmbiguedad = useMemo(
    () =>
      platillos.filter(
        (p) => (p.match_count ?? 0) > 1 && !p.matches.some((m) => m.codigo === p.codigo),
      ).length,
    [platillos],
  )

  const dialogCandidatosFiltrados = useMemo(() => {
    const q = dialogFiltroTexto.trim().toLowerCase()
    if (!q) return dialogCandidatos
    const norm = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
    const qNorm = norm(q)
    return dialogCandidatos.filter((c) => {
      return (
        norm(c.descripcion).includes(qNorm) ||
        norm(c.codigo).includes(qNorm) ||
        (c.tipo ? norm(c.tipo).includes(qNorm) : false)
      )
    })
  }, [dialogCandidatos, dialogFiltroTexto])

  const platillosFiltrados = useMemo(() => {
    const q = filtroTexto.trim().toLowerCase()
    return platillos.filter((p) => {
      if (filtroEstado === "sin_codigo" && p.codigo) return false
      if (filtroEstado === "con_codigo" && !p.codigo) return false
      if (filtroEstado === "auto_disponible" && !(p.match_codigo && !p.codigo)) return false
      if (filtroMatch === "con_match" && !p.match_codigo) return false
      if (filtroMatch === "sin_match" && p.match_codigo) return false
      if (q && !p.nombre.toLowerCase().includes(q) && !(p.codigo ?? "").toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [platillos, filtroTexto, filtroEstado, filtroMatch])

  // ---------- Render ----------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Tag className="h-6 w-6 text-indigo-700" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Carga de Ventas</h1>
          </div>
          <p className="text-base md:text-lg text-slate-600">
            Asigna códigos de venta a los platillos del sistema cruzando{" "}
            <span className="font-mono text-slate-800">platillos.nombre</span> con{" "}
            <span className="font-mono text-slate-800">cargaventas.descripcion</span> del mismo hotel.
          </p>
        </div>

        {/* Selector de hotel */}
        <Card className="bg-white/95 backdrop-blur border-2 border-indigo-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Selecciona el hotel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Trae los platillos activos del hotel y los compara contra los códigos de cargaventas del mismo hotel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label htmlFor="cv-hotel" className="block text-sm font-medium text-slate-700 mb-1">
                  Hotel
                </label>
                <select
                  id="cv-hotel"
                  value={hotelSeleccionadoId}
                  onChange={(e) => setHotelSeleccionadoId(e.target.value)}
                  disabled={loadingComparativo || hotelesList.length === 0}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">— Selecciona un hotel —</option>
                  {hotelesList.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.acronimo} — {h.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={cargarComparativo}
                disabled={loadingComparativo || !hotelSeleccionadoId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loadingComparativo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cargando…
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Cargar comparativo
                  </>
                )}
              </Button>
            </div>
            {loadingHoteles && hotelesList.length === 0 && (
              <p className="text-xs text-slate-500">Cargando lista de hoteles…</p>
            )}
            {!loadingHoteles && hotelesList.length === 0 && (
              <p className="text-xs text-amber-700">No se encontraron hoteles activos.</p>
            )}
          </CardContent>
        </Card>

        {/* Métricas + acción bulk */}
        {hotelCargado !== null && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricChip label="Platillos" value={metrics.total} tone="slate" icon={<ListChecks className="h-4 w-4" />} />
            <MetricChip
              label="Con código"
              value={metrics.conCodigo}
              tone="emerald"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <MetricChip
              label="Sin código"
              value={metrics.sinCodigo}
              tone="amber"
              icon={<AlertCircle className="h-4 w-4" />}
            />
            <MetricChip
              label="Match auto disponible"
              value={metrics.matchAutoDisponible}
              tone="indigo"
              icon={<Sparkles className="h-4 w-4" />}
            />
            <MetricChip
              label="Códigos cargaventas"
              value={totalCargaventas}
              tone="blue"
              icon={<Tag className="h-4 w-4" />}
            />
          </div>
        )}

        {/* Aviso si cargaventas no tiene datos para este hotel */}
        {hotelCargado !== null && totalCargaventas === 0 && (
          <Card className="border-2 border-amber-200 bg-amber-50/70">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">Sin códigos para este hotel</p>
                <p>
                  La tabla <span className="font-mono">cargaventas</span> no tiene registros con{" "}
                  <span className="font-mono">hotelid = {hotelCargado}</span>. No se pueden generar match
                  automáticos ni búsquedas manuales hasta que se carguen los códigos del hotel.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros + botón bulk */}
        {hotelCargado !== null && platillos.length > 0 && (
          <Card className="bg-white/95 backdrop-blur border-2 border-slate-200">
            <CardContent className="py-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Filtrar por nombre o código…"
                      value={filtroTexto}
                      onChange={(e) => setFiltroTexto(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <FiltroChip
                      label={`Todos (${metrics.total})`}
                      active={filtroEstado === "todos"}
                      onClick={() => setFiltroEstado("todos")}
                    />
                    <FiltroChip
                      label={`Sin código (${metrics.sinCodigo})`}
                      active={filtroEstado === "sin_codigo"}
                      onClick={() => setFiltroEstado("sin_codigo")}
                      tone="amber"
                    />
                    <FiltroChip
                      label={`Con código (${metrics.conCodigo})`}
                      active={filtroEstado === "con_codigo"}
                      onClick={() => setFiltroEstado("con_codigo")}
                      tone="emerald"
                    />
                    <FiltroChip
                      label={`Match auto (${metrics.matchAutoDisponible})`}
                      active={filtroEstado === "auto_disponible"}
                      onClick={() => setFiltroEstado("auto_disponible")}
                      tone="indigo"
                    />
                  </div>
                </div>
                <Button
                  onClick={aplicarTodosLosMatchesAuto}
                  disabled={aplicandoBulk || metrics.matchAutoDisponible === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                >
                  {aplicandoBulk ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aplicando…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Aplicar {metrics.matchAutoDisponible} match(es) auto
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla principal */}
        {hotelCargado !== null && (
          <Card className="bg-white/95 backdrop-blur border-2 border-slate-200">
            <CardHeader className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-slate-900 text-lg">
                  Platillos del hotel{" "}
                  <span className="text-slate-500 font-normal">({platillosFiltrados.length} de {metrics.total})</span>
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wide font-semibold text-slate-500">
                    Match cargaventas:
                  </span>
                  <FiltroChip
                    label={`Todos (${metrics.total})`}
                    active={filtroMatch === "todos"}
                    onClick={() => setFiltroMatch("todos")}
                  />
                  <FiltroChip
                    label={`Con match (${metrics.conMatch})`}
                    active={filtroMatch === "con_match"}
                    onClick={() => setFiltroMatch("con_match")}
                    tone="indigo"
                  />
                  <FiltroChip
                    label={`Sin match (${metrics.total - metrics.conMatch})`}
                    active={filtroMatch === "sin_match"}
                    onClick={() => setFiltroMatch("sin_match")}
                    tone="amber"
                  />
                </div>
              </div>
              {filtroMatch === "con_match" && (
                <div className="flex items-center justify-between gap-3 rounded-md border border-indigo-200 bg-indigo-50/60 px-3 py-2">
                  <div className="text-xs text-indigo-900 space-y-1">
                    <div>
                      {elegiblesAsociarTodos.length === 0 ? (
                        <span>No hay platillos con match único para asociar automáticamente.</span>
                      ) : (
                        <>
                          Aplica el código del match a los <strong>{elegiblesAsociarTodos.length}</strong>{" "}
                          platillo(s) con coincidencia única
                          {elegiblesSobrescribir > 0 && (
                            <>
                              , <strong>{elegiblesSobrescribir}</strong> de los cuales sobrescribirán
                              un código existente
                            </>
                          )}
                          .
                        </>
                      )}
                    </div>
                    {omitidosPorAmbiguedad > 0 && (
                      <div className="text-amber-800">
                        Se omiten <strong>{omitidosPorAmbiguedad}</strong> platillo(s) con varios
                        códigos posibles — requieren elegir manualmente cuál asignar.
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => setConfirmAsociarTodos(true)}
                    disabled={aplicandoAsociarTodos || elegiblesAsociarTodos.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                  >
                    {aplicandoAsociarTodos ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Asociando…
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Asociar Todos los códigos
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold w-16">ID</th>
                      <th className="text-left px-3 py-2 font-semibold">Platillo</th>
                      <th className="text-left px-3 py-2 font-semibold w-44">Código actual</th>
                      <th className="text-left px-3 py-2 font-semibold">Match automático</th>
                      <th className="text-right px-3 py-2 font-semibold w-72">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platillosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                          {platillos.length === 0
                            ? "No hay platillos para este hotel."
                            : "Ningún platillo cumple los filtros actuales."}
                        </td>
                      </tr>
                    )}
                    {platillosFiltrados.map((p) => {
                      const enProceso = aplicandoIds.has(p.id)
                      const matchCount = p.match_count ?? 0
                      const ambiguo = matchCount > 1
                      const matchUnico = matchCount === 1
                      const matchYaAsignado =
                        matchCount > 0 && p.matches.some((m) => m.codigo === p.codigo)
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-slate-100 hover:bg-slate-50 ${
                            ambiguo ? "bg-amber-50/30" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-slate-500 font-mono text-xs align-top pt-3">{p.id}</td>
                          <td className="px-3 py-2 align-top pt-3">
                            <div className="font-medium text-slate-900">{p.nombre}</div>
                            {p.tipofamilia && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{p.tipofamilia}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top pt-3">
                            {p.codigo ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                                {p.codigo}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 italic text-xs">— sin código —</span>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top pt-3">
                            {matchCount === 0 && (
                              <span className="text-slate-400 italic text-xs">sin match exacto</span>
                            )}
                            {matchUnico && (
                              <div className="flex flex-col gap-0.5">
                                <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-300 font-mono w-fit">
                                  {p.match_codigo}
                                </Badge>
                                <span className="text-[11px] text-slate-600 font-mono">
                                  {p.match_descripcion}
                                </span>
                              </div>
                            )}
                            {ambiguo && (
                              <div className="space-y-1.5">
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold w-fit">
                                  ⚠ {matchCount} códigos posibles — elige uno
                                </Badge>
                                <ul className="space-y-1 mt-1">
                                  {p.matches.map((m) => {
                                    const yaAsignado = m.codigo === p.codigo
                                    return (
                                      <li
                                        key={m.cargaventaid}
                                        className={`flex items-center justify-between gap-2 rounded border px-2 py-1 ${
                                          yaAsignado
                                            ? "bg-emerald-50 border-emerald-300"
                                            : "bg-white border-slate-200"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Badge
                                            className={`font-mono shrink-0 ${
                                              yaAsignado
                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                                            }`}
                                          >
                                            {m.codigo}
                                          </Badge>
                                          <span className="text-[11px] text-slate-600 font-mono truncate">
                                            {m.descripcion}
                                          </span>
                                        </div>
                                        {yaAsignado ? (
                                          <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wide shrink-0">
                                            asignado
                                          </span>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 bg-transparent text-[11px] shrink-0"
                                            disabled={enProceso}
                                            onClick={() => aplicarCodigo(p.id, m.codigo)}
                                          >
                                            Asignar
                                          </Button>
                                        )}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top pt-2 text-right">
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              {matchUnico && !matchYaAsignado && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-indigo-300 text-indigo-700 hover:bg-indigo-50 bg-transparent"
                                  disabled={enProceso}
                                  onClick={() => aplicarCodigo(p.id, p.match_codigo)}
                                >
                                  {enProceso ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Asignar match
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-slate-300 text-slate-700 hover:bg-slate-100 bg-transparent"
                                disabled={enProceso || totalCargaventas === 0}
                                onClick={() => abrirBuscadorManual(p)}
                                title={
                                  totalCargaventas === 0
                                    ? "No hay códigos cargados para este hotel"
                                    : "Buscar coincidencias manualmente"
                                }
                              >
                                <Search className="h-3.5 w-3.5 mr-1" />
                                Buscar…
                              </Button>
                              {p.codigo && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-rose-300 text-rose-700 hover:bg-rose-50 bg-transparent"
                                  disabled={enProceso}
                                  onClick={() => aplicarCodigo(p.id, null)}
                                >
                                  {enProceso ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Eraser className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Quitar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de búsqueda manual */}
      <Dialog
        open={!!dialogPlatillo}
        onOpenChange={(open) => {
          if (!open) setDialogPlatillo(null)
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-indigo-600" />
              Buscar código manual
            </DialogTitle>
            <DialogDescription>
              Coincidencias en <span className="font-mono">cargaventas</span> del hotel para el platillo
              seleccionado. El ranking pondera coincidencia de palabras y similitud de longitud.
            </DialogDescription>
          </DialogHeader>

          {dialogPlatillo && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 mb-2">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                Platillo
              </div>
              <div className="font-medium text-slate-900">{dialogPlatillo.nombre}</div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                <span>ID {dialogPlatillo.id}</span>
                {dialogPlatillo.tipofamilia && <span>· {dialogPlatillo.tipofamilia}</span>}
                {dialogPlatillo.codigo && (
                  <span>
                    · Código actual:{" "}
                    <span className="font-mono text-emerald-700">{dialogPlatillo.codigo}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Input de filtro local sobre los candidatos del dialog */}
          {!dialogLoading && dialogCandidatos.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtrar candidatos por descripción, código o tipo…"
                value={dialogFiltroTexto}
                onChange={(e) => setDialogFiltroTexto(e.target.value)}
                className="pl-8 pr-8"
                autoFocus
              />
              {dialogFiltroTexto && (
                <button
                  type="button"
                  onClick={() => setDialogFiltroTexto("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700"
                  title="Limpiar filtro"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <div className="max-h-[55vh] overflow-y-auto rounded-md border border-slate-200">
            {dialogLoading && (
              <div className="flex items-center justify-center py-10 text-slate-500 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando coincidencias…
              </div>
            )}
            {!dialogLoading && dialogCandidatos.length === 0 && (
              <div className="py-10 text-center text-slate-500 text-sm">
                {totalCargaventas === 0
                  ? "Este hotel no tiene registros en cargaventas."
                  : "Sin coincidencias para el nombre del platillo."}
              </div>
            )}
            {!dialogLoading && dialogCandidatos.length > 0 && dialogCandidatosFiltrados.length === 0 && (
              <div className="py-10 text-center text-slate-500 text-sm">
                Ningún candidato coincide con el filtro «{dialogFiltroTexto}».
              </div>
            )}
            {!dialogLoading && dialogCandidatosFiltrados.length > 0 && (
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold w-28">Código</th>
                    <th className="text-left px-3 py-2 font-semibold">Descripción</th>
                    <th className="text-left px-3 py-2 font-semibold w-24">Tipo</th>
                    <th className="text-left px-3 py-2 font-semibold w-20">Score</th>
                    <th className="px-3 py-2 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {dialogCandidatosFiltrados.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-indigo-50/40">
                      <td className="px-3 py-2 align-top">
                        <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-300 font-mono">
                          {c.codigo}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="font-mono text-slate-800">
                          {renderHighlight(c.descripcion, c.matchedTokens)}
                        </div>
                        {c.matchedTokens.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            tokens: {c.matchedTokens.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-xs text-slate-600">{c.tipo ?? "—"}</td>
                      <td className="px-3 py-2 align-top">
                        <ScoreBar score={c.score} />
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                          onClick={() => seleccionarCandidato(c)}
                        >
                          Asignar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!dialogLoading && dialogCandidatos.length > 0 && (
            <p className="text-xs text-slate-500">
              {dialogFiltroTexto
                ? `${dialogCandidatosFiltrados.length} de ${dialogCandidatos.length} candidato(s) coinciden con el filtro.`
                : dialogTotal > dialogCandidatos.length
                  ? `Mostrando los ${dialogCandidatos.length} mejores candidatos de ${dialogTotal} totales.`
                  : `${dialogCandidatos.length} candidato(s) encontrados.`}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPlatillo(null)}>
              <X className="h-4 w-4 mr-1" />
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación: asociar todos los códigos con match */}
      <AlertDialog
        open={confirmAsociarTodos}
        onOpenChange={(open) => {
          if (!open && !aplicandoAsociarTodos) setConfirmAsociarTodos(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-indigo-600" />
              Asociar todos los códigos con match
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  Se actualizará la columna <span className="font-mono">codigo</span> de la tabla{" "}
                  <span className="font-mono">platillos</span> con el código del match exacto en{" "}
                  <span className="font-mono">cargaventas</span>.
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 ml-2">
                  <li>
                    <strong>{elegiblesAsociarTodos.length}</strong> platillo(s) con <em>match único</em>{" "}
                    serán actualizados.
                  </li>
                  {elegiblesSobrescribir > 0 ? (
                    <li className="text-amber-700">
                      <strong>{elegiblesSobrescribir}</strong> ya tienen un código distinto y serán{" "}
                      <strong>sobrescritos</strong>.
                    </li>
                  ) : (
                    <li>Ninguno tiene un código previo distinto: no se sobrescribe nada.</li>
                  )}
                  {omitidosPorAmbiguedad > 0 && (
                    <li className="text-amber-700">
                      <strong>{omitidosPorAmbiguedad}</strong> platillo(s) con varios códigos posibles
                      serán <strong>omitidos</strong> (requieren elección manual).
                    </li>
                  )}
                </ul>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer en bloque.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={aplicandoAsociarTodos}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                ejecutarAsociarTodosConMatch()
              }}
              disabled={aplicandoAsociarTodos || elegiblesAsociarTodos.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {aplicandoAsociarTodos ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Asociando…
                </>
              ) : (
                <>Asociar {elegiblesAsociarTodos.length} código(s)</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Componentes auxiliares ----------

function MetricChip({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone: "slate" | "emerald" | "amber" | "indigo" | "blue"
  icon: React.ReactNode
}) {
  const palette: Record<string, string> = {
    slate: "bg-slate-100 text-slate-800 border-slate-300",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-300",
    amber: "bg-amber-50 text-amber-800 border-amber-300",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-300",
    blue: "bg-blue-50 text-blue-800 border-blue-300",
  }
  return (
    <div
      className={`rounded-lg border-2 ${palette[tone]} px-3 py-2 flex items-center gap-2 shadow-sm`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wide font-semibold opacity-70">{label}</div>
        <div className="text-lg font-bold tabular-nums">{value}</div>
      </div>
    </div>
  )
}

function FiltroChip({
  label,
  active,
  onClick,
  tone = "slate",
}: {
  label: string
  active: boolean
  onClick: () => void
  tone?: "slate" | "amber" | "emerald" | "indigo"
}) {
  const activePalette: Record<string, string> = {
    slate: "bg-slate-800 text-white border-slate-800",
    amber: "bg-amber-600 text-white border-amber-600",
    emerald: "bg-emerald-600 text-white border-emerald-600",
    indigo: "bg-indigo-600 text-white border-indigo-600",
  }
  const inactive = "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors ${
        active ? activePalette[tone] : inactive
      }`}
    >
      {label}
    </button>
  )
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  const tone =
    clamped >= 80
      ? "bg-emerald-500"
      : clamped >= 50
        ? "bg-indigo-500"
        : clamped >= 30
          ? "bg-amber-500"
          : "bg-slate-400"
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`${tone} h-full`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-mono tabular-nums text-slate-600">{clamped}</span>
    </div>
  )
}

// Resalta dentro del texto los tokens matcheados (case-insensitive, sin acentos).
function renderHighlight(texto: string, tokens: string[]): React.ReactNode {
  if (!tokens.length) return texto
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
  const original = texto
  const lowerNorm = norm(original)
  // Recolectar rangos a resaltar
  const rangos: [number, number][] = []
  for (const t of tokens) {
    const tn = norm(t)
    if (!tn) continue
    let from = 0
    while (from < lowerNorm.length) {
      const idx = lowerNorm.indexOf(tn, from)
      if (idx === -1) break
      rangos.push([idx, idx + tn.length])
      from = idx + tn.length
    }
  }
  if (rangos.length === 0) return texto
  // Merge overlapping
  rangos.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of rangos) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([r[0], r[1]])
  }
  const out: React.ReactNode[] = []
  let cursor = 0
  merged.forEach(([a, b], i) => {
    if (a > cursor) out.push(original.slice(cursor, a))
    out.push(
      <mark
        key={i}
        className="bg-yellow-200 text-slate-900 rounded px-0.5 font-semibold"
      >
        {original.slice(a, b)}
      </mark>,
    )
    cursor = b
  })
  if (cursor < original.length) out.push(original.slice(cursor))
  return out
}

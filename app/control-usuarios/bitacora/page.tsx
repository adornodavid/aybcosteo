"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Activity,
  Search,
  Loader2,
  Mail,
  Building2,
  ShieldCheck,
  Calendar,
  Filter,
  RefreshCw,
  ListChecks,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  ScrollText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import {
  obtenerBitacoraDeUsuario,
  type BitacoraEntrada,
  type UsuarioBitacora,
} from "@/app/actions/bitacora-actions"
import { BITACORA_MODULOS } from "@/lib/bitacora-actividades"

const MODULOS_LABEL: Record<string, { label: string; tone: string }> = {
  [BITACORA_MODULOS.PLATILLOS]: { label: "Platillos", tone: "bg-orange-100 text-orange-800 border-orange-300" },
  [BITACORA_MODULOS.RECETAS]: { label: "Recetas", tone: "bg-amber-100 text-amber-800 border-amber-300" },
  [BITACORA_MODULOS.MENUS]: { label: "Menús", tone: "bg-rose-100 text-rose-800 border-rose-300" },
  [BITACORA_MODULOS.RESTAURANTES]: { label: "Restaurantes", tone: "bg-pink-100 text-pink-800 border-pink-300" },
  [BITACORA_MODULOS.HOTELES]: { label: "Hoteles", tone: "bg-teal-100 text-teal-800 border-teal-300" },
  [BITACORA_MODULOS.INGREDIENTES]: { label: "Insumos", tone: "bg-lime-100 text-lime-800 border-lime-300" },
  [BITACORA_MODULOS.IMPORTAR]: { label: "Importar", tone: "bg-blue-100 text-blue-800 border-blue-300" },
  [BITACORA_MODULOS.CARGAVENTAS]: { label: "Carga de Ventas", tone: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  [BITACORA_MODULOS.USUARIOS]: { label: "Usuarios", tone: "bg-purple-100 text-purple-800 border-purple-300" },
}

function moduloBadge(modulo: string | null) {
  if (!modulo) return { label: "—", tone: "bg-slate-100 text-slate-600 border-slate-300" }
  return MODULOS_LABEL[modulo] ?? { label: modulo, tone: "bg-slate-100 text-slate-700 border-slate-300" }
}

// Un icono por verbo principal de la actividad para lectura rápida.
function actividadIcon(actividad: string | null) {
  if (!actividad) return <Activity className="h-3.5 w-3.5" />
  const a = actividad.toLowerCase()
  if (a.startsWith("crear") || a.includes("registrar")) return <Plus className="h-3.5 w-3.5 text-emerald-600" />
  if (a.startsWith("eliminar")) return <Trash2 className="h-3.5 w-3.5 text-rose-600" />
  if (a.startsWith("actualizar")) return <Pencil className="h-3.5 w-3.5 text-amber-600" />
  if (a.startsWith("asignar") || a.startsWith("quitar")) return <ListChecks className="h-3.5 w-3.5 text-indigo-600" />
  return <Activity className="h-3.5 w-3.5 text-slate-500" />
}

function formatFecha(iso: string) {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    return d.toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function relativo(iso: string) {
  if (!iso) return ""
  const now = Date.now()
  const t = new Date(iso).getTime()
  const diffMs = now - t
  if (!Number.isFinite(diffMs)) return ""
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr} h`
  const day = Math.floor(hr / 24)
  if (day < 30) return `hace ${day} d`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `hace ${mo} mes${mo === 1 ? "" : "es"}`
  const yr = Math.floor(day / 365)
  return `hace ${yr} año${yr === 1 ? "" : "s"}`
}

function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function PageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const idParam = params.get("id")
  const usuarioid = idParam ? Number(idParam) : NaN

  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<UsuarioBitacora | null>(null)
  const [entradas, setEntradas] = useState<BitacoraEntrada[]>([])
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroModulo, setFiltroModulo] = useState<string>("todos")

  const cargar = async () => {
    if (!Number.isFinite(usuarioid) || usuarioid <= 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await obtenerBitacoraDeUsuario(usuarioid)
      if (!res.success) {
        toast({
          title: "Error cargando bitácora",
          description: res.message || "Error inesperado",
          variant: "destructive",
        })
        return
      }
      setUsuario(res.usuario)
      setEntradas(res.entradas)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioid])

  const conteoPorModulo = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entradas) {
      const k = e.modulo ?? "—"
      map[k] = (map[k] || 0) + 1
    }
    return map
  }, [entradas])

  const entradasFiltradas = useMemo(() => {
    const q = filtroTexto.trim().toLowerCase()
    return entradas.filter((e) => {
      if (filtroModulo !== "todos") {
        const m = e.modulo ?? ""
        if (filtroModulo === "_sin_modulo" ? m !== "" : m !== filtroModulo) return false
      }
      if (q) {
        const hay =
          (e.actividad ?? "").toLowerCase().includes(q) ||
          (e.observaciones ?? "").toLowerCase().includes(q) ||
          (e.modulo ?? "").toLowerCase().includes(q)
        if (!hay) return false
      }
      return true
    })
  }, [entradas, filtroTexto, filtroModulo])

  // Paramestros inválidos: muestra mensaje claro.
  if (!Number.isFinite(usuarioid) || usuarioid <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-amber-200 bg-amber-50/70">
            <CardContent className="py-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-900">Falta el parámetro de usuario</p>
                <p className="text-sm text-amber-800 mt-1">
                  Esta página requiere <span className="font-mono">?id=</span> en la URL. Vuelve a Control de
                  Usuarios y selecciona uno.
                </p>
                <Button
                  variant="outline"
                  className="mt-3 bg-transparent"
                  onClick={() => router.push("/control-usuarios")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Volver a Control de Usuarios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con back */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => router.push("/control-usuarios")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Control de Usuarios
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-100">
                  <ScrollText className="h-5 w-5 text-indigo-700" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Bitácora del usuario</h1>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Historial de movimientos registrados en el sistema.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={cargar}
            disabled={loading}
            className="bg-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refrescar
          </Button>
        </div>

        {/* Tarjeta de perfil del usuario */}
        <Card className="bg-white/95 border-2 border-slate-200">
          <CardContent className="py-5">
            {loading && !usuario ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando datos del usuario…
              </div>
            ) : !usuario ? (
              <div className="text-sm text-rose-700">
                No se encontró el usuario con id <span className="font-mono">{usuarioid}</span>.
              </div>
            ) : (
              <div className="flex items-start gap-4 flex-wrap">
                <Avatar className="h-16 w-16 ring-2 ring-indigo-200">
                  <AvatarImage src={usuario.imgurl || undefined} alt={usuario.nombrecompleto} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold">
                    {initials(usuario.nombrecompleto || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">{usuario.nombrecompleto}</h2>
                    {usuario.activo ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-700 border border-rose-300">Inactivo</Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">ID {usuario.id}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{usuario.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Rol ID: {usuario.rolid ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>Hotel ID: {usuario.hotelid ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Último acceso:{" "}
                        {usuario.fechaultimoacceso ? formatFecha(usuario.fechaultimoacceso) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50/70 px-4 py-2 text-center">
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-indigo-700">
                      Movimientos
                    </div>
                    <div className="text-2xl font-bold text-indigo-900 tabular-nums">{entradas.length}</div>
                  </div>
                  <div className="rounded-lg border-2 border-slate-200 bg-slate-50/70 px-4 py-2 text-center">
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-600">
                      Accesos
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">
                      {usuario.cantidadaccesos ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filtros + tabla */}
        <Card className="bg-white/95 border-2 border-slate-200">
          <CardHeader className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <CardTitle className="text-slate-900 text-lg">
                Movimientos{" "}
                <span className="text-slate-500 font-normal">
                  ({entradasFiltradas.length} de {entradas.length})
                </span>
              </CardTitle>
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Filtrar por actividad u observaciones…"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs uppercase tracking-wide font-semibold text-slate-500">Módulo:</span>
              <Chip
                label={`Todos (${entradas.length})`}
                active={filtroModulo === "todos"}
                onClick={() => setFiltroModulo("todos")}
              />
              {Object.entries(MODULOS_LABEL).map(([key, meta]) => {
                const count = conteoPorModulo[key] ?? 0
                if (count === 0) return null
                return (
                  <Chip
                    key={key}
                    label={`${meta.label} (${count})`}
                    active={filtroModulo === key}
                    onClick={() => setFiltroModulo(key)}
                  />
                )
              })}
              {(conteoPorModulo["—"] ?? 0) > 0 && (
                <Chip
                  label={`Sin módulo (${conteoPorModulo["—"]})`}
                  active={filtroModulo === "_sin_modulo"}
                  onClick={() => setFiltroModulo("_sin_modulo")}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold w-44">Fecha</th>
                    <th className="text-left px-3 py-2 font-semibold w-32">Módulo</th>
                    <th className="text-left px-3 py-2 font-semibold w-64">Actividad</th>
                    <th className="text-left px-3 py-2 font-semibold">Observaciones</th>
                    <th className="text-left px-3 py-2 font-semibold w-24">Recurso</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cargando movimientos…
                        </span>
                      </td>
                    </tr>
                  )}
                  {!loading && entradasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-500 text-sm">
                        {entradas.length === 0
                          ? "Este usuario aún no tiene movimientos registrados en la bitácora."
                          : "Ningún movimiento coincide con los filtros."}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    entradasFiltradas.map((e) => {
                      const mb = moduloBadge(e.modulo)
                      return (
                        <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 align-top">
                            <div className="text-slate-800">{formatFecha(e.fechamovimiento)}</div>
                            <div className="text-[11px] text-slate-500">{relativo(e.fechamovimiento)}</div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Badge className={`border ${mb.tone}`}>{mb.label}</Badge>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                              {actividadIcon(e.actividad)}
                              <span>{e.actividad ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top text-slate-700">
                            {e.observaciones ? (
                              <span className="whitespace-pre-wrap">{e.observaciones}</span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top">
                            {e.recursoid ? (
                              <span className="font-mono text-xs text-slate-600">#{e.recursoid}</span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  )
}

export default function BitacoraPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
        </div>
      }
    >
      <PageInner />
    </Suspense>
  )
}

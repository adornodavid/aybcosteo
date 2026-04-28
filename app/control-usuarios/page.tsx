"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  Calendar,
  Search,
  RotateCcw,
  Loader2,
  Filter,
  Mail,
  Building2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { obtenerControlUsuarios, UsuarioControl } from "@/app/actions/control-usuarios-actions"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-purple-100 text-purple-800 border-purple-200",
  AdminAsistente: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DirAlimentos: "bg-blue-100 text-blue-800 border-blue-200",
  DirCosteo: "bg-cyan-100 text-cyan-800 border-cyan-200",
  GerenteHotel: "bg-teal-100 text-teal-800 border-teal-200",
  Chef: "bg-orange-100 text-orange-800 border-orange-200",
}

export default function ControlUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioControl[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("todos")
  const [filtroRol, setFiltroRol] = useState<string>("")
  const { toast } = useToast()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // Guard de acceso: solo roles 1-4 pueden ver esta página
  const userRolId = Number(user?.RolId ?? 0)
  const isAuthorized = [1, 2, 3, 4].includes(userRolId)

  useEffect(() => {
    if (authLoading) return
    if (!user) return // AuthProvider redirige a login
    if (!isAuthorized) {
      router.replace("/dashboard")
      return
    }
    cargarUsuarios()
  }, [authLoading, user, isAuthorized, router])

  const cargarUsuarios = async () => {
    setLoading(true)
    try {
      const r = await obtenerControlUsuarios()
      if (r.success) {
        setUsuarios(r.data)
      } else {
        toast({ title: "Error", description: r.error || "No se pudo cargar", variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (s: string | null) => {
    if (!s) return "Sin acceso"
    const d = new Date(s)
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  const daysSince = (s: string | null): number | null => {
    if (!s) return null
    const ms = Date.now() - new Date(s).getTime()
    return Math.floor(ms / (1000 * 60 * 60 * 24))
  }

  const stats = useMemo(() => {
    const total = usuarios.length
    const activos = usuarios.filter((u) => u.activo).length
    const inactivos = total - activos
    const totalAccesos = usuarios.reduce((s, u) => s + u.cantidadaccesos, 0)
    const conAccesoReciente = usuarios.filter((u) => {
      const d = daysSince(u.fechaultimoacceso)
      return d !== null && d <= 7
    }).length
    return { total, activos, inactivos, totalAccesos, conAccesoReciente }
  }, [usuarios])

  const rolesUnicos = useMemo(
    () => Array.from(new Set(usuarios.map((u) => u.rolNombre).filter((r) => r && r !== "Sin rol"))).sort(),
    [usuarios],
  )

  const filtrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroEstado === "activos" && !u.activo) return false
      if (filtroEstado === "inactivos" && u.activo) return false
      if (filtroRol && u.rolNombre !== filtroRol) return false
      if (filtroNombre.trim()) {
        const term = filtroNombre.trim().toLowerCase()
        if (!u.nombrecompleto.toLowerCase().includes(term) && !u.email.toLowerCase().includes(term)) return false
      }
      return true
    })
  }, [usuarios, filtroNombre, filtroEstado, filtroRol])

  const handleLimpiar = () => {
    setFiltroNombre("")
    setFiltroEstado("todos")
    setFiltroRol("")
  }

  const initials = (n: string) =>
    n
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("")

  const accesosBadge = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-600 border-gray-200"
    if (count < 10) return "bg-blue-100 text-blue-700 border-blue-200"
    if (count < 50) return "bg-emerald-100 text-emerald-700 border-emerald-200"
    return "bg-amber-100 text-amber-800 border-amber-200"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#528A94]" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-[#528A94] via-[#5d8f72] to-[#3a7d6a] px-6 py-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Control de Usuarios</h1>
              <p className="text-white/85 text-sm mt-1">
                Monitoreo de acceso y actividad de usuarios del sistema
              </p>
            </div>
          </div>
          <Button
            onClick={cargarUsuarios}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-[#528A94] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</CardTitle>
              <Users className="h-4 w-4 text-[#528A94]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">usuarios registrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.activos}</div>
            <p className="text-xs text-gray-500 mt-1">cuentas habilitadas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">Inactivos</CardTitle>
              <UserX className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.inactivos}</div>
            <p className="text-xs text-gray-500 mt-1">sin acceso</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">Accesos</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalAccesos}</div>
            <p className="text-xs text-gray-500 mt-1">accesos acumulados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">Recientes</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.conAccesoReciente}</div>
            <p className="text-xs text-gray-500 mt-1">≤ 7 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#528A94]" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Buscar por nombre o email</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-8 focus-visible:ring-[#528A94]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#528A94] text-sm h-10"
              >
                <option value="todos">Todos</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Rol</label>
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#528A94] text-sm h-10"
              >
                <option value="">Todos los roles</option>
                {rolesUnicos.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" onClick={handleLimpiar} className="bg-transparent">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Listado de Usuarios</span>
            <Badge variant="outline" className="font-normal">
              {filtrados.length} de {usuarios.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No se encontraron usuarios con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold">Usuario</TableHead>
                    <TableHead className="font-semibold">Rol</TableHead>
                    <TableHead className="font-semibold">Hotel</TableHead>
                    <TableHead className="font-semibold text-center">Accesos</TableHead>
                    <TableHead className="font-semibold">Último acceso</TableHead>
                    <TableHead className="font-semibold">Registro</TableHead>
                    <TableHead className="font-semibold text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((u) => {
                    const dias = daysSince(u.fechaultimoacceso)
                    return (
                      <TableRow key={u.id} className="hover:bg-[#528A94]/5 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-2 ring-[#528A94]/15">
                              <AvatarImage src={u.imgurl || undefined} alt={u.nombrecompleto} />
                              <AvatarFallback className="bg-gradient-to-br from-[#528A94] to-[#5d8f72] text-white text-xs font-semibold">
                                {initials(u.nombrecompleto)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900 leading-tight">{u.nombrecompleto}</div>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                <Mail className="h-3 w-3" />
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${ROLE_COLORS[u.rolNombre] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            {u.rolNombre}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            {u.hotelNombre}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`font-mono font-bold ${accesosBadge(u.cantidadaccesos)}`}>
                            {u.cantidadaccesos}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.fechaultimoacceso ? (
                            <div>
                              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                {formatDate(u.fechaultimoacceso)}
                              </div>
                              {dias !== null && (
                                <div className="text-xs text-gray-500 mt-0.5 ml-5">
                                  {dias === 0 ? "Hoy" : dias === 1 ? "Ayer" : `Hace ${dias} días`}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Nunca ha ingresado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{formatDate(u.fechacreacion)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {u.activo ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                              Activo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500 inline-block"></span>
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

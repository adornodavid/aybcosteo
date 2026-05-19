"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RefreshCw, Plus, Search, X, Users, Filter, UserCheck, UserX, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  obtenerUsuarios,
  obtenerRoles,
  listaDesplegableHoteles,
  type UsuarioRow,
  type Rol,
  type HotelItem,
} from "@/app/actions/usuarios-actions"

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?"
}

export default function UsuariosAdminPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Rol[]>([])
  const [hoteles, setHoteles] = useState<HotelItem[]>([])

  const [filtroBusqueda, setFiltroBusqueda] = useState("")
  const [filtroRolId, setFiltroRolId] = useState("Todos")
  const [filtroEstatus, setFiltroEstatus] = useState("Todos")
  const [filtroHotelId, setFiltroHotelId] = useState("Todos")

  useEffect(() => {
    async function loadInicial() {
      const [resRoles, resHoteles] = await Promise.all([obtenerRoles(), listaDesplegableHoteles(false)])
      if (resRoles.success) setRoles(resRoles.data)
      if (resHoteles.success) setHoteles(resHoteles.data)
    }
    loadInicial()
  }, [])

  const loadUsuarios = useCallback(
    async (busqueda = "", rolid = -1, activo = "Todos", hotelid = -1) => {
      setLoading(true)
      const result = await obtenerUsuarios(busqueda, rolid, activo, hotelid)
      if (result.success) {
        setUsuarios(result.data)
      } else {
        toast.error(result.error || "Error al cargar usuarios")
        setUsuarios([])
      }
      setLoading(false)
    },
    [],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      const rolid = filtroRolId === "Todos" ? -1 : Number(filtroRolId)
      const hotelid = filtroHotelId === "Todos" ? -1 : Number(filtroHotelId)
      loadUsuarios(filtroBusqueda.trim(), rolid, filtroEstatus, hotelid)
    }, 300)
    return () => clearTimeout(timer)
  }, [filtroBusqueda, filtroRolId, filtroEstatus, filtroHotelId, loadUsuarios])

  function handleBuscar() {
    const rolid = filtroRolId === "Todos" ? -1 : Number(filtroRolId)
    const hotelid = filtroHotelId === "Todos" ? -1 : Number(filtroHotelId)
    loadUsuarios(filtroBusqueda.trim(), rolid, filtroEstatus, hotelid)
  }

  function handleLimpiar() {
    setFiltroBusqueda("")
    setFiltroRolId("Todos")
    setFiltroEstatus("Todos")
    setFiltroHotelId("Todos")
  }

  const totalUsuarios = usuarios.length
  const activos = usuarios.filter((u) => u.activo).length
  const inactivos = totalUsuarios - activos

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-lime-50 to-transparent rounded-xl border border-lime-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-lime-600/10">
            <Users className="h-5 w-5 text-lime-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
            <p className="text-sm text-muted-foreground">Gestión de usuarios del sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBuscar}
            title="Actualizar"
            className="hover:bg-lime-100 hover:border-lime-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => router.push("/admin/usuarios/crear")}
            className="bg-foreground text-background hover:bg-foreground/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-lime-200 bg-card overflow-hidden">
        <div className="flex items-center gap-2 bg-gradient-to-r from-lime-50 to-transparent px-4 py-3 border-b border-lime-200/60">
          <Filter className="h-4 w-4 text-lime-600" />
          <h2 className="text-sm font-semibold">Filtros</h2>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  placeholder="Nombre o email..."
                  className="h-9 pl-9"
                  onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                />
              </div>
            </div>
            <div className="space-y-1.5 w-[180px]">
              <label className="text-xs font-semibold text-muted-foreground">Rol</label>
              <Select value={filtroRolId} onValueChange={setFiltroRolId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-[150px]">
              <label className="text-xs font-semibold text-muted-foreground">Estatus</label>
              <Select value={filtroEstatus} onValueChange={setFiltroEstatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-[220px]">
              <label className="text-xs font-semibold text-muted-foreground">Hoteles</label>
              <Select value={filtroHotelId} onValueChange={setFiltroHotelId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>
                      {hotel.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleLimpiar}
              className="h-9 gap-2 hover:bg-lime-50 hover:border-lime-300"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-lime-200 bg-gradient-to-br from-lime-50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Total Usuarios</p>
            <Users className="h-4 w-4 text-lime-600" />
          </div>
          <p className="text-2xl font-bold mt-2">{totalUsuarios}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Activos</p>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{activos}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Inactivos</p>
            <UserX className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{inactivos}</p>
        </div>
      </div>

      <div className="rounded-xl border border-lime-200 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-lime-50 to-transparent">
              <TableHead className="w-[60px]"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Hotel</TableHead>
              <TableHead>Accesos</TableHead>
              <TableHead>Último acceso</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((u) => (
                <TableRow key={u.id} className="hover:bg-lime-50/40">
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      {u.imgurl ? <AvatarImage src={u.imgurl} alt={u.nombrecompleto} /> : null}
                      <AvatarFallback className="bg-lime-100 text-lime-700 text-xs font-semibold">
                        {iniciales(u.nombrecompleto)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{u.nombrecompleto}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-lime-300 bg-lime-50 text-lime-800">
                      {u.rolNombre}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.hotelNombre}</TableCell>
                  <TableCell>{u.cantidadaccesos}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.fechaultimoacceso ? new Date(u.fechaultimoacceso).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    {u.activo ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
                        <UserCheck className="h-3 w-3" /> Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
                        <UserX className="h-3 w-3" /> Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm" className="hover:bg-lime-100">
                      <Link href={`/admin/usuarios/editar?id=${u.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

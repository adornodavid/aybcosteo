"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Shield, Edit, Trash2, Lock, Unlock } from "lucide-react"
import Link from "next/link"

// Datos de ejemplo para permisos
const permisosEjemplo = [
  {
    id: 1,
    nombre: "Crear Ingredientes",
    descripcion: "Permite crear nuevos ingredientes",
    activo: true,
    fechacreacion: "2024-01-01",
    modulo: "Ingredientes",
  },
  {
    id: 2,
    nombre: "Editar Ingredientes",
    descripcion: "Permite modificar ingredientes existentes",
    activo: true,
    fechacreacion: "2024-01-01",
    modulo: "Ingredientes",
  },
  {
    id: 3,
    nombre: "Eliminar Ingredientes",
    descripcion: "Permite eliminar ingredientes",
    activo: true,
    fechacreacion: "2024-01-01",
    modulo: "Ingredientes",
  },
  {
    id: 4,
    nombre: "Ver Reportes",
    descripcion: "Acceso a reportes y análisis",
    activo: true,
    fechacreacion: "2024-01-01",
    modulo: "Reportes",
  },
  {
    id: 5,
    nombre: "Gestionar Usuarios",
    descripcion: "Administrar usuarios del sistema",
    activo: true,
    fechacreacion: "2024-01-01",
    modulo: "Administración",
  },
  {
    id: 6,
    nombre: "Crear Platillos",
    descripcion: "Permite crear nuevos platillos",
    activo: false,
    fechacreacion: "2024-01-01",
    modulo: "Cocina",
  },
]

const modulos = ["Todos", "Ingredientes", "Cocina", "Reportes", "Administración"]

export default function PermisosPage() {
  const [permisos, setPermisos] = useState(permisosEjemplo)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModulo, setSelectedModulo] = useState("Todos")
  const [selectedEstado, setSelectedEstado] = useState("todos")

  const filteredPermisos = permisos.filter((permiso) => {
    const matchesSearch =
      permiso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permiso.descripcion.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesModulo = selectedModulo === "Todos" || permiso.modulo === selectedModulo
    const matchesEstado =
      selectedEstado === "todos" ||
      (selectedEstado === "activo" && permiso.activo) ||
      (selectedEstado === "inactivo" && !permiso.activo)

    return matchesSearch && matchesModulo && matchesEstado
  })

  const permisosActivos = permisos.filter((p) => p.activo).length
  const permisosPorModulo = modulos.slice(1).map((modulo) => ({
    modulo,
    count: permisos.filter((p) => p.modulo === modulo).length,
  }))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Permisos</h1>
          <p className="text-muted-foreground mt-2">Administra los permisos del sistema por módulo</p>
        </div>
        <Button asChild>
          <Link href="/permisos/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Permiso
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Permisos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permisos.length}</div>
            <p className="text-xs text-muted-foreground">permisos definidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Permisos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{permisosActivos}</div>
            <p className="text-xs text-muted-foreground">habilitados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Módulos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modulos.length - 1}</div>
            <p className="text-xs text-muted-foreground">módulos del sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Más Permisos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {permisosPorModulo.reduce(
                (max, current) => (current.count > max.count ? current : max),
                permisosPorModulo[0],
              )?.modulo || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">módulo con más permisos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Módulo</label>
              <Select value={selectedModulo} onValueChange={setSelectedModulo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modulos.map((modulo) => (
                    <SelectItem key={modulo} value={modulo}>
                      {modulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedModulo("Todos")
                  setSelectedEstado("todos")
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Permisos */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos del Sistema</CardTitle>
          <CardDescription>{filteredPermisos.length} permiso(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPermisos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron permisos</p>
              <p className="text-sm">Ajusta los filtros o crea un nuevo permiso</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/permisos/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Permiso
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermisos.map((permiso) => (
                  <TableRow key={permiso.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {permiso.activo ? (
                          <Unlock className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-red-500" />
                        )}
                        {permiso.nombre}
                      </div>
                    </TableCell>
                    <TableCell>{permiso.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{permiso.modulo}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={permiso.activo ? "default" : "secondary"}>
                        {permiso.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(permiso.fechacreacion).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/permisos/${permiso.id}/editar`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Users, Edit, Trash2, UserCheck, UserX } from "lucide-react"
import Link from "next/link"

// Datos de ejemplo para usuarios
const usuariosEjemplo = [
  {
    id: 1,
    nombre: "Juan Pérez",
    email: "juan.perez@hotel.com",
    password: "***",
    rolid: 1,
    activo: true,
    fechacreacion: "2024-01-15",
    rol: "Administrador",
  },
  {
    id: 2,
    nombre: "María García",
    email: "maria.garcia@hotel.com",
    password: "***",
    rolid: 2,
    activo: true,
    fechacreacion: "2024-01-10",
    rol: "Chef",
  },
  {
    id: 3,
    nombre: "Carlos López",
    email: "carlos.lopez@hotel.com",
    password: "***",
    rolid: 3,
    activo: false,
    fechacreacion: "2024-01-05",
    rol: "Mesero",
  },
]

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState(usuariosEjemplo)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRol, setSelectedRol] = useState("todos")
  const [selectedEstado, setSelectedEstado] = useState("todos")

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRol = selectedRol === "todos" || usuario.rolid.toString() === selectedRol
    const matchesEstado =
      selectedEstado === "todos" ||
      (selectedEstado === "activo" && usuario.activo) ||
      (selectedEstado === "inactivo" && !usuario.activo)

    return matchesSearch && matchesRol && matchesEstado
  })

  const usuariosActivos = usuarios.filter((u) => u.activo).length
  const usuariosInactivos = usuarios.filter((u) => !u.activo).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-2">Administra los usuarios del sistema</p>
        </div>
        <Button asChild>
          <Link href="/usuarios/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.length}</div>
            <p className="text-xs text-muted-foreground">usuarios registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{usuariosActivos}</div>
            <p className="text-xs text-muted-foreground">pueden acceder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{usuariosInactivos}</div>
            <p className="text-xs text-muted-foreground">sin acceso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Roles Diferentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">tipos de rol</p>
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
                  placeholder="Nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select value={selectedRol} onValueChange={setSelectedRol}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los roles</SelectItem>
                  <SelectItem value="1">Administrador</SelectItem>
                  <SelectItem value="2">Chef</SelectItem>
                  <SelectItem value="3">Mesero</SelectItem>
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
                  setSelectedRol("todos")
                  setSelectedEstado("todos")
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>{filteredUsuarios.length} usuario(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsuarios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron usuarios</p>
              <p className="text-sm">Ajusta los filtros o crea un nuevo usuario</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/usuarios/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Usuario
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nombre}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{usuario.rol}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.activo ? "default" : "secondary"}>
                        {usuario.activo ? (
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Activo
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <UserX className="h-3 w-3" />
                            Inactivo
                          </div>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(usuario.fechacreacion).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/usuarios/${usuario.id}/editar`}>
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

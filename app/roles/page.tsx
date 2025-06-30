"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, UserCheck, Edit, Trash2, Shield } from "lucide-react"
import Link from "next/link"

// Datos de ejemplo para roles
const rolesEjemplo = [
  {
    id: 1,
    nombre: "Administrador",
    descripcion: "Acceso completo al sistema",
    activo: true,
    fechacreacion: "2024-01-01",
    usuariosCount: 2,
  },
  {
    id: 2,
    nombre: "Chef",
    descripcion: "Gestión de cocina y platillos",
    activo: true,
    fechacreacion: "2024-01-01",
    usuariosCount: 3,
  },
  {
    id: 3,
    nombre: "Mesero",
    descripcion: "Acceso a menús y pedidos",
    activo: true,
    fechacreacion: "2024-01-01",
    usuariosCount: 5,
  },
  {
    id: 4,
    nombre: "Gerente",
    descripcion: "Supervisión y reportes",
    activo: false,
    fechacreacion: "2024-01-01",
    usuariosCount: 0,
  },
]

export default function RolesPage() {
  const [roles, setRoles] = useState(rolesEjemplo)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRoles = roles.filter(
    (rol) =>
      rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rol.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const rolesActivos = roles.filter((r) => r.activo).length
  const totalUsuarios = roles.reduce((sum, r) => sum + r.usuariosCount, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Roles</h1>
          <p className="text-muted-foreground mt-2">Administra los roles y permisos del sistema</p>
        </div>
        <Button asChild>
          <Link href="/roles/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Rol
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">roles definidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Roles Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{rolesActivos}</div>
            <p className="text-xs text-muted-foreground">en uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Asignados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsuarios}</div>
            <p className="text-xs text-muted-foreground">con roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Permisos Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">por rol</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles del Sistema</CardTitle>
          <CardDescription>{filteredRoles.length} rol(es) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron roles</p>
              <p className="text-sm">Crea el primer rol para comenzar</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/roles/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Rol
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((rol) => (
                  <TableRow key={rol.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {rol.nombre}
                      </div>
                    </TableCell>
                    <TableCell>{rol.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <UserCheck className="h-3 w-3 mr-1" />
                        {rol.usuariosCount} usuarios
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rol.activo ? "default" : "secondary"}>{rol.activo ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                    <TableCell>{new Date(rol.fechacreacion).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/roles/${rol.id}/permisos`}>
                            <Shield className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/roles/${rol.id}/editar`}>
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

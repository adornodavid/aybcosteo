"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, BookOpen, Edit, Trash2, Clock, Users } from "lucide-react"
import Link from "next/link"

// Datos de ejemplo para recetas
const recetasEjemplo = [
  {
    id: 1,
    nombre: "Salsa Marinara",
    descripcion: "Salsa base para pasta italiana",
    tiempoPreparacion: "30 min",
    porciones: 4,
    activo: true,
    fechaCreacion: "2024-01-15",
  },
  {
    id: 2,
    nombre: "Masa para Pizza",
    descripcion: "Masa tradicional italiana",
    tiempoPreparacion: "2 horas",
    porciones: 8,
    activo: true,
    fechaCreacion: "2024-01-10",
  },
]

export default function RecetasPage() {
  const [recetas, setRecetas] = useState(recetasEjemplo)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRecetas = recetas.filter(
    (receta) =>
      receta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receta.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Recetas</h1>
          <p className="text-muted-foreground mt-2">Administra las recetas base para tus platillos</p>
        </div>
        <Button asChild>
          <Link href="/recetas/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Receta
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recetas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecetas.length}</div>
            <p className="text-xs text-muted-foreground">recetas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recetas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecetas.filter((r) => r.activo).length}</div>
            <p className="text-xs text-muted-foreground">en uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 min</div>
            <p className="text-xs text-muted-foreground">preparación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Porciones Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">por receta</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Recetas</CardTitle>
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

      {/* Lista de Recetas */}
      <Card>
        <CardHeader>
          <CardTitle>Recetas Registradas</CardTitle>
          <CardDescription>{filteredRecetas.length} receta(s) encontrada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecetas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron recetas</p>
              <p className="text-sm">Crea tu primera receta para comenzar</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/recetas/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Receta
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Porciones</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecetas.map((receta) => (
                  <TableRow key={receta.id}>
                    <TableCell className="font-medium">{receta.nombre}</TableCell>
                    <TableCell>{receta.descripcion}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {receta.tiempoPreparacion}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {receta.porciones}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={receta.activo ? "default" : "secondary"}>
                        {receta.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/recetas/${receta.id}`}>
                            <BookOpen className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/recetas/${receta.id}/editar`}>
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

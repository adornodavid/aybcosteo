"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Scale } from "lucide-react"

// Unidades de medida predefinidas
const unidadesPredefinidas = [
  { id: "1", nombre: "Kilogramo", abreviacion: "kg", tipo: "Peso", factor_conversion: 1000 },
  { id: "2", nombre: "Gramo", abreviacion: "g", tipo: "Peso", factor_conversion: 1 },
  { id: "3", nombre: "Litro", abreviacion: "l", tipo: "Volumen", factor_conversion: 1000 },
  { id: "4", nombre: "Mililitro", abreviacion: "ml", tipo: "Volumen", factor_conversion: 1 },
  { id: "5", nombre: "Pieza", abreviacion: "pz", tipo: "Unidad", factor_conversion: 1 },
  { id: "6", nombre: "Unidad", abreviacion: "u", tipo: "Unidad", factor_conversion: 1 },
  { id: "7", nombre: "Caja", abreviacion: "caja", tipo: "Empaque", factor_conversion: 1 },
  { id: "8", nombre: "Paquete", abreviacion: "paq", tipo: "Empaque", factor_conversion: 1 },
  { id: "9", nombre: "Bolsa", abreviacion: "bolsa", tipo: "Empaque", factor_conversion: 1 },
  { id: "10", nombre: "Lata", abreviacion: "lata", tipo: "Empaque", factor_conversion: 1 },
]

export default function UnidadesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [unidades] = useState(unidadesPredefinidas)

  // Filtrar unidades por término de búsqueda
  const filteredUnidades = unidades.filter(
    (unidad) =>
      unidad.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidad.abreviacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidad.tipo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Unidades de Medida</h1>
          <p className="text-muted-foreground">Gestiona las unidades de medida del sistema</p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Unidad
          <span className="text-xs ml-2">(Próximamente)</span>
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Unidades</p>
                <p className="text-2xl font-bold">{filteredUnidades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Peso</p>
                <p className="text-2xl font-bold">{filteredUnidades.filter((u) => u.tipo === "Peso").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Volumen</p>
                <p className="text-2xl font-bold">{filteredUnidades.filter((u) => u.tipo === "Volumen").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Otros</p>
                <p className="text-2xl font-bold">
                  {filteredUnidades.filter((u) => !["Peso", "Volumen"].includes(u.tipo)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de unidades */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Unidades Disponibles</CardTitle>
              <CardDescription>
                {filteredUnidades.length} unidad(es) encontrada(s)
                {searchTerm && ` para "${searchTerm}"`}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar unidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUnidades.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron unidades</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Abreviación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Factor de Conversión</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnidades.map((unidad) => (
                  <TableRow key={unidad.id}>
                    <TableCell className="font-medium">{unidad.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{unidad.abreviacion}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          unidad.tipo === "Peso" ? "default" : unidad.tipo === "Volumen" ? "secondary" : "outline"
                        }
                      >
                        {unidad.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{unidad.factor_conversion}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500" disabled>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
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

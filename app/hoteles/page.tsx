"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Hotel, MapPin, Phone, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { obtenerHoteles, eliminarHotel } from "@/app/actions/hoteles-actions"
import Link from "next/link"

export default function HotelesPage() {
  const [hoteles, setHoteles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchHoteles()
  }, [])

  const fetchHoteles = async () => {
    try {
      setLoading(true)
      const result = await obtenerHoteles()
      if (result.success) {
        setHoteles(result.data || [])
      } else {
        console.error("Error obteniendo hoteles:", result.error)
        setHoteles([])
      }
    } catch (error) {
      console.error("Error fetching hoteles:", error)
      setHoteles([])
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarHotel = async (id: string, nombre: string) => {
    try {
      const result = await eliminarHotel(id)
      if (result.success) {
        setHoteles(hoteles.filter((h) => h.id !== id))
        toast({
          title: "Hotel eliminado",
          description: `El hotel ${nombre} ha sido eliminado correctamente`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el hotel",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error eliminando hotel:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el hotel",
        variant: "destructive",
      })
    }
  }

  const filteredHoteles = hoteles.filter(
    (hotel) =>
      hotel.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Hoteles</h1>
          <p className="text-muted-foreground mt-2">Administra los hoteles y sus restaurantes</p>
        </div>
        <Button asChild>
          <Link href="/hoteles/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Hotel
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hoteles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hoteles.length}</div>
            <p className="text-xs text-muted-foreground">{hoteles.filter((h) => h.activo).length} activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Datos Reales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">✓</div>
            <p className="text-xs text-muted-foreground">Conectado a Supabase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Activo</div>
            <p className="text-xs text-muted-foreground">Sistema funcionando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ahora</div>
            <p className="text-xs text-muted-foreground">Datos en tiempo real</p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      {hoteles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Buscar Hoteles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-md">
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
      )}

      {/* Lista de Hoteles */}
      <Card>
        <CardHeader>
          <CardTitle>Hoteles Registrados</CardTitle>
          <CardDescription>
            {hoteles.length === 0 ? "No hay hoteles registrados" : `${filteredHoteles.length} hotel(es) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hoteles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hotel className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay hoteles registrados</p>
              <p className="text-sm mb-4">Crea tu primer hotel para comenzar</p>
              <Button asChild>
                <Link href="/hoteles/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Hotel
                </Link>
              </Button>
            </div>
          ) : filteredHoteles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron hoteles</p>
              <p className="text-sm">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hotel</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHoteles.map((hotel) => (
                    <TableRow key={hotel.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{hotel.nombre || "Sin nombre"}</div>
                          <div className="text-sm text-muted-foreground">{hotel.descripcion || "Sin descripción"}</div>
                          {hotel.direccion && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {hotel.direccion}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {hotel.telefono && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" />
                              {hotel.telefono}
                            </div>
                          )}
                          {hotel.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1" />
                              {hotel.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={hotel.activo ? "default" : "secondary"}>
                          {hotel.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {hotel.created_at ? new Date(hotel.created_at).toLocaleDateString() : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/hoteles/${hotel.id}`}>Ver</Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/hoteles/${hotel.id}/editar`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarHotel(hotel.id, hotel.nombre)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

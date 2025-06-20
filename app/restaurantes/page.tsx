import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Store, AlertTriangle, MapPin, Phone, Mail, Building2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function RestaurantesPage() {
  // Obtener restaurantes sin JOIN por ahora
  const { data: restaurantes, error } = await supabase
    .from("restaurantes")
    .select("*")
    .order("created_at", { ascending: false })

  console.log("Restaurantes encontrados:", restaurantes?.length || 0)
  if (restaurantes?.length) {
    console.log("Primer restaurante:", restaurantes[0])
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Restaurantes</h1>
          <p className="text-muted-foreground">Gestiona los restaurantes de tus hoteles</p>
        </div>
        <Button asChild>
          <Link href="/restaurantes/crear">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Restaurante
          </Link>
        </Button>
      </div>

      {error && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>No se pudieron cargar los restaurantes. Por favor, intenta de nuevo.</p>
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {!error && (!restaurantes || restaurantes.length === 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>No hay restaurantes</CardTitle>
            <CardDescription>Crea tu primer restaurante para comenzar a gestionar menús e ingredientes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8 space-y-4">
            <Store className="h-16 w-16 text-muted-foreground opacity-50" />
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Los restaurantes pueden estar asignados a un hotel específico o ser independientes
              </p>
              <Button asChild>
                <Link href="/restaurantes/crear">
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Primer Restaurante
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurantes?.map((restaurante) => (
          <Card key={restaurante.id} className="overflow-hidden">
            <div className="h-40 bg-muted relative">
              {restaurante.imagen_url ? (
                <Image
                  src={restaurante.imagen_url || "/placeholder.svg"}
                  alt={restaurante.nombre}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-orange-50 to-red-50">
                  <Store className="h-16 w-16 text-muted-foreground opacity-20" />
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{restaurante.nombre}</div>
                  {/* Mostrar hotel si existe */}
                  {restaurante.hotel_id ? (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Building2 className="h-3 w-3 mr-1" />
                      Hotel Asignado
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Store className="h-3 w-3 mr-1" />
                      Restaurante Independiente
                    </div>
                  )}
                </div>
                {restaurante.activo !== false ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Activo</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Inactivo</span>
                )}
              </CardTitle>
              {restaurante.descripcion && <CardDescription>{restaurante.descripcion}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-2">
              {restaurante.direccion && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{restaurante.direccion}</span>
                </div>
              )}
              {restaurante.telefono && (
                <div className="flex items-center text-sm">
                  <Phone className="h-3 w-3 mr-2" />
                  <span>{restaurante.telefono}</span>
                </div>
              )}
              {restaurante.email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-3 w-3 mr-2" />
                  <span className="truncate">{restaurante.email}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href={`/restaurantes/${restaurante.id}`}>Ver Detalles</Link>
              </Button>
              <Button asChild>
                <Link href={`/restaurantes/${restaurante.id}/menus`}>Ver Menús</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

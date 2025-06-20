"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Hotel, CheckCircle } from "lucide-react"
import Link from "next/link"
import { crearHotel } from "@/app/actions/hoteles-actions" // ✅ CORREGIDO
import { useFormState } from "react-dom"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function NuevoHotelPage() {
  const [state, formAction] = useFormState(crearHotel, { success: false, error: null }) // ✅ Solo 2 parámetros
  const router = useRouter()

  // Manejar redirección cuando sea exitoso
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/hoteles")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state?.success, router])

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/hoteles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Crear Nuevo Hotel</h1>
          <p className="text-muted-foreground">Agrega un nuevo hotel al sistema</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Información del Hotel
          </CardTitle>
          <CardDescription>
            Completa la información básica del hotel para comenzar a gestionar sus restaurantes e ingredientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {state.message || "Hotel creado exitosamente"}. Redirigiendo...
              </AlertDescription>
            </Alert>
          )}

          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Hotel *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: Hotel Plaza Central"
                required
                minLength={2}
                maxLength={100}
                disabled={state?.success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                placeholder="Ej: Hotel de lujo ubicado en el centro de la ciudad..."
                rows={3}
                maxLength={500}
                disabled={state?.success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                name="direccion"
                placeholder="Ej: Av. Principal 123, Col. Centro, Ciudad, CP 12345"
                rows={2}
                maxLength={300}
                disabled={state?.success}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="Ej: +52 55 1234 5678"
                  maxLength={20}
                  disabled={state?.success}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Ej: contacto@hotel.com"
                  maxLength={100}
                  disabled={state?.success}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortname">Nombre Corto (Opcional)</Label>
              <Input
                id="shortname"
                name="shortname"
                placeholder="Ej: Plaza, Central, Vista"
                maxLength={20}
                disabled={state?.success}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={state?.success}>
                {state?.success ? "Hotel Creado ✓" : "Crear Hotel"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/hoteles">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

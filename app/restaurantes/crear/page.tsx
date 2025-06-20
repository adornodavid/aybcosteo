"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { crearRestaurante } from "@/app/actions/restaurantes-actions"
import { useFormState } from "react-dom"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export default function CrearRestaurantePage() {
  const router = useRouter()
  const [state, formAction] = useFormState(crearRestaurante, { error: null })
  const [isPending, startTransition] = useTransition()

  return (
    <div className="container py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/restaurantes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Crear Nuevo Restaurante</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Restaurante</CardTitle>
          <CardDescription>
            Completa la información básica del restaurante para comenzar a gestionar sus ingredientes y menús.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <form action={(formData) => startTransition(() => formAction(formData))} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Restaurante *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: La Cocina de María"
                required
                minLength={2}
                maxLength={100}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                name="direccion"
                placeholder="Ej: Av. Principal 123, Col. Centro"
                rows={2}
                maxLength={500}
                disabled={isPending}
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
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Ej: contacto@restaurante.com"
                  maxLength={100}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Creando..." : "Crear Restaurante"}
              </Button>
              <Button type="button" variant="outline" asChild disabled={isPending}>
                <Link href="/restaurantes">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

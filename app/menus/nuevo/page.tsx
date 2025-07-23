"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "@/components/ui/loader2"
import { useToast } from "@/hooks/use-toast" // Mantener si se usa en otros lugares, aunque no para los errores de handleSubmit
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { crearMenu } from "@/app/actions/menus-actions"
import { obtenerHoteles } from "@/app/actions/ingredientes-actions" // Reutilizando obtenerHoteles
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast as sonnerToast } from "sonner" // Mantener si se usa en otros lugares, aunque no para los errores de handleSubmit
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Hotel {
  id: number
  nombre: string
}

interface Restaurante {
  id: number
  nombre: string
}

export default function NuevoMenuPage() {
  const router = useRouter()
  const { toast } = useToast() // Se mantiene por si se usa en otros contextos, pero no para los errores de handleSubmit

  const { user, isLoading: authLoading } = useAuth()

  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [hotelId, setHotelId] = useState<string>("")
  const [restauranteId, setRestauranteId] = useState<string>("")
  const [activo, setActivo] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)

  // Estados para los AlertDialogs
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [newMenuId, setNewMenuId] = useState<number | null>(null)
  const [showIncompleteFieldsDialog, setShowIncompleteFieldsDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])

  const esAdmin = useMemo(() => user && [1, 2, 3, 4].includes(user.RolId), [user])

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }
      cargarDatosIniciales()
    }
  }, [authLoading, user, router])

  const cargarDatosIniciales = async () => {
    setLoadingPage(true)
    try {
      const hotelesResult = await obtenerHoteles()
      if (hotelesResult.success && hotelesResult.data) {
        setHoteles(hotelesResult.data)
        if (!esAdmin && user?.HotelId) {
          setHotelId(user.HotelId.toString())
          await cargarRestaurantes(user.HotelId)
        }
      } else {
        sonnerToast.error("Error al cargar hoteles", { description: hotelesResult.error })
      }
    } catch (error) {
      console.error("Error cargando datos iniciales:", error)
      sonnerToast.error("Error inesperado al cargar datos iniciales.")
    } finally {
      setLoadingPage(false)
    }
  }

  const cargarRestaurantes = async (selectedHotelId: number) => {
    if (selectedHotelId === -1) {
      setRestaurantes([])
      setRestauranteId("")
      return
    }
    try {
      const { data, error } = await supabase
        .from("restaurantes")
        .select("id, nombre")
        .eq("hotelid", selectedHotelId)
        .order("nombre")

      if (error) {
        console.error("Error cargando restaurantes:", error)
        sonnerToast.error("Error al cargar restaurantes.")
        setRestaurantes([])
      } else {
        setRestaurantes(data || [])
        setRestauranteId("") // Resetear el restaurante seleccionado
      }
    } catch (error) {
      console.error("Error inesperado al cargar restaurantes:", error)
      sonnerToast.error("Error inesperado al cargar restaurantes.")
    }
  }

  const handleHotelChange = (value: string) => {
    setHotelId(value)
    const selectedHotelId = Number.parseInt(value, 10)
    cargarRestaurantes(selectedHotelId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!nombre || !hotelId || !restauranteId) {
      setShowIncompleteFieldsDialog(true) // Mostrar AlertDialog de campos incompletos
      setIsSubmitting(false)
      return
    }

    try {
      const result = await crearMenu({
        nombre,
        descripcion,
        hotelid: Number.parseInt(hotelId, 10),
        restauranteid: Number.parseInt(restauranteId, 10),
        activo,
      })

      if (result.success) {
        const getMenuid = result.data?.id // Asignar el nuevo ID a getMenuid
        if (getMenuid) {
          setNewMenuId(getMenuid)
          setShowConfirmationDialog(true) // Mostrar el modal de confirmación
        } else {
          // Fallback si por alguna razón no se obtiene el ID
          setErrorMessage("El menú ha sido creado exitosamente, pero no se pudo obtener el ID para agregar recetas.")
          setShowErrorDialog(true)
          router.push("/menus") // Redirigir a /menus si no hay ID para agregar recetas
        }
      } else {
        setErrorMessage(result.error || "Hubo un problema al crear el menú.")
        setShowErrorDialog(true) // Mostrar AlertDialog de error
      }
    } catch (error) {
      console.error("Error inesperado al enviar el formulario:", error)
      setErrorMessage("Ocurrió un error inesperado al procesar tu solicitud.")
      setShowErrorDialog(true) // Mostrar AlertDialog de error inesperado
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingPage) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Crear Nuevo Menú</CardTitle>
          <CardDescription>Completa los campos para registrar un nuevo menú en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="nombre"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Nombre del Menú
                </label>
                <Input
                  id="nombre"
                  placeholder="Ej. Menú Desayuno, Menú Cena Especial"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="descripcion"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Descripción
                </label>
                <Textarea
                  id="descripcion"
                  placeholder="Breve descripción del menú..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="hotel"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Hotel
                </label>
                <Select value={hotelId} onValueChange={handleHotelChange} disabled={!esAdmin}>
                  <SelectTrigger id="hotel">
                    <SelectValue placeholder="Selecciona un hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoteles.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id.toString()}>
                        {hotel.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="restaurante"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Restaurante
                </label>
                <Select
                  value={restauranteId}
                  onValueChange={setRestauranteId}
                  disabled={!hotelId || restaurantes.length === 0}
                >
                  <SelectTrigger id="restaurante">
                    <SelectValue placeholder="Selecciona un restaurante" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantes.map((restaurante) => (
                      <SelectItem key={restaurante.id} value={restaurante.id.toString()}>
                        {restaurante.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="activo" checked={activo} onCheckedChange={(checked) => setActivo(Boolean(checked))} />
                <label
                  htmlFor="activo"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Activo
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Menú"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* AlertDialog de confirmación de éxito */}
      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Menú Registrado Exitosamente</AlertDialogTitle>
            <AlertDialogDescription>¿Deseas agregar recetas a este nuevo menú?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowConfirmationDialog(false)
                router.push("/menus")
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmationDialog(false)
                if (newMenuId) {
                  router.push(`/menus/${newMenuId}/agregar`)
                } else {
                  router.push("/menus") // Fallback si newMenuId es null por alguna razón
                }
              }}
            >
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para campos incompletos */}
      <AlertDialog open={showIncompleteFieldsDialog} onOpenChange={setShowIncompleteFieldsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Campos Incompletos</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, completa todos los campos obligatorios (Nombre, Hotel, Restaurante).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowIncompleteFieldsDialog(false)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para errores generales */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error al crear menú</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

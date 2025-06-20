"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { crearIngrediente, obtenerCategorias } from "@/app/actions/ingredientes-actions" // ✅ CORREGIDO
import { obtenerHoteles } from "@/app/actions/hoteles-actions"
import { useToast } from "@/hooks/use-toast" // ✅ CORREGIDO - usar hook local
import Link from "next/link"

interface Hotel {
  id: string
  nombre: string
}

interface Categoria {
  id: string
  nombre: string
}

export default function NuevoIngredientePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])

  const [formData, setFormData] = useState({
    clave: "",
    restaurante_id: "",
    descripcion: "",
    categoria_id: "",
    status: "activo",
    tipo: "",
    unidad_medida: "",
    cantidad_por_presentacion: "1.0",
    conversion: "",
    precio_inicial: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoadingData(true)

      // Obtener hoteles/restaurantes
      const hotelesResult = await obtenerHoteles()
      if (hotelesResult.success && hotelesResult.data) {
        const hotelesFormateados = hotelesResult.data.map((hotel: any) => ({
          id: hotel.id || hotel.Id || hotel.ID,
          nombre: hotel.nombre || hotel.Nombre || hotel.name || "Sin nombre",
        }))
        setHoteles(hotelesFormateados)
      } else {
        setHoteles([])
      }

      // Obtener categorías
      const categoriasResult = await obtenerCategorias()
      if (categoriasResult.success && categoriasResult.data) {
        const categoriasFormateadas = categoriasResult.data.map((categoria: any) => ({
          id: categoria.id || categoria.Id || categoria.ID,
          nombre: categoria.nombre || categoria.Nombre || categoria.name || "Sin nombre",
        }))
        setCategorias(categoriasFormateadas)
      } else {
        setCategorias([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clave || !formData.descripcion || !formData.restaurante_id) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const ingredienteData = {
        clave: formData.clave,
        descripcion: formData.descripcion,
        categoria_id: formData.categoria_id || null,
        status: formData.status,
        tipo: formData.tipo || null,
        unidad_medida: formData.unidad_medida || null,
        cantidad_por_presentacion: Number.parseFloat(formData.cantidad_por_presentacion) || 1.0,
        conversion: formData.conversion || null,
        restaurante_id: formData.restaurante_id,
        precio_inicial: Number.parseFloat(formData.precio_inicial) || 0,
      }

      const result = await crearIngrediente(ingredienteData)

      if (result.success) {
        toast({
          title: "Ingrediente creado",
          description: `El ingrediente ${formData.descripcion} ha sido creado correctamente`,
        })
        router.push("/ingredientes")
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el ingrediente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating ingrediente:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el ingrediente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (loadingData) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando formulario...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/ingredientes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Ingrediente</h1>
          <p className="text-muted-foreground">Registra un nuevo ingrediente en el sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos principales del ingrediente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clave">Código del Ingrediente *</Label>
                    <Input
                      id="clave"
                      value={formData.clave}
                      onChange={(e) => handleInputChange("clave", e.target.value)}
                      placeholder="Ej: ING001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restaurante">Restaurante *</Label>
                    <Select
                      value={formData.restaurante_id}
                      onValueChange={(value) => handleInputChange("restaurante_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar restaurante" />
                      </SelectTrigger>
                      <SelectContent>
                        {hoteles.length === 0 ? (
                          <SelectItem value="no-data" disabled>
                            No hay restaurantes disponibles
                          </SelectItem>
                        ) : (
                          hoteles.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id}>
                              {hotel.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Nombre del Ingrediente *</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange("descripcion", e.target.value)}
                    placeholder="Ej: Tomate Roma"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading || hoteles.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Guardando..." : "Crear Ingrediente"}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/ingredientes">Cancelar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

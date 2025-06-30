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
import {
  crearIngrediente,
  obtenerCategorias,
  obtenerHoteles,
  obtenerUnidadesMedida,
} from "@/app/actions/ingredientes-actions-real"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Hotel, CategoriaIngrediente, TipoUnidadMedida } from "@/lib/supabase-real"

export default function NuevoIngredientePageReal() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>([])
  const [unidades, setUnidades] = useState<TipoUnidadMedida[]>([])

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    categoriaid: "",
    costo: "",
    unidadmedidaid: "",
    hotelid: "",
    imgurl: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoadingData(true)

      const [hotelesResult, categoriasResult, unidadesResult] = await Promise.all([
        obtenerHoteles(),
        obtenerCategorias(),
        obtenerUnidadesMedida(),
      ])

      if (hotelesResult.success) {
        setHoteles(hotelesResult.data)
      }

      if (categoriasResult.success) {
        setCategorias(categoriasResult.data)
      }

      if (unidadesResult.success) {
        setUnidades(unidadesResult.data)
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

    if (!formData.codigo || !formData.nombre || !formData.hotelid) {
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
        codigo: formData.codigo,
        nombre: formData.nombre,
        categoriaid: formData.categoriaid ? Number.parseInt(formData.categoriaid) : undefined,
        costo: Number.parseFloat(formData.costo) || 0,
        unidadmedidaid: formData.unidadmedidaid ? Number.parseInt(formData.unidadmedidaid) : undefined,
        hotelid: Number.parseInt(formData.hotelid),
        imgurl: formData.imgurl || undefined,
      }

      const result = await crearIngrediente(ingredienteData)

      if (result.success) {
        toast({
          title: "Ingrediente creado",
          description: `El ingrediente ${formData.nombre} ha sido creado correctamente`,
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
                    <Label htmlFor="codigo">Código del Ingrediente *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => handleInputChange("codigo", e.target.value)}
                      placeholder="Ej: ING001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hotel">Hotel *</Label>
                    <Select value={formData.hotelid} onValueChange={(value) => handleInputChange("hotelid", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hoteles.length === 0 ? (
                          <SelectItem value="no-data" disabled>
                            No hay hoteles disponibles
                          </SelectItem>
                        ) : (
                          hoteles.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id.toString()}>
                              {hotel.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Ingrediente *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Ej: Tomate Roma"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select
                      value={formData.categoriaid}
                      onValueChange={(value) => handleInputChange("categoriaid", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-categoria">Sin categoría</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costo">Costo</Label>
                    <Input
                      id="costo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costo}
                      onChange={(e) => handleInputChange("costo", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unidad">Unidad de Medida</Label>
                    <Select
                      value={formData.unidadmedidaid}
                      onValueChange={(value) => handleInputChange("unidadmedidaid", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-unidad">Sin unidad</SelectItem>
                        {unidades.map((unidad) => (
                          <SelectItem key={unidad.id} value={unidad.id.toString()}>
                            {unidad.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imgurl">URL de Imagen</Label>
                  <Input
                    id="imgurl"
                    value={formData.imgurl}
                    onChange={(e) => handleInputChange("imgurl", e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
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

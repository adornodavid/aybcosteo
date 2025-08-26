"use client"

/* ==================================================
  Imports
================================================== */
import { useEffect, useState } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { crearIngrediente } from "@/app/actions/ingredientes-actions-correcto"
import { createClient } from "@/lib/supabase" // Import the correct client for server-side fetching

/* ==================================================
  Interfaces, tipados, clases
================================================== */
interface Categoria {
  id: number
  nombre: string
}

interface UnidadMedida {
  id: number
  nombre: string
}

const initialState = {
  success: false,
  message: "",
  error: "",
}

export default function NuevoIngredientePage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(true)
  const [state, formAction] = useFormState(crearIngrediente, initialState)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingDropdowns(true)
      const supabase = createClient() // Use the correct client for server-side fetching

      const { data: categoriasData, error: categoriasError } = await supabase
        .from("categorias")
        .select("*")
        .eq("activo", true)
        .order("nombre")

      if (categoriasError) {
        console.error("Error fetching categorias:", categoriasError)
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías.",
          variant: "destructive",
        })
      } else {
        setCategorias(categoriasData || [])
      }

      const { data: unidadesData, error: unidadesError } = await supabase
        .from("unidades_medida")
        .select("*")
        .eq("activo", true)
        .order("nombre")

      if (unidadesError) {
        console.error("Error fetching unidades de medida:", unidadesError)
        toast({
          title: "Error",
          description: "No se pudieron cargar las unidades de medida.",
          variant: "destructive",
        })
      } else {
        setUnidadesMedida(unidadesData || [])
      }

      setLoadingDropdowns(false)
    }

    fetchDropdownData()
  }, [toast])

  useEffect(() => {
    if (state.success) {
      toast({
        title: "¡Registro exitoso!",
        description: state.message,
      })
    } else if (state.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, toast])

  if (loadingDropdowns) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Cargando opciones...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Nuevo Ingrediente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="clave">Clave</Label>
              <Input id="clave" name="clave" type="text" placeholder="Ej: AZUCAR001" required />
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Input id="descripcion" name="descripcion" type="text" placeholder="Ej: Azúcar Estándar" required />
            </div>
            <div>
              <Label htmlFor="categoria_id">Categoría</Label>
              <select
                id="categoria_id"
                name="categoria_id"
                className="block w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Input id="tipo" name="tipo" type="text" placeholder="Ej: Seco" />
            </div>
            <div>
              <Label htmlFor="unidad_medida_id">Unidad de Medida</Label>
              <select
                id="unidad_medida_id"
                name="unidad_medida_id"
                className="block w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Selecciona una unidad</option>
                {unidadesMedida.map((um) => (
                  <option key={um.id} value={um.id}>
                    {um.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="cantidad_por_presentacion">Cantidad por Presentación</Label>
              <Input
                id="cantidad_por_presentacion"
                name="cantidad_por_presentacion"
                type="number"
                step="0.01"
                placeholder="Ej: 1000 (gramos)"
              />
            </div>
            <div>
              <Label htmlFor="conversion">Conversión</Label>
              <Input id="conversion" name="conversion" type="number" step="0.01" placeholder="Ej: 1 (para kg a gr)" />
            </div>
            <Button type="submit" className="w-full" disabled={state.success}>
              {state.success ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Ingrediente"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

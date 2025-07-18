"use client"

import { useEffect, useState, useCallback } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"
import { crearIngrediente, actualizarIngrediente } from "@/app/actions/ingredientes-actions-correcto"
import { createClient } from "@/lib/supabase" // Import the correct client for client-side fetching

interface IngredienteFormProps {
  initialData?: any | null
  onSuccess: () => void
  onClose: () => void
}

interface CategoriaOption {
  id: number
  nombre: string
}

interface UnidadMedidaOption {
  id: number
  nombre: string
}

export function IngredienteForm({ initialData, onSuccess, onClose }: IngredienteFormProps) {
  const { toast } = useToast()
  const [state, formAction] = useFormState(
    initialData ? actualizarIngrediente.bind(null, initialData.id) : crearIngrediente,
    null,
  )
  const { pending } = useFormStatus()

  const [categorias, setCategorias] = useState<CategoriaOption[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaOption[]>([])
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(initialData?.categoria_id?.toString() || "")
  const [selectedUnidadMedidaId, setSelectedUnidadMedidaId] = useState<string>(
    initialData?.unidad_medida_id?.toString() || "",
  )

  const loadDropdowns = useCallback(async () => {
    const supabase = createClient() // Use the correct client for client-side fetching

    const { data: categoriasData, error: categoriasError } = await supabase
      .from("categorias")
      .select("id, nombre")
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
      .select("id, nombre")
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
  }, [toast])

  useEffect(() => {
    loadDropdowns()
  }, [loadDropdowns])

  useEffect(() => {
    if (state?.success) {
      toast({
        title: initialData ? "Actualización exitosa!" : "¡Registro exitoso!",
        description: `El ingrediente ha sido ${initialData ? "actualizado" : "registrado"} correctamente.`,
      })
      onSuccess()
      onClose()
    } else if (state?.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, initialData, onSuccess, onClose, toast])

  return (
    <form action={formAction} className="grid gap-4 py-4">
      <div>
        <Label htmlFor="clave">Clave</Label>
        <Input
          id="clave"
          name="clave"
          type="text"
          defaultValue={initialData?.clave || ""}
          required
          disabled={pending}
        />
      </div>
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Input
          id="descripcion"
          name="descripcion"
          type="text"
          defaultValue={initialData?.descripcion || ""}
          required
          disabled={pending}
        />
      </div>
      <div>
        <Label htmlFor="categoria_id">Categoría</Label>
        <Select
          value={selectedCategoriaId}
          onValueChange={setSelectedCategoriaId}
          name="categoria_id"
          id="categoria_id"
          disabled={pending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <Input id="tipo" name="tipo" type="text" defaultValue={initialData?.tipo || ""} disabled={pending} />
      </div>
      <div>
        <Label htmlFor="unidad_medida_id">Unidad de Medida</Label>
        <Select
          value={selectedUnidadMedidaId}
          onValueChange={setSelectedUnidadMedidaId}
          name="unidad_medida_id"
          id="unidad_medida_id"
          disabled={pending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una unidad" />
          </SelectTrigger>
          <SelectContent>
            {unidadesMedida.map((um) => (
              <SelectItem key={um.id} value={um.id.toString()}>
                {um.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="cantidad_por_presentacion">Cantidad por Presentación</Label>
        <Input
          id="cantidad_por_presentacion"
          name="cantidad_por_presentacion"
          type="number"
          step="0.01"
          defaultValue={initialData?.cantidad_por_presentacion || ""}
          disabled={pending}
        />
      </div>
      <div>
        <Label htmlFor="conversion">Conversión</Label>
        <Input
          id="conversion"
          name="conversion"
          type="number"
          step="0.01"
          defaultValue={initialData?.conversion || ""}
          disabled={pending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Guardar
      </Button>
    </form>
  )
}

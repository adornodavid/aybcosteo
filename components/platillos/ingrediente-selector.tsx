"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Search, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase" // Import the correct client for client-side fetching

interface Ingrediente {
  id: number
  descripcion: string
  clave: string
  unidad_medida: string
  precio_actual: number | null
}

interface IngredienteSelectorProps {
  onSelectIngrediente: (ingrediente: Ingrediente) => void
}

export function IngredienteSelector({ onSelectIngrediente }: IngredienteSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchIngredientes = useCallback(async () => {
    setLoading(true)
    const supabase = createClient() // Use the correct client for client-side fetching
    let query = supabase
      .from("ingredientes")
      .select(
        `
        id,
        clave,
        descripcion,
        unidades_medida(nombre),
        precios_unitarios(precio, fecha_inicio, fecha_fin)
      `,
      )
      .eq("activo", true)
      .order("descripcion")

    if (searchTerm) {
      query = query.ilike("descripcion", `%${searchTerm}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error fetching ingredientes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los ingredientes.",
        variant: "destructive",
      })
      setIngredientes([])
    } else {
      const formattedData = data.map((ing: any) => {
        const activePrice = ing.precios_unitarios?.find((precio: any) => {
          const now = new Date()
          const fechaInicio = new Date(precio.fecha_inicio)
          const fechaFin = precio.fecha_fin ? new Date(precio.fecha_fin) : null
          return fechaInicio <= now && (!fechaFin || fechaFin > now)
        })
        return {
          id: ing.id,
          clave: ing.clave,
          descripcion: ing.descripcion,
          unidad_medida: ing.unidades_medida?.nombre || "N/A",
          precio_actual: activePrice ? activePrice.precio : null,
        }
      })
      setIngredientes(formattedData || [])
    }
    setLoading(false)
  }, [searchTerm, toast])

  useEffect(() => {
    if (isDialogOpen) {
      fetchIngredientes()
    }
  }, [isDialogOpen, fetchIngredientes])

  const handleSelect = (ingrediente: Ingrediente) => {
    onSelectIngrediente(ingrediente)
    setIsDialogOpen(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Seleccionar Ingrediente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Ingrediente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar ingrediente por descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  fetchIngredientes()
                }
              }}
            />
            <Button onClick={fetchIngredientes} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : ingredientes.length === 0 ? (
              <p className="text-center text-muted-foreground">No se encontraron ingredientes.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clave</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Precio Actual</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientes.map((ingrediente) => (
                    <TableRow key={ingrediente.id}>
                      <TableCell>{ingrediente.clave}</TableCell>
                      <TableCell>{ingrediente.descripcion}</TableCell>
                      <TableCell>{ingrediente.unidad_medida}</TableCell>
                      <TableCell className="text-right">
                        {ingrediente.precio_actual !== null ? `$${ingrediente.precio_actual.toFixed(2)}` : "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleSelect(ingrediente)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

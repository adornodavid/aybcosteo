"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { createClient } from "@/lib/supabase" // Import the correct client for server-side fetching

interface PrecioUnitario {
  id: number
  precio: number
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
}

interface Ingrediente {
  id: number
  descripcion: string
  clave: string
  unidad_medida_id: number
  unidades_medida: { nombre: string } | null
}

export default function PreciosIngredientePage({ params }: { params: { id: string } }) {
  const ingredienteId = Number(params.id)
  const [ingrediente, setIngrediente] = useState<Ingrediente | null>(null)
  const [precios, setPrecios] = useState<PrecioUnitario[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPrecios = async () => {
      setLoading(true)
      const supabase = createClient() // Use the correct client for server-side fetching

      const { data: ingredienteData, error: ingredienteError } = await supabase
        .from("ingredientes")
        .select(`*, unidades_medida(nombre)`)
        .eq("id", ingredienteId)
        .single()

      if (ingredienteError) {
        console.error("Error fetching ingrediente:", ingredienteError)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del ingrediente.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      setIngrediente(ingredienteData)

      const { data: preciosData, error: preciosError } = await supabase
        .from("precios_unitarios")
        .select("*")
        .eq("ingrediente_id", ingredienteId)
        .order("fecha_inicio", { ascending: false })

      if (preciosError) {
        console.error("Error fetching precios:", preciosError)
        toast({
          title: "Error",
          description: "No se pudieron cargar los precios unitarios.",
          variant: "destructive",
        })
      } else {
        setPrecios(preciosData || [])
      }
      setLoading(false)
    }

    fetchPrecios()
  }, [ingredienteId, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Cargando precios...</span>
      </div>
    )
  }

  if (!ingrediente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-destructive">Ingrediente no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Precios Unitarios de {ingrediente.descripcion}</h1>
          <p className="text-lg text-muted-foreground">Clave: {ingrediente.clave}</p>
          <p className="text-lg text-muted-foreground">
            Unidad de Medida: {ingrediente.unidades_medida?.nombre || "N/A"}
          </p>
        </div>
        <Link href={`/precios/nuevo?ingredienteId=${ingredienteId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Precio
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          {precios.length === 0 ? (
            <p className="text-muted-foreground">No hay precios registrados para este ingrediente.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Precio</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {precios.map((precio) => (
                  <TableRow key={precio.id}>
                    <TableCell>${precio.precio.toFixed(2)}</TableCell>
                    <TableCell>{new Date(precio.fecha_inicio).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {precio.fecha_fin ? new Date(precio.fecha_fin).toLocaleDateString() : "Actual"}
                    </TableCell>
                    <TableCell>{precio.activo ? "Sí" : "No"}</TableCell>
                    <TableCell className="text-center">
                      {/* Add edit functionality if needed */}
                      <Button variant="ghost" size="icon" title="Editar precio">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar precio {precio.id}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

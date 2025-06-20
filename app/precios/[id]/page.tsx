"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase, type PrecioUnitario, type IngredienteRestaurante } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"
import { PrecioForm } from "@/components/precios/precio-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function PreciosIngredientePage() {
  const params = useParams()
  const router = useRouter()
  const [ingrediente, setIngrediente] = useState<IngredienteRestaurante | null>(null)
  const [precios, setPrecios] = useState<PrecioUnitario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchIngrediente(params.id as string)
      fetchPrecios(params.id as string)
    }
  }, [params.id])

  const fetchIngrediente = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("ingredientes_restaurante")
        .select(`
        *,
        categoria:categorias(*)
      `)
        .eq("id", id)
        .single()

      if (error) throw error
      setIngrediente(data)
    } catch (error: any) {
      console.error("Error fetching ingrediente:", error)
      setError(error.message || "No se pudo cargar el ingrediente")
    }
  }

  const fetchPrecios = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("precios_unitarios")
        .select(`
        *,
        ingrediente:ingredientes_restaurante(*)
      `)
        .eq("ingrediente_id", id)
        .order("fecha_inicio", { ascending: false })

      if (error) throw error
      setPrecios(data || [])
    } catch (error: any) {
      console.error("Error fetching precios:", error)
      setError(error.message || "No se pudieron cargar los precios")
    } finally {
      setLoading(false)
    }
  }

  const handlePrecioAdded = () => {
    if (params.id) {
      fetchPrecios(params.id as string)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !ingrediente) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || "No se encontró el ingrediente"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Precios de Ingrediente</h1>
          <p className="text-muted-foreground">
            Gestiona los precios históricos de <strong>{ingrediente.descripcion}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <PrecioForm ingrediente={ingrediente} onSuccess={handlePrecioAdded} />
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Precios</CardTitle>
              <CardDescription>Precios históricos del ingrediente</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Precio</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {precios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay precios registrados para este ingrediente
                      </TableCell>
                    </TableRow>
                  ) : (
                    precios.map((precio) => (
                      <TableRow key={precio.id}>
                        <TableCell className="font-medium">
                          ${Number.parseFloat(precio.precio.toString()).toFixed(2)}
                        </TableCell>
                        <TableCell>{format(new Date(precio.fecha_inicio), "PPP", { locale: es })}</TableCell>
                        <TableCell>
                          {precio.fecha_fin ? format(new Date(precio.fecha_fin), "PPP", { locale: es }) : "Vigente"}
                        </TableCell>
                        <TableCell>
                          {!precio.fecha_fin ? (
                            <Badge variant="default">Actual</Badge>
                          ) : (
                            <Badge variant="secondary">Histórico</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

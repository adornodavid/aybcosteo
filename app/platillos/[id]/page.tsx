"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { createClient } from "@/lib/supabase" // Import the correct client for server-side fetching
import Image from "next/image"
import { ImageIcon } from "@/components/ui/image-icon"

interface Platillo {
  id: number
  nombre: string
  descripcion: string | null
  imagen_url: string | null
  activo: boolean
}

interface PlatilloIngrediente {
  id: number
  cantidad: number
  ingredientes: {
    descripcion: string
    unidad_medida_id: number
    unidades_medida: { nombre: string } | null
    precios_unitarios: { precio: number }[] | null
  } | null
}

export default function PlatilloDetallePage({ params }: { params: { id: string } }) {
  const platilloId = Number(params.id)
  const [platillo, setPlatillo] = useState<Platillo | null>(null)
  const [ingredientes, setIngredientes] = useState<PlatilloIngrediente[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPlatilloData = async () => {
      setLoading(true)
      const supabase = createClient() // Use the correct client for server-side fetching

      const { data: platilloData, error: platilloError } = await supabase
        .from("platillos")
        .select("*")
        .eq("id", platilloId)
        .single()

      if (platilloError) {
        console.error("Error fetching platillo:", platilloError)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del platillo.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      setPlatillo(platilloData)

      const { data: ingredientesData, error: ingredientesError } = await supabase
        .from("platillos_ingredientes")
        .select(
          `
          id,
          cantidad,
          ingredientes (
            descripcion,
            unidad_medida_id,
            unidades_medida ( nombre ),
            precios_unitarios ( precio, fecha_inicio, fecha_fin )
          )
        `,
        )
        .eq("platillo_id", platilloId)

      if (ingredientesError) {
        console.error("Error fetching ingredientes del platillo:", ingredientesError)
        toast({
          title: "Error",
          description: "No se pudieron cargar los ingredientes del platillo.",
          variant: "destructive",
        })
      } else {
        // Filter for active prices (no fecha_fin or fecha_fin > now)
        const processedIngredientes = ingredientesData?.map((pi) => {
          const activePrice = pi.ingredientes?.precios_unitarios?.find((precio) => {
            const now = new Date()
            const fechaInicio = new Date(precio.fecha_inicio)
            const fechaFin = precio.fecha_fin ? new Date(precio.fecha_fin) : null
            return fechaInicio <= now && (!fechaFin || fechaFin > now)
          })
          return {
            ...pi,
            ingredientes: {
              ...pi.ingredientes,
              precio_actual: activePrice ? activePrice.precio : 0, // Add active price
            },
          }
        })
        setIngredientes(processedIngredientes || [])
      }
      setLoading(false)
    }

    fetchPlatilloData()
  }, [platilloId, toast])

  const calculateTotalCost = () => {
    return ingredientes.reduce((total, item) => {
      const cantidad = item.cantidad || 0
      const precioUnitario = item.ingredientes?.precio_actual || 0
      return total + cantidad * precioUnitario
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Cargando platillo...</span>
      </div>
    )
  }

  if (!platillo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-destructive">Platillo no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Detalle del Platillo: {platillo.nombre}</h1>
          <p className="text-lg text-muted-foreground">{platillo.descripcion}</p>
        </div>
        <Link href={`/platillos/${platillo.id}/editar`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Platillo
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Imagen del Platillo</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          {platillo.imagen_url ? (
            <Image
              src={platillo.imagen_url || "/placeholder.svg"}
              alt={platillo.nombre}
              width={200}
              height={200}
              className="rounded-md object-cover"
            />
          ) : (
            <ImageIcon className="h-32 w-32 text-muted-foreground" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredientes</CardTitle>
        </CardHeader>
        <CardContent>
          {ingredientes.length === 0 ? (
            <p className="text-muted-foreground">Este platillo no tiene ingredientes asociados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Costo Unitario Actual</TableHead>
                  <TableHead className="text-right">Costo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.ingredientes?.descripcion}</TableCell>
                    <TableCell>{item.cantidad}</TableCell>
                    <TableCell>{item.ingredientes?.unidades_medida?.nombre || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      {item.ingredientes?.precio_actual?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell className="text-right">
                      {(item.cantidad * (item.ingredientes?.precio_actual || 0)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Costo Total del Platillo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-right">${calculateTotalCost().toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  )
}

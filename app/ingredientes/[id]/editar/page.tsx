"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { IngredienteForm } from "@/components/ingredientes/ingrediente-form"
import { supabase, type Ingrediente } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditarIngredientePage() {
  const params = useParams()
  const [ingrediente, setIngrediente] = useState<Ingrediente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchIngrediente(params.id as string)
    }
  }, [params.id])

  const fetchIngrediente = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("ingredientes").select("*").eq("id", id).single()

      if (error) throw error
      setIngrediente(data)
    } catch (error: any) {
      console.error("Error fetching ingrediente:", error)
      setError(error.message || "No se pudo cargar el ingrediente")
    } finally {
      setLoading(false)
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
      <div>
        <h1 className="text-3xl font-bold">Editar Ingrediente</h1>
        <p className="text-muted-foreground">Modifica la información del ingrediente</p>
      </div>

      <IngredienteForm ingrediente={ingrediente} />
    </div>
  )
}

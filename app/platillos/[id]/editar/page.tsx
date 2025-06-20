"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { PlatilloForm } from "@/components/platillos/platillo-form"
import { supabase, type Platillo } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditarPlatilloPage() {
  const params = useParams()
  const [platillo, setPlatillo] = useState<Platillo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id && params.id !== "nuevo") {
      fetchPlatillo(params.id as string)
    }
  }, [params.id])

  const fetchPlatillo = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("platillos").select("*").eq("id", id).single()

      if (error) throw error
      setPlatillo(data)
    } catch (error: any) {
      console.error("Error fetching platillo:", error)
      setError(error.message || "No se pudo cargar el platillo")
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

  if (error || !platillo) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || "No se encontró el platillo"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Platillo</h1>
        <p className="text-muted-foreground">Modifica la información del platillo</p>
      </div>

      <PlatilloForm platillo={platillo} />
    </div>
  )
}

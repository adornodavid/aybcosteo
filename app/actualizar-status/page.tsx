"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function ActualizarStatusPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    count?: number
    error?: string
  } | null>(null)
  const { toast } = useToast()

  const actualizarStatus = async () => {
    try {
      setLoading(true)
      setResult(null)

      // Verificar cuántos ingredientes hay con status inactivo
      const { count: inactiveCount, error: countError } = await supabase
        .from("ingredientes")
        .select("*", { count: "exact", head: true })
        .eq("status", "inactivo")

      if (countError) {
        throw new Error(`Error al contar ingredientes inactivos: ${countError.message}`)
      }

      if (inactiveCount === 0) {
        setResult({
          success: true,
          message: "No hay ingredientes con status 'inactivo' que actualizar.",
          count: 0,
        })
        return
      }

      // Actualizar todos los ingredientes con status inactivo a activo
      const { error: updateError } = await supabase
        .from("ingredientes")
        .update({ status: "activo" })
        .eq("status", "inactivo")

      if (updateError) {
        throw new Error(`Error al actualizar ingredientes: ${updateError.message}`)
      }

      setResult({
        success: true,
        message: "Status de ingredientes actualizado correctamente",
        count: inactiveCount,
      })

      toast({
        title: "Actualización exitosa",
        description: `Se actualizaron ${inactiveCount} ingredientes a status 'activo'`,
      })
    } catch (error: any) {
      console.error("Error:", error)
      setResult({
        success: false,
        message: "Error al actualizar status de ingredientes",
        error: error.message,
      })
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al actualizar los ingredientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Actualizar Status de Ingredientes</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actualizar todos los ingredientes a status "activo"</CardTitle>
          <CardDescription>
            Esta herramienta actualizará todos los ingredientes con status "inactivo" a "activo" para que puedan ser
            utilizados en los platillos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Si has importado ingredientes pero no puedes verlos al crear platillos, es posible que tengan el status
            "inactivo". Esta herramienta los actualizará a "activo".
          </p>

          {result && (
            <div
              className={`p-4 rounded-md mb-4 ${
                result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              <h3 className={`font-medium mb-2 ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.success ? "Operación exitosa" : "Error"}
              </h3>
              <p className={result.success ? "text-green-700" : "text-red-700"}>{result.message}</p>
              {result.count !== undefined && (
                <p className="mt-1 text-sm text-green-700">
                  Se actualizaron {result.count} ingredientes a status "activo".
                </p>
              )}
              {result.error && <p className="mt-1 text-sm text-red-700">Error: {result.error}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={actualizarStatus} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar Status de Ingredientes"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

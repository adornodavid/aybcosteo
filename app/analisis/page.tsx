"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function AnalisisPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch("/api/run-sql-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(JSON.stringify(data.result, null, 2))
        toast({
          title: "Consulta exitosa",
          description: "Los resultados se muestran a continuación.",
        })
      } else {
        setResult(`Error: ${data.error}`)
        toast({
          title: "Error en la consulta",
          description: data.error || "Ocurrió un error al ejecutar la consulta SQL.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error executing SQL query:", error)
      setResult("Error: No se pudo conectar con el servidor.")
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor para ejecutar la consulta.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Análisis de Base de Datos (SQL)</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sqlQuery">Consulta SQL</Label>
            <Textarea
              id="sqlQuery"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe tu consulta SQL aquí (ej: SELECT * FROM ingredientes;)"
              rows={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ejecutar Consulta"}
          </Button>
        </form>
        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200 overflow-auto max-h-96">
            <h2 className="text-lg font-semibold mb-2">Resultado:</h2>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

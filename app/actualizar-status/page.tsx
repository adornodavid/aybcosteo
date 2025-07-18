"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function ActualizarStatusPage() {
  const [tableName, setTableName] = useState("")
  const [recordId, setRecordId] = useState("")
  const [status, setStatus] = useState("true")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableName,
          recordId: Number.parseInt(recordId),
          status: status === "true",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Éxito",
          description: `Estado actualizado para ${tableName} ID ${recordId}.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el estado.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Actualizar Estado de Registro</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tableName">Nombre de la Tabla</Label>
            <Input
              id="tableName"
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Ej: ingredientes, platillos, etc."
              required
            />
          </div>
          <div>
            <Label htmlFor="recordId">ID del Registro</Label>
            <Input
              id="recordId"
              type="number"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              placeholder="Ej: 1, 2, 3"
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Actualizar Estado"}
          </Button>
        </form>
      </div>
    </div>
  )
}

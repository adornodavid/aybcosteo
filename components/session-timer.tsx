"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, RefreshCw } from "lucide-react"
import { obtenerTiempoRestanteSesion, renovarSesion } from "@/app/actions/session-actions-with-expiration"
import { toast } from "sonner"

export function SessionTimer() {
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [renovando, setRenovando] = useState(false)

  useEffect(() => {
    const verificarTiempo = async () => {
      const tiempo = await obtenerTiempoRestanteSesion()
      setTiempoRestante(tiempo)

      // Mostrar alerta si quedan menos de 15 minutos
      if (tiempo && tiempo < 15 * 60 * 1000) {
        setMostrarAlerta(true)
      }
    }

    // Verificar cada minuto
    const interval = setInterval(verificarTiempo, 60000)
    verificarTiempo() // Verificar inmediatamente

    return () => clearInterval(interval)
  }, [])

  const formatearTiempo = (milisegundos: number): string => {
    const horas = Math.floor(milisegundos / (1000 * 60 * 60))
    const minutos = Math.floor((milisegundos % (1000 * 60 * 60)) / (1000 * 60))

    if (horas > 0) {
      return `${horas}h ${minutos}m`
    }
    return `${minutos}m`
  }

  const manejarRenovacion = async () => {
    setRenovando(true)
    try {
      const exito = await renovarSesion()
      if (exito) {
        toast.success("Sesión renovada por 8 horas más")
        setMostrarAlerta(false)
        // Actualizar tiempo restante
        const nuevoTiempo = await obtenerTiempoRestanteSesion()
        setTiempoRestante(nuevoTiempo)
      } else {
        toast.error("No se pudo renovar la sesión")
      }
    } catch (error) {
      toast.error("Error al renovar la sesión")
    } finally {
      setRenovando(false)
    }
  }

  if (tiempoRestante === null) {
    return null
  }

  if (tiempoRestante <= 0) {
    return (
      <Alert variant="destructive">
        <Clock className="h-4 w-4" />
        <AlertDescription>Su sesión ha expirado. Por favor, inicie sesión nuevamente.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Sesión expira en:</span>
        <Badge variant={tiempoRestante < 15 * 60 * 1000 ? "destructive" : "secondary"}>
          {formatearTiempo(tiempoRestante)}
        </Badge>
      </div>

      {mostrarAlerta && (
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Su sesión expirará pronto. ¿Desea renovarla?</span>
            <Button onClick={manejarRenovacion} disabled={renovando} size="sm" variant="outline">
              {renovando ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Renovar"}
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

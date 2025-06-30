"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, RefreshCw, Shield, Key, CheckCircle, XCircle } from "lucide-react"
import { obtenerVariablesSesion, type SessionData } from "@/app/actions/session-actions"

export function SessionInfo() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    cargarVariablesSesion()
  }, [])

  const cargarVariablesSesion = async () => {
    try {
      setLoading(true)
      const data = await obtenerVariablesSesion()
      setSessionData(data)
      console.log("Variables de sesión cargadas:", data)
    } catch (error) {
      console.error("Error cargando variables de sesión:", error)
    } finally {
      setLoading(false)
    }
  }

  const actualizarSesion = async () => {
    try {
      setRefreshing(true)
      await cargarVariablesSesion()
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información de Sesión Actual
          </CardTitle>
          <CardDescription>Cargando variables de sesión...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const haySession = sessionData?.SesionActiva === "true"

  return (
    <Card className={`${haySession ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Información de Sesión Actual</CardTitle>
            {haySession ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <Button variant="outline" size="sm" onClick={actualizarSesion} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando..." : "Actualizar Sesión"}
          </Button>
        </div>
        <CardDescription>Variables de sesión asignadas durante el proceso de login</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!haySession ? (
          <div className="text-center py-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">No hay sesión activa</p>
            <p className="text-sm text-red-500">Por favor, inicia sesión para ver las variables</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Usuario ID */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Usuario ID:</span>
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                {sessionData?.UsuarioId || "No disponible"}
              </Badge>
            </div>

            <Separator />

            {/* Nombre Completo */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Nombre Completo:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {sessionData?.NombreCompleto || "No disponible"}
              </Badge>
            </div>

            <Separator />

            {/* Rol ID */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Rol ID:
              </span>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                {sessionData?.RolId || "No disponible"}
              </Badge>
            </div>

            <Separator />

            {/* Permisos */}
            <div className="space-y-2">
              <span className="font-medium text-sm flex items-center gap-1">
                <Key className="h-4 w-4" />
                Permisos:
              </span>
              <div className="flex flex-wrap gap-2">
                {sessionData?.Permisos && sessionData.Permisos.length > 0 ? (
                  sessionData.Permisos.map((permiso, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-100 text-gray-700">
                      Permiso {permiso}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-500">
                    Sin permisos asignados
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Sesión Activa */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Sesión Activa:</span>
              <Badge
                variant={sessionData?.SesionActiva === "true" ? "default" : "destructive"}
                className={
                  sessionData?.SesionActiva === "true" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }
              >
                {sessionData?.SesionActiva === "true" ? "ACTIVA" : "INACTIVA"}
              </Badge>
            </div>

            {/* Información adicional */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">
                <strong>Nota:</strong> Estas variables se asignaron automáticamente durante el proceso de login y se
                mantienen activas durante toda la sesión del usuario.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Copy, RefreshCw } from "lucide-react"

interface CookieData {
  name: string
  value: string
  length: number
  chars: string[]
}

export default function DebugSessionPage() {
  const [cookies, setCookies] = useState<CookieData[]>([])
  const [permisosAnalysis, setPermisosAnalysis] = useState<{
    raw: string
    splitByPipe: string[]
    splitByEncodedPipe: string[]
    splitByComma: string[]
    splitByEncodedComma: string[]
    finalPermisos: number[]
  } | null>(null)

  const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() || ""
    return ""
  }

  const loadCookieData = () => {
    const sessionCookieNames = [
      "UsuarioId",
      "Email",
      "NombreCompleto",
      "HotelId",
      "RolId",
      "Permisos",
      "SesionActiva",
      "ExpiresAt",
    ]

    const cookieData: CookieData[] = sessionCookieNames.map((name) => {
      const value = getCookie(name)
      return {
        name,
        value,
        length: value.length,
        chars: value.split("").map((char) => `${char} (${char.charCodeAt(0)})`),
      }
    })

    setCookies(cookieData)

    // Análisis específico de permisos
    const permisosRaw = getCookie("Permisos")
    if (permisosRaw) {
      const analysis = {
        raw: permisosRaw,
        splitByPipe: permisosRaw.includes("|") ? permisosRaw.split("|") : [],
        splitByEncodedPipe: permisosRaw.includes("%7C") ? permisosRaw.split("%7C") : [],
        splitByComma: permisosRaw.includes(",") ? permisosRaw.split(",") : [],
        splitByEncodedComma: permisosRaw.includes("%2C") ? permisosRaw.split("%2C") : [],
        finalPermisos: [] as number[],
      }

      // Determinar el método correcto de split
      let permisosArray: string[] = []
      if (analysis.splitByPipe.length > 1) {
        permisosArray = analysis.splitByPipe
      } else if (analysis.splitByEncodedPipe.length > 1) {
        permisosArray = analysis.splitByEncodedPipe
      } else if (analysis.splitByComma.length > 1) {
        permisosArray = analysis.splitByComma
      } else if (analysis.splitByEncodedComma.length > 1) {
        permisosArray = analysis.splitByEncodedComma
      } else {
        permisosArray = [permisosRaw]
      }

      analysis.finalPermisos = permisosArray
        .map((p) => {
          const num = Number.parseInt(p.trim(), 10)
          return isNaN(num) ? null : num
        })
        .filter((p): p is number => p !== null)

      setPermisosAnalysis(analysis)
    }
  }

  useEffect(() => {
    loadCookieData()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug de Sesión</h1>
          <p className="text-muted-foreground">Análisis detallado de las cookies de sesión</p>
        </div>
        <Button onClick={loadCookieData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Análisis de Permisos */}
      {permisosAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Permisos</CardTitle>
            <CardDescription>Análisis detallado de cómo se procesan los permisos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Valor Raw:</h4>
              <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">{permisosAnalysis.raw}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Longitud: {permisosAnalysis.raw.length} caracteres
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Split por | (pipe):</h4>
                <div className="bg-blue-50 p-2 rounded text-sm">
                  {permisosAnalysis.splitByPipe.length > 1 ? (
                    <div className="space-y-1">
                      {permisosAnalysis.splitByPipe.map((item, index) => (
                        <Badge key={index} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No contiene |</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Split por %7C (encoded pipe):</h4>
                <div className="bg-green-50 p-2 rounded text-sm">
                  {permisosAnalysis.splitByEncodedPipe.length > 1 ? (
                    <div className="space-y-1">
                      {permisosAnalysis.splitByEncodedPipe.map((item, index) => (
                        <Badge key={index} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No contiene %7C</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Split por , (comma):</h4>
                <div className="bg-yellow-50 p-2 rounded text-sm">
                  {permisosAnalysis.splitByComma.length > 1 ? (
                    <div className="space-y-1">
                      {permisosAnalysis.splitByComma.map((item, index) => (
                        <Badge key={index} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No contiene ,</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Split por %2C (encoded comma):</h4>
                <div className="bg-red-50 p-2 rounded text-sm">
                  {permisosAnalysis.splitByEncodedComma.length > 1 ? (
                    <div className="space-y-1">
                      {permisosAnalysis.splitByEncodedComma.map((item, index) => (
                        <Badge key={index} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No contiene %2C</span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Permisos Finales Parseados:</h4>
              <div className="bg-green-100 p-3 rounded">
                <div className="flex flex-wrap gap-2 mb-2">
                  {permisosAnalysis.finalPermisos.map((permiso, index) => (
                    <Badge key={index} variant="default">
                      {permiso}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: {permisosAnalysis.finalPermisos.length} permisos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todas las Cookies */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Cookies de Sesión</CardTitle>
          <CardDescription>Valores completos de todas las cookies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cookies.map((cookie, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{cookie.name}</h4>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cookie.value)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="bg-gray-50 p-2 rounded mb-2">
                  <div className="font-mono text-sm break-all">
                    {cookie.value || <span className="text-muted-foreground italic">vacío</span>}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">Longitud: {cookie.length} caracteres</div>

                {cookie.name === "Permisos" && cookie.value && (
                  <div className="mt-2">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Ver caracteres individuales</summary>
                      <div className="mt-2 bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                        {cookie.chars.map((char, charIndex) => (
                          <div key={charIndex} className="font-mono">
                            {char}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información del Navegador */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Navegador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>User Agent:</strong> {navigator.userAgent}
            </div>
            <div>
              <strong>Cookies Habilitadas:</strong> {navigator.cookieEnabled ? "Sí" : "No"}
            </div>
            <div>
              <strong>Todas las Cookies:</strong>
            </div>
            <div className="bg-gray-50 p-2 rounded font-mono text-xs break-all max-h-32 overflow-y-auto">
              {document.cookie || "No hay cookies"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

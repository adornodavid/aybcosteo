"use client"

/* ==================================================
  Imports
================================================== */
import { Input } from "@/components/ui/input"
import { CardDescription } from "@/components/ui/card"
import { useEffect } from "react"
import { useState } from "react"
import type React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Upload, LinkIcon, AlertTriangle, Loader2, BarChart2, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [excelUrl, setExcelUrl] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [columnas, setColumnas] = useState<string[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [restaurantes, setRestaurantes] = useState<any[]>([])
  const [selectedRestaurante, setSelectedRestaurante] = useState<string>("")
  const [expandInstrucciones, setExpandInstrucciones] = useState(false)
  const { toast } = useToast()

  // URL del archivo de ejemplo
  const EXAMPLE_FILE_URL =
    "https://tjbnbfcowjkfnqifspcu.supabase.co/storage/v1/object/sign/filescosteo/Plantilla_Importacion_Ingredientes_Muestra.xlsx?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hNWQxZGI4OS04MGU2LTQ0MDAtYWYwMS1mZTNjMGUwZWM2ZmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmaWxlc2Nvc3Rlby9QbGFudGlsbGFfSW1wb3J0YWNpb25fSW5ncmVkaWVudGVzX011ZXN0cmEueGxzeCIsImlhdCI6MTc0ODk3NDQ3OCwiZXhwIjoxNzgwNTEwNDc4fQ.Ie0a4cEXwQsDYmHnR2e8qXmZ7kJyqKrUChk9x12w5mI"

  useEffect(() => {
    fetchRestaurantes()
  }, [])

  const fetchRestaurantes = async () => {
    try {
      const { data, error } = await supabase.from("restaurantes").select("*").order("nombre")
      if (error) throw error
      setRestaurantes(data || [])
      // Seleccionar automáticamente Montana iStay si existe
      const montana = data?.find((r) => r.id === "eb492bec-f87a-4bda-917f-4e8109ec914c")
      if (montana) {
        setSelectedRestaurante(montana.id)
      }
    } catch (error: any) {
      console.error("Error fetching restaurantes:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const processExcel = async (arrayBuffer: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        throw new Error("El archivo no contiene datos")
      }

      // Obtener columnas
      const columns = Object.keys(jsonData[0])
      setColumnas(columns)

      // Mostrar vista previa
      setPreviewData(jsonData.slice(0, 5))
      setTotalRows(jsonData.length)

      return { data: jsonData, columns }
    } catch (error: any) {
      console.error("Error procesando Excel:", error)
      toast({
        title: "Error al procesar el archivo",
        description: error.message,
        variant: "destructive",
      })
      return null
    }
  }

  const handleUpload = async () => {
    if (!selectedRestaurante) {
      toast({
        title: "Error",
        description: "Debes seleccionar un restaurante antes de cargar ingredientes",
        variant: "destructive",
      })
      return
    }

    if (!file) {
      toast({
        title: "Error",
        description: "Selecciona un archivo primero",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setProgress(10)

      const arrayBuffer = await file.arrayBuffer()
      setProgress(30)

      const result = await processExcel(arrayBuffer)
      if (!result) return

      setProgress(60)
      setShowConfirmDialog(true)
    } catch (error: any) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUrlImport = async () => {
    if (!selectedRestaurante) {
      toast({
        title: "Error",
        description: "Debes seleccionar un restaurante antes de cargar ingredientes",
        variant: "destructive",
      })
      return
    }

    if (!excelUrl) {
      toast({
        title: "Error",
        description: "Ingresa una URL válida",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setProgress(10)

      const response = await fetch(excelUrl)
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      setProgress(30)

      const result = await processExcel(arrayBuffer)
      if (!result) return

      setProgress(60)
      setShowConfirmDialog(true)
    } catch (error: any) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmImport = async () => {
    setShowConfirmDialog(false)
    toast({
      title: "Importación iniciada",
      description: "Redirigiendo a la página de importación avanzada...",
    })
    // Redirigir a la página de importación avanzada
    window.location.href = "/importar/excel-correcto"
  }

  const downloadExampleFile = async () => {
    try {
      window.open(EXAMPLE_FILE_URL, "_blank")
    } catch (error) {
      console.error("Error al descargar archivo de ejemplo:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Grid Principal: 2 columnas x 2 filas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 auto-rows-max lg:auto-rows-max">
          {/* Fila 1, Columna 1: Título y Subtítulo */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Importación de Datos</h1>
            <p className="text-lg text-slate-600">Gestiona la carga masiva de información a tu sistema.</p>
          </div>

          {/* Fila 1-2, Columna 2: Instrucciones (rowspan 2) */}
          <div className="lg:row-span-2">
            <Card className="bg-white/95 backdrop-blur h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Instrucciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className={`space-y-6 text-sm flex-1 overflow-hidden transition-all duration-300 ${expandInstrucciones ? 'max-h-none' : 'max-h-64'}`}>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">📋 Formato del Archivo</h3>
                  <p className="text-slate-600 mb-2">El archivo Excel debe contener las siguientes columnas:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                    <li>Clave Innsist</li>
                    <li>Clave Rapsodia</li>
                    <li>Descripción del artículo</li>
                    <li>Categoria</li>
                    <li>Ingrediente</li>
                    <li>Tipo</li>
                    <li>Metrica</li>
                    <li>Cantidad</li>
                    <li>Metrica Convertida</li>
                    <li>Conversion</li>
                    <li>GR/ML/PZA</li>
                    <li>Precio</li>
                    <li>Unitario</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">✓ Requerimientos</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                    <li>Primera fila con nombres de columnas</li>
                    <li>Descripción del artículo es obligatoria</li>
                    <li>Valores numéricos con punto o coma</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">📝 Proceso</h3>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 text-xs">
                    <li>Selecciona tipo de importación</li>
                    <li>Sube archivo o proporciona URL</li>
                    <li>Revisa la vista previa</li>
                    <li>Confirma la importación</li>
                  </ol>
                </div>
              </CardContent>
              <div className="px-6 py-4 border-t border-slate-200">
                <Button
                  variant="ghost"
                  onClick={() => setExpandInstrucciones(!expandInstrucciones)}
                  className="w-full text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  {expandInstrucciones ? '↑ Ver menos' : '↓ Ver más'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Fila 2, Columna 1: Tarjetas de Importación */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Selecciona el tipo de importación</h2>
            <div className="grid gap-4">
              {/* Importar Ingredientes */}
              <Link href="#">
                <Card className="group relative h-full overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-transparent hover:border-blue-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          Importar Ingredientes
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-2">
                          Carga masivamente ingredientes desde un archivo Excel a tu inventario
                        </p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">Haz clic para continuar →</p>
                  </CardContent>
                </Card>
              </Link>

              {/* Importar Recetas */}
              <Link href="#">
                <Card className="group relative h-full overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-transparent hover:border-green-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">
                          Importar Recetas
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-2">
                          Carga platillos y recetas desde un archivo Excel con sus ingredientes
                        </p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Upload className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">Haz clic para continuar →</p>
                  </CardContent>
                </Card>
              </Link>

              {/* Importar Subrecetas */}
              <Link href="#">
                <Card className="group relative h-full overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-transparent hover:border-purple-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                          Importar Subrecetas
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-2">
                          Carga subrecetas y preparaciones desde un archivo Excel
                        </p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <BarChart2 className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">Haz clic para continuar →</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Diálogo de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar Importación
            </DialogTitle>
            {/* Reemplazamos DialogDescription con un div para evitar anidación de <p> */}
            <div className="text-sm text-muted-foreground">
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-sm text-yellow-800">
                  <strong>
                    Estás a punto de importar {totalRows} ingredientes al restaurante{" "}
                    {restaurantes.find((r) => r.id === selectedRestaurante)?.nombre}
                  </strong>
                </div>
                <div className="text-xs text-yellow-700 mt-1">
                  Este proceso puede tardar varios minutos dependiendo de la cantidad de datos.
                </div>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmImport}>Confirmar Importación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

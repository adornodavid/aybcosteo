"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileSpreadsheet, Upload, LinkIcon, AlertTriangle, Loader2 } from "lucide-react"
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
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Importar Ingredientes</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Selector de Restaurante */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Restaurante</CardTitle>
              <CardDescription>
                Selecciona el restaurante al que se asignarán los ingredientes importados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedRestaurante} onValueChange={setSelectedRestaurante}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un restaurante" />
                </SelectTrigger>
                <SelectContent>
                  {restaurantes.map((restaurante) => (
                    <SelectItem key={restaurante.id} value={restaurante.id}>
                      {restaurante.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Tabs defaultValue="upload">
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
              <TabsTrigger value="url">Importar desde URL</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Subir Archivo Excel</CardTitle>
                  <CardDescription>
                    Sube un archivo Excel con la estructura correcta para importar ingredientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Input
                      id="excel"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={loading || !selectedRestaurante}
                    />
                    <p className="text-xs text-muted-foreground">Formatos aceptados: .xlsx, .xls (Excel)</p>
                  </div>

                  {file && (
                    <div className="text-sm">
                      <span className="font-medium">Archivo seleccionado:</span> {file.name} (
                      {(file.size / 1024).toFixed(2)} KB)
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleUpload} disabled={!file || loading || !selectedRestaurante}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Procesar Archivo
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={downloadExampleFile}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Descargar Ejemplo
                    </Button>
                  </div>

                  {loading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Procesando...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="url">
              <Card>
                <CardHeader>
                  <CardTitle>Importar desde URL</CardTitle>
                  <CardDescription>Proporciona la URL de un archivo Excel para importar ingredientes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Input
                      type="url"
                      placeholder="https://ejemplo.com/archivo.xlsx"
                      value={excelUrl}
                      onChange={(e) => setExcelUrl(e.target.value)}
                      disabled={loading || !selectedRestaurante}
                    />
                    <p className="text-xs text-muted-foreground">
                      La URL debe apuntar directamente a un archivo Excel descargable
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleUrlImport} disabled={!excelUrl || loading || !selectedRestaurante}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Importar desde URL
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setExcelUrl(EXAMPLE_FILE_URL)}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Usar URL de Ejemplo
                    </Button>
                  </div>

                  {loading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Procesando...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Vista previa */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>
                  Mostrando {previewData.length} de {totalRows} filas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        {columnas.slice(0, 5).map((col) => (
                          <th key={col} className="p-2 text-left text-xs font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-b border-muted">
                          {columnas.slice(0, 5).map((col) => (
                            <td key={col} className="p-2 text-xs">
                              {String(row[col] || "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium mb-1">Formato del Archivo</h3>
                <p className="text-muted-foreground">El archivo Excel debe contener las siguientes columnas:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
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

              <div>
                <h3 className="font-medium mb-1">Requerimientos</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>La primera fila debe contener los nombres de las columnas</li>
                  <li>La columna "Descripción del artículo" es obligatoria</li>
                  <li>Los valores numéricos pueden usar punto o coma como separador decimal</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-1">Proceso</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Selecciona un restaurante</li>
                  <li>Sube tu archivo Excel o proporciona una URL</li>
                  <li>Revisa la vista previa de los datos</li>
                  <li>Confirma la importación</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ayuda</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Si tienes problemas con la importación, asegúrate de que tu archivo siga el formato correcto. Puedes
                descargar el archivo de ejemplo para ver la estructura esperada.
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={downloadExampleFile} className="w-full">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </div>
            </CardContent>
          </Card>
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

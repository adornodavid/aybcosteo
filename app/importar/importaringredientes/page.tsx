"use client"

import { useState, useRef } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, Download, Upload, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"

export default function ImportarIngredientesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [columnas, setColumnas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const EXAMPLE_FILE_URL =
    "https://tjbnbfcowjkfnqifspcu.supabase.co/storage/v1/object/sign/filescosteo/Plantilla_Importacion_Ingredientes_Muestra.xlsx?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hNWQxZGI4OS04MGU2LTQ0MDAtYWYwMS1mZTNjMGUwZWM2ZmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmaWxlc2Nvc3Rlby9QbGFudGlsbGFfSW1wb3J0YWNpb25fSW5ncmVkaWVudGVzX011ZXN0cmEueGxzeCIsImlhdCI6MTc0ODk3NDQ3OCwiZXhwIjoxNzgwNTEwNDc4fQ.Ie0a4cEXwQsDYmHnR2e8qXmZ7kJyqKrUChk9x12w5mI"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        setFile(selectedFile)
      } else {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo Excel (.xlsx o .xls)",
          variant: "destructive",
        })
      }
    }
  }

  const handleLoadFile = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        throw new Error("El archivo no contiene datos")
      }

      const columns = Object.keys(jsonData[0])
      setColumnas(columns)
      setPreviewData(jsonData.slice(0, 50))
      setScrollPosition(0)

      toast({
        title: "Éxito",
        description: `Se cargaron ${jsonData.length} filas del archivo`,
      })
    } catch (error: any) {
      toast({
        title: "Error al procesar el archivo",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    window.open(EXAMPLE_FILE_URL, "_blank")
  }

  const handleScroll = (direction: "left" | "right") => {
    if (tableContainerRef.current) {
      const scrollAmount = 300
      if (direction === "left") {
        tableContainerRef.current.scrollLeft -= scrollAmount
      } else {
        tableContainerRef.current.scrollLeft += scrollAmount
      }
      setScrollPosition(tableContainerRef.current.scrollLeft)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Importar Ingredientes</h1>
          <p className="text-lg text-slate-600">Carga de datos masivo</p>
        </div>

        {/* Sección de Carga y Descarga */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Cargar Archivo - Columna 1 */}
          <div className="lg:col-span-2">
            <Card className="h-full bg-white/95 backdrop-blur border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Cargar Archivo Excel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {file && (
                      <p className="text-sm text-slate-600 mt-2">
                        Archivo: <span className="font-semibold">{file.name}</span>
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleLoadFile}
                    disabled={!file || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? "Cargando..." : "Cargar Archivo"}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Formatos soportados: .xlsx, .xls
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Descargar Plantilla - Columna 2 */}
          <div>
            <Card className="h-full bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur border-2 border-green-200 hover:border-green-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 text-base">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Descargar Plantilla
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Descarga la plantilla requerida para cargar los ingredientes correctamente.
                </p>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabla de Vista Previa */}
        {previewData.length > 0 && (
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-900">
                Vista Previa de Datos ({previewData.length} filas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tabla con scroll */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScroll("left")}
                  className="p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div
                  ref={tableContainerRef}
                  className="flex-1 overflow-x-auto h-[80vh] overflow-y-auto rounded-lg border border-slate-200"
                >
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-white z-10">
                      <tr>
                        {columnas.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={`border-b border-slate-200 ${
                            rowIndex % 2 === 0 ? "bg-slate-50" : "bg-white"
                          } hover:bg-blue-50 transition-colors`}
                        >
                          {columnas.map((col) => (
                            <td
                              key={`${rowIndex}-${col}`}
                              className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
                            >
                              {String(row[col] || "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScroll("right")}
                  className="p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Botón Cargar Información */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-8">
                  Cargar Información
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

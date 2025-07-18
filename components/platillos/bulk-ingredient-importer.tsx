"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

interface BulkIngredientImporterProps {
  onImport: (ingredients: { id: number; cantidad: number; nombre: string; unidad: string }[]) => void
}

export function BulkIngredientImporter({ onImport }: BulkIngredientImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0]
      setFile(selectedFile)
      parseExcel(selectedFile)
    } else {
      setFile(null)
      setParsedData([])
    }
  }

  const parseExcel = (file: File) => {
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)

        // Assuming the Excel has columns: IngredienteID, Cantidad, NombreIngrediente, UnidadMedida
        const formattedData = json.map((row: any) => ({
          id: row["IngredienteID"],
          cantidad: row["Cantidad"],
          nombre: row["NombreIngrediente"],
          unidad: row["UnidadMedida"],
        }))

        setParsedData(formattedData)
        toast({
          title: "Archivo cargado",
          description: "El archivo Excel ha sido leído y los datos están listos para importar.",
        })
      } catch (error) {
        console.error("Error parsing Excel file:", error)
        toast({
          title: "Error al leer Excel",
          description: "Asegúrate de que el archivo sea un Excel válido y tenga las columnas correctas.",
          variant: "destructive",
        })
        setParsedData([])
      } finally {
        setLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = () => {
    if (parsedData.length > 0) {
      onImport(parsedData)
      setIsDialogOpen(false)
      setFile(null)
      setParsedData([])
      toast({
        title: "Importación exitosa",
        description: "Los ingredientes han sido importados al platillo.",
      })
    } else {
      toast({
        title: "Error",
        description: "No hay datos para importar. Por favor, carga un archivo Excel válido.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar desde Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Importar Ingredientes desde Excel</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Sube un archivo Excel con las columnas: `IngredienteID`, `Cantidad`, `NombreIngrediente`, `UnidadMedida`.
          </p>
          <div>
            <Label htmlFor="excelFile">Archivo Excel (.xlsx)</Label>
            <Input id="excelFile" type="file" accept=".xlsx" onChange={handleFileChange} disabled={loading} />
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : parsedData.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.nombre}</TableCell>
                      <TableCell>{row.cantidad}</TableCell>
                      <TableCell>{row.unidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            file && <p className="text-center text-muted-foreground">No se encontraron datos válidos en el archivo.</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button type="button" onClick={handleImport} disabled={loading || parsedData.length === 0}>
            <Upload className="h-4 w-4 mr-2" />
            Importar Ingredientes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

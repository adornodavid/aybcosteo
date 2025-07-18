"use client"

import { CardContent } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { useToast } from "@/hooks/use-toast"

interface ExcelTemplateGeneratorProps {
  templateName: string
  headers: string[]
  fileName: string
}

export function ExcelTemplateGenerator({ templateName, headers, fileName }: ExcelTemplateGeneratorProps) {
  const [selectedType, setSelectedType] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generateExcel = () => {
    if (!selectedType) {
      toast({
        title: "Selección Requerida",
        description: "Por favor, selecciona un tipo de plantilla para generar.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let data: any[] = []
      let sheetName = ""

      switch (selectedType) {
        case "ingredientes":
          data = [
            ["TOM001", "Tomate Rojo Fresco", "Vegetales", "Fresco", "Kilogramo", 1, 1, "TRUE"],
            ["POLL002", "Pechuga de Pollo", "Carnes", "Congelado", "Kilogramo", 1, 1, "TRUE"],
          ]
          sheetName = "Ingredientes"
          break
        case "platillos":
          data = [
            ["Pasta Alfredo", "Deliciosa pasta con salsa cremosa", "http://example.com/pasta.jpg", "TRUE"],
            ["Ensalada César", "Clásica ensalada con aderezo César", "http://example.com/ensalada.jpg", "TRUE"],
          ]
          sheetName = "Platillos"
          break
        case "restaurantes":
          data = [
            [
              "El Fogón",
              "Av. Siempre Viva 742",
              "5512345678",
              "info@elfogon.com",
              "",
              "http://example.com/fogon.jpg",
              "TRUE",
            ],
            [
              "La Casona",
              "Calle Falsa 123",
              "5587654321",
              "contacto@lacasona.com",
              "1",
              "http://example.com/casona.jpg",
              "TRUE",
            ],
          ]
          sheetName = "Restaurantes"
          break
        case "hoteles":
          data = [
            ["Hotel Gran Plaza", "HGP", "Av. Reforma 100", "5511223344", "TRUE"],
            ["Hotel Boutique", "HB", "Callejón del Beso 5", "5599887766", "TRUE"],
          ]
          sheetName = "Hoteles"
          break
        case "categorias":
          data = [
            ["Vegetales", "TRUE"],
            ["Carnes", "TRUE"],
          ]
          sheetName = "Categorias"
          break
        case "unidades_medida":
          data = [
            ["Kilogramo", "TRUE"],
            ["Litro", "TRUE"],
            ["Pieza", "TRUE"],
          ]
          sheetName = "Unidades de Medida"
          break
        default:
          toast({
            title: "Error",
            description: "Tipo de plantilla no reconocido.",
            variant: "destructive",
          })
          setLoading(false)
          return
      }

      const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
      saveAs(blob, `${fileName}.xlsx`)

      toast({
        title: "Plantilla Generada",
        description: `La plantilla de ${selectedType} se ha descargado exitosamente.`,
      })
    } catch (error) {
      console.error("Error generating excel:", error)
      toast({
        title: "Error al generar plantilla",
        description: "Ocurrió un error al crear el archivo Excel.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Plantilla Excel</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="template-type">Tipo de Plantilla</Label>
          <Select value={selectedType} onValueChange={setSelectedType} disabled={loading}>
            <SelectTrigger id="template-type">
              <SelectValue placeholder="Selecciona el tipo de datos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ingredientes">Ingredientes</SelectItem>
              <SelectItem value="platillos">Platillos</SelectItem>
              <SelectItem value="restaurantes">Restaurantes</SelectItem>
              <SelectItem value="hoteles">Hoteles</SelectItem>
              <SelectItem value="categorias">Categorías</SelectItem>
              <SelectItem value="unidades_medida">Unidades de Medida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={generateExcel} disabled={loading || !selectedType}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Descargar Plantilla {fileName}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

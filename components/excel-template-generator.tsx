"use client"

import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface IngredienteTemplate {
  clave: string
  descripcion: string
  categoria: string
  unidad: string
  precio_unitario: number
  conversion_unidad: string
  factor_conversion: number
  precio_unitario_convertido: number
}

export function ExcelTemplateGenerator() {
  const generateExcelTemplate = () => {
    try {
      // Datos de ejemplo para el template
      const templateData: IngredienteTemplate[] = [
        {
          clave: "ACE001",
          descripcion: "Aceite de Oliva Extra Virgen",
          categoria: "Aceites y Grasas",
          unidad: "Litro",
          precio_unitario: 180.0,
          conversion_unidad: "Mililitro",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.18,
        },
        {
          clave: "HAR002",
          descripcion: "Harina de Trigo",
          categoria: "Harinas y Cereales",
          unidad: "Kilogramo",
          precio_unitario: 25.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.025,
        },
        {
          clave: "HUE003",
          descripcion: "Huevo Fresco",
          categoria: "Lácteos y Huevos",
          unidad: "Pieza",
          precio_unitario: 3.5,
          conversion_unidad: "Pieza",
          factor_conversion: 1,
          precio_unitario_convertido: 3.5,
        },
        {
          clave: "LEC004",
          descripcion: "Leche Entera",
          categoria: "Lácteos y Huevos",
          unidad: "Litro",
          precio_unitario: 22.0,
          conversion_unidad: "Mililitro",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.022,
        },
        {
          clave: "TOM005",
          descripcion: "Tomate Rojo",
          categoria: "Verduras y Hortalizas",
          unidad: "Kilogramo",
          precio_unitario: 35.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.035,
        },
        {
          clave: "CEB006",
          descripcion: "Cebolla Blanca",
          categoria: "Verduras y Hortalizas",
          unidad: "Kilogramo",
          precio_unitario: 28.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.028,
        },
        {
          clave: "AJO007",
          descripcion: "Ajo",
          categoria: "Condimentos y Especias",
          unidad: "Kilogramo",
          precio_unitario: 120.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.12,
        },
        {
          clave: "SAL008",
          descripcion: "Sal de Mesa",
          categoria: "Condimentos y Especias",
          unidad: "Kilogramo",
          precio_unitario: 15.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.015,
        },
        {
          clave: "PIM009",
          descripcion: "Pimienta Negra Molida",
          categoria: "Condimentos y Especias",
          unidad: "Kilogramo",
          precio_unitario: 450.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.45,
        },
        {
          clave: "POL010",
          descripcion: "Pechuga de Pollo",
          categoria: "Carnes y Aves",
          unidad: "Kilogramo",
          precio_unitario: 85.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.085,
        },
        {
          clave: "RES011",
          descripcion: "Carne de Res Molida",
          categoria: "Carnes y Aves",
          unidad: "Kilogramo",
          precio_unitario: 120.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.12,
        },
        {
          clave: "QUE012",
          descripcion: "Queso Oaxaca",
          categoria: "Lácteos y Huevos",
          unidad: "Kilogramo",
          precio_unitario: 180.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.18,
        },
        {
          clave: "ARR013",
          descripcion: "Arroz Blanco",
          categoria: "Harinas y Cereales",
          unidad: "Kilogramo",
          precio_unitario: 32.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.032,
        },
        {
          clave: "FRI014",
          descripcion: "Frijol Negro",
          categoria: "Leguminosas",
          unidad: "Kilogramo",
          precio_unitario: 45.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.045,
        },
        {
          clave: "CHI015",
          descripcion: "Chile Jalapeño",
          categoria: "Verduras y Hortalizas",
          unidad: "Kilogramo",
          precio_unitario: 55.0,
          conversion_unidad: "Gramo",
          factor_conversion: 1000,
          precio_unitario_convertido: 0.055,
        },
      ]

      // Crear el workbook con configuración específica para el navegador
      const wb = XLSX.utils.book_new()

      // Crear la hoja con los datos
      const ws = XLSX.utils.json_to_sheet(templateData)

      // Configurar el ancho de las columnas
      const colWidths = [
        { wch: 12 }, // clave
        { wch: 35 }, // descripcion
        { wch: 25 }, // categoria
        { wch: 15 }, // unidad
        { wch: 18 }, // precio_unitario
        { wch: 20 }, // conversion_unidad
        { wch: 18 }, // factor_conversion
        { wch: 25 }, // precio_unitario_convertido
      ]
      ws["!cols"] = colWidths

      // Agregar la hoja al workbook
      XLSX.utils.book_append_sheet(wb, ws, "Ingredientes")

      // Crear hoja de instrucciones
      const instrucciones = [
        {
          Campo: "clave",
          Descripcion: "Código único del ingrediente (ej: ACE001)",
          Requerido: "SÍ",
          Tipo: "Texto",
          Ejemplo: "ACE001",
        },
        {
          Campo: "descripcion",
          Descripcion: "Nombre completo del ingrediente",
          Requerido: "SÍ",
          Tipo: "Texto",
          Ejemplo: "Aceite de Oliva Extra Virgen",
        },
        {
          Campo: "categoria",
          Descripcion: "Categoría del ingrediente",
          Requerido: "SÍ",
          Tipo: "Texto",
          Ejemplo: "Aceites y Grasas",
        },
        {
          Campo: "unidad",
          Descripcion: "Unidad base de compra/almacenamiento",
          Requerido: "SÍ",
          Tipo: "Texto",
          Ejemplo: "Kilogramo, Litro, Pieza",
        },
        {
          Campo: "precio_unitario",
          Descripcion: "Precio por unidad base",
          Requerido: "SÍ",
          Tipo: "Número",
          Ejemplo: "180.00",
        },
        {
          Campo: "conversion_unidad",
          Descripcion: "Unidad para uso en recetas",
          Requerido: "NO",
          Tipo: "Texto",
          Ejemplo: "Gramo, Mililitro, Pieza",
        },
        {
          Campo: "factor_conversion",
          Descripcion: "Factor de conversión (unidad base = X unidades convertidas)",
          Requerido: "NO",
          Tipo: "Número",
          Ejemplo: "1000 (1 kg = 1000 g)",
        },
        {
          Campo: "precio_unitario_convertido",
          Descripcion: "Precio por unidad convertida (calculado automáticamente si no se proporciona)",
          Requerido: "NO",
          Tipo: "Número",
          Ejemplo: "0.18 (precio por gramo)",
        },
      ]

      const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones)
      const colWidthsInstr = [
        { wch: 25 }, // Campo
        { wch: 60 }, // Descripcion
        { wch: 12 }, // Requerido
        { wch: 12 }, // Tipo
        { wch: 30 }, // Ejemplo
      ]
      wsInstrucciones["!cols"] = colWidthsInstr
      XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones")

      // Crear hoja de categorías sugeridas
      const categoriasSugeridas = [
        { categoria: "Aceites y Grasas" },
        { categoria: "Harinas y Cereales" },
        { categoria: "Lácteos y Huevos" },
        { categoria: "Verduras y Hortalizas" },
        { categoria: "Frutas" },
        { categoria: "Carnes y Aves" },
        { categoria: "Pescados y Mariscos" },
        { categoria: "Condimentos y Especias" },
        { categoria: "Leguminosas" },
        { categoria: "Bebidas" },
        { categoria: "Panadería y Repostería" },
        { categoria: "Conservas y Enlatados" },
        { categoria: "Productos Congelados" },
        { categoria: "Otros" },
      ]

      const wsCategorias = XLSX.utils.json_to_sheet(categoriasSugeridas)
      wsCategorias["!cols"] = [{ wch: 30 }]
      XLSX.utils.book_append_sheet(wb, wsCategorias, "Categorías Sugeridas")

      // Generar el archivo usando writeFile que funciona en el navegador
      const fileName = `template_ingredientes_${new Date().toISOString().split("T")[0]}.xlsx`

      // Usar writeFile con configuración específica para el navegador
      XLSX.writeFile(wb, fileName, {
        bookType: "xlsx",
        type: "binary",
      })

      console.log("Template Excel generado exitosamente")
    } catch (error) {
      console.error("Error generando template Excel:", error)

      // Fallback: generar CSV si Excel falla
      try {
        generateCSVTemplate()
      } catch (csvError) {
        console.error("Error generando template CSV:", csvError)
        alert("Error generando el template. Por favor intenta de nuevo.")
      }
    }
  }

  const generateCSVTemplate = () => {
    const csvData = [
      [
        "clave",
        "descripcion",
        "categoria",
        "unidad",
        "precio_unitario",
        "conversion_unidad",
        "factor_conversion",
        "precio_unitario_convertido",
      ],
      ["ACE001", "Aceite de Oliva Extra Virgen", "Aceites y Grasas", "Litro", "180.00", "Mililitro", "1000", "0.18"],
      ["HAR002", "Harina de Trigo", "Harinas y Cereales", "Kilogramo", "25.00", "Gramo", "1000", "0.025"],
      ["HUE003", "Huevo Fresco", "Lácteos y Huevos", "Pieza", "3.50", "Pieza", "1", "3.50"],
      ["LEC004", "Leche Entera", "Lácteos y Huevos", "Litro", "22.00", "Mililitro", "1000", "0.022"],
      ["TOM005", "Tomate Rojo", "Verduras y Hortalizas", "Kilogramo", "35.00", "Gramo", "1000", "0.035"],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `template_ingredientes_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Button onClick={generateExcelTemplate} variant="outline" className="w-full">
      <Download className="mr-2 h-4 w-4" />
      Descargar Template Excel
    </Button>
  )
}

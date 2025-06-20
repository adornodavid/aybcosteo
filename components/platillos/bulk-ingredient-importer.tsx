"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileText, CheckCircle, XCircle, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"

interface BulkIngredientImporterProps {
  onAddIngredientes: (ingredientes: Array<{ ingrediente: any; cantidad: number }>) => void
  restauranteId?: string
}

interface IngredienteEncontrado {
  codigo: string
  cantidad: number
  ingrediente?: any
  encontrado: boolean
  error?: string
}

export function BulkIngredientImporter({ onAddIngredientes, restauranteId }: BulkIngredientImporterProps) {
  const [open, setOpen] = useState(false)
  const [codigosText, setCodigosText] = useState("")
  const [resultados, setResultados] = useState<IngredienteEncontrado[]>([])
  const [procesando, setProcesando] = useState(false)
  const [agregando, setAgregando] = useState(false)
  const { toast } = useToast()

  const parsearCodigos = (texto: string): Array<{ codigo: string; cantidad: number }> => {
    const lineas = texto
      .trim()
      .split("\n")
      .filter((linea) => linea.trim())
    const codigos: Array<{ codigo: string; cantidad: number }> = []

    for (const linea of lineas) {
      const lineaLimpia = linea.trim()
      if (!lineaLimpia) continue

      // Diferentes formatos soportados:
      // "AC100030" (solo código, cantidad = 1)
      // "AC100030 1.5" (código + cantidad)
      // "AC100030,2.0" (código,cantidad)
      // "AC100030 - 0.5 kg" (código - cantidad unidad)

      let codigo = ""
      let cantidad = 1

      if (lineaLimpia.includes(",")) {
        // Formato: "AC100030,1.5"
        const partes = lineaLimpia.split(",")
        codigo = partes[0].trim()
        cantidad = Number.parseFloat(partes[1]?.trim()) || 1
      } else if (lineaLimpia.includes(" - ")) {
        // Formato: "AC100030 - 1.5 kg"
        const partes = lineaLimpia.split(" - ")
        codigo = partes[0].trim()
        const cantidadParte = partes[1]?.trim().split(" ")[0]
        cantidad = Number.parseFloat(cantidadParte) || 1
      } else if (lineaLimpia.includes(" ")) {
        // Formato: "AC100030 1.5"
        const partes = lineaLimpia.split(" ")
        codigo = partes[0].trim()
        cantidad = Number.parseFloat(partes[1]?.trim()) || 1
      } else {
        // Solo código: "AC100030"
        codigo = lineaLimpia
        cantidad = 1
      }

      if (codigo) {
        codigos.push({ codigo: codigo.toUpperCase(), cantidad })
      }
    }

    return codigos
  }

  const buscarIngredientes = async (codigos: Array<{ codigo: string; cantidad: number }>) => {
    const resultados: IngredienteEncontrado[] = []

    for (const { codigo, cantidad } of codigos) {
      try {
        // Buscar por clave_innsist
        const { data, error } = await supabase
          .from("ingredientes")
          .select(`
            id,
            clave_innsist,
            descripcion,
            unidad,
            precio_unitario,
            conversion_unidad,
            precio_unitario_convertido,
            categoria:categorias(nombre)
          `)
          .eq("clave_innsist", codigo)
          .eq("activo", true)
          .single()

        if (error || !data) {
          resultados.push({
            codigo,
            cantidad,
            encontrado: false,
            error: "Código no encontrado",
          })
        } else {
          resultados.push({
            codigo,
            cantidad,
            ingrediente: {
              ...data,
              precio_actual: data.precio_unitario,
              unidad_medida: data.unidad,
              clave_innsist: data.clave_innsist,
            },
            encontrado: true,
          })
        }
      } catch (error) {
        console.error(`Error buscando ingrediente ${codigo}:`, error)
        resultados.push({
          codigo,
          cantidad,
          encontrado: false,
          error: "Error en la búsqueda",
        })
      }
    }

    return resultados
  }

  const handleProcesarCodigos = async () => {
    if (!codigosText.trim()) {
      toast({
        title: "Error",
        description: "Ingresa al menos un código",
        variant: "destructive",
      })
      return
    }

    setProcesando(true)
    try {
      const codigos = parsearCodigos(codigosText)
      if (codigos.length === 0) {
        toast({
          title: "Error",
          description: "No se encontraron códigos válidos",
          variant: "destructive",
        })
        return
      }

      const resultados = await buscarIngredientes(codigos)
      setResultados(resultados)

      const encontrados = resultados.filter((r) => r.encontrado).length
      const noEncontrados = resultados.filter((r) => !r.encontrado).length

      toast({
        title: "Procesamiento completado",
        description: `${encontrados} encontrados, ${noEncontrados} no encontrados`,
      })
    } catch (error) {
      console.error("Error procesando códigos:", error)
      toast({
        title: "Error",
        description: "Error al procesar los códigos",
        variant: "destructive",
      })
    } finally {
      setProcesando(false)
    }
  }

  const handleAgregarCodigosDirectamente = async () => {
    if (!codigosText.trim()) {
      toast({
        title: "Error",
        description: "Ingresa al menos un código",
        variant: "destructive",
      })
      return
    }

    setAgregando(true)
    try {
      const codigos = parsearCodigos(codigosText)
      const resultados = await buscarIngredientes(codigos)

      const ingredientesEncontrados = resultados
        .filter((r) => r.encontrado && r.ingrediente)
        .map((r) => ({
          ingrediente: r.ingrediente,
          cantidad: r.cantidad,
        }))

      if (ingredientesEncontrados.length > 0) {
        onAddIngredientes(ingredientesEncontrados)

        const noEncontrados = resultados.filter((r) => !r.encontrado).length

        toast({
          title: "Ingredientes agregados",
          description: `${ingredientesEncontrados.length} ingredientes agregados${noEncontrados > 0 ? `, ${noEncontrados} no encontrados` : ""}`,
        })

        setOpen(false)
        setCodigosText("")
        setResultados([])
      } else {
        toast({
          title: "Error",
          description: "No se encontraron ingredientes válidos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error agregando códigos:", error)
      toast({
        title: "Error",
        description: "Error al agregar los ingredientes",
        variant: "destructive",
      })
    } finally {
      setAgregando(false)
    }
  }

  const handleAgregarSeleccionados = () => {
    const ingredientesEncontrados = resultados
      .filter((r) => r.encontrado && r.ingrediente)
      .map((r) => ({
        ingrediente: r.ingrediente,
        cantidad: r.cantidad,
      }))

    if (ingredientesEncontrados.length > 0) {
      onAddIngredientes(ingredientesEncontrados)
      toast({
        title: "Ingredientes agregados",
        description: `${ingredientesEncontrados.length} ingredientes agregados al platillo`,
      })
      setOpen(false)
      setCodigosText("")
      setResultados([])
    }
  }

  const handleCargarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/plain") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const contenido = e.target?.result as string
        setCodigosText(contenido)
      }
      reader.readAsText(file)
    } else {
      toast({
        title: "Error",
        description: "Solo se permiten archivos .txt",
        variant: "destructive",
      })
    }
  }

  const limpiarFormulario = () => {
    setCodigosText("")
    setResultados([])
  }

  const encontrados = resultados.filter((r) => r.encontrado).length
  const noEncontrados = resultados.filter((r) => !r.encontrado).length
  const totalCosto = resultados
    .filter((r) => r.encontrado && r.ingrediente)
    .reduce((sum, r) => sum + r.cantidad * (r.ingrediente?.precio_actual || 0), 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar por Códigos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Ingredientes por Códigos Innsist
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-hidden">
          {/* Paso 1: Ingresar Códigos */}
          <div className="space-y-4">
            <h3 className="font-medium">Paso 1: Ingresar Códigos</h3>

            <div className="space-y-2">
              <Label htmlFor="codigos">Códigos Innsist (uno por línea)</Label>
              <Textarea
                id="codigos"
                placeholder={`FR260200
HU210250 1.5
SE170020,2.0
JI250030 - 0.5 kg
CE250020`}
                value={codigosText}
                onChange={(e) => setCodigosText(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formatos: "CÓDIGO", "CÓDIGO CANTIDAD", "CÓDIGO,CANTIDAD" o "CÓDIGO - CANTIDAD unidad"
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleCargarArchivo}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Cargar archivo .txt
                </Button>
              </div>

              <Button onClick={handleProcesarCodigos} disabled={procesando || !codigosText.trim()} size="sm">
                {procesando ? "Procesando..." : "Procesar Códigos"}
              </Button>

              <Button
                onClick={handleAgregarCodigosDirectamente}
                disabled={agregando || !codigosText.trim()}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {agregando ? "Agregando..." : "Agregar Códigos Directamente"}
              </Button>

              <Button variant="ghost" onClick={limpiarFormulario} size="sm">
                Limpiar
              </Button>
            </div>
          </div>

          {/* Paso 2: Revisar y Ajustar */}
          {resultados.length > 0 && (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Paso 2: Revisar y Ajustar</h3>
                <div className="flex gap-2">
                  {encontrados > 0 && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {encontrados} encontrados
                    </Badge>
                  )}
                  {noEncontrados > 0 && <Badge variant="destructive">{noEncontrados} no encontrados</Badge>}
                </div>
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                <div className="max-h-[300px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-16">Estado</TableHead>
                        <TableHead className="w-24">Código</TableHead>
                        <TableHead>Ingrediente</TableHead>
                        <TableHead className="w-24">Cantidad</TableHead>
                        <TableHead className="w-24">Precio Unit.</TableHead>
                        <TableHead className="w-24">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.map((resultado, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {resultado.encontrado ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">{resultado.codigo}</code>
                          </TableCell>
                          <TableCell>
                            {resultado.encontrado ? (
                              <div>
                                <p className="font-medium text-sm">{resultado.ingrediente?.descripcion}</p>
                                <p className="text-xs text-muted-foreground">
                                  {resultado.ingrediente?.categoria?.nombre}
                                </p>
                              </div>
                            ) : (
                              <span className="text-red-600 text-sm">{resultado.error}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {resultado.encontrado ? (
                              <Input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={resultado.cantidad}
                                onChange={(e) => {
                                  const newResultados = [...resultados]
                                  newResultados[index].cantidad = Number.parseFloat(e.target.value) || 0
                                  setResultados(newResultados)
                                }}
                                className="w-16 h-8 text-xs"
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {resultado.encontrado ? (
                              <span className="text-xs">
                                {formatCurrency(resultado.ingrediente?.precio_actual || 0)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {resultado.encontrado ? (
                              <span className="text-xs font-medium">
                                {formatCurrency(resultado.cantidad * (resultado.ingrediente?.precio_actual || 0))}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer con totales y botones */}
        {resultados.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">{encontrados} ingredientes encontrados</div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total estimado</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalCosto)}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAgregarSeleccionados}
                disabled={encontrados === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar {encontrados} Ingredientes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Plus, Search, X, Menu, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Platillo } from "@/lib/supabase"

type PlatilloSelectorProps = {
  onAddPlatillo: (platillo: Platillo, precioVenta: number) => void
  buttonText?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
}

export function PlatilloSelector({
  onAddPlatillo,
  buttonText = "Agregar Platillo",
  buttonVariant = "default",
  className,
}: PlatilloSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [allPlatillos, setAllPlatillos] = useState<Platillo[]>([])
  const [filteredPlatillos, setFilteredPlatillos] = useState<Platillo[]>([])
  const [loading, setLoading] = useState(false)
  const [platillosSeleccionados, setPlatillosSeleccionados] = useState<(Platillo & { precioVenta: number })[]>([])
  const { toast } = useToast()

  // Cargar todos los platillos al abrir el modal
  useEffect(() => {
    if (open) {
      fetchAllPlatillos()
    } else {
      // Limpiar cuando se cierra el modal
      setSearchTerm("")
      setPlatillosSeleccionados([])
    }
  }, [open])

  // Filtrar platillos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = allPlatillos.filter(
        (platillo) =>
          platillo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (platillo.descripcion && platillo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredPlatillos(filtered)
    } else {
      setFilteredPlatillos(allPlatillos)
    }
  }, [searchTerm, allPlatillos])

  const fetchAllPlatillos = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("platillos").select("*").order("nombre")

      if (error) {
        throw error
      }

      setAllPlatillos(data || [])
      setFilteredPlatillos(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los platillos. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
      setAllPlatillos([])
      setFilteredPlatillos([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlatillo = (platillo: Platillo) => {
    // Verificar si ya está en la lista
    const existe = platillosSeleccionados.some((item) => item.id === platillo.id)
    if (existe) {
      toast({
        title: "Platillo ya seleccionado",
        description: "Este platillo ya está en tu lista",
        variant: "default",
      })
      return
    }

    // Calcular precio de venta sugerido (30% de margen por defecto)
    const precioSugerido = platillo.costo_total * 1.3

    // Agregar a la lista con precio sugerido
    setPlatillosSeleccionados([
      ...platillosSeleccionados,
      {
        ...platillo,
        precioVenta: precioSugerido,
      },
    ])

    toast({
      title: "Platillo agregado",
      description: `${platillo.nombre} agregado a la lista`,
      variant: "default",
    })
  }

  const handleRemovePlatillo = (id: string) => {
    setPlatillosSeleccionados(platillosSeleccionados.filter((item) => item.id !== id))
  }

  const handleUpdatePrecio = (id: string, precio: number) => {
    if (precio < 0) return

    setPlatillosSeleccionados(
      platillosSeleccionados.map((item) => (item.id === id ? { ...item, precioVenta: precio } : item)),
    )
  }

  const handleAddAllPlatillos = () => {
    if (platillosSeleccionados.length === 0) {
      toast({
        title: "No hay platillos",
        description: "Agrega al menos un platillo a la lista",
        variant: "destructive",
      })
      return
    }

    // Agregar cada platillo al menú
    for (const item of platillosSeleccionados) {
      onAddPlatillo(item, item.precioVenta)
    }

    toast({
      title: "Platillos agregados",
      description: `Se agregaron ${platillosSeleccionados.length} platillos al menú`,
      variant: "default",
    })

    setOpen(false)
    setPlatillosSeleccionados([])
    setSearchTerm("")
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setFilteredPlatillos(allPlatillos)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={className}>
          <Plus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Menu className="mr-2 h-5 w-5" />
            Agregar Platillos al Menú
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Sección superior: Platillos seleccionados - altura fija */}
          {platillosSeleccionados.length > 0 && (
            <Card className="border-dashed shrink-0">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">Platillos seleccionados</h3>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddAllPlatillos}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Agregar todos al menú
                  </Button>
                </div>

                {/* Lista de platillos seleccionados con altura máxima */}
                <div className="border rounded-md">
                  <ScrollArea className="h-[150px]">
                    <div className="p-2 space-y-2">
                      {platillosSeleccionados.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.nombre}</p>
                            <p className="text-xs text-muted-foreground">Costo: {formatCurrency(item.costo_total)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-sm">Precio de venta:</span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.precioVenta}
                                onChange={(e) => handleUpdatePrecio(item.id, Number(e.target.value))}
                                className="w-24 h-8"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePlatillo(item.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección inferior: Búsqueda de platillos - ocupa el resto del espacio */}
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar platillo por nombre..."
                    className="pl-8 pr-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={handleClearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">Cargando platillos...</div>
              ) : filteredPlatillos.length > 0 ? (
                <div className="border rounded-md flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky top-0 bg-background">Nombre</TableHead>
                          <TableHead className="sticky top-0 bg-background">Descripción</TableHead>
                          <TableHead className="sticky top-0 bg-background">Costo</TableHead>
                          <TableHead className="sticky top-0 bg-background"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlatillos.map((platillo) => (
                          <TableRow key={platillo.id}>
                            <TableCell className="font-medium">{platillo.nombre}</TableCell>
                            <TableCell>{platillo.descripcion || "-"}</TableCell>
                            <TableCell>{formatCurrency(platillo.costo_total)}</TableCell>
                            <TableCell>
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full"
                                onClick={() => handleSelectPlatillo(platillo)}
                              >
                                Seleccionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              ) : searchTerm ? (
                <div className="text-center py-4 text-muted-foreground">
                  No se encontraron platillos que coincidan con "{searchTerm}"
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No hay platillos disponibles en la base de datos.</p>
                  <p className="text-sm mt-2">Por favor, crea platillos primero.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

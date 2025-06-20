"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Plus, Search, X, Menu } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Menu as MenuType } from "@/lib/supabase"

type MenuSelectorProps = {
  onAddMenu: (menu: MenuType) => void
  buttonText?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
}

export function MenuSelector({
  onAddMenu,
  buttonText = "Agregar Menú",
  buttonVariant = "default",
  className,
}: MenuSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [allMenus, setAllMenus] = useState<MenuType[]>([])
  const [filteredMenus, setFilteredMenus] = useState<MenuType[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Cargar todos los menús al abrir el modal
  useEffect(() => {
    if (open) {
      fetchAllMenus()
    } else {
      // Limpiar cuando se cierra el modal
      setSearchTerm("")
    }
  }, [open])

  // Filtrar menús cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = allMenus.filter(
        (menu) =>
          menu.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (menu.descripcion && menu.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredMenus(filtered)
    } else {
      setFilteredMenus(allMenus)
    }
  }, [searchTerm, allMenus])

  const fetchAllMenus = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("menus").select("*").order("nombre")

      if (error) {
        throw error
      }

      setAllMenus(data || [])
      setFilteredMenus(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los menús. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
      setAllMenus([])
      setFilteredMenus([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMenu = (menu: MenuType) => {
    onAddMenu(menu)
    setOpen(false)

    toast({
      title: "Menú seleccionado",
      description: `${menu.nombre} ha sido seleccionado`,
      variant: "default",
    })
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setFilteredMenus(allMenus)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={className}>
          <Plus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Menu className="mr-2 h-5 w-5" />
            Seleccionar Menú
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar menú por nombre..."
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
                <div className="text-center py-4">Cargando menús...</div>
              ) : filteredMenus.length > 0 ? (
                <div className="border rounded-md flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky top-0 bg-background">Nombre</TableHead>
                          <TableHead className="sticky top-0 bg-background">Descripción</TableHead>
                          <TableHead className="sticky top-0 bg-background">Fecha de Creación</TableHead>
                          <TableHead className="sticky top-0 bg-background"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMenus.map((menu) => (
                          <TableRow key={menu.id}>
                            <TableCell className="font-medium">{menu.nombre}</TableCell>
                            <TableCell>{menu.descripcion || "-"}</TableCell>
                            <TableCell>{new Date(menu.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full"
                                onClick={() => handleSelectMenu(menu)}
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
                  No se encontraron menús que coincidan con "{searchTerm}"
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No hay menús disponibles en la base de datos.</p>
                  <p className="text-sm mt-2">Por favor, crea menús primero.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

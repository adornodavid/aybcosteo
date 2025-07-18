"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Search, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase" // Import the correct client for client-side fetching

interface Menu {
  id: number
  nombre: string
  restaurante_nombre: string
}

interface MenuSelectorProps {
  onSelectMenu: (menu: Menu) => void
  selectedMenuId?: number | null
}

export function MenuSelector({ onSelectMenu, selectedMenuId }: MenuSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchMenus = useCallback(async () => {
    setLoading(true)
    const supabase = createClient() // Use the correct client for client-side fetching
    let query = supabase
      .from("menus_restaurantes")
      .select(`id, nombre, restaurantes(nombre)`)
      .eq("activo", true)
      .order("nombre")

    if (searchTerm) {
      query = query.ilike("nombre", `%${searchTerm}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error fetching menus:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los menús.",
        variant: "destructive",
      })
      setMenus([])
    } else {
      const formattedData = data.map((menu: any) => ({
        id: menu.id,
        nombre: menu.nombre,
        restaurante_nombre: menu.restaurantes?.nombre || "N/A",
      }))
      setMenus(formattedData || [])
    }
    setLoading(false)
  }, [searchTerm, toast])

  useEffect(() => {
    if (isDialogOpen) {
      fetchMenus()
    }
  }, [isDialogOpen, fetchMenus])

  const handleSelect = (menu: Menu) => {
    onSelectMenu(menu)
    setIsDialogOpen(false)
  }

  const selectedMenu = menus.find((m) => m.id === selectedMenuId)

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Label htmlFor="menu-selected">Menú Seleccionado</Label>
      <div className="flex items-center space-x-2">
        <Input
          id="menu-selected"
          value={selectedMenu?.nombre || "Ningún menú seleccionado"}
          readOnly
          className="flex-grow"
        />
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Seleccionar
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Menú</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar menú por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  fetchMenus()
                }
              }}
            />
            <Button onClick={fetchMenus} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : menus.length === 0 ? (
              <p className="text-center text-muted-foreground">No se encontraron menús.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Menú</TableHead>
                    <TableHead>Restaurante</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menus.map((menu) => (
                    <TableRow key={menu.id}>
                      <TableCell>{menu.nombre}</TableCell>
                      <TableCell>{menu.restaurante_nombre}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleSelect(menu)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

/* ==================================================
  Imports
================================================== */
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Search, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase" // Import the correct client for client-side fetching

interface Platillo {
  id: number
  nombre: string
  descripcion: string
  imagen_url: string | null
}

interface PlatilloSelectorProps {
  onSelectPlatillo: (platillo: Platillo) => void
  selectedPlatilloId?: number | null
}

export function PlatilloSelector({ onSelectPlatillo, selectedPlatilloId }: PlatilloSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchPlatillos = useCallback(async () => {
    setLoading(true)
    const supabase = createClient() // Use the correct client for client-side fetching
    let query = supabase.from("platillos").select("*").eq("activo", true).order("nombre")

    if (searchTerm) {
      query = query.ilike("nombre", `%${searchTerm}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error fetching platillos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los platillos.",
        variant: "destructive",
      })
      setPlatillos([])
    } else {
      setPlatillos(data || [])
    }
    setLoading(false)
  }, [searchTerm, toast])

  useEffect(() => {
    if (isDialogOpen) {
      fetchPlatillos()
    }
  }, [isDialogOpen, fetchPlatillos])

  const handleSelect = (platillo: Platillo) => {
    onSelectPlatillo(platillo)
    setIsDialogOpen(false)
  }

  const selectedPlatillo = platillos.find((p) => p.id === selectedPlatilloId)

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Label htmlFor="platillo-selected">Platillo Seleccionado</Label>
      <div className="flex items-center space-x-2">
        <Input
          id="platillo-selected"
          value={selectedPlatillo?.nombre || "Ningún platillo seleccionado"}
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
          <DialogTitle>Seleccionar Platillo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar platillo por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  fetchPlatillos()
                }
              }}
            />
            <Button onClick={fetchPlatillos} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : platillos.length === 0 ? (
              <p className="text-center text-muted-foreground">No se encontraron platillos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platillos.map((platillo) => (
                    <TableRow key={platillo.id}>
                      <TableCell>{platillo.nombre}</TableCell>
                      <TableCell>{platillo.descripcion}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleSelect(platillo)}>
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

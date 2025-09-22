"use client"

/* ==================================================
  Imports
================================================== */
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, RotateCcw } from "lucide-react"
import { obtenerHotelesFiltrados, obtenerTotalHoteles } from "@/app/actions/hoteles-actions"
import Image from "next/image" // Importar Image de next/image

/* ==================================================
  Interfaces, tipados, clases
================================================== */
// Tipo para los resultados del query SQL específico
type HotelResult = {
  Folio: number
  Acronimo: string | null
  Nombre: string
  Direccion: string | null
  Estatus: boolean
}

export default function HotelesPage() {
  const [hotels, setHotels] = useState<HotelResult[]>([])
  const [totalHoteles, setTotalHoteles] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para los filtros
  const [searchAcronimo, setSearchAcronimo] = useState("")
  const [searchNombre, setSearchNombre] = useState("")
  const [currentSearchAcronimo, setCurrentSearchAcronimo] = useState("")
  const [currentSearchNombre, setCurrentSearchNombre] = useState("")

  const mounted = useRef(true)
  const itemsPerPage = 20

  const fetchData = useCallback(async () => {
    if (!mounted.current) return

    setLoading(true)
    setError(null)

    try {
      // Obtener estadísticas generales
      const { total: totalHotelesCount, error: statsError } = await obtenerTotalHoteles()
      if (statsError) {
        console.error("Error al obtener estadísticas:", statsError)
      } else if (mounted.current) {
        setTotalHoteles(totalHotelesCount)
      }

      // Obtener hoteles filtrados
      const {
        data,
        error: hotelesError,
        totalCount: count,
      } = await obtenerHotelesFiltrados(currentSearchAcronimo, currentSearchNombre, currentPage, itemsPerPage)

      if (hotelesError) {
        if (mounted.current) {
          setError(hotelesError)
        }
      } else if (mounted.current) {
        setHotels(data || [])
        setTotalCount(count)
      }
    } catch (err) {
      console.error("Error en fetchData:", err)
      if (mounted.current) {
        setError("Error al cargar los datos")
      }
    } finally {
      if (mounted.current) {
        setLoading(false)
      }
    }
  }, [currentSearchAcronimo, currentSearchNombre, currentPage])

  useEffect(() => {
    mounted.current = true
    fetchData()

    return () => {
      mounted.current = false
    }
  }, [fetchData])

  const handleSearch = () => {
    setCurrentSearchAcronimo(searchAcronimo)
    setCurrentSearchNombre(searchNombre)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleClearFilters = () => {
    setSearchAcronimo("")
    setSearchNombre("")
    setCurrentSearchAcronimo("")
    setCurrentSearchNombre("")
    setCurrentPage(1)
  }


    if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
         <div className="flex flex-col items-center justify-center p-8">
            <div className="relative w-24 h-24 mb-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/design-mode-images/CargarPage%281%29-eqtLX9AzyIvXuPKJKQz0BWJW7GdBI1.gif"
              alt="Procesando..."
              width={300} // Ajusta el tamaño según sea necesario
              height={300} // Ajusta el tamaño según sea necesario
              unoptimized // Importante para GIFs externos
              className="absolute inset-0 animate-bounce-slow"
            />
            </div>
            <p className="text-lg font-semibold text-gray-800">Cargando Pagina...</p>
           
        </div>
      </div>
    )
  }
  

   // ESTE ES EL ÚNICO LUGAR DONDE SE EJECUTA LA BÚSQUEDA
  const handleFormSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSearch()
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Título de la página */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hoteles</h2>
          <p className="text-muted-foreground">Gestión hotelera</p>
        </div>
      </div>

      {/* Resúmenes de estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Hoteles Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : totalHoteles.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Buscar hoteles por acrónimo y nombre</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="frmHotelesBuscar" name="frmHotelesBuscar" className="flex gap-4 items-end" onSubmit={handleFormSearchSubmit}>
            <div className="flex-1">
              <label htmlFor="txtHotelAcronimo" className="text-sm font-medium">
                Acrónimo
              </label>
              <Input
                id="txtHotelAcronimo"
                name="txtHotelAcronimo"
                type="text"
                maxLength={50}
                value={searchAcronimo}
                onChange={(e) => setSearchAcronimo(e.target.value)}
                placeholder="Buscar por acrónimo..."
              />
            </div>
            <div className="flex-1">
              <label htmlFor="txtHotelNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtHotelNombre"
                name="txtHotelNombre"
                type="text"
                maxLength={150}
                value={searchNombre}
                onChange={(e) => setSearchNombre(e.target.value)}
                placeholder="Buscar por nombre..."
              />
            </div>
            <Button
              id="btnHotelesLimpiar"
              name="btnHotelesLimpiar"
              type="button"
              onClick={handleClearFilters}
              className="bg-black text-white hover:bg-gray-800"
              style={{ fontSize: "12px" }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpiar filtros
            </Button>
            <Button
              id="btnHotelesBuscar"
              name="btnHotelesBuscar"
              //type="button"
              type="submit"
              //onClick={handleSearch}
              className="bg-black text-white hover:bg-gray-800"
              style={{ fontSize: "12px" }}
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Grid del listado y de la búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Hoteles</CardTitle>
          <CardDescription>
            {loading
              ? "Cargando..."
              : `Mostrando ${hotels.length} de ${totalCount} hoteles (Página ${currentPage} de ${totalPages})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>Error: {error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron hoteles con los criterios de búsqueda especificados.
            </div>
          ) : (
            <>
              <Table id="tblHotelesResultados">
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Acrónimo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Estatus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotels.map((hotel) => (
                    <TableRow key={hotel.Folio}>
                      <TableCell className="font-medium">{hotel.Folio}</TableCell>
                      <TableCell>{hotel.Acronimo || "-"}</TableCell>
                      <TableCell>{hotel.Nombre}</TableCell>
                      <TableCell>{hotel.Direccion || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={hotel.Estatus ? "default" : "secondary"}>
                          {hotel.Estatus ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = i + 1
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNumber)}
                              isActive={currentPage === pageNumber}
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      {totalPages > 5 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

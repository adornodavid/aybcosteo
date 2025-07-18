import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Estadísticas Costos</h1>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-16" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Select */}
            </div>
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-16" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Popover/Button */}
            </div>
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-24" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Date Picker */}
            </div>
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-24" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Date Picker */}
            </div>
            <Skeleton className="h-10 w-full" /> {/* Search Button */}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Gráfico de Costos por Platillo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Comparativa de Valores del Platillo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Márgenes de Utilidad de Platillos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Skeleton className="h-10 w-full" /> {/* Table Header */}
            <Skeleton className="h-10 w-full" /> {/* Table Row 1 */}
            <Skeleton className="h-10 w-full" /> {/* Table Row 2 */}
            <Skeleton className="h-10 w-full" /> {/* Table Row 3 */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

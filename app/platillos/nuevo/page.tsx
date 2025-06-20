import { PlatilloForm } from "@/components/platillos/platillo-form"

export default function NuevoPlatilloPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo Platillo</h1>
        <p className="text-muted-foreground">Crea un nuevo platillo para el menú</p>
      </div>
      <PlatilloForm />
    </div>
  )
}

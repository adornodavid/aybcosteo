import { PlatilloForm } from "@/components/platillos/platillo-form"

export default function CrearPlatilloPage() {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Platillo</h1>
      <PlatilloForm />
    </div>
  )
}

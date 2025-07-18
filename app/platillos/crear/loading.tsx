import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="ml-2 text-lg text-muted-foreground">Cargando formulario de creación de platillo...</span>
    </div>
  )
}

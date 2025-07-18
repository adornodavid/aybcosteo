"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2 } from "lucide-react"
import { eliminarIngrediente } from "@/app/actions/ingredientes-actions-correcto"

interface DeleteDialogProps {
  id: number
  descripcion: string
  onSuccess: () => void
}

export function DeleteDialog({ id, descripcion, onSuccess }: DeleteDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const result = await eliminarIngrediente(id)
      if (result.success) {
        toast({
          title: "¡Eliminación exitosa!",
          description: `El ingrediente "${descripcion}" ha sido eliminado.`,
        })
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el ingrediente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting ingredient:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al eliminar el ingrediente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Eliminar ingrediente" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
          <span className="sr-only">Eliminar ingrediente {descripcion}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el ingrediente &quot;{descripcion}&quot;. Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

"use client"

import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DeleteDialogProps {
  open: boolean
  ingrediente: { id: string; name: string } | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export default function DeleteDialog({ open, ingrediente, onClose, onConfirm, loading }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Confirmar Eliminación
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800">
            <strong>¿Estás seguro de que deseas eliminar este ingrediente?</strong>
          </div>
          <div className="text-xs text-yellow-700 mt-1">Esta acción no se puede deshacer.</div>
          {ingrediente && (
            <div className="mt-2 p-2 bg-white/50 rounded border border-yellow-100">
              <span className="text-sm font-medium">{ingrediente.name}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

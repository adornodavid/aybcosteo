"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { useToast } from "@/components/ui/use-toast"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
}

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Por favor selecciona una imagen (JPG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `imagenes/${fileName}`

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage.from("filescosteo").upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data } = supabase.storage.from("filescosteo").getPublicUrl(filePath)

      // Llamar al callback con la URL
      onChange(data.publicUrl)

      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente",
      })
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error al subir la imagen",
        description: error.message || "Ocurrió un error al subir la imagen",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      // Limpiar input para permitir subir el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
        disabled={loading}
      />

      {value ? (
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
          <img src={value || "/placeholder.svg"} alt="Imagen del platillo" className="w-full h-full object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onRemove}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-muted-foreground/25 rounded-md aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-muted-foreground/40 transition"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Haz clic para subir una imagen</p>
              <p className="text-xs text-muted-foreground/70">JPG, PNG (máx. 5MB)</p>
            </>
          )}
        </div>
      )}

      {!value && (
        <Button type="button" variant="outline" onClick={handleClick} disabled={loading} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          {loading ? "Subiendo..." : "Subir Imagen"}
        </Button>
      )}
    </div>
  )
}

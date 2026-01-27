"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ImageUploadProps {
  label?: string
  value?: string | null // URL de la imagen existente
  onChange: (file: File | null) => void
  onRemove?: () => void
  maxSizeMB?: number
  maxWidth?: number
  maxHeight?: number
  disabled?: boolean
}

const DEFAULT_MAX_SIZE_MB = 10
const DEFAULT_MAX_DIMENSION = 500

export function ImageUpload({
  label = "Cargar Imagen",
  value, // La URL pública de la imagen ya subida
  onChange,
  onRemove,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  maxWidth = DEFAULT_MAX_DIMENSION,
  maxHeight = DEFAULT_MAX_DIMENSION,
  disabled = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentFileRef = useRef<File | null>(null) // Para mantener el archivo seleccionado

  // Actualizar previewUrl si el valor externo cambia (ej. al cargar un platillo existente)
  useEffect(() => {
    setPreviewUrl(value || null)
  }, [value])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) {
        currentFileRef.current = null
        setPreviewUrl(null)
        onChange(null)
        return
      }

      if (file.type !== "image/jpeg") {
        toast.error("Formato no válido. Solo se permiten imágenes .jpg")
        currentFileRef.current = null
        setPreviewUrl(null)
        onChange(null)
        return
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`La imagen es muy pesada. El máximo es ${maxSizeMB}MB.`)
        currentFileRef.current = null
        setPreviewUrl(null)
        onChange(null)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          if (img.width > maxWidth || img.height > maxHeight) {
            toast.error(`La resolución es muy alta. Máximo ${maxWidth}x${maxHeight}px.`)
            currentFileRef.current = null
            setPreviewUrl(null)
            onChange(null)
          } else {
            currentFileRef.current = file
            setPreviewUrl(event.target?.result as string)
            onChange(file) // Notificar al componente padre sobre el nuevo archivo
            toast.success("Imagen cargada con éxito.")
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    },
    [onChange, maxSizeMB, maxWidth, maxHeight],
  )

  const handleRemoveImage = useCallback(() => {
    currentFileRef.current = null
    setPreviewUrl(null)
    onChange(null) // Notificar al padre que no hay archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // Limpiar el input de tipo file
    }
    if (onRemove) {
      onRemove() // Llamar a la función de eliminación si se proporciona
    }
    toast.info("Imagen eliminada.")
  }, [onChange, onRemove])

  return (
    <div className="space-y-2">
      <Label htmlFor="image-upload-input">{label}</Label>
      <div className="flex h-64 w-full items-center justify-center rounded-md border-2 border-dashed">
        {previewUrl ? (
          <img src={previewUrl || "/placeholder.svg"} alt="Vista previa" className="h-full w-full object-contain" />
        ) : (
          <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <p>Arrastra o selecciona una imagen</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id="image-upload-input"
          type="file"
          accept="image/jpeg"
          onChange={handleFileChange}
          className="flex-1"
          ref={fileInputRef}
          disabled={disabled}
        />
        {previewUrl && (
          <Button type="button" variant="outline" size="icon" onClick={handleRemoveImage} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

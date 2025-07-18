"use client"

import { useState, useEffect } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Pencil, Trash2, Save } from "lucide-react"
import { createClient } from "@/lib/supabase" // Import the correct client for server-side fetching

interface UnidadMedida {
  id: number
  nombre: string
  activo: boolean
}

const initialState = {
  success: false,
  message: "",
  error: "",
}

// Server Actions for UnidadMedida
async function crearUnidadMedida(prevState: any, formData: FormData) {
  const supabase = createClient() // Use the correct client for server-side operations
  const nombre = formData.get("nombre") as string

  if (!nombre || nombre.trim() === "") {
    return { success: false, error: "El nombre de la unidad de medida es requerido." }
  }

  const { data, error } = await supabase
    .from("unidades_medida")
    .insert({ nombre: nombre.trim(), activo: true })
    .select()
    .single()

  if (error) {
    console.error("Error al crear unidad de medida:", error)
    return { success: false, error: `Error de base de datos: ${error.message}` }
  }

  return { success: true, message: `Unidad de medida "${nombre}" creada exitosamente.`, data }
}

async function actualizarUnidadMedida(id: number, prevState: any, formData: FormData) {
  const supabase = createClient() // Use the correct client for server-side operations
  const nombre = formData.get("nombre") as string

  if (!nombre || nombre.trim() === "") {
    return { success: false, error: "El nombre de la unidad de medida es requerido." }
  }

  const { error } = await supabase.from("unidades_medida").update({ nombre: nombre.trim() }).eq("id", id)

  if (error) {
    console.error("Error al actualizar unidad de medida:", error)
    return { success: false, error: `Error de base de datos: ${error.message}` }
  }

  return { success: true, message: `Unidad de medida "${nombre}" actualizada exitosamente.` }
}

async function eliminarUnidadMedida(id: number) {
  const supabase = createClient() // Use the correct client for server-side operations
  const { error } = await supabase.from("unidades_medida").update({ activo: false }).eq("id", id)

  if (error) {
    console.error("Error al eliminar unidad de medida:", error)
    return { success: false, error: `Error de base de datos: ${error.message}` }
  }

  return { success: true, message: "Unidad de medida eliminada exitosamente." }
}

export default function UnidadesMedidaPage() {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState<string>("")
  const [newName, setNewName] = useState<string>("")
  const { toast } = useToast()

  const [createState, createAction] = useFormState(crearUnidadMedida, initialState)
  const [updateState, updateAction] = useFormState(actualizarUnidadMedida.bind(null, editingId || 0), initialState)

  const fetchUnidades = async () => {
    setLoading(true)
    const supabase = createClient() // Use the correct client for server-side fetching
    const { data, error } = await supabase.from("unidades_medida").select("*").eq("activo", true).order("nombre")

    if (error) {
      console.error("Error fetching unidades de medida:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las unidades de medida.",
        variant: "destructive",
      })
    } else {
      setUnidades(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUnidades()
  }, [])

  useEffect(() => {
    if (createState.success) {
      toast({ title: "¡Registro exitoso!", description: createState.message })
      setNewName("")
      fetchUnidades()
    } else if (createState.error) {
      toast({ title: "Error", description: createState.error, variant: "destructive" })
    }
  }, [createState, toast])

  useEffect(() => {
    if (updateState.success) {
      toast({ title: "¡Actualización exitosa!", description: updateState.message })
      setEditingId(null)
      setEditingName("")
      fetchUnidades()
    } else if (updateState.error) {
      toast({ title: "Error", description: updateState.error, variant: "destructive" })
    }
  }, [updateState, toast])

  const handleEditClick = (unidad: UnidadMedida) => {
    setEditingId(unidad.id)
    setEditingName(unidad.nombre)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName("")
  }

  const handleDelete = async (id: number, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la unidad de medida "${nombre}"?`)) {
      setLoading(true)
      try {
        const result = await eliminarUnidadMedida(id)
        if (result.success) {
          toast({ title: "¡Eliminación exitosa!", description: result.message })
          fetchUnidades()
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" })
        }
      } catch (error) {
        console.error("Error deleting unidad de medida:", error)
        toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Unidades de Medida</h1>
        <p className="text-lg text-muted-foreground">Administra las unidades de medida para tus ingredientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Unidad de Medida</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="flex gap-2">
            <Input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Nombre de la unidad (ej: gramos, litros)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Unidades de Medida</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando unidades...</span>
            </div>
          ) : unidades.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">No hay unidades de medida registradas.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unidades.map((unidad) => (
                    <TableRow key={unidad.id}>
                      <TableCell>{unidad.id}</TableCell>
                      <TableCell>
                        {editingId === unidad.id ? (
                          <form action={updateAction} className="flex gap-2 items-center">
                            <input type="hidden" name="id" value={unidad.id} />
                            <Input
                              name="nombre"
                              type="text"
                              defaultValue={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              required
                            />
                            <Button type="submit" size="sm" disabled={loading}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        ) : (
                          unidad.nombre
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingId !== unidad.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => handleEditClick(unidad)}
                              disabled={loading}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar {unidad.nombre}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Eliminar"
                              onClick={() => handleDelete(unidad.id, unidad.nombre)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Eliminar {unidad.nombre}</span>
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { RecetaEditForm } from "@/components/recetas/receta-edit-form"

interface RecetaEditPageProps {
  params: {
    id: string
  }
}

export default function RecetaEditPage({ params }: RecetaEditPageProps) {
  const { id } = params

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-6">
        <RecetaEditForm recetaId={id} />
      </main>
    </div>
  )
}

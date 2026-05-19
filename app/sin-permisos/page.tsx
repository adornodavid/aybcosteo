"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft } from "lucide-react"

export default function SinPermisosPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center space-y-6 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-transparent p-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Acceso denegado</h1>
          <p className="text-sm text-muted-foreground mt-2">
            No tienes permisos para acceder a esta sección. Si crees que es un error, contacta al administrador.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  )
}

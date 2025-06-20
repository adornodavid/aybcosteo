"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface TutorialStep {
  title: string
  description: string
  route: string
  buttonText: string
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "1. Gestión de Ingredientes",
    description:
      "Comienza importando o creando los ingredientes que utilizarás en tus platillos. Cada ingrediente debe tener una clave única, descripción y unidad de medida.",
    route: "/ingredientes",
    buttonText: "Ir a Ingredientes",
  },
  {
    title: "2. Asignación de Precios",
    description:
      "Asigna precios a tus ingredientes. Puedes mantener un historial de precios para cada ingrediente y ver cómo afectan al costo de tus platillos.",
    route: "/precios",
    buttonText: "Ir a Precios",
  },
  {
    title: "3. Creación de Platillos",
    description:
      "Crea platillos utilizando los ingredientes disponibles. Especifica las cantidades necesarias y el sistema calculará automáticamente el costo total.",
    route: "/platillos",
    buttonText: "Ir a Platillos",
  },
  {
    title: "4. Diseño de Menús",
    description:
      "Organiza tus platillos en menús temáticos o por categorías. Esto te permitirá tener una visión clara de tu oferta gastronómica.",
    route: "/menus",
    buttonText: "Ir a Menús",
  },
  {
    title: "5. Gestión de Restaurantes",
    description:
      "Configura tus restaurantes y asígnales menús específicos. Podrás analizar los costos por restaurante y optimizar tu operación.",
    route: "/restaurantes",
    buttonText: "Ir a Restaurantes",
  },
]

export function TutorialSteps({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const step = tutorialSteps[currentStep]

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGoToStep = () => {
    router.push(step.route)
    onClose()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="relative pb-2">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
          aria-label="Cerrar tutorial"
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="text-lg">{step.title}</CardTitle>
        <CardDescription>
          Paso {currentStep + 1} de {tutorialSteps.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            aria-label="Paso anterior"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentStep === tutorialSteps.length - 1}
            aria-label="Siguiente paso"
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <Button size="sm" onClick={handleGoToStep}>
          {step.buttonText}
        </Button>
      </CardFooter>
    </Card>
  )
}

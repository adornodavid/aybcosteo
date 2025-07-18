"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TutorialStep {
  title: string
  description: string
  image?: string // Optional image URL
}

interface TutorialStepsProps {
  steps: TutorialStep[]
}

export function TutorialSteps({ steps }: TutorialStepsProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const currentStepContent = steps[currentStep]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">{currentStepContent.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentStepContent.image && (
          <div className="flex justify-center">
            <img
              src={currentStepContent.image || "/placeholder.svg"}
              alt={currentStepContent.title}
              className="max-h-64 object-contain"
            />
          </div>
        )}
        <p className="text-center text-muted-foreground">{currentStepContent.description}</p>
        <div className="flex justify-between items-center mt-6">
          <Button onClick={handlePrevious} disabled={currentStep === 0} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

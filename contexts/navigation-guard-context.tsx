"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useCallback } from "react"

// Define la interfaz para el contexto
interface NavigationGuardContextType {
  isGuarded: boolean // Indica si hay una página activa que requiere confirmación al salir
  setGuard: (guardFn: ((targetPath: string) => Promise<boolean>) | null) => void // Para que las páginas registren su función de guardia
  attemptNavigation: (targetPath: string) => Promise<boolean> // Para que los componentes de navegación intenten navegar
}

// Crea el contexto
const NavigationGuardContext = createContext<NavigationGuardContextType | undefined>(undefined)

// Proveedor del contexto
export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const [isGuarded, setIsGuarded] = useState(false)
  // useRef para almacenar la función de guardia de la página actual
  const guardFunctionRef = useRef<((targetPath: string) => Promise<boolean>) | null>(null)

  // Función para que una página registre su lógica de guardia
  const setGuard = useCallback((guardFn: ((targetPath: string) => Promise<boolean>) | null) => {
    guardFunctionRef.current = guardFn
    setIsGuarded(guardFn !== null)
  }, [])

  // Función que los componentes de navegación llamarán para intentar navegar
  const attemptNavigation = useCallback(
    async (targetPath: string): Promise<boolean> => {
      if (isGuarded && guardFunctionRef.current) {
        // Si hay una guardia activa, llama a la función de guardia de la página
        const canProceed = await guardFunctionRef.current(targetPath)
        return canProceed
      }
      // Si no hay guardia, se puede navegar libremente
      return true
    },
    [isGuarded],
  )

  return (
    <NavigationGuardContext.Provider value={{ isGuarded, setGuard, attemptNavigation }}>
      {children}
    </NavigationGuardContext.Provider>
  )
}

// Hook personalizado para consumir el contexto
export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext)
  if (context === undefined) {
    throw new Error("useNavigationGuard must be used within a NavigationGuardProvider")
  }
  return context
}

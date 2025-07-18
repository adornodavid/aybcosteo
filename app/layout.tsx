import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import ConditionalLayout from "@/components/conditional-layout"
import { NavigationGuardProvider } from "@/contexts/navigation-guard-context" // Importar el nuevo contexto

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Costeos",
  description: "Gestión de ingredientes, platillos y menús para restaurantes",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {/* Envolver con el nuevo proveedor de guardia de navegación */}
            <NavigationGuardProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </NavigationGuardProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

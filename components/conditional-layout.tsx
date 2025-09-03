"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar-final"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Páginas que no deben mostrar la navegación
  const noSidebarPages = ["/login", "/logout"]

  const shouldShowSidebar = !noSidebarPages.includes(pathname)

  if (!shouldShowSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-row items-stretch">
      <AppSidebar />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  )
}

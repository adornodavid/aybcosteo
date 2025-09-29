"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar-final"

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 ml-[100px] overflow-auto">{children}</main>
    </div>
  )
}

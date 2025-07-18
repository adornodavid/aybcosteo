"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import type React from "react"
import { useState } from "react"

interface NavLink {
  title: string
  label?: string
  icon: React.ElementType
  variant: "default" | "ghost"
  href: string
  submenu?: NavLink[]
}

interface NavMainProps {
  links: NavLink[]
  isCollapsed: boolean
}

export function NavMain({ links, isCollapsed }: NavMainProps) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => (prev.includes(title) ? prev.filter((group) => group !== title) : [...prev, title]))
  }

  return (
    <div className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
      {links.map((link, index) =>
        link.submenu ? (
          <div key={index} className="relative">
            <Button
              variant={pathname.startsWith(link.href) ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                isCollapsed && "h-9 w-9",
                pathname.startsWith(link.href) && "bg-primary text-primary-foreground",
              )}
              onClick={() => toggleGroup(link.title)}
            >
              <link.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && (
                <>
                  {link.title}
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 transition-transform",
                      openGroups.includes(link.title) && "rotate-180",
                    )}
                  />
                </>
              )}
            </Button>
            {!isCollapsed && openGroups.includes(link.title) && (
              <div className="ml-4 mt-1 grid gap-1">
                {link.submenu.map((subLink, subIndex) => (
                  <Link key={subIndex} href={subLink.href}>
                    <Button
                      variant={pathname === subLink.href ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        pathname === subLink.href && "bg-accent text-accent-foreground",
                      )}
                    >
                      <subLink.icon className="mr-3 h-5 w-5" />
                      {subLink.title}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link key={index} href={link.href}>
            <Button
              variant={pathname === link.href ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                isCollapsed && "h-9 w-9",
                pathname === link.href && "bg-primary text-primary-foreground",
              )}
            >
              <link.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && (
                <>
                  {link.title}
                  {link.label && (
                    <span className={cn("ml-auto", pathname === link.href && "text-background dark:text-white")}>
                      {link.label}
                    </span>
                  )}
                </>
              )}
            </Button>
          </Link>
        ),
      )}
    </div>
  )
}

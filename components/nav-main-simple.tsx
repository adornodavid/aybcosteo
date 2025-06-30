"use client"

import { ChevronDown, type LucideIcon } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function NavMainSimple({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
    }[]
  }[]
}) {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (title: string) => {
    setOpenItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isOpen = openItems.includes(item.title)
        const hasSubItems = item.items && item.items.length > 0

        return (
          <div key={item.title}>
            {/* Menú principal */}
            {hasSubItems ? (
              <button
                onClick={() => toggleItem(item.title)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  item.isActive && "bg-accent text-accent-foreground",
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span className="flex-1 text-left">{item.title}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>
            ) : (
              <Link
                href={item.url}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  item.isActive && "bg-accent text-accent-foreground",
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </Link>
            )}

            {/* Submenús */}
            {hasSubItems && isOpen && (
              <div className="ml-6 mt-1 space-y-1 border-l border-border pl-4">
                {item.items?.map((subItem) => (
                  <Link
                    key={subItem.title}
                    href={subItem.url}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {subItem.icon && <subItem.icon className="h-3 w-3" />}
                    <span>{subItem.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

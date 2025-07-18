import type React from "react"
import { LucideLoader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Loader2Props extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function Loader2({ className, ...props }: Loader2Props) {
  return <LucideLoader2 className={cn("animate-spin", className)} {...props} />
}

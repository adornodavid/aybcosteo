import type React from "react"
import { ImageIcon as ImageIconLucide } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function ImageIcon({ className, ...props }: ImageIconProps) {
  return <ImageIconLucide className={cn("h-6 w-6", className)} {...props} />
}

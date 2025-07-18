import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col space-y-3 p-4">
      <Skeleton className="h-[40px] w-[250px]" />
      <div className="space-y-2">
        <Skeleton className="h-[30px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  )
}

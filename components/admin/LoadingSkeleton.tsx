import * as React from "react"
import { cn } from "../../lib/utils"

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-neutral-800/50", className)} />
  )
}

export function TableSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-10 w-[250px]" />
        <LoadingSkeleton className="h-10 w-[100px]" />
      </div>
      <div className="rounded-md border border-neutral-800">
        <div className="h-12 border-b border-neutral-800 bg-neutral-900/50 px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-neutral-800 px-4 py-4 last:border-0">
              {Array.from({ length: 5 }).map((_, j) => (
                <LoadingSkeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

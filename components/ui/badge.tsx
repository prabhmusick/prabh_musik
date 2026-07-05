import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-neutral-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2",
        {
          'bg-primary/10 text-primary border-primary/20': variant === 'default',
          'bg-neutral-900 text-neutral-300 border-white/[0.04]': variant === 'secondary',
          'bg-red-950/40 text-red-400 border-red-500/20': variant === 'destructive',
          'bg-transparent text-neutral-300 border-white/[0.08]': variant === 'outline',
          'bg-emerald-950/40 text-emerald-400 border-emerald-500/20': variant === 'success',
          'bg-amber-950/40 text-amber-400 border-amber-500/20': variant === 'warning',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }

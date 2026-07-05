import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            'bg-primary text-black hover:bg-primary-hover hover:shadow-[0_4px_20px_rgba(212,130,10,0.4)] shadow-[0_2px_8px_rgba(212,130,10,0.2)]': variant === 'default',
            'bg-red-650 text-neutral-50 hover:bg-red-700': variant === 'destructive',
            'border border-white/[0.08] hover:border-white/[0.16] bg-transparent text-neutral-100 hover:bg-white/[0.04]': variant === 'outline',
            'bg-neutral-800 text-neutral-50 hover:bg-neutral-800/80': variant === 'secondary',
            'hover:bg-neutral-900 hover:text-primary text-neutral-100': variant === 'ghost',
            'text-neutral-50 underline-offset-4 hover:underline': variant === 'link',
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-10 rounded-md px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

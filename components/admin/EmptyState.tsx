import * as React from "react"
import { FileQuestion } from "lucide-react"
import { Button } from "../ui/button"

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-card-border bg-card/50 p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900/60 mb-4 text-neutral-400">
          {icon || <FileQuestion size={40} />}
        </div>
        <h2 className="text-xl font-semibold text-neutral-50">{title}</h2>
        <p className="mb-8 mt-2 text-sm font-normal leading-6 text-neutral-400">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "../ui/button"

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md animate-in zoom-in-95 rounded-xl border border-card-border bg-card p-6 shadow-lg shadow-black/60">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {isDestructive && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-900/20 text-red-500">
                <AlertTriangle size={20} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-neutral-50">{title}</h2>
              <p className="mt-2 text-sm text-neutral-400">{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-100">
            <X size={20} />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "default"} 
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "../ui/button"

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  children: React.ReactNode;
  activeFilterCount?: number;
}

export function FilterDrawer({ isOpen, onClose, onOpen, children, activeFilterCount = 0 }: FilterDrawerProps) {
  return (
    <>
      <Button variant="outline" onClick={onOpen} className="gap-2">
        <SlidersHorizontal size={16} />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-black">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity">
          <div className="w-full max-w-sm animate-in slide-in-from-right h-full bg-card border-l border-card-border p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <h2 className="text-lg font-semibold text-neutral-50">Filters</h2>
              <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6">
              {children}
            </div>
            <div className="border-t border-card-border pt-4 flex gap-3 mt-auto">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Reset
              </Button>
              <Button className="flex-1" onClick={onClose}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

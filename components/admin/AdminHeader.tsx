"use client"

import * as React from "react"
import { Bell, Search, Menu } from "lucide-react"

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-card-border bg-card px-4 md:px-6">
      <button 
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 text-neutral-400 hover:text-neutral-100"
      >
        <Menu size={24} />
      </button>

      <div className="flex flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              type="search"
              placeholder="Search admin..."
              className="w-full rounded-md border border-card-border bg-background px-8 py-2 text-sm text-neutral-100 outline-none focus:border-white/[0.12] sm:w-[300px]"
            />
          </div>
        </form>
        <button className="relative p-2 text-neutral-400 hover:text-neutral-100 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 border border-neutral-950"></span>
        </button>
      </div>
    </header>
  )
}

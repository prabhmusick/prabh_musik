"use client"

import * as React from "react"
import { SearchBar } from "../SearchBar"

interface UserFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onReset: () => void;
}

export function UserFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onReset
}: UserFiltersProps) {

  const hasActiveFilters = search || statusFilter

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
      <SearchBar
        placeholder="Search customers by name, email, or mobile..."
        value={search}
        onChange={onSearchChange}
        className="w-full sm:max-w-md"
      />

      <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="py-2 px-3 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-red-500/10 rounded-md transition-all font-mono"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

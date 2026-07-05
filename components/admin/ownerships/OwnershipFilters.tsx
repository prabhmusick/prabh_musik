"use client"

import * as React from "react"
import { SearchBar } from "../SearchBar"

interface OwnershipFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  onReset: () => void;
}

export function OwnershipFilters({
  search,
  onSearchChange,
  onReset
}: OwnershipFiltersProps) {

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
      <SearchBar
        placeholder="Search by beat, artist, or licensee name..."
        value={search}
        onChange={onSearchChange}
        className="w-full sm:max-w-md"
      />

      {search && (
        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            onClick={onReset}
            className="py-2 px-3 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-red-500/10 rounded-md transition-all font-mono"
          >
            Reset Search
          </button>
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { SearchBar } from "../SearchBar"
import { FilterDrawer } from "../FilterDrawer"
import { BEAT_GENRES } from "../../../constants/beat-genres"
import { BEAT_MOODS } from "../../../constants/beat-moods"
import { ORDER_STATUSES } from "../../../constants/order-status" // wait, order-statuses or beat statuses? In beat.ts model we have published, draft, sold_out

interface BeatFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  genreFilter: string;
  onGenreChange: (val: string) => void;
  moodFilter: string;
  onMoodChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  bpmMin: string;
  onBpmMinChange: (val: string) => void;
  bpmMax: string;
  onBpmMaxChange: (val: string) => void;
  onReset: () => void;
}

export function BeatFilters({
  search,
  onSearchChange,
  genreFilter,
  onGenreChange,
  moodFilter,
  onMoodChange,
  statusFilter,
  onStatusChange,
  bpmMin,
  onBpmMinChange,
  bpmMax,
  onBpmMaxChange,
  onReset
}: BeatFiltersProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const activeFilters = [
    genreFilter,
    moodFilter,
    statusFilter,
    bpmMin,
    bpmMax
  ].filter(Boolean).length

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
      <SearchBar
        placeholder="Search by Beat Name or Artist..."
        value={search}
        onChange={onSearchChange}
        className="w-full sm:max-w-md"
      />

      <FilterDrawer
        isOpen={isDrawerOpen}
        onOpen={() => setIsDrawerOpen(true)}
        onClose={() => setIsDrawerOpen(false)}
        activeFilterCount={activeFilters}
      >
        <div className="space-y-5">
          {/* Genre Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Genre</label>
            <select
              value={genreFilter}
              onChange={(e) => onGenreChange(e.target.value)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              <option value="">All Genres</option>
              {BEAT_GENRES.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Mood Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Mood</label>
            <select
              value={moodFilter}
              onChange={(e) => onMoodChange(e.target.value)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              <option value="">All Moods</option>
              {BEAT_MOODS.map(mood => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="DRAFT">Draft</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>

          {/* BPM Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-neutral-300">BPM Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={bpmMin}
                onChange={(e) => onBpmMinChange(e.target.value)}
                className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12] font-mono"
              />
              <span className="text-neutral-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={bpmMax}
                onChange={(e) => onBpmMaxChange(e.target.value)}
                className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12] font-mono"
              />
            </div>
          </div>

          {activeFilters > 0 && (
            <button
              onClick={onReset}
              className="w-full py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-red-500/10 rounded-md transition-all mt-2"
            >
              Clear Filters
            </button>
          )}
        </div>
      </FilterDrawer>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Disc3 } from "lucide-react"

import { PageHeader } from "../../../components/admin/PageHeader"
import { BeatTable } from "../../../components/admin/beats/BeatTable"
import { BeatFilters } from "../../../components/admin/beats/BeatFilters"
import { useBeats } from "../../../hooks/useBeats"
import { useArtists } from "../../../hooks/useArtists"
import { Button } from "../../../components/ui/button"
import { EmptyState } from "../../../components/admin/EmptyState"
import { TableSkeleton } from "../../../components/admin/LoadingSkeleton"

export default function BeatsPage() {
  const { data: beats = [], isLoading } = useBeats()
  const { data: artists = [] } = useArtists()

  // Filter States
  const [search, setSearch] = React.useState("")
  const [genreFilter, setGenreFilter] = React.useState("")
  const [moodFilter, setMoodFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [bpmMin, setBpmMin] = React.useState("")
  const [bpmMax, setBpmMax] = React.useState("")

  const handleResetFilters = () => {
    setGenreFilter("")
    setMoodFilter("")
    setStatusFilter("")
    setBpmMin("")
    setBpmMax("")
  }

  // Derived Filtered Beats
  const filteredBeats = React.useMemo(() => {
    return beats.filter((beat) => {
      // 1. Search Query
      if (search) {
        const query = search.toLowerCase()
        const artist = artists.find((a) => a.id === beat.artistId)
        const matchesTitle = beat.title.toLowerCase().includes(query)
        const matchesArtist = artist?.stageName.toLowerCase().includes(query) || "prabh musik".includes(query)
        if (!matchesTitle && !matchesArtist) return false
      }

      // 2. Genre Filter
      if (genreFilter && beat.genre !== genreFilter) return false

      // 3. Mood Filter
      if (moodFilter && beat.mood !== moodFilter) return false

      // 4. Status Filter
      if (statusFilter && beat.status !== statusFilter) return false

      // 5. BPM Range Filter
      const bpm = beat.bpm
      if (bpmMin && bpm < parseInt(bpmMin)) return false
      if (bpmMax && bpm > parseInt(bpmMax)) return false

      return true
    })
  }, [beats, artists, search, genreFilter, moodFilter, statusFilter, bpmMin, bpmMax])

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      {/* Ambient Radial Accent Glow */}
      <div className="absolute top-[-100px] right-[-100px] h-[400px] w-[400px] bg-gradient-to-b from-accent/5 to-transparent blur-[100px] pointer-events-none -z-10" />

      <PageHeader 
        title="Beats Catalog" 
        description="Manage, upload, edit, and organize all beats on your marketplace."
      >
        <Link href="/admin/beats/new">
          <Button className="gap-2 shadow-[0_2px_8px_rgba(212,130,10,0.25)]">
            <Plus size={16} />
            Upload Beat
          </Button>
        </Link>
      </PageHeader>

      <BeatFilters
        search={search}
        onSearchChange={setSearch}
        genreFilter={genreFilter}
        onGenreChange={setGenreFilter}
        moodFilter={moodFilter}
        onMoodChange={setMoodFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        bpmMin={bpmMin}
        onBpmMinChange={setBpmMin}
        bpmMax={bpmMax}
        onBpmMaxChange={setBpmMax}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : filteredBeats.length > 0 ? (
        <BeatTable beats={filteredBeats} />
      ) : (
        <EmptyState
          title={search || genreFilter || moodFilter || statusFilter || bpmMin || bpmMax ? "No Beats Found" : "Your Catalog is Empty"}
          description={
            search || genreFilter || moodFilter || statusFilter || bpmMin || bpmMax
              ? "Try adjusting your keywords or clearing the active filters."
              : "Upload your first beat to get started and showcase your music to the world."
          }
          icon={<Disc3 size={40} />}
          actionLabel="Upload Beat"
          onAction={() => window.location.href = "/admin/beats/new"}
        />
      )}
    </div>
  )
}

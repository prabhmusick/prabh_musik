"use client"

import * as React from "react"
import { FileBadge } from "lucide-react"

import { PageHeader } from "../../../components/admin/PageHeader"
import { OwnershipTable } from "../../../components/admin/ownerships/OwnershipTable"
import { OwnershipFilters } from "../../../components/admin/ownerships/OwnershipFilters"
import { useOwnerships } from "../../../hooks/useOwnerships"
import { useUsers } from "../../../hooks/useUsers"
import { useBeats } from "../../../hooks/useBeats"
import { useArtists } from "../../../hooks/useArtists"
import { EmptyState } from "../../../components/admin/EmptyState"
import { TableSkeleton } from "../../../components/admin/LoadingSkeleton"

export default function OwnershipsPage() {
  const { data: ownerships = [], isLoading } = useOwnerships()
  const { data: users = [] } = useUsers()
  const { data: beats = [] } = useBeats()
  const { data: artists = [] } = useArtists()

  const [search, setSearch] = React.useState("")

  const handleResetFilters = () => {
    setSearch("")
  }

  // Filter ownerships dynamically based on related entities (beat title, artist, or licensee name)
  const filteredOwnerships = React.useMemo(() => {
    return ownerships.filter(own => {
      if (search) {
        const query = search.toLowerCase()
        
        const beat = beats.find(b => b.id === own.beatId)
        const customer = users.find(u => u.id === own.customerId)
        const artist = beat ? artists.find(a => a.id === beat.artistId) : null

        const matchesBeat = beat?.title.toLowerCase().includes(query)
        const matchesCustomer = customer?.name.toLowerCase().includes(query)
        const matchesArtist = artist?.stageName.toLowerCase().includes(query)
        const matchesOwnId = own.id.toLowerCase().includes(query)

        if (!matchesBeat && !matchesCustomer && !matchesArtist && !matchesOwnId) return false
      }

      return true
    })
  }, [ownerships, search, beats, users, artists])

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      {/* Ambient Accent Glow */}
      <div className="absolute top-[-100px] right-[-100px] h-[400px] w-[400px] bg-gradient-to-b from-accent/5 to-transparent blur-[100px] pointer-events-none -z-10" />

      <PageHeader 
        title="License Ownerships" 
        description="Monitor active and exclusive track licenses, buyer associations, and transactions."
      />

      <OwnershipFilters
        search={search}
        onSearchChange={setSearch}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : filteredOwnerships.length > 0 ? (
        <OwnershipTable ownerships={filteredOwnerships} />
      ) : (
        <EmptyState
          title={search ? "No Ownerships Found" : "No Licenses Generated"}
          description={
            search
              ? "Try adjusting your search keywords."
              : "Completed orders will automatically assign and showcase license ownerships here."
          }
          icon={<FileBadge size={40} />}
        />
      )}
    </div>
  )
}

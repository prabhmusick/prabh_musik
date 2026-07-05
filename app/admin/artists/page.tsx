"use client"

import { PageHeader } from "../../../components/admin/PageHeader"
import { EmptyState } from "../../../components/admin/EmptyState"
import { Music } from "lucide-react"

export default function ArtistsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Artists Management" 
        description="Manage producers and beatmakers on your platform."
      />
      <EmptyState
        title="Module Coming Soon"
        description="Detailed implementation for the Artists module is scheduled for the next phase."
        icon={<Music size={40} />}
      />
    </div>
  )
}

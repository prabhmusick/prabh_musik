"use client"

import { PageHeader } from "../../../components/admin/PageHeader"
import { EmptyState } from "../../../components/admin/EmptyState"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Platform Settings" 
        description="Configure marketplace settings and preferences."
      />
      <EmptyState
        title="Module Coming Soon"
        description="Detailed implementation for the Settings module is scheduled for the next phase."
        icon={<Settings size={40} />}
      />
    </div>
  )
}

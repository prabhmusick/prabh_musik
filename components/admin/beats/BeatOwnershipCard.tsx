import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { FileBadge, ShieldCheck } from "lucide-react"
import { Beat } from "../../../types/admin"

interface BeatOwnershipCardProps {
  beat: Beat;
}

export function BeatOwnershipCard({ beat }: BeatOwnershipCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold text-white">License & Ownership</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3.5 rounded-xl border border-card-border p-3.5 bg-neutral-900/20">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <FileBadge size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-200">Active Licenses</div>
            <div className="text-xs text-neutral-400 mt-0.5">
              Currently held by <span className="font-bold text-white font-mono">{beat.ownershipsCount}</span> customers.
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-xl border border-card-border p-3.5 bg-neutral-900/20">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-200">Copyright Integrity</div>
            <div className="text-xs text-neutral-400 mt-0.5">
              Metadata, audio signatures, and digital watermarks validated successfully.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { StatusBadge } from "../StatusBadge"
import { Beat } from "../../../types/admin"

interface BeatPricingCardProps {
  beat: Beat;
}

export function BeatPricingCard({ beat }: BeatPricingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold text-white">Pricing & Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Exclusive License Price</span>
          <span className="text-2xl font-bold text-primary font-mono">${beat.price.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-card-border">
          <span className="text-sm text-neutral-400">Selling Status</span>
          <StatusBadge status={beat.status} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-card-border text-xs text-neutral-500">
          <span>Created On</span>
          <span className="font-mono">{new Date(beat.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="rounded-lg bg-neutral-900/50 border border-card-border p-3 mt-2 text-xs text-neutral-400 space-y-1">
          <span className="font-bold text-neutral-300 block mb-1">Standard Licensing Terms:</span>
          <div>• Exclusive license guarantees sole ownership.</div>
          <div>• Sold out status triggers automatic marketplace page lock.</div>
        </div>
      </CardContent>
    </Card>
  )
}

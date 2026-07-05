import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Eye, Download, ShoppingCart, DollarSign } from "lucide-react"
import { Beat } from "../../../types/admin"

interface BeatAnalyticsCardProps {
  beat: Beat;
}

export function BeatAnalyticsCard({ beat }: BeatAnalyticsCardProps) {
  const stats = [
    {
      label: "Plays",
      value: beat.analytics.plays,
      icon: <Eye className="text-neutral-500 size-4" />
    },
    {
      label: "Downloads",
      value: beat.analytics.downloads,
      icon: <Download className="text-neutral-500 size-4" />
    },
    {
      label: "Sales Count",
      value: beat.analytics.salesCount,
      icon: <ShoppingCart className="text-neutral-500 size-4" />
    },
    {
      label: "Revenue",
      value: `$${beat.analytics.revenue.toFixed(2)}`,
      icon: <DollarSign className="text-neutral-500 size-4" />
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold text-white">Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-card-border bg-neutral-900/20 rounded-xl p-3.5 flex flex-col space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-semibold">{stat.label}</span>
                {stat.icon}
              </div>
              <span className="text-xl font-bold text-white font-mono">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

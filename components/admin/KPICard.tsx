import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { cn } from "../../lib/utils"

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, icon, trend, className }: KPICardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-400">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white tracking-tight font-mono">{value}</div>
        {trend && (
          <p className="text-xs mt-2">
            <span className={cn("font-semibold rounded bg-neutral-900 px-1.5 py-0.5 border border-white/[0.04]", trend.isPositive ? "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" : "text-red-400 border-red-500/10 bg-red-500/5")}>
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
            {" "}
            <span className="text-neutral-500 ml-1">vs last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

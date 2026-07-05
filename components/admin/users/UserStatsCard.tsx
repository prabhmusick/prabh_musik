"use client"

import * as React from "react"
import { DollarSign, ShoppingCart, Shield, Calendar } from "lucide-react"

import { useOrders } from "../../../hooks/useOrders"
import { useOwnerships } from "../../../hooks/useOwnerships"
import { KPICard } from "../KPICard"

interface UserStatsCardProps {
  userId: string;
}

export function UserStatsCard({ userId }: UserStatsCardProps) {
  const { data: orders = [] } = useOrders()
  const { data: ownerships = [] } = useOwnerships()

  // Calculate dynamic stats
  const customerOrders = React.useMemo(() => orders.filter(o => o.customerId === userId), [orders, userId])
  
  const totalOrders = customerOrders.length
  
  const beatsOwned = React.useMemo(() => ownerships.filter(own => own.customerId === userId).length, [ownerships, userId])
  
  const totalSpend = React.useMemo(() => {
    return customerOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.totalAmount, 0)
  }, [customerOrders])

  const lastPurchaseDate = React.useMemo(() => {
    const completed = customerOrders
      .filter(o => o.status === 'COMPLETED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    if (completed.length === 0) return "N/A"
    return new Date(completed[0].createdAt).toLocaleDateString()
  }, [customerOrders])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Spend"
        value={`$${totalSpend.toFixed(2)}`}
        icon={<DollarSign />}
        className="hover:shadow-[0_4px_25px_rgba(0,0,0,0.45)] transition-all"
      />
      <KPICard
        title="Total Orders"
        value={totalOrders}
        icon={<ShoppingCart />}
        className="hover:shadow-[0_4px_25px_rgba(0,0,0,0.45)] transition-all"
      />
      <KPICard
        title="Beats Owned"
        value={beatsOwned}
        icon={<Shield />}
        className="hover:shadow-[0_4px_25px_rgba(0,0,0,0.45)] transition-all"
      />
      <KPICard
        title="Last Purchase"
        value={lastPurchaseDate}
        icon={<Calendar />}
        className="hover:shadow-[0_4px_25px_rgba(0,0,0,0.45)] transition-all font-mono"
      />
    </div>
  )
}

"use client"

import * as React from "react"
import { Calendar, ShoppingCart, Shield, User, RefreshCw, AlertCircle } from "lucide-react"

import { User as UserType } from "../../../types/admin"
import { useOrders } from "../../../hooks/useOrders"
import { Card, CardContent } from "../../ui/card"

interface UserActivityTimelineProps {
  user: UserType;
}

interface TimelineEvent {
  title: string;
  description: string;
  date: string;
  type: 'system' | 'order' | 'ownership' | 'refund';
}

export function UserActivityTimeline({ user }: UserActivityTimelineProps) {
  const { data: orders = [] } = useOrders()

  const events = React.useMemo(() => {
    const list: TimelineEvent[] = []

    // 1. Account Creation Event
    list.push({
      title: "Account Created",
      description: "Customer profile generated and verified in the database.",
      date: user.createdAt,
      type: "system"
    })

    // 2. Last Login Event (simulate a login slightly after registration if lastLogin is absent, or log actual)
    if (user.lastLogin) {
      list.push({
        title: "Session Login",
        description: "Customer authenticated and logged into the storefront.",
        date: user.lastLogin,
        type: "system"
      })
    }

    // 3. Order Events
    const customerOrders = orders.filter(o => o.customerId === user.id)
    customerOrders.forEach(order => {
      if (order.status === 'COMPLETED') {
        list.push({
          title: "Purchased Exclusive Beat",
          description: `Placed order #${order.id} for $${order.totalAmount.toFixed(2)}.`,
          date: order.createdAt,
          type: "order"
        })
        list.push({
          title: "License Ownership Assigned",
          description: `Exclusive master rights granted. Original tracks flagged as SOLD.`,
          date: new Date(new Date(order.createdAt).getTime() + 2000).toISOString(), // offset slightly for timeline flow
          type: "ownership"
        })
      } else if (order.status === 'PENDING') {
        list.push({
          title: "Logged Checkout Draft",
          description: `Logged order #${order.id} as PENDING (awaiting payment checkout).`,
          date: order.createdAt,
          type: "order"
        })
      } else if (order.status === 'REFUNDED') {
        list.push({
          title: "Order Refunded & Revoked",
          description: `Logged order #${order.id} as REFUNDED. Licenses removed and tracks made AVAILABLE.`,
          date: order.createdAt,
          type: "refund"
        })
      } else if (order.status === 'FAILED') {
        list.push({
          title: "Order Checkout Failed",
          description: `Payment attempt for order #${order.id} rejected by checkout gateway.`,
          date: order.createdAt,
          type: "refund"
        })
      }
    })

    // Sort chronologically descending (newest events first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [user, orders])

  return (
    <Card>
      <div className="px-6 py-4 border-b border-card-border">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Activity Timeline</h3>
      </div>
      <CardContent className="p-6">
        <div className="relative border-l border-card-border pl-6 space-y-6">
          {events.map((ev, index) => {
            let iconColor = "text-neutral-500 bg-neutral-900 border-card-border"
            let icon = <User size={13} />

            if (ev.type === 'order') {
              iconColor = "text-blue-400 bg-blue-500/10 border-blue-500/20"
              icon = <ShoppingCart size={13} />
            } else if (ev.type === 'ownership') {
              iconColor = "text-amber-500 bg-amber-500/10 border-amber-500/20"
              icon = <Shield size={13} />
            } else if (ev.type === 'refund') {
              iconColor = "text-purple-400 bg-purple-500/10 border-purple-500/20"
              icon = <RefreshCw size={13} />
            }

            return (
              <div key={index} className="relative">
                {/* Timeline node dot indicator */}
                <div className={`absolute -left-[37px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${iconColor}`}>
                  {icon}
                </div>
                
                <div className="flex flex-col space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h4 className="text-sm font-semibold text-neutral-100">{ev.title}</h4>
                    <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(ev.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed pt-0.5">{ev.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import { DollarSign, ShoppingCart, Users, Disc3, TrendingUp, Shield } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

import { PageHeader } from "../../../components/admin/PageHeader"
import { KPICard } from "../../../components/admin/KPICard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { useDashboard } from "../../../hooks/useDashboard"
import { StatusBadge } from "../../../components/admin/StatusBadge"

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()

  if (isLoading || !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-[250px] bg-neutral-800/50 rounded-lg"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-card border border-card-border rounded-xl"></div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 h-[400px] bg-card border border-card-border rounded-xl"></div>
          <div className="col-span-3 h-[400px] bg-card border border-card-border rounded-xl"></div>
        </div>
      </div>
    )
  }

  const {
    totalRevenue,
    totalOrders,
    totalUsers,
    totalArtists,
    totalBeats,
    revenueOverview,
    recentOrders,
    topArtists,
    recentBeats,
    recentActivities,
  } = data

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      {/* Ambient Premium Accent Radial Glow */}
      <div className="absolute top-[-100px] right-[-100px] h-[500px] w-[500px] bg-gradient-to-b from-accent/10 to-transparent blur-[120px] pointer-events-none -z-10" />

      <PageHeader 
        title="Dashboard" 
        description="Overview of your beat marketplace performance."
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={<DollarSign />}
          trend={{ value: 12.5, isPositive: true }}
          className="hover:shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        />
        <KPICard
          title="Total Orders"
          value={totalOrders}
          icon={<ShoppingCart />}
          trend={{ value: 8.2, isPositive: true }}
          className="hover:shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        />
        <KPICard
          title="Total Users"
          value={totalUsers}
          icon={<Users />}
          trend={{ value: 3.1, isPositive: true }}
          className="hover:shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        />
        <KPICard
          title="Active Beats"
          value={totalBeats}
          icon={<Disc3 />}
          className="hover:shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Charts and Lists Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight text-white">Revenue Overview</CardTitle>
            <CardDescription className="text-neutral-400 text-sm">Monthly sales statistics for the current year</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueOverview}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0c10', 
                      borderColor: 'var(--color-card-border)', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: 'var(--color-primary)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="col-span-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight text-white">Recent Orders</CardTitle>
            <CardDescription className="text-neutral-400 text-sm">Latest transactions on the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 border border-card-border">
                      <span className="text-sm font-semibold text-neutral-300">{order.customerName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none text-neutral-100">{order.customerName}</p>
                      <p className="text-xs text-neutral-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <div className="font-semibold text-white font-mono">+${order.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row Lists */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Top Artists */}
        <Card className="shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight text-white">Top Artists</CardTitle>
            <CardDescription className="text-neutral-400 text-sm">Most successful creators on the platform</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
              {topArtists.map((artist) => (
                <div key={artist.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-none text-neutral-100">{artist.stageName}</p>
                      <p className="text-xs text-neutral-500 mt-1">{artist.totalSales} Sales</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-neutral-300">{artist.totalBeats} Beats</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recently Added Beats */}
        <Card className="shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight text-white">Recently Added Beats</CardTitle>
            <CardDescription className="text-neutral-400 text-sm">Newest tracks added to the catalog</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
              {recentBeats.map((beat) => (
                <div key={beat.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 border border-card-border">
                      <Disc3 size={20} className="text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-none text-neutral-100">{beat.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">{beat.genre} • {beat.bpm} BPM</p>
                    </div>
                  </div>
                  <div className="text-sm font-mono font-semibold text-primary">${beat.price}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight text-white">Recent Activities</CardTitle>
            <CardDescription className="text-neutral-400 text-sm">Audit log of system events and sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 max-h-[320px] overflow-y-auto pr-1 scrollbar-hide">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((act) => {
                  let iconColor = "text-blue-400 bg-blue-500/10 border-blue-500/20"
                  let icon = <ShoppingCart size={15} />

                  if (act.type === 'ownership') {
                    iconColor = "text-amber-500 bg-amber-500/10 border-amber-500/20"
                    icon = <Shield size={15} />
                  } else if (act.type === 'beat') {
                    iconColor = "text-purple-400 bg-purple-500/10 border-purple-500/20"
                    icon = <Disc3 size={15} />
                  } else if (act.type === 'system') {
                    iconColor = "text-red-400 bg-red-500/10 border-red-500/20"
                    icon = <TrendingUp size={15} /> // Fallback for settings/admin
                  }

                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${iconColor}`}>
                        {icon}
                      </div>
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs text-neutral-200 leading-normal font-medium">{act.description}</p>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-xs text-neutral-500 py-6">No recent actions logged.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

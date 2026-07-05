"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { useUser } from "../../../../hooks/useUsers"
import { Button } from "../../../../components/ui/button"
import { UserProfileCard } from "../../../../components/admin/users/UserProfileCard"
import { UserStatsCard } from "../../../../components/admin/users/UserStatsCard"
import { UserOrdersTable } from "../../../../components/admin/users/UserOrdersTable"
import { UserOwnershipTable } from "../../../../components/admin/users/UserOwnershipTable"
import { UserActivityTimeline } from "../../../../components/admin/users/UserActivityTimeline"

export default function UserDetailPage() {
  const { id } = useParams()
  const userId = Array.isArray(id) ? id[0] : id

  const { data: user, isLoading, error } = useUser(userId || "")

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-32 bg-neutral-800 rounded"></div>
        <div className="h-16 w-full bg-neutral-800 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[380px] bg-neutral-800 rounded-xl"></div>
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[120px] bg-neutral-800 rounded-xl"></div>
            <div className="h-[250px] bg-neutral-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Customer Profile Not Found</h2>
        <p className="text-neutral-400 max-w-sm">The user ID does not exist or has been removed from the directory.</p>
        <Link href="/admin/users">
          <Button>Back to Customer Directory</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      {/* Ambient Radial Accent Glow */}
      <div className="absolute top-[-100px] right-[-100px] h-[500px] w-[500px] bg-gradient-to-b from-accent/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Header breadcrumb navigation */}
      <div className="flex items-center gap-3">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <span className="text-sm font-semibold text-neutral-500">Back to Customers</span>
      </div>

      {/* Profile Detail Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Profile Details Card + Timeline Event Feed */}
        <div className="space-y-6 lg:col-span-1">
          <UserProfileCard user={user} />
          <UserActivityTimeline user={user} />
        </div>

        {/* Right Side: KPIs summaries, Beats owned list, Orders history table */}
        <div className="lg:col-span-2 space-y-6">
          <UserStatsCard userId={user.id} />
          <UserOwnershipTable userId={user.id} />
          <UserOrdersTable userId={user.id} />
        </div>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, RefreshCcw, Trash2, User, Disc3 } from "lucide-react"

import { useOrder, useUpdateOrderStatus, useDeleteOrder } from "../../../../hooks/useOrders"
import { useUsers } from "../../../../hooks/useUsers"
import { useBeats } from "../../../../hooks/useBeats"
import { useArtists } from "../../../../hooks/useArtists"
import { Button } from "../../../../components/ui/button"
import { StatusBadge } from "../../../../components/admin/StatusBadge"
import { Card, CardContent } from "../../../../components/ui/card"
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog"
import { User as UserType, Beat as BeatType, Artist as ArtistType } from "../../../../types/admin"

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const orderId = Array.isArray(id) ? id[0] : id

  const { data: order, isLoading, error } = useOrder(orderId || "")
  const { data: users = [] } = useUsers()
  const { data: beats = [] } = useBeats()
  const { data: artists = [] } = useArtists()

  const updateStatusMutation = useUpdateOrderStatus()
  const deleteOrderMutation = useDeleteOrder()

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

  const handleUpdateStatus = (status: 'COMPLETED' | 'REFUNDED') => {
    if (!orderId) return
    updateStatusMutation.mutate({ id: orderId, status })
  }

  const handleDelete = () => {
    if (!orderId) return
    deleteOrderMutation.mutate(orderId, {
      onSuccess: () => {
        router.push("/admin/orders")
      }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-32 bg-neutral-800 rounded"></div>
        <div className="h-16 w-full bg-neutral-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-[300px] bg-neutral-800 rounded-xl"></div>
          <div className="h-[300px] bg-neutral-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <p className="text-neutral-400 max-w-sm">The purchase order code does not exist or has been deleted.</p>
        <Link href="/admin/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    )
  }

  const customer = users.find((u: UserType) => u.id === order.customerId)
  const purchasedBeats = order.beatIds
    .map((bid: string) => beats.find((b: BeatType) => b.id === bid))
    .filter(Boolean) as BeatType[]

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      {/* Ambient Glow */}
      <div className="absolute top-[-100px] right-[-100px] h-[500px] w-[500px] bg-gradient-to-b from-accent/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border pb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon" className="size-8 rounded-full">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-500 font-mono">#{order.id}</span>
              <StatusBadge status={order.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-0.5">Order Invoice Details</h1>
          </div>
        </div>

        {/* Actions panel */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'PENDING' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus('COMPLETED')}
              disabled={updateStatusMutation.isPending}
              className="gap-2 text-xs text-green-400 border-green-500/10 hover:bg-green-500/5 hover:border-green-500/20"
            >
              <CheckCircle size={13} />
              Mark Completed
            </Button>
          )}

          {order.status === 'COMPLETED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus('REFUNDED')}
              disabled={updateStatusMutation.isPending}
              className="gap-2 text-xs text-purple-400 border-purple-500/10 hover:bg-purple-500/5 hover:border-purple-500/20"
            >
              <RefreshCcw size={13} />
              Refund Order
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            disabled={deleteOrderMutation.isPending}
            className="gap-2 text-xs border-red-500/10 text-red-400 hover:bg-red-500/5 hover:border-red-500/20 hover:text-red-300"
          >
            <Trash2 size={13} />
            Delete Invoice
          </Button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Buyer & Items List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer profile card */}
          <Card>
            <div className="px-6 py-4 border-b border-card-border">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Buyer Information</h3>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 border border-card-border shrink-0 text-neutral-400">
                  <User size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-white">{customer ? customer.name : "Unknown Customer"}</span>
                  <span className="text-sm text-neutral-400 mt-0.5">{customer ? customer.email : "No email contact available"}</span>
                  <span className="text-xs text-neutral-500 font-mono mt-1">ID: {order.customerId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchased Items List */}
          <Card>
            <div className="px-6 py-4 border-b border-card-border">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Order Items</h3>
            </div>
            <CardContent className="p-0 divide-y divide-card-border">
              {purchasedBeats.map((beat: BeatType) => {
                const artist = artists.find((a: ArtistType) => a.id === beat.artistId)
                return (
                  <div key={beat.id} className="flex items-center justify-between p-4 px-6 hover:bg-neutral-900/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-neutral-900 border border-card-border overflow-hidden flex items-center justify-center shrink-0">
                        {beat.assets.coverImage ? (
                          <img src={beat.assets.coverImage} className="h-full w-full object-cover" />
                        ) : (
                          <Disc3 size={20} className="text-neutral-500" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/beats/${beat.id}`}
                          className="text-sm font-bold text-neutral-200 hover:underline"
                        >
                          {beat.title}
                        </Link>
                        <span className="text-xs text-neutral-500 mt-0.5">By {artist ? artist.stageName : "Unknown Artist"}</span>
                      </div>
                    </div>
                    <div className="text-sm font-mono font-semibold text-primary">
                      ${beat.price.toFixed(2)}
                    </div>
                  </div>
                )
              })}
              {purchasedBeats.length === 0 && (
                <div className="text-center text-xs text-neutral-500 py-6">No beat items match this invoice catalog.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Stats */}
        <div className="space-y-6">
          <Card className="h-fit shadow-md">
            <div className="px-6 py-4 border-b border-card-border bg-neutral-900/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Transaction Summary</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between border-b border-card-border pb-3">
                <span className="text-xs font-semibold text-neutral-400">Total Price Paid</span>
                <span className="text-base font-mono font-bold text-primary">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-card-border pb-3">
                <span className="text-xs font-semibold text-neutral-400">Payment Gateway</span>
                <span className="text-xs font-bold text-neutral-200 capitalize">{(order.paymentMethod || "").replace("_", " ")}</span>
              </div>
              <div className="flex justify-between border-b border-card-border pb-3">
                <span className="text-xs font-semibold text-neutral-400">Transaction Status</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex justify-between border-b border-card-border pb-3">
                <span className="text-xs font-semibold text-neutral-400">Date Logged</span>
                <span className="text-xs font-mono text-neutral-300">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-neutral-500 leading-normal text-center pt-2">
                This is a local simulated transaction generated inside the Prabh Musik Admin Panel workspace.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Cancel & Delete Order"
        description="Are you sure you want to cancel and delete this order invoice? This will revoke generated licenses and restore purchased tracks back to AVAILABLE."
        confirmLabel="Cancel Invoice"
        isDestructive
      />
    </div>
  )
}

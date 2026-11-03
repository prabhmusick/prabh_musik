"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock3,
  CreditCard,
  Disc3,
  FileText,
  Hash,
  Music2,
  Shield,
  ShieldAlert,
  User,
} from "lucide-react"

import { useOwnership, useRevokeOwnership } from "../../../../hooks/useOwnerships"
import { useBeats } from "../../../../hooks/useBeats"
import { Button } from "../../../../components/ui/button"
import { Badge } from "../../../../components/ui/badge"
import { Card, CardContent } from "../../../../components/ui/card"
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog"

const formatDate = (value?: string | null) => {
  if (!value) return "Not set"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)
}

const formatMoney = (value: number, currencyCode = "INR") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(value)

function DetailRow({
  label,
  value,
}: {
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-card-border/50 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <span className="break-all text-xs text-neutral-200 sm:text-right">
        {value ?? "Not provided"}
      </span>
    </div>
  )
}

export default function OwnershipDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const ownershipId = Array.isArray(id) ? id[0] : id

  const { data: own, isLoading, error } = useOwnership(ownershipId || "")
  const { data: beats = [] } = useBeats()

  const revokeMutation = useRevokeOwnership()
  const [isRevokeOpen, setIsRevokeOpen] = React.useState(false)

  const handleRevoke = () => {
    if (!ownershipId) return
    revokeMutation.mutate(ownershipId, {
      onSuccess: () => router.push("/admin/ownerships"),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-32 rounded bg-neutral-800" />
        <div className="h-16 w-full rounded bg-neutral-800" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-[350px] rounded-xl bg-neutral-800 md:col-span-2" />
          <div className="h-[350px] rounded-xl bg-neutral-800" />
        </div>
      </div>
    )
  }

  if (error || !own) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-xl font-bold text-white">License Not Found</h2>
        <p className="max-w-sm text-neutral-400">
          The license ownership record does not exist or is unavailable.
        </p>
        <Link href="/admin/ownerships">
          <Button>Back to Ownerships</Button>
        </Link>
      </div>
    )
  }

  const beat = beats.find((item) => item.id === own.beatPublicId)
  const isActive = own.status === "active"
  const currencyCode = own.currencyCode || "INR"
  const downloadLimit =
    own.maxDownloads === null || own.maxDownloads === undefined
      ? "Unlimited"
      : String(own.maxDownloads)
  const remainingDownloads =
    own.maxDownloads === null || own.maxDownloads === undefined
      ? "Unlimited"
      : String(Math.max(0, own.maxDownloads - (own.downloadCount || 0)))

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      <div className="absolute right-[-100px] top-[-100px] -z-10 h-[500px] w-[500px] bg-gradient-to-b from-accent/5 to-transparent blur-[120px] pointer-events-none" />

      <div className="flex flex-col justify-between gap-4 border-b border-card-border pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Link href="/admin/ownerships">
            <Button variant="ghost" size="icon" className="size-8 rounded-full">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-neutral-500">
                #{own.id}
              </span>
              <Badge className="gap-1 border border-amber-500/20 bg-amber-500/10 py-0.5 text-xs font-semibold text-amber-500">
                <Shield size={10} />
                {own.licenseType}
              </Badge>
              <Badge
                className={
                  isActive
                    ? "border border-emerald-500/20 bg-emerald-500/10 py-0.5 text-xs text-emerald-400"
                    : "border border-red-500/20 bg-red-500/10 py-0.5 text-xs text-red-400"
                }
              >
                {own.status || "Unknown status"}
              </Badge>
            </div>
            <h1 className="mt-0.5 text-2xl font-extrabold text-white">
              License Ownership
            </h1>
          </div>
        </div>

        {isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRevokeOpen(true)}
            disabled={revokeMutation.isPending}
            className="gap-2 border-red-500/10 text-xs text-red-400 hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-300"
          >
            <ShieldAlert size={13} />
            Revoke License
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="border-b border-card-border px-6 py-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Licensed Beat
              </h3>
            </div>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-card-border bg-neutral-900">
                  {beat?.assets.coverImage ? (
                    <img
                      src={beat.assets.coverImage}
                      alt={`${own.beatTitle || "Beat"} cover`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Disc3 size={32} className="text-neutral-500" />
                  )}
                </div>
                <div className="min-w-0">
                  {own.beatPublicId ? (
                    <Link
                      href={`/admin/beats/${own.beatPublicId}`}
                      className="text-lg font-bold text-white hover:underline"
                    >
                      {own.beatTitle || "Untitled Beat"}
                    </Link>
                  ) : (
                    <h2 className="text-lg font-bold text-white">
                      {own.beatTitle || "Untitled Beat"}
                    </h2>
                  )}
                  <p className="mt-1 text-sm text-neutral-400">
                    By {own.artistName || "Unknown Artist"}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-neutral-500">
                    Beat ID: {own.beatPublicId || own.beatId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-card-border pt-4 sm:grid-cols-4">
                {([
                  ["Genre", own.beatGenre],
                  ["Mood", own.beatMood],
                  ["BPM", own.beatBpm],
                  ["Key", own.beatKey],
                  ["Duration", own.beatDuration ? `${own.beatDuration}s` : undefined],
                ] as const).map(([label, value]) => (
                  <div key={label} className="rounded border border-card-border bg-neutral-950/60 p-3">
                    <p className="text-[10px] font-semibold uppercase text-neutral-500">{label}</p>
                    <p className="mt-1 text-sm text-neutral-200">{value || "Not provided"}</p>
                  </div>
                ))}
              </div>

              {own.beatDescription && (
                <div className="border-t border-card-border pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Beat Description
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                    {own.beatDescription}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <div className="border-b border-card-border px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                <FileText size={15} className="text-neutral-500" />
                License Terms and Usage
              </h3>
            </div>
            <CardContent className="px-6 py-2">
              <DetailRow label="License type" value={own.licenseType} />
              <DetailRow label="License status" value={own.status} />
              <DetailRow label="Downloads used" value={own.downloadCount ?? 0} />
              <DetailRow label="Download limit" value={downloadLimit} />
              <DetailRow label="Downloads remaining" value={remainingDownloads} />
              <DetailRow label="License expires" value={own.expiresAt ? formatDate(own.expiresAt) : "No expiration set"} />
              <DetailRow label="Revoked on" value={own.revokedAt ? formatDate(own.revokedAt) : "Not revoked"} />
              <p className="pb-4 pt-2 text-xs leading-relaxed text-neutral-500">
                The license type and download allowance shown here are taken from the purchased ownership record.
              </p>
            </CardContent>
          </Card>

          <Card>
            <div className="border-b border-card-border px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                <CreditCard size={15} className="text-neutral-500" />
                Purchase and Payment
              </h3>
            </div>
            <CardContent className="px-6 py-2">
              <DetailRow label="Price paid" value={formatMoney(own.pricePaid, currencyCode)} />
              <DetailRow label="Order total" value={own.orderTotalAmount === undefined ? undefined : formatMoney(own.orderTotalAmount, currencyCode)} />
              <DetailRow label="Order ID" value={own.orderPublicId || own.orderId} />
              <DetailRow label="Payment transaction" value={own.paymentTransactionId} />
              <DetailRow label="Payment reference" value={own.paymentReference} />
              <DetailRow label="Payment method" value={own.paymentMethod} />
              <DetailRow label="Payment gateway" value={own.paymentGateway} />
              <DetailRow label="Order status" value={own.orderStatus} />
              <DetailRow label="Fulfillment status" value={own.fulfillmentStatus} />
              <DetailRow label="Purchased" value={formatDate(own.purchasedAt)} />
              <DetailRow label="Record created" value={formatDate(own.createdAt)} />
              <DetailRow label="Last updated" value={formatDate(own.updatedAt)} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="border-b border-card-border px-6 py-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Artist / Licensor
              </h3>
            </div>
            <CardContent className="px-6 py-2">
              <DetailRow label="Artist" value={own.artistName} />
              <DetailRow label="Artist ID" value={own.artistPublicId} />
              <DetailRow label="Email" value={own.artistEmail} />
              <DetailRow label="Phone" value={own.artistPhone} />
            </CardContent>
          </Card>

          <Card>
            <div className="border-b border-card-border px-6 py-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Licensee
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-card-border bg-neutral-900 text-neutral-400">
                  <User size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">
                    {own.customerName || "Unknown Customer"}
                  </p>
                  <p className="mt-0.5 break-all text-xs text-neutral-400">
                    {own.customerEmail || "No email provided"}
                  </p>
                </div>
              </div>
              <div className="border-t border-card-border pt-2">
                <DetailRow label="Customer ID" value={own.customerId} />
                <DetailRow label="Phone" value={own.customerMobile} />
                <DetailRow label="Address" value={own.customerAddress} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <div className="border-b border-card-border px-6 py-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Ownership Record
              </h3>
            </div>
            <CardContent className="px-6 py-2">
              <DetailRow
                label="Ownership ID"
                value={
                  <span className="flex items-center gap-1">
                    <Hash size={12} />
                    {own.id}
                  </span>
                }
              />
              <DetailRow label="Order ID" value={own.orderPublicId || own.orderId} />
              <DetailRow
                label="Purchase date"
                value={
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(own.purchasedAt)}
                  </span>
                }
              />
              <DetailRow
                label="Updated date"
                value={
                  <span className="flex items-center gap-1">
                    <Clock3 size={12} />
                    {formatDate(own.updatedAt)}
                  </span>
                }
              />
              <DetailRow
                label="Asset"
                value={
                  <span className="flex items-center gap-1">
                    <Music2 size={12} />
                    {own.beatTitle || "Licensed beat"}
                  </span>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isRevokeOpen}
        onClose={() => setIsRevokeOpen(false)}
        onConfirm={handleRevoke}
        title="Revoke License Agreement"
        description="Are you sure you want to revoke this license? The ownership will become inactive."
        confirmLabel="Revoke Agreement"
        isDestructive
      />
    </div>
  )
}

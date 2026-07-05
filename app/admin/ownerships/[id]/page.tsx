"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldAlert, Shield, Disc3, User, Calendar, FileText } from "lucide-react"

import { useOwnership, useRevokeOwnership } from "../../../../hooks/useOwnerships"
import { useUsers } from "../../../../hooks/useUsers"
import { useBeats } from "../../../../hooks/useBeats"
import { useArtists } from "../../../../hooks/useArtists"
import { Button } from "../../../../components/ui/button"
import { Badge } from "../../../../components/ui/badge"
import { Card, CardContent } from "../../../../components/ui/card"
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog"
import { User as UserType, Beat as BeatType, Artist as ArtistType } from "../../../../types/admin"

export default function OwnershipDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const ownershipId = Array.isArray(id) ? id[0] : id

  const { data: own, isLoading, error } = useOwnership(ownershipId || "")
  const { data: users = [] } = useUsers()
  const { data: beats = [] } = useBeats()
  const { data: artists = [] } = useArtists()

  const revokeMutation = useRevokeOwnership()
  const [isRevokeOpen, setIsRevokeOpen] = React.useState(false)

  const handleRevoke = () => {
    if (!ownershipId) return
    revokeMutation.mutate(ownershipId, {
      onSuccess: () => {
        router.push("/admin/ownerships")
      }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-32 bg-neutral-800 rounded"></div>
        <div className="h-16 w-full bg-neutral-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-[350px] bg-neutral-800 rounded-xl"></div>
          <div className="h-[350px] bg-neutral-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error || !own) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <h2 className="text-xl font-bold text-white">License Not Found</h2>
        <p className="text-neutral-400 max-w-sm">The license ownership record does not exist or has been revoked.</p>
        <Link href="/admin/ownerships">
          <Button>Back to Ownerships</Button>
        </Link>
      </div>
    )
  }

  const customer = users.find((u: UserType) => u.id === own.customerId)
  const beat = beats.find((b: BeatType) => b.id === own.beatId)
  const artist = beat ? artists.find((a: ArtistType) => a.id === beat.artistId) : null

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      {/* Ambient Glow */}
      <div className="absolute top-[-100px] right-[-100px] h-[500px] w-[500px] bg-gradient-to-b from-accent/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border pb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/ownerships">
            <Button variant="ghost" size="icon" className="size-8 rounded-full">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-500 font-mono">#{own.id}</span>
              <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold gap-1 py-0.5">
                <Shield size={10} />
                {own.licenseType}
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-0.5">License Ownership</h1>
          </div>
        </div>

        {/* Action Revoke */}
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsRevokeOpen(true)}
            disabled={revokeMutation.isPending}
            className="gap-2 text-xs border-red-500/10 text-red-400 hover:bg-red-500/5 hover:border-red-500/20 hover:text-red-300"
          >
            <ShieldAlert size={13} />
            Revoke License
          </Button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Linked entities and Terms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Beat and Artist Card */}
          <Card>
            <div className="px-6 py-4 border-b border-card-border">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Licensed Asset</h3>
            </div>
            <CardContent className="p-6 flex items-center justify-between gap-4 flex-col sm:flex-row">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded bg-neutral-900 border border-card-border overflow-hidden flex items-center justify-center shrink-0">
                  {beat?.assets.coverImage ? (
                    <img src={beat.assets.coverImage} className="h-full w-full object-cover" />
                  ) : (
                    <Disc3 size={32} className="text-neutral-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <Link 
                    href={`/admin/beats/${own.beatId}`}
                    className="text-lg font-bold text-white hover:underline"
                  >
                    {beat ? beat.title : "Unknown Beat"}
                  </Link>
                  <span className="text-sm text-neutral-400 mt-1">By {artist ? artist.stageName : "Unknown Artist"}</span>
                  <span className="text-xs text-neutral-500 font-mono mt-1">ID: {own.beatId}</span>
                </div>
              </div>

              {beat && (
                <div className="flex items-center gap-6 self-start sm:self-center border-t sm:border-t-0 border-card-border pt-3 sm:pt-0 w-full sm:w-auto font-mono text-xs text-neutral-400">
                  <div className="flex flex-col">
                    <span className="text-neutral-500 font-semibold uppercase text-[10px]">BPM</span>
                    <span className="text-neutral-200 mt-0.5">{beat.bpm}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-neutral-500 font-semibold uppercase text-[10px]">Key</span>
                    <span className="text-neutral-200 mt-0.5">{beat.key}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-neutral-500 font-semibold uppercase text-[10px]">Genre</span>
                    <span className="text-neutral-200 mt-0.5">{beat.genre}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simple Visual Terms Summary */}
          <Card>
            <div className="px-6 py-4 border-b border-card-border">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText size={15} className="text-neutral-500" />
                License Agreement Parameters
              </h3>
            </div>
            <CardContent className="p-6 space-y-4 text-xs text-neutral-400 leading-relaxed">
              <p>
                This exclusive license grants the Licensee complete and unrestricted commercial rights to publish, broadcast, sync, and distribute recordings incorporating the licensed audio asset.
              </p>
              <div className="rounded border border-card-border bg-neutral-950 p-4 space-y-2.5">
                <div className="flex justify-between border-b border-card-border/50 pb-1.5">
                  <span className="font-semibold text-neutral-300">Grant Type:</span>
                  <span className="text-neutral-400">Exclusive commercial usage rights.</span>
                </div>
                <div className="flex justify-between border-b border-card-border/50 pb-1.5">
                  <span className="font-semibold text-neutral-300">Distribution Limit:</span>
                  <span className="text-neutral-400">Unlimited streams, broadcasts, sales.</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-neutral-300">Territory:</span>
                  <span className="text-neutral-400">Worldwide, perpetual duration.</span>
                </div>
              </div>
              <p className="text-[10px] text-neutral-500">
                Note: In accordance with the exclusive license grant, the original master beat file is marked as SOLD OUT, preventing further licensing or purchases on the marketplace index.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Buyer Profile & Info */}
        <div className="space-y-6">
          {/* Customer / Buyer Card */}
          <Card>
            <div className="px-6 py-4 border-b border-card-border">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Licensee</h3>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 border border-card-border shrink-0 text-neutral-400">
                  <User size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{customer ? customer.name : "Unknown Customer"}</span>
                  <span className="text-xs text-neutral-400 mt-0.5">{customer ? customer.email : ""}</span>
                </div>
              </div>
              <div className="border-t border-card-border pt-3.5 space-y-3 font-mono text-xs text-neutral-400">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold uppercase text-[10px]">Price Paid</span>
                  <span className="text-primary font-bold">${own.pricePaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold uppercase text-[10px]">Transaction ID</span>
                  <span className="text-neutral-300 select-all">{own.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold uppercase text-[10px]">Date Assigned</span>
                  <span className="text-neutral-300 flex items-center gap-1.5">
                    <Calendar size={12} className="text-neutral-500" />
                    {new Date(own.purchasedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isRevokeOpen}
        onClose={() => setIsRevokeOpen(false)}
        onConfirm={handleRevoke}
        title="Revoke License Agreement"
        description="Are you sure you want to revoke this license? Revoking deletes this license ownership record, and changes the beat status back to AVAILABLE."
        confirmLabel="Revoke Agreement"
        isDestructive
      />
    </div>
  )
}

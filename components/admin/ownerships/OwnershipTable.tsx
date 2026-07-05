"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, ShieldAlert, MoreHorizontal, Shield } from "lucide-react"

import { Ownership } from "../../../types/admin"
import { useUsers } from "../../../hooks/useUsers"
import { useBeats } from "../../../hooks/useBeats"
import { useArtists } from "../../../hooks/useArtists"
import { useRevokeOwnership } from "../../../hooks/useOwnerships"
import { DataTable } from "../DataTable"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { ConfirmDialog } from "../ConfirmDialog"

interface OwnershipTableProps {
  ownerships: Ownership[];
}

export function OwnershipTable({ ownerships }: OwnershipTableProps) {
  const { data: users = [] } = useUsers()
  const { data: beats = [] } = useBeats()
  const { data: artists = [] } = useArtists()

  const revokeOwnershipMutation = useRevokeOwnership()

  const [ownToRevoke, setOwnToRevoke] = React.useState<string | null>(null)
  const [activeDropdownId, setActiveDropdownId] = React.useState<string | null>(null)

  const handleRevokeConfirm = () => {
    if (ownToRevoke) {
      revokeOwnershipMutation.mutate(ownToRevoke)
      setOwnToRevoke(null)
    }
  }

  const columns: ColumnDef<Ownership>[] = [
    {
      accessorKey: "id",
      header: "Ownership ID",
      cell: ({ row }) => (
        <Link 
          href={`/admin/ownerships/${row.original.id}`}
          className="font-mono text-xs text-primary font-bold hover:underline"
        >
          #{row.original.id}
        </Link>
      )
    },
    {
      id: "beat",
      header: "Beat Title",
      cell: ({ row }) => {
        const beat = beats.find(b => b.id === row.original.beatId)
        return (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0 border border-card-border">
              {beat?.assets.coverImage ? (
                <img src={beat.assets.coverImage} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[8px] font-bold text-neutral-600">BEAT</span>
              )}
            </div>
            <Link 
              href={`/admin/beats/${row.original.beatId}`}
              className="font-semibold text-neutral-100 hover:underline"
            >
              {beat ? beat.title : "Unknown Beat"}
            </Link>
          </div>
        )
      }
    },
    {
      id: "artist",
      header: "Artist",
      cell: ({ row }) => {
        const beat = beats.find(b => b.id === row.original.beatId)
        const artist = beat ? artists.find(a => a.id === beat.artistId) : null
        return (
          <span className="text-sm text-neutral-300">
            {artist ? artist.stageName : "Unknown Artist"}
          </span>
        )
      }
    },
    {
      id: "customer",
      header: "Customer / Licensee",
      cell: ({ row }) => {
        const customer = users.find(u => u.id === row.original.customerId)
        return (
          <div className="flex flex-col">
            <span className="font-medium text-neutral-100">{customer ? customer.name : "Unknown Customer"}</span>
            <span className="text-xs text-neutral-500 mt-0.5">{customer ? customer.email : ""}</span>
          </div>
        )
      }
    },
    {
      accessorKey: "licenseType",
      header: "License",
      cell: ({ row }) => (
        <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold gap-1 py-0.5">
          <Shield size={10} />
          {row.original.licenseType}
        </Badge>
      )
    },
    {
      accessorKey: "pricePaid",
      header: "Price Paid",
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-neutral-200">
          ${row.original.pricePaid.toFixed(2)}
        </span>
      )
    },
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-neutral-400">
          {row.original.transactionId}
        </span>
      )
    },
    {
      accessorKey: "purchasedAt",
      header: "Purchased Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 font-mono text-xs">
          {new Date(row.original.purchasedAt).toLocaleDateString()}
        </span>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const own = row.original
        const isOpen = activeDropdownId === own.id

        return (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveDropdownId(isOpen ? null : own.id)}
              className="h-8 w-8 text-neutral-400 hover:text-neutral-100"
            >
              <MoreHorizontal size={16} />
            </Button>
            
            {isOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setActiveDropdownId(null)}
                />
                <div className="absolute right-0 mt-1 w-40 rounded-md border border-card-border bg-card p-1 shadow-xl z-20 animate-in fade-in slide-in-from-top-1">
                  <Link
                    href={`/admin/ownerships/${own.id}`}
                    onClick={() => setActiveDropdownId(null)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    <Eye size={13} />
                    View License File
                  </Link>

                  <button
                    onClick={() => {
                      setOwnToRevoke(own.id)
                      setActiveDropdownId(null)
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-colors"
                  >
                    <ShieldAlert size={13} />
                    Revoke License
                  </button>
                </div>
              </>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <>
      <DataTable columns={columns} data={ownerships} />

      <ConfirmDialog
        isOpen={!!ownToRevoke}
        onClose={() => setOwnToRevoke(null)}
        onConfirm={handleRevokeConfirm}
        title="Revoke License Ownership"
        description="Are you sure you want to revoke this license agreement? Revoking deletes this license ownership record, and frees the beat status back to AVAILABLE."
        confirmLabel="Revoke License"
        isDestructive
      />
    </>
  )
}

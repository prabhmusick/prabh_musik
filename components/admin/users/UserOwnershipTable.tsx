"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Shield, Disc3 } from "lucide-react"

import { Ownership, Beat as BeatType } from "../../../types/admin"
import { useOwnerships } from "../../../hooks/useOwnerships"
import { useBeats } from "../../../hooks/useBeats"
import { DataTable } from "../DataTable"
import { Badge } from "../../ui/badge"
import { Card, CardContent } from "../../ui/card"
import { EmptyState } from "../EmptyState"

interface UserOwnershipTableProps {
  userId: string;
}

export function UserOwnershipTable({ userId }: UserOwnershipTableProps) {
  const { data: allOwnerships = [] } = useOwnerships()
  const { data: beats = [] } = useBeats()

  // Filter ownerships specific to this customer
  const customerOwnerships = React.useMemo(() => {
    return allOwnerships.filter(o => o.customerId === userId)
  }, [allOwnerships, userId])

  const columns: ColumnDef<Ownership>[] = [
    {
      id: "beat",
      header: "Track Asset Name",
      cell: ({ row }) => {
        const beat = beats.find((b: BeatType) => b.id === row.original.beatId)
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-neutral-900 border border-card-border overflow-hidden flex items-center justify-center shrink-0">
              {beat?.assets.coverImage ? (
                <img src={beat.assets.coverImage} className="h-full w-full object-cover" />
              ) : (
                <Disc3 size={16} className="text-neutral-500" />
              )}
            </div>
            <Link 
              href={`/admin/beats/${row.original.beatId}`}
              className="font-bold text-neutral-200 hover:underline"
            >
              {beat ? beat.title : "Unknown Beat"}
            </Link>
          </div>
        )
      }
    },
    {
      accessorKey: "pricePaid",
      header: "Purchase Price",
      cell: ({ row }) => (
        <span className="font-mono text-neutral-300">
          ${row.original.pricePaid.toFixed(2)}
        </span>
      )
    },
    {
      accessorKey: "purchasedAt",
      header: "Assigned Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 font-mono text-xs">
          {new Date(row.original.purchasedAt).toLocaleDateString()}
        </span>
      )
    },
    {
      id: "license",
      header: "License Type",
      cell: ({ row }) => (
        <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-semibold gap-1 py-0.5 capitalize">
          <Shield size={10} />
          {row.original.licenseType}
        </Badge>
      )
    }
  ]

  return (
    <Card>
      <div className="px-6 py-4 border-b border-card-border">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Owned Licenses</h3>
      </div>
      <CardContent className="p-0">
        {customerOwnerships.length > 0 ? (
          <DataTable columns={columns} data={customerOwnerships} />
        ) : (
          <div className="py-8">
            <EmptyState
              title="No Beat Licenses Owned"
              description="This customer has not acquired any active exclusive licenses yet."
              icon={<Shield size={32} />}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

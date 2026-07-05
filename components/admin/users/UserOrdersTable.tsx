"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { ShoppingCart } from "lucide-react"

import { Order, Beat as BeatType } from "../../../types/admin"
import { useBeats } from "../../../hooks/useBeats"
import { useOrders } from "../../../hooks/useOrders"
import { DataTable } from "../DataTable"
import { StatusBadge } from "../StatusBadge"
import { Card, CardContent } from "../../ui/card"
import { EmptyState } from "../EmptyState"

interface UserOrdersTableProps {
  userId: string;
}

export function UserOrdersTable({ userId }: UserOrdersTableProps) {
  const { data: allOrders = [] } = useOrders()
  const { data: beats = [] } = useBeats()

  // Filter orders specific to this customer
  const customerOrders = React.useMemo(() => {
    return allOrders.filter(o => o.customerId === userId)
  }, [allOrders, userId])

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <Link 
          href={`/admin/orders/${row.original.id}`}
          className="font-mono text-xs text-primary font-bold hover:underline"
        >
          #{row.original.id}
        </Link>
      )
    },
    {
      id: "beats",
      header: "Track Items",
      cell: ({ row }) => {
        const beatTitles = row.original.beatIds
          .map(id => beats.find((b: BeatType) => b.id === id)?.title)
          .filter(Boolean)
          .join(", ")

        return <span className="font-semibold text-neutral-200">{beatTitles || "Unknown Beat"}</span>
      }
    },
    {
      accessorKey: "totalAmount",
      header: "Amount Paid",
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-neutral-300">
          ${row.original.totalAmount.toFixed(2)}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />
    },
    {
      accessorKey: "createdAt",
      header: "Purchase Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 font-mono text-xs">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      )
    }
  ]

  return (
    <Card>
      <div className="px-6 py-4 border-b border-card-border">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Orders History</h3>
      </div>
      <CardContent className="p-0">
        {customerOrders.length > 0 ? (
          <DataTable columns={columns} data={customerOrders} />
        ) : (
          <div className="py-8">
            <EmptyState
              title="No Orders Found"
              description="This customer has not logged any orders on the marketplace yet."
              icon={<ShoppingCart size={32} />}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

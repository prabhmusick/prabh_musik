"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, CheckCircle, RefreshCcw, Trash2, MoreHorizontal } from "lucide-react"

import { Order } from "../../../types/admin"
import { useUsers } from "../../../hooks/useUsers"
import { useBeats } from "../../../hooks/useBeats"
import { useUpdateOrderStatus, useDeleteOrder } from "../../../hooks/useOrders"
import { DataTable } from "../DataTable"
import { StatusBadge } from "../StatusBadge"
import { Button } from "../../ui/button"
import { ConfirmDialog } from "../ConfirmDialog"

interface OrderTableProps {
  orders: Order[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const { data: users = [] } = useUsers()
  const { data: beats = [] } = useBeats()

  const updateStatusMutation = useUpdateOrderStatus()
  const deleteOrderMutation = useDeleteOrder()

  const [orderToDelete, setOrderToDelete] = React.useState<string | null>(null)
  const [activeDropdownId, setActiveDropdownId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleDeleteConfirm = () => {
    if (orderToDelete) {
      setError(null)
      deleteOrderMutation.mutate(orderToDelete, {
        onError: (err: any) => {
          const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to delete order"
          setError(msg)
        }
      })
      setOrderToDelete(null)
    }
  }

  const handleUpdateStatus = (id: string, status: Order['status']) => {
    setError(null)
    updateStatusMutation.mutate({ id, status }, {
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to update order status"
        setError(msg)
      }
    })
    setActiveDropdownId(null)
  }

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
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = users.find(u => u.id === row.original.customerId)
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-100">{customer ? customer.name : "Unknown Customer"}</span>
            <span className="text-xs text-neutral-500 mt-0.5">{customer ? customer.email : ""}</span>
          </div>
        )
      }
    },
    {
      id: "beats",
      header: "Beats Purchased",
      cell: ({ row }) => {
        const purchasedBeats = row.original.beatIds
          .map(id => beats.find(b => b.id === id))
          .filter(Boolean)

        return (
          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
            {purchasedBeats.map(beat => (
              <span 
                key={beat!.id}
                className="px-2 py-0.5 rounded bg-neutral-900 border border-card-border text-[10px] text-neutral-300 font-medium"
              >
                {beat!.title}
              </span>
            ))}
            {purchasedBeats.length === 0 && <span className="text-xs text-neutral-500 font-mono">No beats</span>}
          </div>
        )
      }
    },
    {
      accessorKey: "totalAmount",
      header: "Total Price",
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-neutral-200">
          ${row.original.totalAmount.toFixed(2)}
        </span>
      )
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-400 capitalize">
          {(row.original.paymentMethod || "").replace("_", " ")}
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
      header: "Created Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 font-mono text-xs">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original
        const isOpen = activeDropdownId === order.id

        return (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveDropdownId(isOpen ? null : order.id)}
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
                <div className="absolute right-0 mt-1 w-44 rounded-md border border-card-border bg-card p-1 shadow-xl z-20 animate-in fade-in slide-in-from-top-1">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    onClick={() => setActiveDropdownId(null)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    <Eye size={13} />
                    View Invoice Details
                  </Link>

                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-green-400 hover:bg-green-500/5 hover:text-green-300 transition-colors"
                    >
                      <CheckCircle size={13} />
                      Mark Completed
                    </button>
                  )}

                  {order.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'REFUNDED')}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-purple-400 hover:bg-purple-500/5 hover:text-purple-300 transition-colors"
                    >
                      <RefreshCcw size={13} />
                      Refund Order
                    </button>
                  )}

                  <div className="my-1 border-t border-card-border" />
                  <button
                    onClick={() => {
                      setOrderToDelete(order.id)
                      setActiveDropdownId(null)
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete Order
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
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400 font-medium flex items-center justify-between animate-in fade-in duration-200">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-300 text-xs font-semibold">Dismiss</button>
        </div>
      )}
      <DataTable columns={columns} data={orders} />

      <ConfirmDialog
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Order"
        description="Are you sure you want to delete this purchase order? Refunding or deleting will automatically remove associated beat ownership items and free up exclusive tracks."
        confirmLabel="Delete Order"
        isDestructive
      />
    </>
  )
}

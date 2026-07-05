"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, ShieldAlert, CheckCircle, MoreHorizontal } from "lucide-react"

import { User } from "../../../types/admin"
import { useOrders } from "../../../hooks/useOrders"
import { useOwnerships } from "../../../hooks/useOwnerships"
import { useBlockUser, useUnblockUser } from "../../../hooks/useUsers"
import { DataTable } from "../DataTable"
import { StatusBadge } from "../StatusBadge"
import { Button } from "../../ui/button"

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
  const { data: orders = [] } = useOrders()
  const { data: ownerships = [] } = useOwnerships()

  const blockMutation = useBlockUser()
  const unblockMutation = useUnblockUser()

  const [activeDropdownId, setActiveDropdownId] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const handleBlockToggle = (id: string, isBlocked: boolean) => {
    setActionError(null)
    const mutation = isBlocked ? unblockMutation : blockMutation
    mutation.mutate(id, {
      onSuccess: () => {
        setActiveDropdownId(null)
      },
      onError: (err: any) => {
        setActiveDropdownId(null)
        const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to update user status"
        setActionError(msg)
      }
    })
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Customer Name",
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-100">{row.original.name}</span>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-neutral-300">{row.original.email}</span>
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: ({ row }) => (
        <span className="text-neutral-400 font-mono text-xs">
          {row.original.mobile || "—"}
        </span>
      )
    },
    {
      id: "ownedBeats",
      header: "Beats Owned",
      cell: ({ row }) => {
        const count = ownerships.filter(o => o.customerId === row.original.id).length
        return <span className="font-mono text-center block w-fit mx-auto sm:mx-0">{count}</span>
      }
    },
    {
      id: "totalOrders",
      header: "Total Orders",
      cell: ({ row }) => {
        const count = orders.filter(o => o.customerId === row.original.id).length
        return <span className="font-mono">{count}</span>
      }
    },
    {
      id: "totalSpend",
      header: "Total Spend",
      cell: ({ row }) => {
        const completedSpend = orders
          .filter(o => o.customerId === row.original.id && o.status === 'COMPLETED')
          .reduce((sum, o) => sum + o.totalAmount, 0)
        return (
          <span className="font-mono text-primary font-semibold">
            ${completedSpend.toFixed(2)}
          </span>
        )
      }
    },
    {
      id: "lastPurchase",
      header: "Last Purchase",
      cell: ({ row }) => {
        const completedOrders = orders
          .filter(o => o.customerId === row.original.id && o.status === 'COMPLETED')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        if (completedOrders.length === 0) return <span className="text-neutral-500 font-mono text-xs">N/A</span>
        
        return (
          <span className="text-neutral-400 font-mono text-xs">
            {new Date(completedOrders[0].createdAt).toLocaleDateString()}
          </span>
        )
      }
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => (
        <span className="text-neutral-500 font-mono text-xs">
          {row.original.lastLogin ? new Date(row.original.lastLogin).toLocaleDateString() : "—"}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original
        const isBlocked = user.status === 'BLOCKED'
        const isOpen = activeDropdownId === user.id

        return (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveDropdownId(isOpen ? null : user.id)}
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
                    href={`/admin/users/${user.id}`}
                    onClick={() => setActiveDropdownId(null)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    <Eye size={13} />
                    View Customer Profile
                  </Link>

                  <button
                    onClick={() => handleBlockToggle(user.id, isBlocked)}
                    disabled={blockMutation.isPending || unblockMutation.isPending}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                      isBlocked 
                        ? 'text-green-400 hover:bg-green-500/5 hover:text-green-300' 
                        : 'text-red-400 hover:bg-red-500/5 hover:text-red-300'
                    }`}
                  >
                    {isBlocked ? <CheckCircle size={13} /> : <ShieldAlert size={13} />}
                    {isBlocked ? "Unblock Account" : "Block Account"}
                  </button>
                </div>
              </>
            )}
          </div>
        )
      }
    }
  ]

  // Filter out admin users from customer management list
  const customersOnly = users.filter(u => u.role !== 'admin')

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400 font-medium flex items-center justify-between animate-in fade-in duration-200">
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/60 hover:text-red-300 text-xs font-semibold">Dismiss</button>
        </div>
      )}
      <DataTable columns={columns} data={customersOnly} />
    </>
  )
}

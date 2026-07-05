"use client"

import * as React from "react"
import { X, DollarSign, ShoppingCart, Shield } from "lucide-react"

import { useUsers } from "../../../hooks/useUsers"
import { useBeats } from "../../../hooks/useBeats"
import { useCreateOrder } from "../../../hooks/useOrders"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  const { data: users = [], isLoading: loadingUsers } = useUsers()
  const { data: beats = [], isLoading: loadingBeats } = useBeats()
  const createOrderMutation = useCreateOrder()

  const [customerId, setCustomerId] = React.useState("")
  const [selectedBeatIds, setSelectedBeatIds] = React.useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = React.useState("credit_card")
  const [status, setStatus] = React.useState<'PENDING' | 'COMPLETED'>("COMPLETED")
  const [customPrice, setCustomPrice] = React.useState("")

  const [error, setError] = React.useState<string | null>(null)

  // Filter customers & available beats
  const customers = React.useMemo(() => users.filter(u => u.role === 'customer'), [users])
  const availableBeats = React.useMemo(() => beats.filter(b => b.status === 'AVAILABLE'), [beats])

  // Automatically compute default total amount based on selected beats
  const calculatedTotal = React.useMemo(() => {
    return selectedBeatIds.reduce((sum, id) => {
      const beat = beats.find(b => b.id === id)
      return sum + (beat ? beat.price : 0)
    }, 0)
  }, [selectedBeatIds, beats])

  React.useEffect(() => {
    if (calculatedTotal > 0) {
      setCustomPrice(calculatedTotal.toFixed(2))
    } else {
      setCustomPrice("")
    }
  }, [calculatedTotal])

  if (!isOpen) return null

  const handleToggleBeat = (id: string) => {
    setSelectedBeatIds(prev => 
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId || selectedBeatIds.length === 0 || !customPrice) return
    setError(null)

    createOrderMutation.mutate({
      customerId,
      beatIds: selectedBeatIds,
      totalAmount: parseFloat(customPrice) || calculatedTotal,
      status,
      paymentMethod
    }, {
      onSuccess: () => {
        // Reset and close
        setCustomerId("")
        setSelectedBeatIds([])
        setPaymentMethod("credit_card")
        setStatus("COMPLETED")
        setCustomPrice("")
        onClose()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to create order"
        setError(msg)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl animate-in zoom-in-95 rounded-xl border border-card-border bg-card p-6 shadow-lg shadow-black/60 my-8">
        <div className="flex items-center justify-between border-b border-card-border pb-3 mb-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-primary size-5" />
            <h2 className="text-lg font-bold text-neutral-50">Create New Purchase Order</h2>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-100">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400 font-medium flex items-center justify-between animate-in fade-in duration-200">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-300 text-xs font-semibold">Dismiss</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Select Customer</label>
            {loadingUsers ? (
              <div className="h-10 bg-neutral-900 rounded border border-card-border animate-pulse" />
            ) : (
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-md border border-card-border bg-background px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-primary"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            )}
          </div>

          {/* Beats Multi-selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Select Beats (AVAILABLE)</label>
            {loadingBeats ? (
              <div className="h-24 bg-neutral-900 rounded border border-card-border animate-pulse" />
            ) : availableBeats.length === 0 ? (
              <div className="text-xs text-neutral-500 bg-neutral-900/50 p-4 border border-card-border rounded text-center">
                No beats are currently available for purchase (all are draft or sold).
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-md border border-card-border bg-background divide-y divide-card-border scrollbar-hide">
                {availableBeats.map(b => {
                  const isChecked = selectedBeatIds.includes(b.id)
                  return (
                    <div 
                      key={b.id} 
                      onClick={() => handleToggleBeat(b.id)}
                      className={`flex items-center justify-between p-2.5 px-4 cursor-pointer hover:bg-neutral-900/45 transition-colors ${isChecked ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0 border border-card-border">
                          {b.assets.coverImage ? (
                            <img src={b.assets.coverImage} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-bold text-neutral-600">BEAT</span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-neutral-200">{b.title}</span>
                      </div>
                      <span className="text-sm text-primary font-mono font-semibold">${b.price.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* License Type (Pre-selected as Exclusive) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">License Assignment</label>
            <div className="flex items-center gap-2.5 rounded-md border border-card-border bg-neutral-950 p-3">
              <Shield className="text-amber-500 size-4 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-300">Exclusive License</span>
                <span className="text-[10px] text-neutral-500 mt-0.5">Purchasing marks beat as SOLD. Basic/non-exclusive licenses are disabled.</span>
              </div>
            </div>
          </div>

          {/* Pricing & Overrides */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Price ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <DollarSign size={15} />
                </div>
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="pl-8 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-md border border-card-border bg-background px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-primary"
              >
                <option value="credit_card">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="wire_transfer">Wire Transfer</option>
              </select>
            </div>
          </div>

          {/* Status Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Order Action Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-primary"
            >
              <option value="COMPLETED">Completed (Triggers Ownership Assignment)</option>
              <option value="PENDING">Pending (Created as unpaid draft)</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-card-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={createOrderMutation.isPending}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createOrderMutation.isPending || !customerId || selectedBeatIds.length === 0}
              className="px-5 shadow-lg shadow-black/20"
            >
              {createOrderMutation.isPending ? "Creating Order..." : "Log Purchase"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

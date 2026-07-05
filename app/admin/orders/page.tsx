"use client"

import * as React from "react"
import { Plus, ShoppingCart } from "lucide-react"

import { PageHeader } from "../../../components/admin/PageHeader"
import { OrderTable } from "../../../components/admin/orders/OrderTable"
import { OrderFilters } from "../../../components/admin/orders/OrderFilters"
import { CreateOrderModal } from "../../../components/admin/orders/CreateOrderModal"
import { useOrders } from "../../../hooks/useOrders"
import { useUsers } from "../../../hooks/useUsers"
import { Button } from "../../../components/ui/button"
import { EmptyState } from "../../../components/admin/EmptyState"
import { TableSkeleton } from "../../../components/admin/LoadingSkeleton"

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders()
  const { data: users = [] } = useUsers()

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const handleResetFilters = () => {
    setSearch("")
    setStatusFilter("")
  }

  // Filter orders dynamically in the client
  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      // 1. Search Query (Matches Customer Name/Email or Order ID)
      if (search) {
        const query = search.toLowerCase()
        const customer = users.find(u => u.id === order.customerId)
        const matchesName = customer?.name.toLowerCase().includes(query)
        const matchesEmail = customer?.email.toLowerCase().includes(query)
        const matchesId = order.id.toLowerCase().includes(query)
        
        if (!matchesName && !matchesEmail && !matchesId) return false
      }

      // 2. Status Filter
      if (statusFilter && order.status !== statusFilter) return false

      return true
    })
  }, [orders, search, statusFilter, users])

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      {/* Ambient Accent Glow */}
      <div className="absolute top-[-100px] right-[-100px] h-[400px] w-[400px] bg-gradient-to-b from-accent/5 to-transparent blur-[100px] pointer-events-none -z-10" />

      <PageHeader 
        title="Orders & Transactions" 
        description="Monitor beat purchases, manual invoicing, and order states."
      >
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-[0_2px_8px_rgba(212,130,10,0.25)]">
          <Plus size={16} />
          Create Order
        </Button>
      </PageHeader>

      <OrderFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : filteredOrders.length > 0 ? (
        <OrderTable orders={filteredOrders} />
      ) : (
        <EmptyState
          title={search || statusFilter ? "No Orders Found" : "No Orders Recorded"}
          description={
            search || statusFilter
              ? "Try adjusting your search query or removing status filters."
              : "Log your first sales purchase order to see transactional history here."
          }
          icon={<ShoppingCart size={40} />}
          actionLabel="Create Order"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      <CreateOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

"use client"

import * as React from "react"
import { AdminSidebar } from "../../components/admin/AdminSidebar"
import { AdminHeader } from "../../components/admin/AdminHeader"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AdminSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-neutral-950/50 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

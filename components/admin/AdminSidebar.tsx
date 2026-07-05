"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Music,
  Disc3,
  ShoppingCart,
  FileBadge,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { AnimatePresence } from "framer-motion"

import { cn } from "../../lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Artists", href: "/admin/artists", icon: Music },
  { name: "Beats", href: "/admin/beats", icon: Disc3 },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Ownerships", href: "/admin/ownerships", icon: FileBadge },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname()

  const renderSidebar = (collapsedMode: boolean) => (
    <>
      <div className={cn(
        "flex h-16 items-center border-b border-neutral-800",
        collapsedMode ? "justify-center px-0" : "justify-between px-6"
      )}>
        {!collapsedMode && (
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-400">
            AdminPanel
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 transition-colors"
        >
          {collapsedMode ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 transition-colors ml-auto"
        >
          <X size={20} />
        </button>
      </div>

      <nav className={cn(
        "flex-1 space-y-1 overflow-y-auto scrollbar-hide",
        collapsedMode ? "p-3" : "px-3 py-4"
      )}>
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-neutral-800 text-primary"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-50",
                collapsedMode && "justify-center px-0"
              )}
            >
              <item.icon size={20} className={cn("shrink-0", isActive ? "text-primary" : "text-neutral-400")} />
              {!collapsedMode && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
      
      <div className={cn(
        "border-t border-neutral-800",
        collapsedMode ? "p-4 flex justify-center" : "px-6 py-4"
      )}>
        <div className={cn("flex items-center gap-3", collapsedMode && "justify-center")}>
          <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-medium shrink-0">
            A
          </div>
          {!collapsedMode && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">Admin User</span>
              <span className="text-xs text-neutral-500">admin@prabhmusik.com</span>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative z-10 flex w-72 flex-col bg-neutral-950 text-neutral-100 border-r border-neutral-800 h-full"
            >
              {renderSidebar(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ width: 256 }}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col border-r border-neutral-800 bg-neutral-950 text-neutral-100"
      >
        {renderSidebar(isCollapsed)}
      </motion.aside>
    </>
  )
}

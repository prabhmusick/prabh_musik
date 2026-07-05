"use client"

import * as React from "react"
import { User, ShieldAlert, CheckCircle, Mail, Phone, MapPin, Calendar, LogIn } from "lucide-react"

import { User as UserType } from "../../../types/admin"
import { useBlockUser, useUnblockUser } from "../../../hooks/useUsers"
import { StatusBadge } from "../StatusBadge"
import { Card, CardContent } from "../../ui/card"
import { Button } from "../../ui/button"

interface UserProfileCardProps {
  user: UserType;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const blockMutation = useBlockUser()
  const unblockMutation = useUnblockUser()

  const isBlocked = user.status === 'BLOCKED'

  const handleBlockToggle = () => {
    if (isBlocked) {
      unblockMutation.mutate(user.id)
    } else {
      blockMutation.mutate(user.id)
    }
  }

  return (
    <Card className="shadow-md">
      <CardContent className="p-6 space-y-6">
        {/* Profile Header Block */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-card-border">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 border border-card-border shrink-0 text-neutral-400">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-snug">{user.name}</h2>
            <span className="text-xs text-neutral-500 font-mono">ID: {user.id}</span>
          </div>
          <div className="pt-1.5">
            <StatusBadge status={user.status} />
          </div>
        </div>

        {/* Detailed Demographics */}
        <div className="space-y-4 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-neutral-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider">Email Contact</span>
              <span className="text-neutral-200 mt-0.5">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone size={16} className="text-neutral-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider">Mobile Number</span>
              <span className="text-neutral-200 mt-0.5">{user.mobile || "N/A"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-neutral-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider">Mailing Address</span>
              <span className="text-neutral-200 mt-0.5 leading-relaxed">{user.address || "N/A"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-neutral-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider">Registration Date</span>
              <span className="text-neutral-200 mt-0.5 font-mono">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LogIn size={16} className="text-neutral-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-neutral-500 font-bold uppercase text-[9px] tracking-wider">Last Login Time</span>
              <span className="text-neutral-200 mt-0.5 font-mono">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toggle Button */}
        <div className="pt-2">
          <Button
            onClick={handleBlockToggle}
            variant="outline"
            disabled={blockMutation.isPending || unblockMutation.isPending}
            className={`w-full gap-2 text-xs font-semibold ${
              isBlocked 
                ? 'border-green-500/10 text-green-400 hover:bg-green-500/5 hover:border-green-500/20 hover:text-green-300' 
                : 'border-red-500/10 text-red-400 hover:bg-red-500/5 hover:border-red-500/20 hover:text-red-300'
            }`}
          >
            {isBlocked ? <CheckCircle size={14} /> : <ShieldAlert size={14} />}
            {isBlocked ? "Unblock Customer Account" : "Block Customer Account"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

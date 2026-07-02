import * as React from "react"
import { Badge } from "../ui/badge"

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const safeStatus = status || ""
  const normalizedStatus = safeStatus.toLowerCase()
  
  switch (normalizedStatus) {
    case 'active':
    case 'completed':
    case 'published':
    case 'available':
      return <Badge variant="success" className="capitalize">{safeStatus.replace('_', ' ').toLowerCase()}</Badge>
    case 'pending':
    case 'draft':
      return <Badge variant="warning" className="capitalize">{safeStatus.replace('_', ' ').toLowerCase()}</Badge>
    case 'suspended':
    case 'failed':
    case 'inactive':
    case 'refunded':
      return <Badge variant="destructive" className="capitalize">{safeStatus.replace('_', ' ').toLowerCase()}</Badge>
    case 'sold':
      return <Badge variant="secondary" className="capitalize">{safeStatus.replace('_', ' ').toLowerCase()}</Badge>
    default:
      return <Badge variant="secondary" className="capitalize">{safeStatus.replace('_', ' ').toLowerCase()}</Badge>
  }
}

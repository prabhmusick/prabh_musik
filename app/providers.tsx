"use client"

import React, { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppShellProvider } from "./contexts/app-shell-context"
import { GoogleProvider } from "../components/providers/google-provider"
import { AppleProvider } from "../components/providers/apple-provider"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleProvider>
        <AppleProvider>
          <AppShellProvider>{children}</AppShellProvider>
        </AppleProvider>
      </GoogleProvider>
    </QueryClientProvider>
  )
}

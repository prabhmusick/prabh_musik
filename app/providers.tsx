"use client"

import React, { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppShellProvider } from "./contexts/app-shell-context"
import { AudioPlayerProvider } from "./contexts/audio-player-context"
import { GlobalAudioPlayer } from "../components/audio/GlobalAudioPlayer"
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
          <AppShellProvider>
            <AudioPlayerProvider>
              {children}
              <GlobalAudioPlayer />
            </AudioPlayerProvider>
          </AppShellProvider>
        </AppleProvider>
      </GoogleProvider>
    </QueryClientProvider>
  )
}

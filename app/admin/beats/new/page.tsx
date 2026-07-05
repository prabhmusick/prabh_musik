"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "../../../../components/admin/PageHeader"
import { BeatForm } from "../../../../components/admin/beats/BeatForm"
import { useCreateBeat } from "../../../../hooks/useBeats"
import { Button } from "../../../../components/ui/button"

export default function NewBeatPage() {
  const router = useRouter()
  const createBeatMutation = useCreateBeat()

  const handleFormSubmit = (data: any) => {
    createBeatMutation.mutate(data, {
      onSuccess: () => {
        router.push("/admin/beats")
      }
    })
  }

  const errorMsg = createBeatMutation.error
    ? (createBeatMutation.error as any)?.response?.data?.error || 
      (createBeatMutation.error as any)?.response?.data?.message || 
      createBeatMutation.error.message
    : null;

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      <div className="absolute top-[-100px] right-[-100px] h-[400px] w-[400px] bg-gradient-to-b from-accent/5 to-transparent blur-[100px] pointer-events-none -z-10" />

      <div className="flex items-center gap-3">
        <Link href="/admin/beats">
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <span className="text-sm font-medium text-neutral-500">Back to Beats</span>
      </div>

      <PageHeader
        title="Upload Beat"
        description="Fill out the fields to publish a new beat to the marketplace."
      />

      <BeatForm 
        onSubmit={handleFormSubmit}
        isSubmitting={createBeatMutation.isPending}
        error={errorMsg}
      />
    </div>
  )
}

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "../../../../../components/admin/PageHeader"
import { BeatForm } from "../../../../../components/admin/beats/BeatForm"
import { useBeat, useUpdateBeat } from "../../../../../hooks/useBeats"
import { Button } from "../../../../../components/ui/button"

export default function EditBeatPage() {
  const { id } = useParams()
  const router = useRouter()
  const beatId = Array.isArray(id) ? id[0] : id

  const { data: beat, isLoading, error } = useBeat(beatId || "")
  const updateBeatMutation = useUpdateBeat()

  const handleFormSubmit = (data: any) => {
    if (!beatId) return
    updateBeatMutation.mutate({
      id: beatId,
      updatedFields: data
    }, {
      onSuccess: () => {
        router.push(`/admin/beats/${beatId}`)
      }
    })
  }

  const errorMsg = updateBeatMutation.error
    ? (updateBeatMutation.error as any)?.response?.data?.error || 
      (updateBeatMutation.error as any)?.response?.data?.message || 
      updateBeatMutation.error.message
    : null;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-32 bg-neutral-800 rounded"></div>
        <div className="h-10 w-[200px] bg-neutral-800 rounded"></div>
        <div className="h-[400px] bg-neutral-800 rounded-xl"></div>
      </div>
    )
  }

  if (error || !beat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Track Not Found</h2>
        <p className="text-neutral-400 max-w-sm">The beat you are trying to edit does not exist or has been removed.</p>
        <Link href="/admin/beats">
          <Button>Back to Beats</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      <div className="absolute top-[-100px] right-[-100px] h-[400px] w-[400px] bg-gradient-to-b from-accent/5 to-transparent blur-[100px] pointer-events-none -z-10" />

      <div className="flex items-center gap-3">
        <Link href={`/admin/beats/${beatId}`}>
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <span className="text-sm font-medium text-neutral-500">Back to Track Details</span>
      </div>

      <PageHeader
        title={`Edit Beat: ${beat.title}`}
        description="Modify the track meta information, price details, and deliverable files."
      />

      <BeatForm 
        initialValues={beat}
        onSubmit={handleFormSubmit}
        isSubmitting={updateBeatMutation.isPending}
        error={errorMsg}
      />
    </div>
  )
}

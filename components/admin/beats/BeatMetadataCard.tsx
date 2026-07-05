import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Beat } from "../../../types/admin"

interface BeatMetadataCardProps {
  beat: Beat;
}

export function BeatMetadataCard({ beat }: BeatMetadataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold text-white">Music Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-neutral-500 uppercase font-semibold">Genre</span>
            <span className="text-sm font-semibold text-neutral-200">{beat.genre}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-neutral-500 uppercase font-semibold">Mood</span>
            <span className="text-sm font-semibold text-neutral-200">{beat.mood}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-neutral-500 uppercase font-semibold">BPM</span>
            <span className="text-sm font-semibold text-neutral-200 font-mono">{beat.bpm} BPM</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-neutral-500 uppercase font-semibold">Key</span>
            <span className="text-sm font-semibold text-neutral-200 font-mono">{beat.key}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-neutral-500 uppercase font-semibold">Beat Type</span>
            <span className="text-sm font-semibold text-neutral-200 capitalize">{beat.type}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-neutral-500 uppercase font-semibold">License Track Type</span>
            <span className="text-sm font-semibold text-neutral-200 capitalize">{beat.trackType}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-neutral-500 uppercase font-semibold">Duration</span>
            <span className="text-sm font-semibold text-neutral-200 font-mono">
              {beat.duration ? `${Math.floor(beat.duration / 60)}:${(beat.duration % 60).toString().padStart(2, '0')}` : "--:--"}
            </span>
          </div>
        </div>

        {beat.tags && beat.tags.length > 0 && (
          <div className="mt-5 pt-4 border-t border-card-border">
            <span className="text-xs text-neutral-500 uppercase font-semibold block mb-2">Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {beat.tags.map((tag) => (
                <span 
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 border border-card-border text-neutral-400 font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

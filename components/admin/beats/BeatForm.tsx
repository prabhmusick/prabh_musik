"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Beat, BeatAssetUrls } from "../../../types/admin"
import { useArtists } from "../../../hooks/useArtists"
import { BEAT_GENRES } from "../../../constants/beat-genres"
import { BEAT_MOODS } from "../../../constants/beat-moods"
import { BEAT_KEYS } from "../../../constants/beat-keys"
import { BeatUploadZone } from "./BeatUploadZone"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"

interface BeatFormProps {
  initialValues?: Beat;
  onSubmit: (data: Omit<Beat, 'id' | 'createdAt' | 'analytics' | 'ownershipsCount'>) => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function BeatForm({ initialValues, onSubmit, isSubmitting, error }: BeatFormProps) {
  const router = useRouter()
  const { data: artists = [] } = useArtists()
  const [title, setTitle] = React.useState(initialValues?.title || "")
  const [artistId, setArtistId] = React.useState(initialValues?.artistId || "")
  const [duration, setDuration] = React.useState(initialValues?.duration || 0)
  const [description, setDescription] = React.useState(initialValues?.description || "")

  React.useEffect(() => {
    if (!artistId && artists.length > 0) {
      setArtistId(artists[0].id)
    }
  }, [artists, artistId])
  
  const [type, setType] = React.useState<'beat' | 'song' | 'vocals'>(initialValues?.type || 'beat')
  const [genre, setGenre] = React.useState(initialValues?.genre || BEAT_GENRES[0])
  const [bpm, setBpm] = React.useState(initialValues?.bpm?.toString() || "120")
  const [key, setKey] = React.useState(initialValues?.key || BEAT_KEYS[0])
  const [mood, setMood] = React.useState(initialValues?.mood || BEAT_MOODS[0])
  const [trackType, setTrackType] = React.useState<'exclusive' | 'non-exclusive'>(initialValues?.trackType || 'non-exclusive')
  const [tagsInput, setTagsInput] = React.useState(initialValues?.tags?.join(", ") || "")
  
  const [price, setPrice] = React.useState(initialValues?.price?.toString() || "149.99")
  const [status, setStatus] = React.useState<'DRAFT' | 'AVAILABLE' | 'SOLD'>(initialValues?.status || 'AVAILABLE')

  const [assets, setAssets] = React.useState<BeatAssetUrls>({
    coverImage: initialValues?.assets?.coverImage || "",
    bannerImage: initialValues?.assets?.bannerImage || "",
    previewAudio: initialValues?.assets?.previewAudio || "",
    wavFile: initialValues?.assets?.wavFile || "",
    stemsFile: initialValues?.assets?.stemsFile || "",
  })

  const handleAssetChange = (key: keyof BeatAssetUrls, url: string) => {
    setAssets(prev => ({
      ...prev,
      [key]: url
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !artistId || !bpm || !price) return

    const tags = tagsInput
      .split(",")
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)

    onSubmit({
      title,
      artistId,
      description,
      type,
      genre,
      bpm: parseInt(bpm) || 120,
      key,
      mood,
      trackType,
      tags,
      price: parseFloat(price) || 0,
      status,
      duration,
      assets,
    } as any)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 font-medium animate-in fade-in duration-200">
          ⚠️ {error}
        </div>
      )}
      {/* Section 1: Basic Information */}
      <div className="rounded-xl border border-card-border bg-card p-6 space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-card-border pb-3">Section 1: Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Beat Name</label>
            <Input 
              required
              placeholder="e.g. Midnight Drive" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Artist</label>
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              {artists.map(artist => (
                <option key={artist.id} value={artist.id}>{artist.stageName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-neutral-300">Description</label>
            <textarea
              rows={3}
              placeholder="Enter details about this track..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-card-border bg-background p-3 text-sm text-neutral-200 outline-none focus:border-white/[0.12] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Music Information */}
      <div className="rounded-xl border border-card-border bg-card p-6 space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-card-border pb-3">Section 2: Music Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Beat Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              <option value="beat">Beat</option>
              <option value="song">Song</option>
              <option value="vocals">Vocals</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              {BEAT_GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              {BEAT_MOODS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">BPM</label>
            <Input 
              required
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Key</label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              {BEAT_KEYS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Track Type</label>
            <select
              value={trackType}
              onChange={(e) => setTrackType(e.target.value as any)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              <option value="non-exclusive">Non-Exclusive</option>
              <option value="exclusive">Exclusive Only</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-semibold text-neutral-300">Tags (comma separated)</label>
            <Input 
              placeholder="e.g. trap, bounce, dark, heavy" 
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Pricing & Status */}
      <div className="rounded-xl border border-card-border bg-card p-6 space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-card-border pb-3">Section 3: Pricing & Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">License Price ($)</label>
            <Input 
              required
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Selling Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.12]"
            >
              <option value="AVAILABLE">Available</option>
              <option value="DRAFT">Draft</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 4: Assets */}
      <div className="rounded-xl border border-card-border bg-card p-6 space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-card-border pb-3">Section 4: Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BeatUploadZone
            label="Cover Image"
            accept="image/*"
            description="JPG or PNG. Min 500x500px."
            value={assets.coverImage}
            onUploadComplete={(key) => handleAssetChange("coverImage", key)}
            type="image"
          />
          <BeatUploadZone
            label="Banner Image"
            accept="image/*"
            description="JPG or PNG. Preferred 1200x400px."
            value={assets.bannerImage}
            onUploadComplete={(key) => handleAssetChange("bannerImage", key)}
            type="image"
          />
          <BeatUploadZone
            label="Preview Audio File"
            accept="audio/mp3,audio/wav"
            description="MP3 or WAV tagged file for site play."
            value={assets.previewAudio}
            onUploadComplete={(key, dur) => {
              handleAssetChange("previewAudio", key)
              if (dur) setDuration(dur)
            }}
            type="audio"
          />
          <BeatUploadZone
            label="Purchasable WAV File"
            accept="audio/wav"
            description="High-quality WAV audio file for purchasers."
            value={assets.wavFile}
            onUploadComplete={(key) => handleAssetChange("wavFile", key)}
            type="audio"
          />
          <BeatUploadZone
            label="Purchasable STEMS (ZIP)"
            accept="application/zip,application/x-zip-compressed"
            description="ZIP archive holding separated stems."
            value={assets.stemsFile}
            onUploadComplete={(key) => handleAssetChange("stemsFile", key)}
            type="document"
          />
        </div>
      </div>

      {/* Submit / Cancel row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-card-border pt-6">
        <div>
          {!assets.previewAudio && (
            <div className="text-amber-500 text-sm flex items-center gap-1.5 font-medium">
              <span>⚠️</span>
              <span>Warning: Preview audio has not been uploaded.</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3.5 w-full sm:w-auto">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/admin/beats")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6"
          >
            {isSubmitting ? "Saving Beat..." : (initialValues ? "Save Changes" : "Upload Beat")}
          </Button>
        </div>
      </div>
    </form>
  )
}

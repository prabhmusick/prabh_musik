"use client"

import * as React from "react"
import { Upload, Check, Loader2, FileText, Image as ImageIcon, Music } from "lucide-react"
import { Button } from "../../ui/button"
import { cn } from "../../../lib/utils"

import { uploadFile } from "../../../services/upload.service"

interface BeatUploadZoneProps {
  label: string;
  accept: string;
  description: string;
  value?: string;
  onUploadComplete: (key: string, duration?: number) => void;
  type: "image" | "audio" | "document";
}

export function BeatUploadZone({
  label,
  accept,
  description,
  value,
  onUploadComplete,
  type
}: BeatUploadZoneProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setProgress(0)
    setUploadError(null)

    let calculatedDuration: number | undefined = undefined
    if (type === "audio") {
      try {
        calculatedDuration = await new Promise<number>((resolve) => {
          const audio = new Audio()
          audio.src = URL.createObjectURL(file)
          audio.addEventListener("loadedmetadata", () => {
            resolve(Math.round(audio.duration))
          })
          audio.addEventListener("error", () => {
            resolve(0)
          })
        })
      } catch (err) {
        console.error("Failed to calculate duration:", err)
      }
    }

    try {
      const response = await uploadFile(file, type, (percentage) => {
        setProgress(percentage)
      })
      setIsUploading(false)
      onUploadComplete(response.fileName, calculatedDuration)
    } catch (err: any) {
      setIsUploading(false)
      console.error("Upload error:", err)
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unknown error"
      setUploadError(errorMsg)
    }
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  const getIcon = () => {
    if (type === "image") return <ImageIcon size={28} className="text-neutral-400" />
    if (type === "audio") return <Music size={28} className="text-neutral-400" />
    return <FileText size={28} className="text-neutral-400" />
  }

  const getDisplayValue = (val: string) => {
    if (!val) return "";
    if (val.includes("/beats/object/")) {
      const decoded = decodeURIComponent(val);
      return decoded.split("/beats/object/").pop() || val;
    }
    return val;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-neutral-300">{label}</label>
      <div 
        onClick={!isUploading ? triggerUpload : undefined}
        className={cn(
          "relative flex flex-col items-center justify-center border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all min-h-[140px]",
          value ? "border-emerald-500/30 bg-emerald-500/[0.01]" : "border-card-border bg-card hover:border-white/[0.12]",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden" 
        />

        {isUploading ? (
          <div className="w-full max-w-[200px] space-y-3">
            <Loader2 className="animate-spin size-6 text-primary mx-auto" />
            <div className="text-xs text-neutral-400">Uploading file... {progress}%</div>
            <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/[0.04]">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-150" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check size={20} />
            </div>
            <div className="text-xs font-semibold text-neutral-200">Upload Complete</div>
            <div className="text-[10px] text-neutral-500 max-w-[250px] truncate font-mono">{getDisplayValue(value)}</div>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation()
                onUploadComplete("")
              }}
              className="h-7 text-xs px-2 mt-1 border-red-500/10 text-red-400 hover:bg-red-500/5 hover:border-red-500/20 hover:text-red-300"
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2.5 rounded-full bg-neutral-900 border border-card-border mb-1">
              {getIcon()}
            </div>
            <div className="text-xs text-neutral-300">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </div>
            <div className="text-[10px] text-neutral-500">{description}</div>
            {uploadError && (
              <div className="text-[10px] text-red-400 font-semibold mt-1 max-w-[250px] break-words">
                Upload failed: {uploadError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

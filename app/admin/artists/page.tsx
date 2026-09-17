"use client";

import * as React from "react";
import { PageHeader } from "../../../components/admin/PageHeader";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { BeatUploadZone } from "../../../components/admin/beats/BeatUploadZone";
import { useArtists } from "../../../hooks/useArtists";
import { createArtist } from "../../../services/artist.service";
import { useQueryClient } from "@tanstack/react-query";

export default function ArtistsPage() {
  const queryClient = useQueryClient();
  const { data: artists = [], isLoading } = useArtists();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [imageKey, setImageKey] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createArtist({ name, phone, email, image_key: imageKey });
      await queryClient.invalidateQueries({ queryKey: ["admin", "artists"] });
      setName("");
      setPhone("");
      setEmail("");
      setImageKey("");
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to create artist",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Artists Management"
        description="Manage producers and beatmakers on your platform."
      />
      <form
        onSubmit={submit}
        className="grid max-w-4xl grid-cols-1 gap-4 rounded-xl border border-card-border bg-card p-6 md:grid-cols-2"
      >
        <Input
          required
          placeholder="Artist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <BeatUploadZone
          label="Artist image"
          accept="image/*"
          description="JPG, PNG, or WebP."
          value={imageKey}
          onUploadComplete={setImageKey}
          type="image"
        />
        {error && <p className="text-sm text-red-400 md:col-span-2">{error}</p>}
        <Button type="submit" disabled={saving} className="md:col-span-2">
          {saving ? "Saving..." : "Add Artist"}
        </Button>
      </form>

      <section className="rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Artists</h2>
        {isLoading ? (
          <p className="text-neutral-400">Loading artists...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="flex items-center gap-3 rounded-lg border border-card-border p-3"
              >
                {artist.image ? (
                  <img
                    src={artist.image}
                    alt={artist.stageName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-neutral-800" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-white">{artist.stageName}</p>
                  <p className="truncate text-xs text-neutral-400">
                    {artist.email || artist.phone || "No contact details"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {artist.totalBeats} beats
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

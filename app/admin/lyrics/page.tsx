"use client";

import * as React from "react";
import { PageHeader } from "../../../components/admin/PageHeader";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../lib/api";
import {
  createLyric,
  deleteLyric,
  getLyrics,
} from "../../../services/lyrics.service";

export default function LyricsAdminPage() {
  const queryClient = useQueryClient();
  const { data: lyrics = [], isLoading } = useQuery({
    queryKey: ["admin", "lyrics"],
    queryFn: getLyrics,
  });
  const [title, setTitle] = React.useState("");
  const [genre, setGenre] = React.useState("");
  const [quote, setQuote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createLyric({ title, genre, quote });
      await queryClient.invalidateQueries({ queryKey: ["admin", "lyrics"] });
      setTitle("");
      setGenre("");
      setQuote("");
    } catch (submitError: unknown) {
      setError(getApiErrorMessage(submitError, "Unable to add lyric"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Remove this lyric commission from the page?")) return;
    setDeletingId(id);
    setError("");
    try {
      await deleteLyric(id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "lyrics"] });
    } catch (removeError: unknown) {
      setError(getApiErrorMessage(removeError, "Unable to remove lyric"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Lyrics Management"
        description="Manage the lyric commissions shown on the lyrics service page."
      />
      <form
        onSubmit={submit}
        className="grid max-w-4xl grid-cols-1 gap-4 rounded-xl border border-card-border bg-card p-6"
      >
        <Input
          required
          placeholder="Song or project title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          required
          placeholder="Genre, e.g. Pop · Electronic"
          value={genre}
          onChange={(event) => setGenre(event.target.value)}
        />
        <textarea
          required
          placeholder="Lyric quote"
          value={quote}
          onChange={(event) => setQuote(event.target.value)}
          className="min-h-32 rounded-md border border-card-border bg-background p-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-white/[0.12]"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add Lyric"}
        </Button>
      </form>

      <section className="rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Published Lyrics</h2>
        {isLoading ? (
          <p className="text-neutral-400">Loading lyrics...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {lyrics.map((lyric) => (
              <div
                key={lyric.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-card-border p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">{lyric.title}</p>
                  <p className="text-xs text-primary">{lyric.genre}</p>
                  <p className="mt-2 text-sm text-neutral-300">{lyric.quote}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingId === lyric.id}
                  onClick={() => remove(lyric.id)}
                  className="shrink-0 border-red-500/20 text-red-400 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-300"
                >
                  {deletingId === lyric.id ? "Removing..." : "Remove"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

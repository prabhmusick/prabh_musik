"use client";

import * as React from "react";
import { PageHeader } from "../../../components/admin/PageHeader";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { BeatUploadZone } from "../../../components/admin/beats/BeatUploadZone";
import { useArtists } from "../../../hooks/useArtists";
import {
  createArtist,
  createWorkedWithArtist,
  deleteWorkedWithArtist,
  getWorkedWithArtists,
  updateWorkedWithArtistVisibility,
  WorkedWithArtistVisibility,
} from "../../../services/artist.service";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../lib/api";

const visibilityOptions = [
  { key: "show_on_music_production", label: "Music Production" },
  { key: "show_on_mix_master", label: "Mix and Master" },
  { key: "show_on_lyrics", label: "Lyrics" },
  { key: "show_on_marketing_distribution", label: "Marketing & Distribution" },
] as const;

export default function ArtistsPage() {
  const queryClient = useQueryClient();
  const { data: artists = [], isLoading } = useArtists();
  const { data: workedWithArtists = [], isLoading: isWorkedWithLoading } =
    useQuery({
      queryKey: ["admin", "worked-with-artists"],
      queryFn: getWorkedWithArtists,
    });
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [imageKey, setImageKey] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [workedWithName, setWorkedWithName] = React.useState("");
  const [workedWithImage, setWorkedWithImage] = React.useState("");
  const [workedWithSong, setWorkedWithSong] = React.useState("Dont Look 2");
  const [workedWithMusicType, setWorkedWithMusicType] =
    React.useState("Punjabi Trap");
  const [workedWithYear, setWorkedWithYear] = React.useState("2024");
  const [workedWithVisibility, setWorkedWithVisibility] =
    React.useState<WorkedWithArtistVisibility>({
      show_on_music_production: false,
      show_on_mix_master: false,
      show_on_lyrics: false,
      show_on_marketing_distribution: false,
    });
  const [workedWithSaving, setWorkedWithSaving] = React.useState(false);
  const [workedWithError, setWorkedWithError] = React.useState("");
  const [deletingWorkedWithId, setDeletingWorkedWithId] = React.useState<
    number | null
  >(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = React.useState<
    number | null
  >(null);

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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to create artist"));
    } finally {
      setSaving(false);
    }
  };

  const submitWorkedWith = async (event: React.FormEvent) => {
    event.preventDefault();
    setWorkedWithSaving(true);
    setWorkedWithError("");

    try {
      await createWorkedWithArtist({
        name: workedWithName,
        image: workedWithImage,
        popular_song: workedWithSong,
        music_type: workedWithMusicType,
        worked_year: Number(workedWithYear),
        ...workedWithVisibility,
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "worked-with-artists"],
      });
      setWorkedWithName("");
      setWorkedWithImage("");
      setWorkedWithSong("Dont Look 2");
      setWorkedWithMusicType("Punjabi Trap");
      setWorkedWithYear("2024");
      setWorkedWithVisibility({
        show_on_music_production: false,
        show_on_mix_master: false,
        show_on_lyrics: false,
        show_on_marketing_distribution: false,
      });
    } catch (err: unknown) {
      setWorkedWithError(
        getApiErrorMessage(err, "Unable to add worked-with artist"),
      );
    } finally {
      setWorkedWithSaving(false);
    }
  };

  const removeWorkedWith = async (id: number) => {
    if (!window.confirm("Remove this worked-with artist?")) return;

    setDeletingWorkedWithId(id);
    setWorkedWithError("");
    try {
      await deleteWorkedWithArtist(id);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "worked-with-artists"],
      });
    } catch (err: unknown) {
      setWorkedWithError(
        getApiErrorMessage(err, "Unable to remove worked-with artist"),
      );
    } finally {
      setDeletingWorkedWithId(null);
    }
  };

  const updateVisibility = async (
    artistId: number,
    key: keyof WorkedWithArtistVisibility,
    checked: boolean,
  ) => {
    const artist = workedWithArtists.find((item) => item.id === artistId);
    if (!artist) return;

    const visibility: WorkedWithArtistVisibility = {
      show_on_music_production: artist.showOnMusicProduction,
      show_on_mix_master: artist.showOnMixMaster,
      show_on_lyrics: artist.showOnLyrics,
      show_on_marketing_distribution: artist.showOnMarketingDistribution,
    };
    visibility[key] = checked;

    setUpdatingVisibilityId(artistId);
    setWorkedWithError("");
    try {
      await updateWorkedWithArtistVisibility(artistId, visibility);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "worked-with-artists"],
      });
    } catch (err: unknown) {
      setWorkedWithError(
        getApiErrorMessage(err, "Unable to update artist visibility"),
      );
    } finally {
      setUpdatingVisibilityId(null);
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

      <section className="space-y-6 rounded-xl border border-card-border bg-card p-6">
        <div>
          <h2 className="text-lg font-bold text-white">
            Artists I Have Worked With
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Choose which service pages feature each artist.
          </p>
        </div>

        <form
          onSubmit={submitWorkedWith}
          className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Input
            required
            placeholder="Artist name"
            value={workedWithName}
            onChange={(event) => setWorkedWithName(event.target.value)}
          />
          <Input
            required
            placeholder="Popular song"
            value={workedWithSong}
            onChange={(event) => setWorkedWithSong(event.target.value)}
          />
          <Input
            required
            placeholder="Music type"
            value={workedWithMusicType}
            onChange={(event) => setWorkedWithMusicType(event.target.value)}
          />
          <Input
            required
            type="number"
            min={1900}
            max={2100}
            placeholder="Worked in year"
            value={workedWithYear}
            onChange={(event) => setWorkedWithYear(event.target.value)}
          />
          <BeatUploadZone
            label="Artist image"
            accept="image/*"
            description="JPG, PNG, or WebP."
            value={workedWithImage}
            onUploadComplete={setWorkedWithImage}
            type="image"
          />
          <fieldset className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <legend className="mb-2 text-sm font-medium text-neutral-300">
              Show on service pages
            </legend>
            {visibilityOptions.map((option) => (
              <label
                key={option.key}
                className="flex items-center gap-2 text-sm text-neutral-300"
              >
                <input
                  type="checkbox"
                  checked={workedWithVisibility[option.key]}
                  onChange={(event) =>
                    setWorkedWithVisibility((current) => ({
                      ...current,
                      [option.key]: event.target.checked,
                    }))
                  }
                />
                Show on {option.label} page
              </label>
            ))}
          </fieldset>
          {workedWithError && (
            <p className="text-sm text-red-400 md:col-span-2">
              {workedWithError}
            </p>
          )}
          <Button
            type="submit"
            disabled={workedWithSaving}
            className="md:col-span-2"
          >
            {workedWithSaving ? "Saving..." : "Add Worked-With Artist"}
          </Button>
        </form>

        {isWorkedWithLoading ? (
          <p className="text-neutral-400">Loading worked-with artists...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {workedWithArtists.map((artist) => (
              <div
                key={artist.id}
                className="flex flex-col gap-3 rounded-lg border border-card-border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {artist.name}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      {artist.popularSong} · {artist.musicType} ·{" "}
                      {artist.workedYear}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingWorkedWithId === artist.id}
                    onClick={() => removeWorkedWith(artist.id)}
                    className="shrink-0 border-red-500/20 text-red-400 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-300"
                  >
                    {deletingWorkedWithId === artist.id
                      ? "Removing..."
                      : "Remove"}
                  </Button>
                </div>
                <div className="grid gap-2 border-t border-card-border pt-3 sm:grid-cols-2">
                  {visibilityOptions.map((option) => {
                    const checked = {
                      show_on_music_production: artist.showOnMusicProduction,
                      show_on_mix_master: artist.showOnMixMaster,
                      show_on_lyrics: artist.showOnLyrics,
                      show_on_marketing_distribution:
                        artist.showOnMarketingDistribution,
                    }[option.key];

                    return (
                      <label
                        key={option.key}
                        className="flex items-center gap-2 text-xs text-neutral-300"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={updatingVisibilityId === artist.id}
                          onChange={(event) =>
                            updateVisibility(
                              artist.id,
                              option.key,
                              event.target.checked,
                            )
                          }
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

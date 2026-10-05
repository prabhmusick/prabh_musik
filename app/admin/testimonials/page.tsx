"use client";

import * as React from "react";
import { PageHeader } from "../../../components/admin/PageHeader";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { BeatUploadZone } from "../../../components/admin/beats/BeatUploadZone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../lib/api";
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonials,
} from "../../../services/testimonial.service";

export default function TestimonialsAdminPage() {
  const queryClient = useQueryClient();
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: getTestimonials,
  });
  const [name, setName] = React.useState("");
  const [image, setImage] = React.useState("");
  const [rating, setRating] = React.useState("5");
  const [testimonial, setTestimonial] = React.useState("");
  const [professional, setProfessional] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await createTestimonial({
        name,
        image,
        rating: Number(rating),
        testimonial,
        professional,
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "testimonials"],
      });
      setName("");
      setImage("");
      setRating("5");
      setTestimonial("");
      setProfessional("");
    } catch (submitError: unknown) {
      setError(getApiErrorMessage(submitError, "Unable to add testimonial"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Remove this testimonial from the home page?")) return;

    setDeletingId(id);
    setError("");
    try {
      await deleteTestimonial(id);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "testimonials"],
      });
    } catch (removeError: unknown) {
      setError(getApiErrorMessage(removeError, "Unable to remove testimonial"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Testimonials Management"
        description="Add and remove client testimonials shown on the home page."
      />

      <form
        onSubmit={submit}
        className="grid max-w-4xl grid-cols-1 gap-4 rounded-xl border border-card-border bg-card p-6 md:grid-cols-2"
      >
        <Input
          required
          placeholder="Client name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          required
          placeholder="Professional or company"
          value={professional}
          onChange={(event) => setProfessional(event.target.value)}
        />
        <Input
          required
          type="number"
          min={1}
          max={5}
          placeholder="Rating (1-5)"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
        />
        <BeatUploadZone
          label="Client image"
          accept="image/*"
          description="JPG, PNG, or WebP."
          value={image}
          onUploadComplete={setImage}
          type="image"
        />
        <textarea
          required
          placeholder="Testimonial"
          value={testimonial}
          onChange={(event) => setTestimonial(event.target.value)}
          className="min-h-32 rounded-md border border-card-border bg-background p-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-white/[0.12] md:col-span-2"
        />
        {error && <p className="text-sm text-red-400 md:col-span-2">{error}</p>}
        <Button type="submit" disabled={saving} className="md:col-span-2">
          {saving ? "Saving..." : "Add Testimonial"}
        </Button>
      </form>

      <section className="rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-lg font-bold text-white">
          Published Testimonials
        </h2>
        {isLoading ? (
          <p className="text-neutral-400">Loading testimonials...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {testimonials.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-card-border p-3"
              >
                <div className="flex min-w-0 gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-neutral-400">
                      {item.professional}
                    </p>
                    <p className="mt-1 text-xs text-amber-400">
                      {"★".repeat(item.rating)}
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm text-neutral-300">
                      {item.testimonial}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingId === item.id}
                  onClick={() => remove(item.id)}
                  className="shrink-0 border-red-500/20 text-red-400 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-300"
                >
                  {deletingId === item.id ? "Removing..." : "Remove"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

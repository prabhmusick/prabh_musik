import React from "react";
import { Metadata } from "next";
import NextLink from "next/link";
import { ArrowLeft, Music } from "lucide-react";
import { fetchBeatByIdOrSlug } from "@/lib/api/beats";
import { mapBeatDto } from "@/lib/mappers/beat.mapper";
import { CANONICAL_DOMAIN, createBreadcrumbSchema } from "@/lib/seo/schemas";
import { JsonLd } from "@/components/seo/JsonLd";
import { BeatDetailView } from "./BeatDetailView";

interface BeatPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BeatPageProps): Promise<Metadata> {
  const { id } = await params;
  const rawBeat = await fetchBeatByIdOrSlug(id);

  if (!rawBeat) {
    return {
      title: "Beat Not Found | Prabh Musik",
      description: "The beat you are looking for is unavailable or has been moved.",
      robots: { index: false, follow: true },
    };
  }

  const beat = mapBeatDto(rawBeat);
  const artistName = beat.producer || beat.artist || "Prabh Musik";
  const canonicalId = String(rawBeat.public_id || rawBeat.id || id);
  const canonicalUrl = `${CANONICAL_DOMAIN}/beat/${encodeURIComponent(canonicalId)}`;
  
  const coverUrl = beat.cover?.startsWith("http")
    ? beat.cover
    : `${CANONICAL_DOMAIN}${beat.cover || "/beats_bg.png"}`;

  const title = `${beat.title} by ${artistName} | Prabh Musik`;
  const description = `Listen to "${beat.title}" by ${artistName} on Prabh Musik. ${
    beat.genre ? `Genre: ${beat.genre}. ` : ""
  }${beat.bpm ? `Tempo: ${beat.bpm} BPM. ` : ""}Royalty-free commercial license and studio preview.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Prabh Musik",
      images: [
        {
          url: coverUrl,
          width: 1200,
          height: 630,
          alt: `${beat.title} cover artwork`,
        },
      ],
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [coverUrl],
    },
  };
}

export default async function BeatDetailPage({ params }: BeatPageProps) {
  const { id } = await params;
  const rawBeat = await fetchBeatByIdOrSlug(id);

  if (!rawBeat) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0c",
          color: "#fff",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(255, 192, 67, 0.1)",
            border: "1px solid rgba(255, 192, 67, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffc043",
            marginBottom: 20,
          }}
        >
          <Music size={28} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px" }}>
          Beat Not Found
        </h1>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            maxWidth: 420,
            fontSize: 14,
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          We couldn&apos;t find the beat you requested. It might have been removed,
          or the link might be incorrect.
        </p>
        <NextLink
          href="/beat"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#ffc043",
            color: "#0a0a0c",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          Explore Beat Catalog
        </NextLink>
      </div>
    );
  }

  const beat = mapBeatDto(rawBeat);
  const artistName = beat.producer || beat.artist || "Prabh Musik";
  const canonicalId = String(rawBeat.public_id || rawBeat.id || id);
  const canonicalUrl = `${CANONICAL_DOMAIN}/beat/${encodeURIComponent(canonicalId)}`;
  const coverUrl = beat.cover?.startsWith("http")
    ? beat.cover
    : `${CANONICAL_DOMAIN}${beat.cover || "/beats_bg.png"}`;

  const breadcrumbSchema = createBreadcrumbSchema(canonicalUrl, [
    { name: "Home", url: CANONICAL_DOMAIN },
    { name: "Beats", url: `${CANONICAL_DOMAIN}/beat` },
    { name: beat.title, url: canonicalUrl },
  ]);

  const productSchema = {
    "@type": ["MusicRecording", "Product"],
    "@id": `${canonicalUrl}#recording`,
    name: beat.title,
    byArtist: {
      "@type": "MusicGroup",
      name: artistName,
    },
    image: coverUrl,
    genre: beat.genre || "Hip-Hop",
    offers: {
      "@type": "Offer",
      price: beat.price !== null ? beat.price : 249.99,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    },
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, productSchema]} />
      <BeatDetailView beat={beat} canonicalUrl={canonicalUrl} />
    </>
  );
}

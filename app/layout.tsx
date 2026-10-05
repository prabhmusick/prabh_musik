import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "./Header";
import Footer from "./Footer";
import { Agentation } from "agentation";
import Script from "next/script";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  CANONICAL_DOMAIN,
  ORGANIZATION_SCHEMA,
  FOUNDER_SCHEMA,
  WEBSITE_SCHEMA,
} from "@/lib/seo/schemas";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_DOMAIN),
  title: {
    default: "Prabh Musik | Premium Punjabi & Hip-Hop Beats",
    template: "%s | Prabh Musik",
  },
  description:
    "Buy Punjabi & Hip-Hop Beats, Custom Beats, Mixing & Mastering, and Lyrics by Prabh Musik.",
  alternates: {
    canonical: CANONICAL_DOMAIN,
  },
  openGraph: {
    title: "Prabh Musik | Premium Punjabi & Hip-Hop Beats",
    description:
      "Buy Punjabi & Hip-Hop Beats, Custom Beats, Mixing & Mastering, and Lyrics by Prabh Musik.",
    url: CANONICAL_DOMAIN,
    siteName: "Prabh Musik",
    type: "website",
  },
};

import Providers from "./providers";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd
          data={[ORGANIZATION_SCHEMA, FOUNDER_SCHEMA, WEBSITE_SCHEMA]}
        />
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <GlobalAudioPlayer />
        </Providers>
        {process.env.NODE_ENV === "development" && <Agentation />}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

import React from "react";

interface JsonLdProps {
  data: Record<string, any> | Record<string, any>[];
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLdContent = {
    "@context": "https://schema.org",
    ...(Array.isArray(data) ? { "@graph": data } : data),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLdContent).replaceAll("<", "\\u003c"),
      }}
    />
  );
}

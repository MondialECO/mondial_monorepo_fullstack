import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { RootProviders } from "./_providers/RootProviders";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const baseUrl = "https://mondialbusiness.eu";
const title = "Mondial | Social Credit Creation Platform";
const description =
  "The first social credit creation platform connecting creators, investors, entrepreneurs, and service providers through Project Intelligence.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "startup ecosystem",
    "investment platform",
    "creator economy",
    "social credit",
    "entrepreneurship",
    "founder network",
    "investor matching",
    "fundraising platform",
  ],
  authors: [{ name: "Mondial", url: baseUrl }],
  creator: "Mondial",
  publisher: "Mondial",
  openGraph: {
    title,
    description,
    url: baseUrl,
    siteName: "Mondial",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Mondial - Social Credit Creation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${baseUrl}/twitter-image.png`],
    creator: "@Mondial",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mondial",
    description,
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mondial",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description,
    sameAs: [
      "https://twitter.com/Mondial",
      "https://linkedin.com/company/mondial",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
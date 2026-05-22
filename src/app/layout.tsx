import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RootProviders } from "./_providers/RootProviders";

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

  // Some browser extensions inject `bis_*` attributes/scripts before React hydrates.
  // That causes false-positive hydration mismatch warnings in development.
  const hydrationSanitizerScript = `
    (function () {
      try {
        var attrs = ["bis_skin_checked", "bis_use", "data-bis-config", "data-dynamic-id"];
        function cleanNode(el) {
          if (!el || !el.removeAttribute) return;
          for (var i = 0; i < attrs.length; i++) {
            el.removeAttribute(attrs[i]);
          }
          if (el.tagName === "SCRIPT") {
            var src = el.getAttribute("src") || "";
            if (src.indexOf("chrome-extension://") === 0) {
              el.remove();
            }
          }
        }
        function clean() {
          cleanNode(document.documentElement);
          cleanNode(document.body);
          var all = document.querySelectorAll("*");
          for (var i = 0; i < all.length; i++) {
            cleanNode(all[i]);
          }
        }
        clean();
        var timer = window.setInterval(clean, 200);
        window.setTimeout(function () {
          window.clearInterval(timer);
        }, 3000);
      } catch (_) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: hydrationSanitizerScript }}
        />
        <script
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body suppressHydrationWarning>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}

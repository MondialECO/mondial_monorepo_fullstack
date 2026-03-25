// import "@/styles/globals.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mondial | Social Credit Creation Platform",
  description:
    "The first social credit creation platform connecting creators, investors, entrepreneurs, and service providers through Project Intelligence.",
  keywords: [
    "startup",
    "investment",
    "creator economy",
    "social credit",
    "entrepreneurship",
  ],
  authors: [{ name: "Mondial" }],
  openGraph: {
    title: "Mondial - Social Credit Creation",
    description:
      "Connect creators, investors, and entrepreneurs through Project Intelligence",
    url: "https://mondialbusiness.eu",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  alternates: {
    canonical: "https://mondialbusiness.eu",
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

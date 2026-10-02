import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Mondial Business Creation',
  description: 'Privacy Policy, data protection (GDPR), and cookie disclosures for Mondial Business Creation.',
};

export default function PrivacyPage() {
  return (
    <div className="w-full min-h-screen bg-white dark:bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="w-full max-w-[1080px] mx-auto px-4 sm:px-8 py-16 md:py-24 space-y-8 font-sans">
        <div className="space-y-3 border-b border-[#e8ecf2] dark:border-border pb-8">
          <span className="text-xs font-semibold text-[#3c61dd] uppercase font-mono tracking-wider">
            Privacy & Trust
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#101828] dark:text-foreground font-heading">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#667085] dark:text-muted-foreground">
            GDPR & French Data Protection (CNIL) Compliant · Last updated: October 2026
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm sm:text-base leading-relaxed text-[#334155] dark:text-slate-300">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-[#101828] dark:text-white font-heading">1. Data Collection & Processing</h2>
            <p>
              We collect minimal personal information required for user authentication, project workspace persistence, and billing records. We do not sell or rent your personal information to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-[#101828] dark:text-white font-heading">2. Confidentiality of Business Projects</h2>
            <p>
              All venture models, financial spreadsheets, and documents are securely encrypted at rest and in transit. Your project drafts are private and never accessible to other platform members unless explicitly shared by you.
            </p>
          </section>

          <section id="cookies" className="space-y-2">
            <h2 className="text-xl font-bold text-[#101828] dark:text-white font-heading">3. Cookie & Local Storage Disclosures</h2>
            <p>
              We use essential session tokens and local preferences (such as theme and active project selection) to ensure reliable platform performance. Analytical cookies are anonymized.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-[#101828] dark:text-white font-heading">4. Your Rights under GDPR</h2>
            <p>
              As a European citizen or platform user, you have the right to access, rectify, export, or permanently delete your personal data and project workspaces at any time via your account settings or by contacting privacy@mondial.eco.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/**
 * Centralized Corporate & Regulatory Metadata Configuration
 * Note: Corporate registration fields remain unpopulated until verified legal entity details
 * (registered name, headquarters address, RCS/SIREN number) are officially finalized.
 */
interface CorporateMetadata {
  legalEntityName?: string;
  registeredAddress?: string;
  registrationNumber?: string;
  copyrightYear: string;
  copyrightHolder: string;
  regulatoryDisclaimer: string;
}

const CORPORATE_METADATA: CorporateMetadata = {
  // Official corporate registration fields (populated when legal incorporation is finalized)
  legalEntityName: "",
  registeredAddress: "",
  registrationNumber: "",
  copyrightYear: "2026",
  copyrightHolder: "Mondial",
  regulatoryDisclaimer:
    "Mondial does not provide legal, financial or investment advice. Nothing on this site is an offer to sell securities. Document templates are structured guides and should be finalized with professional counsel.",
};

const ECOSYSTEM_COLUMNS: FooterColumn[] = [
  {
    title: "Creators",
    links: [
      { label: "The 6 phases", href: "/for-creators#phases" },
      { label: "AI business plan", href: "/for-creators#ai-business-plan" },
      { label: "Financial forecast", href: "/for-creators#financial-forecast" },
      { label: "Landing page & GTM", href: "/for-creators#landing-page-gtm" },
      { label: "Idea licensing", href: "/for-creators#idea-licensing" },
    ],
  },
  {
    title: "Entrepreneurs",
    links: [
      { label: "Company verification", href: "/for-entrepreneurs#verification" },
      { label: "Cap table & equity", href: "/for-entrepreneurs#cap-table" },
      { label: "Readiness score", href: "/for-entrepreneurs#readiness" },
      { label: "Deal pipeline", href: "/for-entrepreneurs#pipeline" },
      { label: "Level Up", href: "/for-entrepreneurs#level-up" },
    ],
  },
  {
    title: "Providers",
    links: [
      { label: "Apply as a provider", href: "/signup?role=ServiceProvider" },
      { label: "Verification tiers", href: "/for-service-providers#verification" },
      { label: "How briefs work", href: "/for-service-providers#briefs" },
      { label: "Getting paid", href: "/for-service-providers#payments" },
      { label: "Provider archetypes", href: "/for-service-providers#archetypes" },
    ],
  },
  {
    title: "Investors",
    links: [
      { label: "Request access", href: "/signup?role=Investor" },
      { label: "How diligence works", href: "/for-investors#diligence" },
      { label: "NDA & data rooms", href: "/for-investors#data-rooms" },
      { label: "The pipeline", href: "/for-investors#pipeline" },
      { label: "Curated introductions", href: "/for-investors#introductions" },
    ],
  },
];

const COMPANY_COLUMNS: FooterColumn[] = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Security & IP", href: "/security" },
      { label: "Glossary", href: "/glossary" },
      { label: "FAQ", href: "/#faq" },
      { label: "The Mondial Brief", href: "/brief" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "GDPR & data requests", href: "/gdpr" },
    ],
  },
];

export default function Footer() {
  const corporateDetailsText = [
    CORPORATE_METADATA.legalEntityName,
    CORPORATE_METADATA.registeredAddress,
    CORPORATE_METADATA.registrationNumber,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <footer
      className="w-full bg-[#F9F9FA] text-[#070707] font-sans border-t border-[rgba(0,0,0,0.06)]"
      data-testid="public-footer"
    >
      <div className="max-w-[1224px] mx-auto px-6 lg:px-0 pt-16 md:pt-20 pb-12 flex flex-col gap-12">
        {/* ================= ZONE 1: ECOSYSTEM ROLES & BRAND CTA ================= */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-0">
          {/* Brand & CTA */}
          <div className="w-full lg:w-[320px] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-85 transition-opacity"
                aria-label="Mondial.eco Home"
              >
                <div className="relative w-[22px] h-[22px] shrink-0">
                  <Image
                    src="/brand-logo-footer.png"
                    alt="Mondial Logo"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </div>
                <span className="font-heading font-bold text-[22px] leading-[27px] tracking-tight text-[#070707]">
                  Mondial.eco
                </span>
              </Link>
              <p className="text-[13px] leading-[20px] text-[#5E5E5E] max-w-[280px]">
                The structured path from raw idea to funded company.
              </p>
            </div>

            <div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[16px] leading-[24px] rounded-[8px] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3C61DD]/40"
              >
                Apply for access
              </Link>
            </div>
          </div>

          {/* 4 Ecosystem Role Columns */}
          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
            {ECOSYSTEM_COLUMNS.map((col) => (
              <div key={col.title} className="w-full sm:w-[150px] lg:w-[160px] flex flex-col gap-3 sm:gap-4">
                <span className="text-[11px] leading-[16px] font-medium text-[#5E5E5E] tracking-wider uppercase">
                  {col.title}
                </span>
                <ul className="flex flex-col gap-2.5 sm:gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[13px] leading-[20px] text-[#3E3E3E] hover:text-[#3C61DD] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider 1 */}
        <hr className="w-full border-t border-[rgba(0,0,0,0.08)] m-0" />

        {/* ================= ZONE 2: COMPANY, RESOURCES, LEGAL ================= */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-0">
          {/* Middle Left Description */}
          <div className="w-full lg:w-[320px]">
            <p className="text-[12px] leading-[16px] text-[#5E5E5E] max-w-[320px]">
              Building the infrastructure for cross-border startup ecosystems in Europe and beyond.
              Vetted, legal, and fast.
            </p>
          </div>

          {/* 3 Secondary Navigation Columns */}
          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {COMPANY_COLUMNS.map((col) => (
              <div key={col.title} className="w-full sm:w-[150px] lg:w-[160px] flex flex-col gap-3 sm:gap-4">
                <span className="text-[11px] leading-[16px] font-medium text-[#5E5E5E] tracking-wider uppercase">
                  {col.title}
                </span>
                <ul className="flex flex-col gap-2.5 sm:gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[13px] leading-[20px] text-[#3E3E3E] hover:text-[#3C61DD] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider 2 */}
        <hr className="w-full border-t border-[rgba(0,0,0,0.08)] m-0" />

        {/* ================= ZONE 3: CORPORATE META & LEGAL DISCLAIMER ================= */}
        <div className="w-full flex flex-col gap-5 text-[#5E5E5E]">
          {/* Corporate Meta & Copyright Row */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 text-[12px] leading-[16px]">
            {corporateDetailsText ? (
              <p className="text-[#5E5E5E]">{corporateDetailsText}</p>
            ) : null}
            <p className="text-[#5E5E5E] shrink-0 sm:ml-auto">
              © {CORPORATE_METADATA.copyrightYear} {CORPORATE_METADATA.copyrightHolder}. All rights reserved.
            </p>
          </div>

          {/* Legal Disclaimer */}
          <p className="text-[11px] leading-[16px] text-[#606060]">
            {CORPORATE_METADATA.regulatoryDisclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
}

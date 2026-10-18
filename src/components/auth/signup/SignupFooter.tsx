'use client';

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Bottom bar: copyright left, legal links right.
 */
export function SignupFooter({ className }: { className?: string }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const links = [
    { href: "/legal/terms", label: t('auth.footer.terms', 'Terms of Service') },
    { href: "/legal/privacy", label: t('auth.footer.privacy', 'Privacy Policy') },
    { href: "/legal/accessibility", label: t('auth.footer.accessibility', 'Accessibility') },
  ];

  return (
    <footer
      className={cn(
        "flex flex-col items-center gap-3 border-t border-border pt-6 pb-8 text-sm text-muted-foreground",
        "sm:flex-row sm:justify-between",
        className,
      )}
    >
      <p>{t('auth.footer.copyright', '© {{year}} Mondial. All rights reserved.', { year })}</p>
      <nav aria-label={t('auth.footer.legalAria', 'Legal')}>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}

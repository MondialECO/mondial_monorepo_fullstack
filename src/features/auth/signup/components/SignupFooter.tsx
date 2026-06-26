import Link from "next/link";
import { cn } from "@/lib/utils";

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/accessibility", label: "Accessibility" },
];

interface SignupFooterProps {
  className?: string;
}

/**
 * Bottom bar — Figma frame 20556:22400 ("bottom footer", 1440×84).
 * Copyright left, legal links right.
 */
export function SignupFooter({ className }: SignupFooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={cn(
        "flex flex-col items-center gap-3 border-t border-border py-6 text-sm text-muted-foreground",
        "sm:flex-row sm:justify-between",
        className,
      )}
    >
      <p>©{year} Mondial Eco System. All right reserved</p>
      <nav aria-label="Legal">
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-1">
          {LEGAL_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="transition-colors hover:text-foreground"
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

import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/accessibility", label: "Accessibility" },
];

/**
 * Bottom bar: copyright left, legal links right. Server component.
 */
export function SignupFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={cn(
        "flex flex-col items-center gap-3 border-t border-border pt-6 pb-8 text-sm text-muted-foreground",
        "sm:flex-row sm:justify-between",
        className,
      )}
    >
      <p>© {year} Mondial. All rights reserved.</p>
      <nav aria-label="Legal">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {LINKS.map((link) => (
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

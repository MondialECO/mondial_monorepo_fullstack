import Link from "next/link";
import { cn } from "@/lib/utils";

interface SignupHeaderProps {
  href?: string;
  className?: string;
}

/**
 * Top-of-page wordmark. "mondial." in foreground, "ceo" in brand-accent green.
 * Matches Figma frame 3655 (mondial.ceo at x=40, y=40).
 */
export function SignupHeader({ href = "/", className }: SignupHeaderProps) {
  return (
    <header className={cn("flex w-full items-center px-10 py-10", className)}>
      <Link
        href={href}
        aria-label="mondial.ceo home"
        className="inline-flex items-baseline text-2xl font-medium tracking-tight text-foreground transition-opacity hover:opacity-90"
      >
        <span>mondial.</span>
        <span className="text-brand-accent">ceo</span>
      </Link>
    </header>
  );
}

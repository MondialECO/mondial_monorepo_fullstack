import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Two-tone brand wordmark: "mondial" in foreground, ".ceo" in primary.
 * Renders as a link to root by default. Server component.
 */
export function Wordmark({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-baseline text-xl font-semibold tracking-tight",
        "text-foreground hover:opacity-90 transition-opacity",
        className,
      )}
      aria-label="mondial.ceo home"
    >
      <span>mondial</span>
      <span className="text-primary">.ceo</span>
    </Link>
  );
}

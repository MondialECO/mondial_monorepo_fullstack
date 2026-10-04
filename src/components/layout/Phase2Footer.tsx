import Link from "next/link";

export default function Phase2Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background shrink-0" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
        <p>© {year} Mondial Eco System. All rights reserved.</p>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/support" className="hover:text-foreground transition-colors">
            Support Center
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}

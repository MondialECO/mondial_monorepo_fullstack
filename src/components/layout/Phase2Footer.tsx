export default function Phase2Footer() {
  return (
    <footer className="border-t px-4 sm:px-6 py-2.5 sm:py-3 bg-background" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
        <p>© 2026 Mondial Eco System. All rights reserved.</p>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Support Center
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}

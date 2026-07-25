export default function Phase2Footer() {
  return (
    <footer className="border-t border-border bg-background px-8 py-8 sm:px-10 sm:py-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>@2025 Mondial Eco System. All right reserved</p>
        <div className="flex items-center gap-6 sm:gap-8">
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

'use client';

/** Shared shell for every step: header, body, and a bordered footer action row. */
export function OrderStepCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {children}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
        {footer}
      </div>
    </div>
  );
}

/** Uppercase section label, matching the UI-R1 filter sidebar headings. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">
      {children}
    </p>
  );
}

interface Phase3SetupShellProps {
  children: React.ReactNode;
  description: string;
  stepEyebrow: string;
  title: string;
}

export function Phase3SetupShell({
  children,
  description,
  stepEyebrow,
  title,
}: Phase3SetupShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 text-foreground">
      <main className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col px-5 py-12 sm:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{stepEyebrow}</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
        </div>

        <div className="mt-12 space-y-8">{children}</div>
      </main>
    </div>
  );
}

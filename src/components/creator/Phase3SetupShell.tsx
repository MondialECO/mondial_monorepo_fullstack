import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Phase3SetupShellProps {
  children: React.ReactNode;
  description: string;
  progress: number;
  stepEyebrow: string;
  stepLabel: string;
  title: string;
}

export function Phase3SetupShell({
  children,
  description,
  progress,
  stepEyebrow,
  stepLabel,
  title,
}: Phase3SetupShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 text-foreground">
      <div className="shrink-0 border-b border-border bg-card/70">
        <div className="flex h-16 items-center justify-between px-5 sm:px-10">
          <Button asChild variant="ghost" className="rounded-xl px-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <Link href="/dashboard/creator" aria-label="Back to creator dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Idea
            </Link>
          </Button>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            {stepLabel}
          </div>
        </div>
        <div className="h-[3px] w-full bg-border/70">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>

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

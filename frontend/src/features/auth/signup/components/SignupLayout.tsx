import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SignupHeader } from "./SignupHeader";
import { SignupFooter } from "./SignupFooter";

interface SignupLayoutProps {
  children: ReactNode;
  /** Max width of the centered hero column. Defaults to 2xl (~672px). */
  width?: "2xl" | "3xl" | "5xl";
  className?: string;
}

const WIDTH_MAP: Record<NonNullable<SignupLayoutProps["width"]>, string> = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
};

/**
 * Page chrome for /signup/* routes — Figma frame 3654 / 3600.
 * Header (wordmark) + main (centered hero column) + footer.
 * Each step controls its own column width via the `width` prop, so the
 * verification two-column card can take 5xl while role-selection stays at 2xl.
 */
export function SignupLayout({
  children,
  width = "2xl",
  className,
}: SignupLayoutProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", className)}>
      <SignupHeader />

      <main className="flex flex-1 flex-col items-center px-6">
        <section
          className={cn(
            "flex w-full flex-1 flex-col items-center justify-center gap-10 py-8",
            WIDTH_MAP[width],
          )}
        >
          {children}
        </section>
      </main>

      <div className="mx-auto w-full max-w-7xl px-6">
        <SignupFooter />
      </div>
    </div>
  );
}

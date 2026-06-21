import { ReactNode } from "react";

interface CTASectionProps {
  children: ReactNode;
  orientation?: "vertical" | "horizontal";
}

export function CTASection({
  children,
  orientation = "vertical"
}: CTASectionProps) {
  return (
    <div className={`flex gap-3 ${
      orientation === "vertical"
        ? "flex-col"
        : "flex-col sm:flex-row"
    }`}>
      {children}
    </div>
  );
}

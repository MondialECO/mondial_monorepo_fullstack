import * as React from "react";
import { cn } from "@/lib/utils";

export type PageContainerVariant = "focused" | "standard" | "wide" | "workspace";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PageContainerVariant;
  children: React.ReactNode;
  as?: React.ElementType;
}

const variantStyles: Record<PageContainerVariant, string> = {
  // Type A: Constrained reading width for questionnaires, legal setup, and focused documents (~768px - 896px)
  focused: "w-full max-w-4xl mx-auto",
  // Type B: Standard fluid dashboard overview container for KPI cards, portfolios, grids (max-w-7xl)
  standard: "w-full max-w-7xl mx-auto",
  // Type C: Wide container for data-intensive 36-month projections, analytical matrices, statements (~1680px)
  wide: "w-full max-w-[1680px] mx-auto",
  // Type D: Full-bleed unconstrained workspace for multi-pane interactive canvases (Brand Studio, Compliance 3-pane)
  workspace: "w-full min-w-0",
};

export function PageContainer({
  variant = "standard",
  className,
  children,
  as: Component = "div",
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn(variantStyles[variant], className)}
      data-layout-variant={variant}
      {...props}
    >
      {children}
    </Component>
  );
}

export default PageContainer;

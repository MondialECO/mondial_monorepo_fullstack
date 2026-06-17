"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Native-checkbox-based primitive styled with theme tokens.
// Accessible by default; theming via peer-checked / peer-focus utilities.
// No Radix dependency.

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, containerClassName, ...props }, ref) => {
    return (
      <span className={cn("relative inline-flex h-4 w-4 shrink-0", containerClassName)}>
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded border border-input bg-background",
            "checked:bg-primary checked:border-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <Check
          className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
          aria-hidden
        />
      </span>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

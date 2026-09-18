import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-page-heading",
        "text-section-title",
        "text-card-title",
        "text-body",
        "text-label",
        "text-input",
        "text-button",
        "text-caption",
        "text-table-header",
        "text-footnote",
        "text-badge",
        "text-stat-lg",
        "text-stat-xl",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}

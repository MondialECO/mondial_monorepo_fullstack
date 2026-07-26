'use client';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// CSV helpers (same pattern as ProfileWorkspace) for string-list fields.
export const csv = (list: string[]) => list.join(', ');
export const parseCsv = (value: string) =>
  Array.from(new Set(value.split(',').map((v) => v.trim()).filter(Boolean)));

// A native <select> styled with the design-system tokens. Used for enum fields;
// the hard-rule primitives list covers button/input/a — a styled native select is
// acceptable and keeps the (large) catalog forms simple and dark-mode safe.
export function EnumSelect({
  value,
  onChange,
  options,
  labelFor,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  labelFor?: string;
  className?: string;
}) {
  return (
    <select
      id={labelFor}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// CSV helpers for string-list fields.
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
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  labelFor?: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <select
      id={labelFor}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]',
        className
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {formatOption(o)}
        </option>
      ))}
    </select>
  );
}

function formatOption(value: string) {
  if (value === 'AfterEscrowFunding') return 'After escrow funding (STUB-backed)';
  if (value === 'File') return 'File (security scanner STUB-backed)';
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
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
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-[#374151]">{label}</Label>
      {children}
    </div>
  );
}

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards against Tailwind utilities that reference a CSS variable with no `--color-*`
 * mapping in globals.css's `@theme inline` block.
 *
 * Tailwind v4 generates a utility only when the mapping exists. Reference one that does
 * not and you get no error, no warning, and no CSS — the class silently does nothing. That
 * is how `bg-success-bg`, `border-success-border` and a bare `text-success` survived across
 * four files: an onboarding banner with no background, completion ticks with no colour, and
 * a "Claim Badge" button rendering white-on-white.
 *
 * Scanning source text rather than rendering, deliberately. Most of these sit behind props
 * or local state — a completed verification, an investor-ready badge — so per-component
 * render tests would cover a fraction of them and miss exactly the unreachable cases that
 * hid the original bug.
 */

const SRC = resolve(process.cwd(), 'src');

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Test files legitimately name these tokens when asserting on them.
      if (entry.name !== '__tests__') sourceFiles(full, acc);
    } else if (/\.(tsx?|css)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/** Every `--color-<name>` actually mapped in @theme inline. */
function mappedColorTokens(): Set<string> {
  const css = readFileSync(join(SRC, 'app', 'globals.css'), 'utf8');
  return new Set([...css.matchAll(/--color-([\w-]+)\s*:/g)].map((m) => m[1]));
}

/**
 * Utility prefixes that resolve against `--color-*`. Not exhaustive across all of
 * Tailwind, but covers everything this codebase uses.
 */
const PREFIXES =
  'bg|text|border|ring|fill|stroke|from|to|via|divide|outline|shadow|accent|caret|decoration|placeholder';

describe('theme tokens', () => {
  const mapped = mappedColorTokens();

  it('maps the tokens this codebase relies on', () => {
    // Sanity check on the parser itself — if this regressed to an empty set the
    // scan below would pass vacuously.
    for (const token of ['primary', 'success-light', 'success-text', 'warning', 'rating'])
      expect(mapped, `--color-${token} should be mapped`).toContain(token);
  });

  it('references no success utility without a --color-* mapping', () => {
    const pattern = new RegExp(`\\b(?:${PREFIXES})-(success[\\w-]*)(?:/\\d+)?\\b`, 'g');
    const offenders: string[] = [];

    for (const file of sourceFiles(SRC)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(pattern)) {
        const token = match[1];
        if (!mapped.has(token)) offenders.push(`${relative(SRC, file)} → ${match[0]}`);
      }
    }

    // Named explicitly rather than just counting, so a failure says which file and which
    // class rather than only that the number moved.
    expect(offenders).toEqual([]);
  });
});

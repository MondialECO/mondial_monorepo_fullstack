import { describe, expect, it } from 'vitest';
import en from '@/locales/en/creator.json';
import fr from '@/locales/fr/creator.json';
import {
  availabilityText,
  experienceText,
  levelText,
  progressText,
  regionText,
  situationText,
  skillText,
} from '@/lib/humainx-quick-start';

// Minimal stand-in for LanguageProvider's t(): dotted lookup in the creator bundle, else fallback.
const makeT = (bundle: unknown) => (key: string, fallback?: string) => {
  const value = key
    .replace(/^creator\./, '')
    .split('.')
    .reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), bundle);
  return typeof value === 'string' ? value : fallback ?? key;
};
const tFr = makeT(fr);
const tEn = makeT(en);

describe('HumainX display translation', () => {
  it('translates stored canonical values and UI labels alike', () => {
    expect(situationText(tFr, 'Self-employed / Freelance')).toBe('Indépendant ou freelance');
    expect(situationText(tFr, 'Self-employed or freelance')).toBe('Indépendant ou freelance');
    expect(availabilityText(tFr, 'Less than 5 hours/week')).toBe(fr.humainx.quickStart.availability['under-5']);
    expect(experienceText(tFr, 'I currently run another activity')).toBe('Je gère une activité en ce moment');
  });

  it('resolves progress from either stored preference field', () => {
    expect(progressText(tFr, 'Focus on core strengths only', 'I prefer to delegate when possible')).toBe('Je préfère le confier');
    expect(progressText(tFr, "I'd rather learn it")).toBe("Je préfère l'apprendre");
  });

  it('keeps English output identical to the code labels', () => {
    expect(progressText(tEn, 'I want to learn them myself')).toBe("I'd rather learn it");
    expect(experienceText(tEn, 'No, this is my first project')).toBe('This is my first time');
  });

  it('passes through values it does not know', () => {
    expect(skillText(tFr, 'Blockchain auditing')).toBe('Blockchain auditing');
    expect(skillText(tFr, 'web design')).toBe('Conception web');
    expect(levelText(tFr, 'Comfortable')).toBe("À l'aise");
    expect(regionText(tFr, 'Bretagne')).toBe('Bretagne');
    expect(regionText(tFr, 'International / Other')).toBe('International / Autre');
    expect(situationText(tFr, '')).toBe('');
  });
});

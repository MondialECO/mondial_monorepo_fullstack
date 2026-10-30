import { describe, it, expect } from 'vitest';
import { editableText } from '@/lib/clarifier-answers';
import type { ClarifierAnswer } from '@/types/creator/journey-api';

const OPENER = "Dorm students can't find cheap healthy food, I want to make a meal-sharing app.";

const answer = (questionIndex: number, aiExtracted: Record<string, string>, userEdited: Record<string, string> | null = null): ClarifierAnswer => ({
  questionIndex, status: 'accepted_weak', attempts: 0, rawAnswer: OPENER, aiExtracted, userEdited, language: 'en', updatedAt: '',
});

describe('editableText (Fix it / weak-topic pencil pre-fill)', () => {
  it('uses the topic field, not the whole multi-topic opener', () => {
    expect(editableText(answer(2, { targetUser: 'Dorm students.' }))).toBe('Dorm students.');
  });

  it('joins both parts of a two-field topic, user edit winning per key', () => {
    expect(editableText(answer(6, { whyNow: 'Prices rose.', riskiestAssumption: 'Trust.' }, { riskiestAssumption: 'Hygiene trust.' })))
      .toBe('Prices rose.\nHygiene trust.');
  });

  it('falls back to the raw answer only when no field exists', () => {
    expect(editableText(answer(4, {}))).toBe(OPENER);
    expect(editableText({ ...answer(6, {}), rawAnswer: 'both parts' })).toBe('both parts');
  });
});

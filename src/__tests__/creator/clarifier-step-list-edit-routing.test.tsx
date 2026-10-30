import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClarifierStepList } from '@/components/creator/clarifier/ClarifierStepList';
import type { ClarifierAnswer } from '@/types/creator/journey-api';

const answer = (questionIndex: number, status: ClarifierAnswer['status']): ClarifierAnswer => ({
  questionIndex, status, attempts: 1, rawAnswer: 'raw', aiExtracted: {}, userEdited: null, language: 'en', updatedAt: '',
});

const labels = ['Problem', 'Who has it', 'What they use now', 'Your solution', 'Your edge', 'Why now + biggest risk'];

function renderList(answers: ClarifierAnswer[]) {
  const onRewriteWeak = vi.fn();
  const onSaveFields = vi.fn();
  render(
    <ClarifierStepList answers={answers} currentTopic={null} topicLabels={labels} disabled={false}
      onSaveFields={onSaveFields} onRewriteWeak={onRewriteWeak} />,
  );
  return { onRewriteWeak, onSaveFields };
}

describe('ClarifierStepList edit routing', () => {
  it('weak topic pencil opens the AI-verified rewrite, never the field-only edit', () => {
    const { onRewriteWeak } = renderList([answer(6, 'accepted_weak')]);

    fireEvent.click(screen.getByRole('button', { name: /Why now \+ biggest risk/ }));

    expect(onRewriteWeak).toHaveBeenCalledWith(6);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('clear topic pencil keeps the field-only edit (two-field topic shows both fields)', () => {
    const { onRewriteWeak } = renderList([answer(5, 'accepted')]);

    fireEvent.click(screen.getByRole('button', { name: /Your edge/ }));

    expect(onRewriteWeak).not.toHaveBeenCalled();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });
});

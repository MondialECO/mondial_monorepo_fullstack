import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FollowUpCard } from '@/components/creator/clarifier/FollowUpCard';
import { splitAiReply } from '@/lib/clarifier-answers';
import type { ClarifierChatMessage } from '@/types/creator/journey-api';

const followUp = (text: string, chips: string[] | null = null): ClarifierChatMessage => ({
  id: 'f1', sender: 'ai', kind: 'followup', questionIndex: 2, text, chips,
});

describe('splitAiReply (ClarifierScript.Join counterpart)', () => {
  it('splits the acknowledgement from the question at the blank line', () => {
    expect(splitAiReply("'Students' is a big group.\n\nWhich students feel this most?")).toEqual({
      ack: "'Students' is a big group.", question: 'Which students feel this most?',
    });
  });

  it('treats a single paragraph as the question', () => {
    expect(splitAiReply('Which students feel this most?')).toEqual({ ack: null, question: 'Which students feel this most?' });
  });

  it('takes the question after the LAST blank line (backend LastQuestionText rule)', () => {
    expect(splitAiReply('Nice.\n\nMore context.\n\nWho exactly?')).toEqual({ ack: 'Nice.\n\nMore context.', question: 'Who exactly?' });
  });
});

describe('FollowUpCard', () => {
  it('renders the acknowledgement and the question separately', () => {
    render(<FollowUpCard message={followUp('Big group.\n\nWhich students?')} active={false} onChip={() => {}} onSkip={() => {}} />);
    expect(screen.getByText('Big group.')).toBeInTheDocument();
    expect(screen.getByText('Which students?')).toHaveClass('font-medium');
  });

  it('renders a single paragraph as the question', () => {
    render(<FollowUpCard message={followUp('Which students?')} active={false} onChip={() => {}} onSkip={() => {}} />);
    expect(screen.getByText('Which students?')).toHaveClass('font-medium');
  });

  it('shows the label, chips and Skip only while active; a chip only reports its value', () => {
    const onChip = vi.fn();
    const { rerender } = render(
      <FollowUpCard message={followUp('Q?', ['dorm students', 'nurses'])} active onChip={onChip} onSkip={() => {}} />,
    );
    expect(screen.getByText('Pick one or write your own')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip — keep my answer' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'dorm students' }));
    expect(onChip).toHaveBeenCalledWith('dorm students');

    rerender(<FollowUpCard message={followUp('Q?', ['dorm students', 'nurses'])} active={false} onChip={onChip} onSkip={() => {}} />);
    expect(screen.queryByText('Pick one or write your own')).toBeNull();
    expect(screen.queryByRole('button', { name: 'dorm students' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Skip — keep my answer' })).toBeNull();
  });

  it('has no label and no chip area when the AI returned no chips (Skip stays)', () => {
    render(<FollowUpCard message={followUp('Q?', [])} active onChip={() => {}} onSkip={() => {}} />);
    expect(screen.queryByText('Pick one or write your own')).toBeNull();
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.getByRole('button', { name: 'Skip — keep my answer' })).toBeInTheDocument();
  });
});

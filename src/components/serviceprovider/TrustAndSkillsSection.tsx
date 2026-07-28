'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SpCard,
  SpEmptyState,
  SpMutationFeedback,
  SpSectionHeader,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import {
  useServiceProviderTrust,
  useSkillsTestStatus,
  useStartSkillsTest,
  useSubmitSkillsTest,
} from '@/hooks/queries/service-provider';
import type {
  ServiceProviderProfile,
  SkillsTestCategoryStatus,
  SkillsTestQuestions,
  SkillsTestResult,
} from '@/types/service-provider';

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : '';

const formatCategory = (value: string) =>
  value.replace(/([a-z])([A-Z])/g, '$1 $2');

export function TrustAndSkillsSection({
  profile,
}: {
  profile: ServiceProviderProfile;
}) {
  if (profile.verificationStatus !== 'Verified') {
    return (
      <SpEmptyState
        icon={ShieldCheck}
        title="Verify your completed profile first"
        description="Trust signals and optional skills tests become available after profile verification. Rejected profiles return to moderation review when resubmitted."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/serviceprovider/profile?view=edit">
              Review profile requirements
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <TrustCard />
      <SkillsTestCard />
    </div>
  );
}

function TrustCard() {
  const { data: trust, isLoading, isError, refetch } =
    useServiceProviderTrust();

  return (
    <SpCard aria-labelledby="trust-score-heading">
      <SpSectionHeader
        title="Trust & reputation"
        description="Your score is calculated from verified marketplace signals as they become available."
      />

      <div className="mt-6 space-y-5">
        {isLoading ? (
          <div className="space-y-3" aria-label="Loading trust score">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        ) : isError || !trust ? (
          <SpMutationFeedback status="error">
            <div className="flex flex-wrap items-center gap-3">
              <span>Your trust score could not be loaded.</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
              >
                Try again
              </button>
            </div>
          </SpMutationFeedback>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <SpStatusBadge tone="positive">
                <ShieldCheck className="mr-1.5 size-3.5" aria-hidden="true" />
                Verified
              </SpStatusBadge>
              <SpStatusBadge>Tier {trust.tierLevel}</SpStatusBadge>
            </div>

            {trust.hasEnoughData ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                <p id="trust-score-heading" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                  Trust score
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-[#171717] tabular-nums">
                  {trust.trustScore.toFixed(1)}
                  <span className="ml-1 text-base font-medium text-[#6B7280]">/100</span>
                </p>
                <Progress
                  value={trust.trustScore}
                  aria-label={`Trust score ${trust.trustScore.toFixed(1)} out of 100`}
                  className="mt-4"
                />
              </div>
            ) : (
              <SpMutationFeedback status="info">
                <div>
                  <p className="font-semibold">Building your trust score</p>
                  <p className="mt-1 text-sm leading-6">
                    There is not enough verified activity to calculate a score yet. No placeholder score is shown.
                  </p>
                </div>
              </SpMutationFeedback>
            )}

            <div>
              <h3 className="text-sm font-semibold text-[#171717]">
                Score signals
              </h3>
              <ul className="mt-3 divide-y divide-[#E5E7EB]" aria-label="Trust score signals">
                {trust.signals.map((signal) => (
                  <li
                    key={signal.key}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="min-w-0 text-[#374151]">
                      {signal.label}
                      <span className="ml-2 text-xs text-[#6B7280]">
                        {signal.weight}% weight
                      </span>
                    </span>
                    {signal.hasData ? (
                      <span className="shrink-0 font-semibold text-[#171717] tabular-nums">
                        {signal.value.toFixed(0)}/100
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-[#6B7280]">
                        Not tracked yet
                      </span>
                    )}
                  </li>
                ))}
                {trust.hasDisputes && (
                  <li className="flex items-center justify-between gap-4 py-3 text-sm text-[#B42318]">
                    <span>Adverse-dispute penalty</span>
                    <span className="font-semibold tabular-nums">
                      &minus;{trust.disputePenalty.toFixed(0)}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </SpCard>
  );
}

function describeCategory(category: SkillsTestCategoryStatus): string {
  if (!category.hasAttempt) return 'Not taken yet';
  const summary = `${category.lastPassed ? 'Passed' : 'Did not pass'} · ${category.lastScore ?? 0}%`;
  if (!category.canTakeNow && category.nextEligibleRetestAt) {
    return `${summary} · Retake after ${formatDate(category.nextEligibleRetestAt)}`;
  }
  return summary;
}

function SkillsTestCard() {
  const { data: status, isLoading, isError, refetch } = useSkillsTestStatus();
  const start = useStartSkillsTest();
  const submit = useSubmitSkillsTest();

  const [active, setActive] = useState<{
    category: string;
    questions: SkillsTestQuestions;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SkillsTestResult | null>(null);

  const beginTest = async (category: string) => {
    setResult(null);
    setAnswers({});
    try {
      const questions = await start.mutateAsync(category);
      setActive({ category, questions });
    } catch {
      setActive(null);
    }
  };

  const allAnswered =
    !!active &&
    active.questions.questions.every(
      (question) => answers[question.id] !== undefined,
    );

  const submitTest = async () => {
    if (!active) return;
    try {
      const response = await submit.mutateAsync({
        category: active.category,
        answers: active.questions.questions.map((question) => ({
          questionId: question.id,
          selectedIndex: answers[question.id],
        })),
      });
      setResult(response);
      setActive(null);
      setAnswers({});
    } catch {
      // The mutation error remains visible below while the provider keeps their answers.
    }
  };

  return (
    <SpCard aria-labelledby="skills-test-heading">
      <SpSectionHeader
        title="Skills tests"
        description="Optional category tests add a verified skills signal. They never block your profile or marketplace access."
        action={<SpStatusBadge>Optional</SpStatusBadge>}
      />

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3" aria-label="Loading skills tests">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <SpMutationFeedback status="error">
            <div className="flex flex-wrap items-center gap-3">
              <span>Your available skills tests could not be loaded.</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
              >
                Try again
              </button>
            </div>
          </SpMutationFeedback>
        ) : active ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
              <div>
                <p id="skills-test-heading" className="font-semibold text-[#171717]">
                  {formatCategory(active.category)} test
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Answer every question before submitting.
                </p>
              </div>
              <SpStatusBadge tone="info">
                {active.questions.passThresholdPercent}% to pass
              </SpStatusBadge>
            </div>

            {active.questions.questions.map((question, questionIndex) => (
              <fieldset key={question.id} className="space-y-3">
                <legend className="text-sm font-semibold leading-6 text-[#171717]">
                  {questionIndex + 1}. {question.prompt}
                </legend>
                <div className="grid gap-2">
                  {question.options.map((option, optionIndex) => {
                    const checked = answers[question.id] === optionIndex;
                    return (
                      <label
                        key={`${question.id}-${optionIndex}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-[#3C61DD] focus-within:ring-offset-2 ${
                          checked
                            ? 'border-[#3C61DD] bg-[#EEF2FF] text-[#171717]'
                            : 'border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={optionIndex}
                          checked={checked}
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: optionIndex,
                            }))
                          }
                          className="mt-0.5 size-4 accent-[#3C61DD]"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            {submit.isError && (
              <SpMutationFeedback status="error">
                Your answers could not be submitted. Your selections are still here; try again.
              </SpMutationFeedback>
            )}

            <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-4">
              <Button
                type="button"
                onClick={submitTest}
                disabled={!allAnswered || submit.isPending}
              >
                {submit.isPending ? 'Submitting…' : 'Submit answers'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActive(null);
                  setAnswers({});
                  submit.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {result && (
              <SpMutationFeedback status={result.passed ? 'success' : 'info'}>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 font-semibold">
                    {result.passed ? (
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                    ) : (
                      <Clock className="size-4" aria-hidden="true" />
                    )}
                    {result.passed ? 'Skills test passed' : 'Not a pass this time'}
                  </p>
                  <p>
                    Score {result.score}% ({result.correctCount}/{result.totalCount}). Retake available after {formatDate(result.nextEligibleRetestAt)}.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setResult(null)}>
                    Dismiss
                  </Button>
                </div>
              </SpMutationFeedback>
            )}

            {start.isError && (
              <SpMutationFeedback status="error">
                The selected test could not be started. Try again.
              </SpMutationFeedback>
            )}

            {!status || status.categories.length === 0 ? (
              <SpEmptyState
                icon={GraduationCap}
                title="No category tests available"
                description="Add at least one service category to your profile to see its available skills test."
                className="min-h-56 border-0 bg-[#F9FAFB] p-4"
              />
            ) : (
              <ul className="divide-y divide-[#E5E7EB]" aria-label="Available skills tests">
                {status.categories.map((category) => (
                  <li
                    key={category.category}
                    className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#171717]">
                        {category.lastPassed && (
                          <Award className="size-4 text-[#157A55]" aria-hidden="true" />
                        )}
                        {formatCategory(category.category)}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                        {describeCategory(category)}
                      </p>
                    </div>
                    {category.canTakeNow ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => beginTest(category.category)}
                        disabled={start.isPending}
                      >
                        {start.isPending ? 'Loading…' : category.hasAttempt ? 'Retake test' : 'Take test'}
                      </Button>
                    ) : category.hasAttempt ? (
                      <SpStatusBadge tone={category.lastPassed ? 'positive' : 'neutral'}>
                        {category.lastPassed ? 'Passed' : 'Retake unavailable'}
                      </SpStatusBadge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </SpCard>
  );
}

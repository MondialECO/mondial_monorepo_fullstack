'use client';

import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : '';

// The whole trust/reputation + skills-test layer is post-approval and entirely
// non-blocking. It renders nothing until the provider is Verified.
export function TrustAndSkillsSection({
  profile,
}: {
  profile: ServiceProviderProfile;
}) {
  if (profile.verificationStatus !== 'Verified') return null;
  return (
    <>
      <TrustCard />
      <SkillsTestCard />
    </>
  );
}

function TrustCard() {
  const { data: trust, isLoading, isError } = useServiceProviderTrust();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldCheck className="h-5 w-5 text-success-text" />
          Trust &amp; reputation
        </CardTitle>
        <CardDescription>
          Your trust score is derived from how you work with founders. It builds
          up over time as real signals come in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {trust && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">
              <ShieldCheck className="h-3 w-3" />
              Verified provider
            </Badge>
            {/* Ranking-only tier. Distinct from the trust score below; affects match
                ordering, not pricing or payouts. */}
            <Badge
              variant="secondary"
              title="Platform ranking tier — affects how you're ordered in matches. Not a pricing or payout signal."
            >
              <TrendingUp className="h-3 w-3" />
              Tier {trust.tierLevel} · Ranking
            </Badge>
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : isError || !trust ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load your trust score right now. Try again in a moment.
          </p>
        ) : !trust.hasEnoughData ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4" />
              We&apos;re still building your trust score
            </p>
            <p className="text-sm text-muted-foreground">
              There isn&apos;t enough activity yet to calculate a score. Complete
              a skills test below, and your score will start to reflect it right
              away. More signals are added as you take on engagements.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Trust score
                </p>
                <p className="text-4xl font-semibold text-foreground tabular-nums">
                  {trust.trustScore.toFixed(1)}
                  <span className="text-lg text-muted-foreground">/100</span>
                </p>
              </div>
            </div>
            <Progress value={trust.trustScore} />
          </div>
        )}

        {trust && (
          <div className="space-y-3">
            <Separator />
            <p className="text-sm font-medium text-foreground">
              What goes into your score
            </p>
            <ul className="space-y-2">
              {trust.signals.map((s) => (
                <li
                  key={s.key}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    {s.label}
                    <span className="text-xs text-muted-foreground">
                      {s.weight}%
                    </span>
                  </span>
                  {s.hasData ? (
                    <span className="font-medium tabular-nums text-foreground">
                      {s.value.toFixed(0)}
                      <span className="text-muted-foreground">/100</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No data yet
                    </span>
                  )}
                </li>
              ))}
              {trust.hasDisputes && (
                <li className="flex items-center justify-between gap-3 text-sm text-destructive">
                  <span>Dispute penalty</span>
                  <span className="font-medium tabular-nums">
                    &minus;{trust.disputePenalty.toFixed(0)}
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function describeCategory(c: SkillsTestCategoryStatus): string {
  if (!c.hasAttempt) return 'Not taken yet';
  const base = `${c.lastPassed ? 'Passed' : 'Did not pass'} · ${c.lastScore ?? 0}%`;
  if (!c.canTakeNow && c.nextEligibleRetestAt) {
    return `${base} · retake after ${fmtDate(c.nextEligibleRetestAt)}`;
  }
  return base;
}

function SkillsTestCard() {
  const { data: status, isLoading } = useSkillsTestStatus();
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
    const questions = await start.mutateAsync(category);
    setActive({ category, questions });
  };

  const allAnswered =
    !!active &&
    active.questions.questions.every((q) => answers[q.id] !== undefined);

  const submitTest = async () => {
    if (!active) return;
    const res = await submit.mutateAsync({
      category: active.category,
      answers: active.questions.questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id],
      })),
    });
    setResult(res);
    setActive(null);
    setAnswers({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <GraduationCap className="h-5 w-5 text-foreground" />
          Skills test
          <Badge variant="secondary" className="font-normal">
            Optional
          </Badge>
        </CardTitle>
        <CardDescription>
          Take a short test in one of your categories to add a verified signal to
          your trust score. It never blocks anything — it only helps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-lg" />
        ) : active ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {active.category} skills test
              </p>
              <span className="text-xs text-muted-foreground">
                {active.questions.passThresholdPercent}% to pass
              </span>
            </div>

            {active.questions.questions.map((q, qi) => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {qi + 1}. {q.prompt}
                </p>
                <div className="grid gap-2">
                  {q.options.map((opt, oi) => (
                    <Button
                      key={oi}
                      type="button"
                      variant={answers[q.id] === oi ? 'default' : 'outline'}
                      className="h-auto justify-start whitespace-normal py-2 text-left"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [q.id]: oi }))
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {submit.isError && (
              <p className="text-sm text-destructive">
                Could not submit your answers. Try again.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={submitTest}
                disabled={!allAnswered || submit.isPending}
              >
                {submit.isPending ? 'Submitting…' : 'Submit answers'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setActive(null);
                  setAnswers({});
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {result && (
              <div
                className={cn(
                  'space-y-2 rounded-lg border p-4',
                  result.passed
                    ? 'border-success-light bg-success-light/50 text-success-text'
                    : 'border-border bg-muted/50 text-foreground'
                )}
              >
                <p className="inline-flex items-center gap-2 text-sm font-medium">
                  {result.passed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  {result.passed ? 'You passed' : 'Not a pass this time'}
                </p>
                <p className="text-sm opacity-90">
                  Score {result.score}% ({result.correctCount}/
                  {result.totalCount}). You can retake this test after{' '}
                  {fmtDate(result.nextEligibleRetestAt)}.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResult(null)}
                >
                  Done
                </Button>
              </div>
            )}

            {start.isError && (
              <p className="text-sm text-destructive">
                Could not start the test. Try again.
              </p>
            )}

            {!status || status.categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add a service category to your profile to unlock the skills test.
              </p>
            ) : (
              <ul className="space-y-2">
                {status.categories.map((c) => (
                  <li
                    key={c.category}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {c.lastPassed && (
                          <Award className="h-4 w-4 text-success-text" />
                        )}
                        {c.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {describeCategory(c)}
                      </p>
                    </div>
                    {c.canTakeNow ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => beginTest(c.category)}
                        disabled={start.isPending}
                      >
                        {c.hasAttempt ? 'Retake' : 'Take test'}
                      </Button>
                    ) : c.hasAttempt ? (
                      <Badge variant={c.lastPassed ? 'success' : 'secondary'}>
                        {c.lastPassed ? 'Passed' : 'Not passed'}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

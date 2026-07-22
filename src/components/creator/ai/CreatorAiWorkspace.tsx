"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import {
  Sparkles,
  FileText,
  LineChart,
  Lightbulb,
  Lock,
  Loader2,
} from "lucide-react";
import {
  useBusinessPlanSession,
  useBusinessPlanSessions,
  useClarifierSession,
  useClarifierSessions,
  useForecastSession,
  useForecastSessions,
  useStartBusinessPlan,
  useStartClarifier,
  useStartForecast,
} from "@/hooks/queries/creator-ai";
import { hasAiOutput } from "@/types/creator/ai";
import AiStatusBadge from "./AiStatusBadge";
import AiJobProgress from "./AiJobProgress";
import ClarifierResultsCard from "./ClarifierResultsCard";
import BusinessPlanView from "./BusinessPlanView";
import ForecastView from "./ForecastView";

function StageShell({
  icon: Icon,
  title,
  description,
  status,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  status?: React.ComponentProps<typeof AiStatusBadge>["status"];
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <AiStatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ClarifierForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (raw: {
    title: string;
    problemStatement: string;
    targetAudience: string;
    description?: string;
    existingAlternatives?: string;
  }) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [description, setDescription] = useState("");
  const [existingAlternatives, setExistingAlternatives] = useState("");

  const valid =
    title.trim() && problemStatement.trim() && targetAudience.trim();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          title: title.trim(),
          problemStatement: problemStatement.trim(),
          targetAudience: targetAudience.trim(),
          description: description.trim() || undefined,
          existingAlternatives: existingAlternatives.trim() || undefined,
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="ai-title">Idea title *</Label>
        <Input
          id="ai-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Carbon-neutral meal delivery"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ai-problem">Problem statement *</Label>
        <Textarea
          id="ai-problem"
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          placeholder="What problem are you solving?"
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ai-audience">Target audience *</Label>
        <Textarea
          id="ai-audience"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="Who is this for?"
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ai-desc">Description</Label>
        <Textarea
          id="ai-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — more context about the idea"
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ai-alts">Existing alternatives</Label>
        <Textarea
          id="ai-alts"
          value={existingAlternatives}
          onChange={(e) => setExistingAlternatives(e.target.value)}
          placeholder="Optional — how is this solved today?"
          rows={2}
        />
      </div>
      <Button type="submit" disabled={!valid || isSubmitting} className="gap-2">
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Run Idea Clarifier
      </Button>
    </form>
  );
}

export function CreatorAiWorkspace() {
  const [clarifierId, setClarifierId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [forecastId, setForecastId] = useState<string | null>(null);

  // Discover the latest existing sessions to resume into.
  const clarifierList = useClarifierSessions();
  const clarifier = useClarifierSession(clarifierId);
  const planList = useBusinessPlanSessions(clarifierId ?? undefined);
  const plan = useBusinessPlanSession(planId);
  const forecastList = useForecastSessions(planId ?? undefined);
  const forecast = useForecastSession(forecastId);

  const startClarifier = useStartClarifier();
  const startPlan = useStartBusinessPlan();
  const startForecast = useStartForecast();

  // Seed active ids from the most recent sessions once lists resolve.
  useEffect(() => {
    if (!clarifierId && clarifierList.data?.length) {
      setClarifierId(clarifierList.data[0].sessionId);
    }
  }, [clarifierId, clarifierList.data]);

  useEffect(() => {
    if (!planId && planList.data?.length) {
      setPlanId(planList.data[0].sessionId);
    }
  }, [planId, planList.data]);

  useEffect(() => {
    if (!forecastId && forecastList.data?.length) {
      setForecastId(forecastList.data[0].sessionId);
    }
  }, [forecastId, forecastList.data]);

  const clarifierData = clarifier.data;
  const planData = plan.data;
  const forecastData = forecast.data;

  const clarifierReady = clarifierData?.status === "Completed";
  const planReady = planData?.status === "Completed";

  const initialLoading = clarifierList.isLoading;

  return (
    <div className="w-full max-w-[960px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-[28px] font-bold leading-tight text-foreground">
          <Sparkles className="h-7 w-7 text-primary" />
          AI Studio
        </h1>
        <p className="text-sm text-muted-foreground">
          Clarify your idea, generate a business plan, and project your
          financials — powered by AI.
        </p>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Idea Clarifier", status: clarifierData?.status, icon: Lightbulb },
          { label: "Business Plan", status: planData?.status, icon: FileText },
          { label: "Forecast", status: forecastData?.status, icon: LineChart },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {s.label}
              </span>
            </div>
            <AiStatusBadge status={s.status} />
          </div>
        ))}
      </div>

      {initialLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Stage 1 — Idea Clarifier */}
          <StageShell
            icon={Lightbulb}
            title="Idea Clarifier"
            description="Sharpen the problem, audience, and solution."
            status={clarifierData?.status}
          >
            {!clarifierId && !clarifierData ? (
              <ClarifierForm
                isSubmitting={startClarifier.isPending}
                onSubmit={(rawIdea) =>
                  startClarifier.mutate(
                    { rawIdea },
                    { onSuccess: (r) => setClarifierId(r.sessionId) },
                  )
                }
              />
            ) : clarifier.isLoading && !clarifierData ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : clarifierData && !hasAiOutput(clarifierData.status) ? (
              <div className="space-y-4">
                <AiJobProgress
                  status={clarifierData.status}
                  title="Clarifying your idea"
                  error={clarifierData.error}
                />
                {clarifierData.status === "Failed" && (
                  <Button
                    variant="outline"
                    onClick={() => setClarifierId(null)}
                  >
                    Start over
                  </Button>
                )}
              </div>
            ) : clarifierData?.output ? (
              <ClarifierResultsCard
                output={clarifierData.output}
                clarityScore={clarifierData.clarityScore}
              />
            ) : (
              <EmptyState
                icon={Lightbulb}
                title="No clarifier output yet"
                description="Run the Idea Clarifier to get started."
              />
            )}
          </StageShell>

          {/* Stage 2 — Business Plan */}
          <StageShell
            icon={FileText}
            title="Business Plan"
            description="A structured plan generated from your clarified idea."
            status={planData?.status}
          >
            {!clarifierReady ? (
              <EmptyState
                icon={Lock}
                title="Complete the Idea Clarifier first"
                description="The business plan is generated from a completed clarifier session."
              />
            ) : !planId && !planData ? (
              <EmptyState
                icon={FileText}
                title="No business plan yet"
                description="Generate a business plan from your clarified idea."
                action={
                  <Button
                    className="gap-2"
                    disabled={startPlan.isPending}
                    onClick={() =>
                      startPlan.mutate(
                        { clarifierSessionId: clarifierId as string },
                        { onSuccess: (r) => setPlanId(r.sessionId) },
                      )
                    }
                  >
                    {startPlan.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate Business Plan
                  </Button>
                }
              />
            ) : plan.isLoading && !planData ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : planData && !hasAiOutput(planData.status) ? (
              <div className="space-y-4">
                <AiJobProgress
                  status={planData.status}
                  title="Generating your business plan"
                  error={planData.error}
                />
                {planData.status === "Failed" && (
                  <Button variant="outline" onClick={() => setPlanId(null)}>
                    Try again
                  </Button>
                )}
              </div>
            ) : planData?.output ? (
              <BusinessPlanView output={planData.output} />
            ) : (
              <EmptyState
                icon={FileText}
                title="No business plan output yet"
              />
            )}
          </StageShell>

          {/* Stage 3 — Forecast */}
          <StageShell
            icon={LineChart}
            title="Financial Forecast"
            description="A 36-month financial projection (12 AI + 24 projected) from your business plan."
            status={forecastData?.status}
          >
            {!planReady ? (
              <EmptyState
                icon={Lock}
                title="Complete the Business Plan first"
                description="The forecast is generated from a completed business plan."
              />
            ) : !forecastId && !forecastData ? (
              <EmptyState
                icon={LineChart}
                title="No forecast yet"
                description="Generate a 36-month financial forecast (12 AI + 24 projected) from your plan."
                action={
                  <Button
                    className="gap-2"
                    disabled={startForecast.isPending}
                    onClick={() =>
                      startForecast.mutate(
                        { businessPlanSessionId: planId as string },
                        { onSuccess: (r) => setForecastId(r.sessionId) },
                      )
                    }
                  >
                    {startForecast.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate Forecast
                  </Button>
                }
              />
            ) : forecast.isLoading && !forecastData ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : forecastData && !hasAiOutput(forecastData.status) ? (
              <div className="space-y-4">
                <AiJobProgress
                  status={forecastData.status}
                  title="Generating your forecast"
                  error={forecastData.error}
                />
                {forecastData.status === "Failed" && (
                  <Button
                    variant="outline"
                    onClick={() => setForecastId(null)}
                  >
                    Try again
                  </Button>
                )}
              </div>
            ) : forecastData?.output ? (
              <ForecastView output={forecastData.output} />
            ) : (
              <EmptyState icon={LineChart} title="No forecast output yet" />
            )}
          </StageShell>
        </>
      )}
    </div>
  );
}

export default CreatorAiWorkspace;

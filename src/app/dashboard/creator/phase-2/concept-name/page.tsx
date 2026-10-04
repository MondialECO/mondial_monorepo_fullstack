"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi, type CompanySearchMatch } from "@/lib/api-creator-journey";
import { toAiError } from "@/lib/ai-errors";

type Suggestion = { name: string; tagline: string; score: number };

const CATEGORIES = ["SaaS", "AI Tool", "Marketplace", "Fintech", "HealthTech", "CleanTech"];
const NEXT_PHASES = ["Logo & Branding", "AI Masterplan", "Offer Setup"];

export default function ConceptNamePage() {
  const router = useRouter();
  const { state, isLoading, error, refetch, setState } = useCreatorProgress();

  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [customName, setCustomName] = useState("");
  const [customTagline, setCustomTagline] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [category, setCategory] = useState("SaaS");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const autoFetchedRef = useRef(false);

  // ── Company Search State (Optional French Company Records Check) ──
  type CompanySearchStatus = "idle" | "loading" | "success" | "empty" | "error";
  const [searchStatus, setSearchStatus] = useState<CompanySearchStatus>("idle");
  const [searchMatches, setSearchMatches] = useState<CompanySearchMatch[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const currentSearchTargetRef = useRef<string>("");

  // The API returns names only; pair each with the project's value prop as the tagline.
  const mapNames = useCallback((names: string[]): Suggestion[] => {
    const tagline = state.project.tagline || state.project.solution || state.project.concept || "";
    return names.map((name, i) => ({ name, tagline, score: Math.max(95 - i * 5, 70) }));
  }, [state.project]);

  const fetchNames = useCallback(async () => {
    const concept = state.project.concept || state.project.solution || state.project.tagline || state.project.name;
    if (!concept) return;
    setNameError(null);
    setRegenerating(true);
    try {
      const { names } = await creatorJourneyApi.nameSuggestions(concept);
      if (names?.length) {
        setSuggestions(mapNames(names));
        setState((prev) => ({
          ...prev,
          journeyState: {
            ...prev.journeyState,
            phase2: { ...prev.journeyState.phase2, nameSuggestions: names },
          },
        }));
      }
    } catch (err) {
      setNameError(toAiError(err).message);
    } finally {
      setRegenerating(false);
    }
  }, [state.project, mapNames, setState]);

  // Load cached suggestions, or fetch real ones once the concept is available.
  useEffect(() => {
    const cached = state.journeyState?.phase2?.nameSuggestions as string[] | undefined;
    if (cached && cached.length) {
      setSuggestions(mapNames(cached));
      return;
    }
    const concept = state.project.concept || state.project.solution || state.project.tagline || state.project.name;
    if (concept && !autoFetchedRef.current) {
      autoFetchedRef.current = true;
      void fetchNames();
    }
  }, [state.project, state.journeyState?.phase2?.nameSuggestions, mapNames, fetchNames]);

  // Load from state on mount
  useEffect(() => {
    const project = state.project;
    if (project) {
      if (project.name) {
        // Find if name is in suggestions
        const sugIndex = suggestions.findIndex((s) => s.name === project.name);
        if (sugIndex !== -1) {
          setSelectedSuggestion(sugIndex);
          setUseCustom(false);
        } else {
          setCustomName(project.name);
          setCustomTagline(project.tagline || "");
          setUseCustom(true);
        }
      }
      if (project.category) {
        setCategory(project.category);
      }
    }
  }, [state.project, suggestions]);

  const activeName = useCustom
    ? customName
    : selectedSuggestion !== null
    ? suggestions[selectedSuggestion]?.name ?? ""
    : "";
  const activeTagline = useCustom
    ? customTagline
    : selectedSuggestion !== null
    ? suggestions[selectedSuggestion]?.tagline ?? ""
    : "";

  // Reset company search results immediately whenever the active name changes
  useEffect(() => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
    setSearchStatus("idle");
    setSearchMatches([]);
    setSearchError(null);
  }, [activeName]);

  const handleSearchCompanies = async () => {
    const query = activeName.trim();
    if (!query) return;

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;
    currentSearchTargetRef.current = query;

    setSearchStatus("loading");
    setSearchError(null);
    setSearchMatches([]);

    try {
      const data = await creatorJourneyApi.searchSimilarCompanies(query, controller.signal);
      if (currentSearchTargetRef.current !== activeName.trim()) return;

      if (data.matches && data.matches.length > 0) {
        setSearchMatches(data.matches.slice(0, 5));
        setSearchStatus("success");
      } else {
        setSearchMatches([]);
        setSearchStatus("empty");
      }
    } catch {
      if (controller.signal.aborted) return;
      if (currentSearchTargetRef.current !== activeName.trim()) return;
      setSearchStatus("error");
      setSearchError("We couldn’t check right now. You can continue and try again later.");
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null;
      }
    }
  };

  // Enable button if: (1) suggestion selected, or (2) custom name + tagline filled
  const canProceed =
    (!useCustom && selectedSuggestion !== null) ||
    (useCustom && customName.trim().length >= 2 && customTagline.trim().length >= 5);

  const handleProceed = async () => {
    if (!canProceed || savingName) return;

    // Persist name/tagline/category to the backend project (source of truth).
    // AWAITED — a failed save must surface, not silently advance (the old
    // swallowed catch hid a 400 that made new ideas unnameable for hours).
    setSavingName(true);
    setNameError(null);
    try {
      await creatorJourneyApi.updateProject({ name: activeName, tagline: activeTagline, category });
    } catch {
      setNameError("Couldn't save your project name — please try again.");
      return;
    } finally {
      setSavingName(false);
    }

    // Save selections in project state
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase2: {
          ...prev.journeyState.phase2,
          currentStep: 9,
        },
      },
      project: {
        ...prev.project,
        name: activeName,
        tagline: activeTagline,
        category: category,
        exists: true,
      },
    }));

    router.push("/dashboard/creator/phase-2/branding");
  };

  // Gate: don't render real content until backend hydration completes.
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-4 py-24" style={{ backgroundColor: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading your project...</p>
      </div>
    );
  }

  // Hydration failed — show an honest error/retry state, never empty data as if real.
  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-3 py-24" style={{ backgroundColor: "var(--background)" }}>
        <p className="text-sm" style={{ color: "var(--destructive)" }}>Couldn&apos;t load your data. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto w-full max-w-[960px] px-4 sm:px-6 py-8 sm:py-12">

        {/* ── main card ── */}
        <div
          className="rounded-3xl border shadow-sm p-5 sm:p-8 flex flex-col gap-6"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}
        >
          {/* Header */}
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
              Name Your Project
            </h1>
            <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
              5 name ideas generated from your concept description. Pick one or define your own custom name.
            </p>
          </div>

          {/* Suggested Names */}
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
              SUGGESTED NAMES
            </span>
            {nameError && <p className="text-xs" style={{ color: "var(--destructive)" }}>{nameError}</p>}

            {suggestions.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm" style={{ color: "var(--muted-foreground)" }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                {regenerating ? "Generating name suggestions…" : "No suggestions yet."}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {suggestions.map((suggestion, i) => {
                  const selected = !useCustom && selectedSuggestion === i;
                  return (
                    <button
                      key={suggestion.name}
                      type="button"
                      onClick={() => { setSelectedSuggestion(i); setUseCustom(false); }}
                      className="w-full sm:w-[280px] rounded-2xl p-4 flex flex-col gap-2 items-start text-left transition-colors"
                      style={{
                        backgroundColor: "var(--popover)",
                        borderWidth: selected ? "2px" : "1px",
                        borderStyle: "solid",
                        borderColor: selected ? "var(--primary)" : "var(--border)",
                      }}
                    >
                      {/* radio */}
                      <span
                        className="rounded-full flex items-center justify-center shrink-0"
                        style={{
                          width: 20,
                          height: 20,
                          borderWidth: "2px",
                          borderStyle: "solid",
                          borderColor: selected ? "var(--primary)" : "var(--muted-foreground)",
                        }}
                      >
                        {selected && <span className="rounded-full" style={{ width: 10, height: 10, backgroundColor: "var(--primary)" }} />}
                      </span>
                      <span className="text-label font-semibold" style={{ color: "var(--foreground)" }}>
                        {suggestion.name}
                      </span>
                      <span className="text-caption w-full truncate" style={{ color: "var(--muted-foreground)" }}>
                        {suggestion.tagline}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom name */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setUseCustom(!useCustom)}
              className="flex items-center gap-3 text-label font-semibold transition-colors"
              style={{ color: useCustom ? "var(--primary)" : "var(--muted-foreground)" }}
            >
              <span
                className="rounded-md flex items-center justify-center shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: useCustom ? "var(--primary)" : "transparent",
                  borderWidth: useCustom ? "0" : "2px",
                  borderStyle: "solid",
                  borderColor: "var(--muted-foreground)",
                }}
              >
                {useCustom && <Check className="w-3.5 h-3.5" strokeWidth={3} style={{ color: "var(--primary-foreground)" }} />}
              </span>
              I have my own custom name in mind
            </button>

            {useCustom && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-label font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. My Custom Brand"
                    className="w-full rounded-xl px-4 py-3.5 text-input outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    style={{ backgroundColor: "var(--popover)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                    Tagline / Value Proposition
                  </label>
                  <input
                    type="text"
                    value={customTagline}
                    onChange={(e) => setCustomTagline(e.target.value)}
                    placeholder="e.g. A localized inventory tool for neighborhood grocery stores."
                    className="w-full rounded-xl px-4 py-3.5 text-input outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    style={{ backgroundColor: "var(--popover)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Optional French Company Name Search ── */}
          <div className="flex flex-col gap-3 pt-3 border-t border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-label font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                  French Company Registry Check
                </span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Optional lookup against active and closed French enterprise records.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSearchCompanies}
                disabled={!activeName.trim() || searchStatus === "loading"}
                className="self-start sm:self-auto rounded-xl flex items-center gap-2 shrink-0"
              >
                {searchStatus === "loading" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Check similar names
                  </>
                )}
              </Button>
            </div>

            {/* Inline Results Container */}
            {searchStatus !== "idle" && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-3 transition-all"
                style={{ backgroundColor: "var(--popover)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)" }}
                data-testid="company-search-results"
              >
                <div className="flex items-center justify-between gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Similar company names in France
                  </span>
                  {searchStatus === "loading" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Searching…
                    </span>
                  )}
                </div>

                {searchStatus === "loading" && (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Searching French enterprise database for &ldquo;{activeName.trim()}&rdquo;…
                  </div>
                )}

                {searchStatus === "empty" && (
                  <p className="text-xs py-2" style={{ color: "var(--muted-foreground)" }}>
                    No matching companies were found in this search.
                  </p>
                )}

                {searchStatus === "error" && (
                  <p className="text-xs py-2" style={{ color: "var(--destructive)" }}>
                    {searchError || "We couldn’t check right now. You can continue and try again later."}
                  </p>
                )}

                {searchStatus === "success" && searchMatches.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {searchMatches.map((match) => {
                      const location = [match.postalCode, match.city].filter(Boolean).join(" ");
                      return (
                        <div
                          key={match.siren || match.name}
                          className="p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border"
                          style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                              {match.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {match.siren && <span>SIREN: {match.siren}</span>}
                              {location && <span>Location: {location}</span>}
                              {match.activityCode && <span>NAF: {match.activityCode}</span>}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {match.status === "active" && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Actif
                              </span>
                            )}
                            {match.status === "closed" && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Fermé
                              </span>
                            )}
                            {match.status === "unknown" && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                Unknown status
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-[11px] leading-relaxed pt-1" style={{ color: "var(--muted-foreground)" }}>
                  This search finds similar company names in France. It does not confirm trademark or name availability.
                </p>
              </div>
            )}
          </div>

          {/* Meta row: category + next phases */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Category */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <span className="text-label font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                Project Category
              </span>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="rounded-full px-4 py-2.5 text-badge font-medium transition-colors"
                      style={{
                        backgroundColor: active ? "var(--secondary)" : "var(--popover)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderColor: active ? "var(--primary)" : "var(--border)",
                        color: active ? "var(--primary)" : "var(--muted-foreground)",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next phases */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <span className="text-label font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                Next Phases (Skippable):
              </span>
              <div className="flex flex-col gap-3">
                {NEXT_PHASES.map((phase) => (
                  <span key={phase} className="text-body" style={{ color: "var(--muted-foreground)" }}>
                    {phase}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleProceed}
              disabled={!canProceed || savingName}
              className="w-full rounded-xl py-4 h-auto text-button font-medium flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Continue to Branding
              <ArrowRight className="w-4 h-4" />
            </Button>
            {/* Save failure surfaces HERE, next to the action that failed. */}
            {nameError && <p className="text-xs text-center" style={{ color: "var(--destructive)" }}>{nameError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

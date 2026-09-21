'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/axios';
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  ArrowRight,
  Plus,
  X,
  Lock,
  ChevronDown,
  Check,
  Shield,
  Briefcase,
  Laptop,
  Search,
  GraduationCap,
  Lightbulb,
  Store,
  MoreHorizontal,
  BookOpen,
  UserPlus,
  ArrowUp,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';
import { creatorProfileApi } from '@/lib/api-creator-profile';
import {
  FRENCH_REGIONS,
  SUGGESTED_SKILLS,
  SKILL_LEVELS,
  CURRENT_SITUATION_UI_OPTIONS,
  WEEKLY_AVAILABILITY_UI_OPTIONS,
  PREVIOUS_EXPERIENCE_UI_OPTIONS,
  PROGRESS_PREFERENCE_UI_OPTIONS,
  HumainXQuickStartSkill,
  HumainXQuickStartData,
  HumainXJourneyState,
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  isQuickStartComplete,
  getFirstIncompleteStep,
  getQuickStartJourneyState,
  saveQuickStartJourneyState,
  resolveTargetQuickStartStep,
  mapSituationFromCanonical,
  mapAvailabilityFromCanonical,
  mapExperienceFromCanonical,
  deriveProgressPreference,
  buildSavePayloadFromQuickStart,
  getMissingFields,
} from '@/lib/humainx-quick-start';

// Icons mapping for Current Situation cards per Figma node 57125:16446
const SITUATION_ICONS: Record<string, React.ElementType> = {
  employed: Briefcase,
  'self-employed': Laptop,
  looking: Search,
  student: GraduationCap,
  training: Lightbulb,
  'existing-business': Store,
  other: MoreHorizontal,
};

// Icons mapping for Progress Preference cards per Figma node 57126:16805
const PROGRESS_ICONS: Record<string, React.ElementType> = {
  learn: BookOpen,
  delegate: UserPlus,
  mixed: ArrowUp,
  'help-me-decide': HelpCircle,
};

function HumainXQuickStartInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasInitializedStep, setHasInitializedStep] = useState(false);

  // Form State
  const [region, setRegion] = useState('Hauts-de-France');
  const [currentSituation, setCurrentSituation] = useState('Employed');
  const [weeklyAvailability, setWeeklyAvailability] = useState('10–20 hrs');
  const [skills, setSkills] = useState<HumainXQuickStartSkill[]>([]);
  const [showCustomSkillInput, setShowCustomSkillInput] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [previousEntrepreneurialExperience, setPreviousExperience] = useState('This is my first time');
  const [progressPreference, setProgressPreference] = useState('A bit of both');

  // UI Status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs for autosave race safety, debouncing, and fresh data snapshots
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // Query canonical profile
  const { data: profile, isLoading: isProfileLoading, refetch } = useQuery({
    queryKey: ['creator', 'my-profile'],
    queryFn: () => creatorProfileApi.getMyProfile(),
    staleTime: 30_000,
  });

  // Territory verification signal from actual frontend context (FIX 04)
  const isTerritoryVerified = Boolean(
    profile?.ventureContext?.territoryVerified ||
    profile?.ventureContext?.isTerritoryVerified ||
    profile?.addressVerified ||
    profile?.isAddressVerified ||
    profile?.verificationStatus === 'Verified'
  );

  // Pre-populate form data from canonical profile
  useEffect(() => {
    if (!profile) return;

    const vc = profile.ventureContext || profile.VentureContext || {};
    if (vc.region || vc.Region) {
      setRegion(vc.region || vc.Region);
    }
    if (vc.currentSituation || vc.CurrentSituation) {
      setCurrentSituation(mapSituationFromCanonical(vc.currentSituation || vc.CurrentSituation));
    }
    if (vc.weeklyAvailability || vc.WeeklyAvailability) {
      setWeeklyAvailability(mapAvailabilityFromCanonical(vc.weeklyAvailability || vc.WeeklyAvailability));
    }

    const rawSkills = profile.skills || profile.Skills || [];
    if (Array.isArray(rawSkills) && rawSkills.length > 0) {
      const loaded: HumainXQuickStartSkill[] = rawSkills
        .filter((s: any) => (s?.name || s?.Name || '').trim().length > 0)
        .map((s: any) => {
          const rawLevel = (s?.level || s?.Level || 'Comfortable').trim();
          const validLevel =
            rawLevel.toLowerCase() === 'beginner'
              ? 'Beginner'
              : rawLevel.toLowerCase() === 'advanced'
              ? 'Advanced'
              : 'Comfortable';
          return {
            name: s?.name || s?.Name,
            level: validLevel,
          };
        });
      if (loaded.length > 0) {
        setSkills(loaded);
      }
    }

    if (vc.previousEntrepreneurialExperience || vc.PreviousEntrepreneurialExperience) {
      setPreviousExperience(
        mapExperienceFromCanonical(vc.previousEntrepreneurialExperience || vc.PreviousEntrepreneurialExperience)
      );
    }

    const lp = vc.learningPreference || vc.LearningPreference;
    const dp = vc.delegationPreference || vc.DelegationPreference;
    const derived = deriveProgressPreference(lp, dp);
    if (derived) {
      setProgressPreference(derived);
    }
  }, [profile]);

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  const { user } = useAuth();
  const userId = user?.id || null;

  // Initial step resolution with strict order normalization
  const getMaxAllowedStep = useCallback(() => {
    const jState = getQuickStartJourneyState(userId);
    let max = 1;
    if (jState.step1Confirmed && isStep1Complete(profile)) {
      max = 2;
    }
    if (jState.step1Confirmed && jState.step2Confirmed && isStep1Complete(profile) && isStep2Complete(profile)) {
      max = 3;
    }
    return max;
  }, [userId, profile]);

  useEffect(() => {
    if (hasInitializedStep || isProfileLoading || !profile) return;

    const jState = getQuickStartJourneyState(userId);
    const recommendedStep = resolveTargetQuickStartStep(profile, jState);
    const maxAllowedStep = getMaxAllowedStep();

    const stepParam = searchParams.get('step');
    const parsedStep = stepParam ? parseInt(stepParam, 10) : null;

    let targetStep: number;
    if (parsedStep && [1, 2, 3].includes(parsedStep)) {
      // Step normalization rule:
      // A user cannot view a later step if an earlier step is incomplete or unconfirmed
      if (parsedStep <= maxAllowedStep) {
        targetStep = parsedStep;
      } else {
        targetStep = maxAllowedStep;
      }
    } else {
      targetStep = recommendedStep;
    }

    setCurrentStep(targetStep);
    if (stepParam !== String(targetStep)) {
      router.replace(`/dashboard/creator/humainx?step=${targetStep}`);
    }
    setHasInitializedStep(true);
  }, [profile, isProfileLoading, searchParams, hasInitializedStep, userId, getMaxAllowedStep, router]);

  // Reactive step order enforcement for in-session navigation
  useEffect(() => {
    if (!hasInitializedStep || !profile) return;
    const maxAllowedStep = getMaxAllowedStep();
    const stepParam = searchParams.get('step');
    const parsedStep = stepParam ? parseInt(stepParam, 10) : null;

    if (parsedStep && [1, 2, 3].includes(parsedStep)) {
      if (parsedStep > maxAllowedStep) {
        setCurrentStep(maxAllowedStep);
        router.replace(`/dashboard/creator/humainx?step=${maxAllowedStep}`);
      } else if (parsedStep !== currentStep) {
        setCurrentStep(parsedStep);
      }
    } else if (stepParam !== null && stepParam !== String(currentStep)) {
      router.replace(`/dashboard/creator/humainx?step=${currentStep}`);
    }
  }, [searchParams, hasInitializedStep, profile, currentStep, getMaxAllowedStep, router]);

  // Current state snapshot
  const currentFormData: HumainXQuickStartData = {
    region,
    currentSituation,
    weeklyAvailability,
    skills,
    previousEntrepreneurialExperience,
    progressPreference,
  };

  const latestDataRef = useRef<HumainXQuickStartData>(currentFormData);
  latestDataRef.current = currentFormData;

  // Step completion calculations
  const step1Valid = Boolean(region.trim() && currentSituation.trim() && weeklyAvailability.trim());
  const step2Valid =
    skills.length >= 1 &&
    skills.every((s) => ['Beginner', 'Comfortable', 'Advanced'].includes(s.level));
  const step3Valid = Boolean(previousEntrepreneurialExperience.trim() && progressPreference.trim());

  // Explicit persistence execution with boolean contract and race safety (FIX 02)
  const persistChanges = useCallback(
    async (overrideData?: Partial<HumainXQuickStartData>): Promise<boolean> => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }

      const requestId = ++activeRequestIdRef.current;
      setSaveStatus('saving');
      setSaveErrorMessage('');

      try {
        const mergedData = {
          ...latestDataRef.current,
          ...overrideData,
        };
        latestDataRef.current = mergedData;
        const payload = buildSavePayloadFromQuickStart(profile, mergedData);
        await api.put('/profile/me', payload);

        // Stale response race protection: only update state if this is still the newest request
        if (requestId === activeRequestIdRef.current) {
          await queryClient.invalidateQueries({ queryKey: ['creator', 'my-profile'] });
          setSaveStatus('saved');
        }
        return true;
      } catch (err: any) {
        if (requestId === activeRequestIdRef.current) {
          setSaveStatus('error');
          setSaveErrorMessage(err?.response?.data?.message || 'Could not save profile changes.');
        }
        return false;
      }
    },
    [profile, queryClient]
  );

  // Debounced real autosave with race protection (FIX 03)
  const triggerAutosave = useCallback(
    (overrides?: Partial<HumainXQuickStartData>) => {
      const dataToSave = {
        ...latestDataRef.current,
        ...overrides,
      };
      latestDataRef.current = dataToSave;

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(async () => {
        const requestId = ++activeRequestIdRef.current;
        setSaveStatus('saving');
        setSaveErrorMessage('');

        try {
          const payload = buildSavePayloadFromQuickStart(profile, dataToSave);
          await api.put('/profile/me', payload);

          if (requestId === activeRequestIdRef.current) {
            setSaveStatus('saved');
            queryClient.invalidateQueries({ queryKey: ['creator', 'my-profile'] });
          }
        } catch (err: any) {
          if (requestId === activeRequestIdRef.current) {
            setSaveStatus('error');
            setSaveErrorMessage(err?.response?.data?.message || 'Could not save profile changes.');
          }
        }
      }, 400);
    },
    [profile, queryClient]
  );

  // State modification wrappers that trigger debounced autosave
  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    triggerAutosave({ region: newRegion });
  };

  const handleSituationChange = (newSituation: string) => {
    setCurrentSituation(newSituation);
    triggerAutosave({ currentSituation: newSituation });
  };

  const handleAvailabilityChange = (newAvailability: string) => {
    setWeeklyAvailability(newAvailability);
    triggerAutosave({ weeklyAvailability: newAvailability });
  };

  const handleExperienceChange = (newExperience: string) => {
    setPreviousExperience(newExperience);
    triggerAutosave({ previousEntrepreneurialExperience: newExperience });
  };

  const handlePreferenceChange = (newPreference: string) => {
    setProgressPreference(newPreference);
    triggerAutosave({ progressPreference: newPreference });
  };

  // Skill toggles and management with autosave
  const toggleSkill = (skillName: string) => {
    const existingIndex = skills.findIndex(
      (s) => s.name.toLowerCase() === skillName.toLowerCase()
    );
    let updated: HumainXQuickStartSkill[];
    if (existingIndex >= 0) {
      updated = skills.filter((_, i) => i !== existingIndex);
    } else {
      updated = [
        ...skills,
        { name: skillName, level: 'Comfortable' },
      ];
    }
    setSkills(updated);
    setSubmitError(null);
    triggerAutosave({ skills: updated });
  };

  const updateSkillLevel = (
    skillName: string,
    level: 'Beginner' | 'Comfortable' | 'Advanced'
  ) => {
    const updated = skills.map((s) =>
      s.name.toLowerCase() === skillName.toLowerCase() ? { ...s, level } : s
    );
    setSkills(updated);
    triggerAutosave({ skills: updated });
  };

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    const exists = skills.some(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      const updated = [...skills, { name: trimmed, level: 'Comfortable' as const }];
      setSkills(updated);
      setSubmitError(null);
      triggerAutosave({ skills: updated });
    }
    setCustomSkillInput('');
    setShowCustomSkillInput(false);
  };

  const removeSkill = (skillName: string) => {
    const updated = skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase());
    setSkills(updated);
    triggerAutosave({ skills: updated });
  };

  // Step Navigation handlers with confirmed persistence check (FIX 02)
  const handleNext = async () => {
    if (currentStep === 1 && !step1Valid) return;
    if (currentStep === 2 && !step2Valid) return;

    const success = await persistChanges();
    if (!success) {
      // Stay on current step! Do NOT advance if persistence failed
      return;
    }

    if (currentStep === 1) {
      if (userId) {
        saveQuickStartJourneyState(userId, { step1Confirmed: true });
      }
      setCurrentStep(2);
      router.replace('/dashboard/creator/humainx?step=2');
    } else if (currentStep === 2) {
      if (userId) {
        saveQuickStartJourneyState(userId, { step2Confirmed: true });
      }
      setCurrentStep(3);
      router.replace('/dashboard/creator/humainx?step=3');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      router.replace(`/dashboard/creator/humainx?step=${prev}`);
    }
  };

  // Safe handler for "I'll add these later" (FIX 01 — NO fake skill bypass)
  const handleSkipSkills = () => {
    if (skills.length === 0) {
      // Step 2 remains strictly incomplete. Show validation feedback without fake data
      setSubmitError('Add at least one skill to continue.');
      return;
    }
    // If user already has valid skills, proceed normally
    handleNext();
  };

  // Final CTA Submission (Start my project)
  const handleFinalSubmit = async () => {
    if (!step3Valid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    try {
      const success = await persistChanges();
      if (!success) {
        setSubmitError("Couldn't save your profile. Please check your connection and try again.");
        setIsSubmitting(false);
        return;
      }

      // Re-fetch canonical profile to guarantee truth
      const refetched = await refetch();
      const latestProfile = refetched.data || profile;
      const pComplete = isQuickStartComplete(latestProfile);

      if (!pComplete) {
        const missing = getMissingFields(latestProfile);
        setSubmitError(
          `Profile incomplete: Missing required information (${missing.join(', ')}). Please review your entries.`
        );
        setIsSubmitting(false);
        return;
      }

      // Journey verification: Step 1 and Step 2 must be confirmed
      const jState = getQuickStartJourneyState(userId);
      if (!jState.step1Confirmed || !jState.step2Confirmed) {
        setSubmitError('Please complete all previous steps before starting your project.');
        setIsSubmitting(false);
        return;
      }

      // Mark journey completed
      if (userId) {
        saveQuickStartJourneyState(userId, {
          step3Confirmed: true,
          completed: true,
        });
      }

      router.replace('/dashboard/creator');
    } catch (err: any) {
      setSubmitError(err?.message || 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading && !profile) {
    return (
      <div
        data-testid="quick-start-loading"
        className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-muted-foreground"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-sans text-body font-medium">Preparing your HumainX Quick Start…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-background text-foreground flex flex-col justify-between py-10 sm:py-14 px-4 sm:px-6">
      {/* Centered Main Canvas (Figma 656px width) */}
      <main className="w-full max-w-[656px] mx-auto flex flex-col gap-8">
        {/* Progress and Milestone Tracker */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-caption font-sans">
            <span className="font-semibold tracking-wider text-muted-foreground uppercase text-xs">
              STEP <span className="font-mono">{currentStep}</span> OF <span className="font-mono">3</span>
            </span>
            <span className="text-primary font-medium text-xs">
              {currentStep === 1
                ? 'Your situation'
                : currentStep === 2
                ? 'Your skills'
                : 'How you build'}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-label={`Step ${currentStep} of 3`}
            className="w-full bg-border/60 rounded-full h-1 overflow-hidden"
          >
            <div
              className="bg-primary h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Error notification if submit or validation failed */}
        {submitError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-body flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-semibold text-card-title">Unable to proceed</p>
              <p className="font-sans text-caption mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* SCREEN 1: YOUR SITUATION (Figma Node 57125:16446)    */}
        {/* ==================================================== */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            {/* Header / Editorial Lead */}
            <div>
              <h1 className="font-heading font-semibold text-[32px] sm:text-[36px] leading-[40px] sm:leading-[44px] tracking-tight text-foreground">
                Tell us about your situation.
              </h1>
              <p className="mt-2.5 font-sans text-[15px] sm:text-[16px] leading-relaxed text-muted-foreground">
                Three quick questions. We&apos;ll use them to shape your roadmap, your paperwork, and the statutory financial support you may qualify for.
              </p>
            </div>

            {/* Section 1: Region Selection Card */}
            <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="region-select"
                  className="font-sans font-semibold text-sm text-foreground"
                >
                  Your region
                </label>
                {/* Truthful badge reflecting real frontend context (FIX 04) */}
                <div
                  data-testid="region-badge"
                  data-verified={isTerritoryVerified}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
                >
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{isTerritoryVerified ? 'Territory Verified' : 'Selected region'}</span>
                </div>
              </div>

              {/* Region Select Box with French Flag and Territory Indicator */}
              <div className="relative">
                <div className="h-11 w-full rounded-xl border border-input bg-card px-3.5 flex items-center justify-between text-sm hover:border-primary/50 transition-colors pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="text-base" role="img" aria-label="France">
                      🇫🇷
                    </span>
                    <span className="font-medium text-foreground">France</span>
                  </div>
                  <span className="text-muted-foreground font-normal">{region}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>

                <select
                  id="region-select"
                  aria-label="Your region"
                  value={region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-foreground bg-card"
                >
                  {FRENCH_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      France • {r}
                    </option>
                  ))}
                </select>
              </div>

              <p className="font-sans text-xs text-muted-foreground">
                From your verified address — change it if this isn&apos;t right.
              </p>
            </div>

            {/* Section 2: Current Status Cards Grid */}
            <div className="space-y-4">
              <div>
                <h2 className="font-heading font-semibold text-[19px] sm:text-[20px] text-foreground">
                  What are you doing right now?
                </h2>
                <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Select the activity that occupies most of your daytime schedule.
                </p>
              </div>

              <div
                role="radiogroup"
                aria-label="Current Situation"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
              >
                {CURRENT_SITUATION_UI_OPTIONS.map((opt) => {
                  const isSelected = currentSituation === opt.label;
                  const IconComp = SITUATION_ICONS[opt.id] || Briefcase;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSituationChange(opt.label)}
                      className={`min-h-[97px] p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-[#EEF2FF] dark:bg-primary/10 text-primary shadow-xs ring-1 ring-primary'
                          : 'border-border bg-card hover:border-border/80 text-foreground'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        {/* Circular icon container */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-primary'
                          }`}
                        >
                          <IconComp className="w-4 h-4 text-primary" />
                        </div>

                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <span
                        className={`font-sans text-sm mt-3 ${
                          isSelected ? 'font-semibold text-primary' : 'font-medium text-foreground'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Availability Selector */}
            <div className="space-y-4">
              <div>
                <h2 className="font-heading font-semibold text-[19px] sm:text-[20px] text-foreground">
                  How much time can you give this each week?
                </h2>
                <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Realistic time commitments help us calibrate actionable development sprints.
                </p>
              </div>

              <div
                role="radiogroup"
                aria-label="Weekly Availability"
                className="flex flex-wrap gap-2.5"
              >
                {WEEKLY_AVAILABILITY_UI_OPTIONS.map((opt) => {
                  const isSelected = weeklyAvailability === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleAvailabilityChange(opt.label)}
                      className={`h-[42px] px-5 rounded-full border text-sm font-sans transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-primary/40 bg-[#EEF2FF] dark:bg-primary/10 text-primary font-semibold shadow-xs ring-1 ring-primary/40'
                          : 'border-border bg-card hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="font-sans text-xs text-muted-foreground mt-2">
                You can change this later as your venture accelerates.
              </p>
            </div>

            {/* Trust & Context Notification Box */}
            <div className="p-4 rounded-xl bg-muted/60 dark:bg-muted/30 border border-border/50 flex items-start gap-3 mt-4">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                Your information is protected under French commercial privacy laws and strictly used to personalize government grant applications and statutory support opportunities.{' '}
                <Link href="/privacy" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* SCREEN 2: YOUR SKILLS (Figma Node 57126:16624)       */}
        {/* ==================================================== */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            {/* Header per Figma Node 57126:16624 */}
            <div>
              <h1 className="font-heading font-semibold text-[32px] sm:text-[36px] leading-[40px] sm:leading-[44px] tracking-tight text-foreground">
                What can you already do?
              </h1>
              <p className="mt-2.5 font-sans text-[15px] sm:text-[16px] leading-relaxed text-muted-foreground">
                Tap anything that applies. School projects and self-taught skills count.
              </p>
            </div>

            {/* Skill Suggestion Pills Grid per Figma */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2.5">
                {SUGGESTED_SKILLS.map((skill) => {
                  const isSelected = skills.some(
                    (s) => s.name.toLowerCase() === skill.toLowerCase()
                  );
                  return (
                    <button
                      key={skill}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleSkill(skill)}
                      className={`h-[38px] px-4 rounded-full font-sans text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20'
                          : 'bg-card border border-border hover:border-primary/50 text-foreground'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span>{skill}</span>
                    </button>
                  );
                })}

                {/* Dashed Add Something Else Pill */}
                {!showCustomSkillInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomSkillInput(true)}
                    className="h-[38px] px-4 rounded-full border border-dashed border-border hover:border-primary/60 bg-transparent text-muted-foreground hover:text-foreground font-sans text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add something else</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      id="custom-skill-input"
                      type="text"
                      autoFocus
                      placeholder="Type custom skill..."
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomSkill();
                        } else if (e.key === 'Escape') {
                          setShowCustomSkillInput(false);
                        }
                      }}
                      className="h-[38px] px-4 rounded-full bg-card border border-primary text-foreground font-sans text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      disabled={!customSkillInput.trim()}
                      className="h-[38px] px-4 rounded-full bg-primary text-primary-foreground font-sans text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomSkillInput(false)}
                      className="h-[38px] px-3 rounded-full text-muted-foreground hover:text-foreground font-sans text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: How confident are you with each? (Figma Layout) */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="font-heading font-semibold text-[19px] sm:text-[20px] text-foreground">
                  How confident are you with each?
                </h2>
                <span className="font-sans text-xs text-muted-foreground font-medium">
                  Your selected skills ({skills.length})
                </span>
              </div>

              {/* Confidence Legend dots */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span>Beginner — I know the basics</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>Comfortable — I can do this on my own</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-700 shrink-0" />
                  <span>Advanced — I can handle complex work</span>
                </div>
              </div>

              {/* Selected Skills List */}
              {skills.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-border text-center font-sans text-sm text-muted-foreground bg-card">
                  Tap skills above or add a custom skill to establish your founder capacity.
                </div>
              ) : (
                <div className="space-y-3">
                  {skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-sm text-foreground">
                          {skill.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {/* Segmented Level selector buttons */}
                        <div
                          role="radiogroup"
                          aria-label={`Proficiency level for ${skill.name}`}
                          className="inline-flex rounded-lg border border-input p-0.5 bg-muted/40"
                        >
                          {SKILL_LEVELS.map((lvl) => {
                            const active = skill.level === lvl;
                            return (
                              <button
                                key={lvl}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => updateSkillLevel(skill.name, lvl)}
                                className={`px-3 py-1.5 font-sans text-xs font-medium rounded-md transition-all cursor-pointer ${
                                  active
                                    ? 'bg-card text-primary font-bold shadow-xs border border-primary/30 ring-1 ring-primary/20'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {lvl}
                              </button>
                            );
                          })}
                        </div>

                        {/* Remove skill button */}
                        <button
                          type="button"
                          aria-label={`Remove ${skill.name}`}
                          onClick={() => removeSkill(skill.name)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* SCREEN 3: HOW YOU BUILD (Figma Node 57126:16805)     */}
        {/* ==================================================== */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            {/* Section 1: Previous Experience Stack */}
            <div className="space-y-4">
              <div>
                <h2 className="font-heading font-semibold text-[19px] sm:text-[20px] text-foreground">
                  Have you built something before?
                </h2>
              </div>

              <div
                role="radiogroup"
                aria-label="Previous entrepreneurial experience"
                className="flex flex-col gap-3"
              >
                {PREVIOUS_EXPERIENCE_UI_OPTIONS.map((opt) => {
                  const isSelected = previousEntrepreneurialExperience === opt.title;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleExperienceChange(opt.title)}
                      className={`p-4 sm:p-4.5 rounded-2xl border text-left transition-all flex items-center gap-4 cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-[#EEF2FF] dark:bg-primary/10 shadow-xs ring-1 ring-primary'
                          : 'border-border bg-card hover:border-border/80'
                      }`}
                    >
                      {/* Radio button circle */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-primary' : 'border-muted-foreground/30'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>

                      <div className="flex flex-col">
                        <span
                          className={`font-heading font-medium text-[15px] ${
                            isSelected ? 'text-primary font-semibold' : 'text-foreground'
                          }`}
                        >
                          {opt.title}
                        </span>
                        <p className="font-sans text-[13px] text-muted-foreground mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Progress Preference Grid (2x2 cards) */}
            <div className="space-y-4">
              <div>
                <h2 className="font-heading font-semibold text-[19px] sm:text-[20px] text-foreground">
                  When you hit something you can&apos;t do yet?
                </h2>
              </div>

              <div
                role="radiogroup"
                aria-label="Progress preference"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                {PROGRESS_PREFERENCE_UI_OPTIONS.map((opt) => {
                  const isSelected = progressPreference === opt.title;
                  const IconComp = PROGRESS_ICONS[opt.id] || BookOpen;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handlePreferenceChange(opt.title)}
                      className={`p-4.5 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer min-h-[114px] ${
                        isSelected
                          ? 'border-primary bg-[#EEF2FF] dark:bg-primary/10 shadow-xs ring-1 ring-primary'
                          : 'border-border bg-card hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        {/* Circular icon container */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-primary'
                          }`}
                        >
                          <IconComp className="w-4 h-4 text-primary" />
                        </div>

                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <span
                          className={`font-heading font-semibold text-[15px] ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {opt.title}
                        </span>
                        <p className="font-sans text-[13px] text-muted-foreground mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="font-sans text-xs text-muted-foreground mt-1">
                You can change this any time — we&apos;ll check in when it actually matters.
              </p>
            </div>
          </div>
        )}

        {/* Action Footer Bar per Figma */}
        <div className="pt-4 flex items-center justify-between border-t border-border/40">
          <div>
            {currentStep === 1 ? (
              <div
                data-testid="autosave-indicator"
                className="font-sans text-xs text-muted-foreground flex items-center gap-1.5"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <span>Saving…</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-destructive" />
                    <span className="text-destructive font-medium">Couldn’t save — try again</span>
                  </>
                ) : (
                  <span>Auto-saved to draft profile</span>
                )}
              </div>
            ) : currentStep === 2 ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>
                    <span className="font-mono font-semibold text-foreground">{skills.length}</span>{' '}
                    {skills.length === 1 ? 'skill' : 'skills'} added
                  </span>
                </div>
                {/* Safe "I'll add these later" link (FIX 01 — does not bypass validation or inject fake skills) */}
                <button
                  type="button"
                  onClick={handleSkipSkills}
                  className="text-xs font-sans text-muted-foreground hover:text-foreground underline text-left cursor-pointer"
                >
                  I&apos;ll add these later
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Preferences saved to draft</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="h-11 px-5 rounded-full border border-border bg-card text-foreground font-sans text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !step1Valid) ||
                  (currentStep === 2 && !step2Valid) ||
                  saveStatus === 'saving'
                }
                className="h-11 px-7 rounded-full bg-primary text-primary-foreground font-sans text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={!step3Valid || isSubmitting}
                className="h-11 px-8 rounded-full bg-primary text-primary-foreground font-sans text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing workspace…</span>
                  </>
                ) : (
                  <>
                    <span>Start my project</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Page Footer per Figma (© 2025 Mondial Eco Systems. All rights reserved. • Support • Privacy • Terms) */}
      <footer className="w-full max-w-[656px] mx-auto pt-14 pb-4 flex items-center justify-between text-xs text-muted-foreground font-sans border-t border-border/40 mt-8">
        <span>© 2025 Mondial Eco Systems. All rights reserved.</span>
        <div className="flex items-center gap-6 font-medium">
          <Link href="/support" className="hover:text-foreground transition-colors">
            Support
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function HumainXQuickStartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <HumainXQuickStartInner />
    </Suspense>
  );
}

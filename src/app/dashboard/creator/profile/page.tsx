'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Languages,
  Clock,
  MapPin,
  Compass,
  Award,
  HelpCircle,
  Save,
  Loader2,
  User,
  CheckSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { creatorProfileApi } from '@/lib/api-creator-profile';
import { useTranslation } from '@/hooks/useTranslation';
import {
  type HumainXFormData,
  type HumainXExperience,
  type HumainXEducation,
  type HumainXSkill,
  type HumainXLanguage,
  type SkillLevel,
  type LanguageLevel,
  type ExperienceType,
  CURRENT_SITUATION_OPTIONS,
  WEEKLY_AVAILABILITY_OPTIONS,
  PREVIOUS_EXPERIENCE_OPTIONS,
  PROGRESS_PREFERENCE_OPTIONS,
  FRENCH_REGIONS,
} from '@/types/creator/profile';

const STEP_KEYS = [
  'experience',
  'education',
  'skills',
  'languages',
  'situation',
  'availability',
  'region',
  'businessExperience',
  'learnDelegate',
  'summary',
] as const;

const STEP_TITLES = [
  'Experience',
  'Education & Learning',
  'Skills',
  'Languages',
  'Current Situation',
  'Availability',
  'Region',
  'Business Experience',
  'Learn / Delegate',
  'Profile Summary',
] as const;

const EXPERIENCE_TYPES: ExperienceType[] = [
  'Job',
  'Internship',
  'Freelance',
  'School Project',
  'Personal Project',
  'Volunteer',
  'Association',
  'Previous Business',
  'Other',
];

const SKILL_LEVELS: SkillLevel[] = ['Beginner', 'Comfortable', 'Advanced'];
const LANGUAGE_LEVELS: LanguageLevel[] = ['Basic', 'Conversational', 'Professional', 'Fluent', 'Native'];

function HumainXProfileBuilderInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const ideaId = searchParams.get('ideaId');
  const returnTo = searchParams.get('returnTo') || '/dashboard/creator';
  const initialMode = searchParams.get('mode');

  const [step, setStep] = useState<number>(initialMode === 'view' ? 9 : 0);
  const [hasInitializedStep, setHasInitializedStep] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<HumainXFormData>({
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    ventureContext: {
      currentSituation: '',
      weeklyAvailability: '',
      region: '',
      previousEntrepreneurialExperience: '',
      learningPreference: '',
      delegationPreference: '',
    },
  });

  const [initialSkills, setInitialSkills] = useState<HumainXSkill[]>([]);

  // Helper to determine if a specific step is completed
  const isStepComplete = (idx: number, data: HumainXFormData): boolean => {
    switch (idx) {
      case 0: // Experience
        return data.experiences.length > 0;
      case 1: // Education
        return data.education.length > 0;
      case 2: // Skills
        return data.skills.length > 0;
      case 3: // Languages
        return data.languages.length > 0;
      case 4: // Current Situation
        return Boolean(data.ventureContext.currentSituation?.trim());
      case 5: // Availability
        return Boolean(data.ventureContext.weeklyAvailability?.trim());
      case 6: // Region
        return Boolean(data.ventureContext.region?.trim());
      case 7: // Business Experience
        return Boolean(data.ventureContext.previousEntrepreneurialExperience?.trim());
      case 8: // Learn / Delegate
        return Boolean(
          data.ventureContext.learningPreference?.trim() ||
          data.ventureContext.delegationPreference?.trim()
        );
      case 9: // Summary
        return false;
      default:
        return false;
    }
  };

  // Fetch current profile
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['creator', 'my-profile'],
    queryFn: () => creatorProfileApi.getMyProfile(),
    staleTime: 60000,
  });

  // Populate form with existing data
  useEffect(() => {
    if (!profileData) return;

    const loadedSkills: HumainXSkill[] = (profileData.skills || []).map((s: any) => ({
      name: typeof s === 'string' ? s : s.name,
      level: typeof s === 'object' ? s.level : null,
      source: typeof s === 'object' ? s.source : 'legacy',
      verification: typeof s === 'object' ? s.verification : null,
    }));
    setInitialSkills(loadedSkills);

    const loadedExperiences: HumainXExperience[] = (profileData.experiences || []).map((e: any) => ({
      id: e.id,
      experienceType: e.experienceType || 'Job',
      roleOrProjectTitle: e.jobTitle || '',
      organizationOrProjectName: e.companyName || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      isCurrent: e.isCurrent || false,
      description: e.description || '',
      skillsUsed: e.skillsUsed || [],
    }));

    const loadedEducation: HumainXEducation[] = (profileData.education || []).map((e: any) => ({
      id: e.id,
      institution: e.institution || '',
      subjectOrField: e.fieldOfStudy || '',
      level: e.description || '',
      startYear: e.startYear || new Date().getFullYear() - 4,
      completionYear: e.endYear || undefined,
      qualification: e.degree || '',
    }));

    const loadedLanguages: HumainXLanguage[] = (profileData.languageProficiencies || []).map((l: any) => ({
      id: l.id,
      language: l.language || '',
      level: l.proficiency || 'Conversational',
    }));

    const vc = profileData.ventureContext || {};

    const populatedData: HumainXFormData = {
      experiences: loadedExperiences,
      education: loadedEducation,
      skills: loadedSkills,
      languages: loadedLanguages,
      ventureContext: {
        currentSituation: vc.currentSituation || '',
        weeklyAvailability: vc.weeklyAvailability || '',
        region: vc.region || profileData.country || '',
        previousEntrepreneurialExperience: vc.previousEntrepreneurialExperience || '',
        learningPreference: vc.learningPreference || '',
        delegationPreference: vc.delegationPreference || '',
      },
    };

    setFormData(populatedData);

    // Auto-resume from the first incomplete step, preserving existing Quick Start & profile answers
    if (!hasInitializedStep && initialMode !== 'view') {
      const explicitStep = searchParams.get('step');
      if (explicitStep !== null && !isNaN(Number(explicitStep))) {
        setStep(Math.min(9, Math.max(0, Number(explicitStep))));
      } else {
        const firstIncomplete = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
          (idx) => !isStepComplete(idx, populatedData)
        );
        if (firstIncomplete !== undefined) {
          setStep(firstIncomplete);
        } else {
          setStep(9);
        }
      }
      setHasInitializedStep(true);
    }
  }, [profileData, hasInitializedStep, initialMode, searchParams]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (data: HumainXFormData) =>
      creatorProfileApi.saveHumainXProfile(data, initialSkills),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creator', 'my-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['creator', 'profile-completeness'] });
      void queryClient.invalidateQueries({ queryKey: ['creator', 'phase4-readiness'] });
    },
  });

  const handleSaveAndContinueLater = async () => {
    await saveMutation.mutateAsync(formData);
    router.push(returnTo);
  };

  const handleConfirmProfile = async () => {
    await saveMutation.mutateAsync(formData);
    setSaveSuccessMessage(
      'Your profile is ready. MBC will use it to personalize your roadmap, training, business needs and next actions.'
    );
    setTimeout(() => {
      router.push(returnTo);
    }, 2000);
  };

  // Step navigation: continue remaining/incomplete questions
  const handleNextStep = () => {
    const nextAfter = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
      (idx) => idx > step && !isStepComplete(idx, formData)
    );
    if (nextAfter !== undefined) {
      setStep(nextAfter);
      return;
    }
    const earlierIncomplete = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
      (idx) => idx < step && !isStepComplete(idx, formData)
    );
    if (earlierIncomplete !== undefined) {
      setStep(earlierIncomplete);
      return;
    }
    setStep(9);
  };

  // Skill Input State
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Comfortable');

  const handleAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    if (formData.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillName('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          name: trimmed,
          level: newSkillLevel,
          source: 'SelfDeclared',
          verification: null,
        },
      ],
    }));
    setNewSkillName('');
  };

  const handleRemoveSkill = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.name.toLowerCase() !== name.toLowerCase()),
    }));
  };

  const handleUpdateSkillLevel = (name: string, level: SkillLevel) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) =>
        s.name.toLowerCase() === name.toLowerCase() ? { ...s, level } : s
      ),
    }));
  };

  // Experience handlers
  const handleAddExperience = () => {
    const newExp: HumainXExperience = {
      experienceType: 'Job',
      roleOrProjectTitle: '',
      organizationOrProjectName: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      skillsUsed: [],
    };
    setFormData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, newExp],
    }));
  };

  const handleUpdateExperience = (index: number, patch: Partial<HumainXExperience>) => {
    setFormData((prev) => {
      const updated = [...prev.experiences];
      updated[index] = { ...updated[index], ...patch };
      return { ...prev, experiences: updated };
    });
  };

  const handleRemoveExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  // Education handlers
  const handleAddEducation = () => {
    const newEdu: HumainXEducation = {
      institution: '',
      subjectOrField: '',
      level: '',
      startYear: new Date().getFullYear() - 2,
      qualification: '',
    };
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  const handleUpdateEducation = (index: number, patch: Partial<HumainXEducation>) => {
    setFormData((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], ...patch };
      return { ...prev, education: updated };
    });
  };

  const handleRemoveEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  // Language handlers
  const handleAddLanguage = () => {
    const newLang: HumainXLanguage = {
      language: '',
      level: 'Conversational',
    };
    setFormData((prev) => ({
      ...prev,
      languages: [...prev.languages, newLang],
    }));
  };

  const handleUpdateLanguage = (index: number, patch: Partial<HumainXLanguage>) => {
    setFormData((prev) => {
      const updated = [...prev.languages];
      updated[index] = { ...updated[index], ...patch };
      return { ...prev, languages: updated };
    });
  };

  const handleRemoveLanguage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{t('creator.humainx.profileBuilder.loading', 'Loading your builder profile...')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[960px] py-6 px-4 space-y-8 font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Compass className="w-3.5 h-3.5" />
            {t('creator.humainx.profileBuilder.eyebrow', 'HUMAINX PROFILE BUILDER')}
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {t('creator.humainx.profileBuilder.mainTitle', 'Build your professional identity')}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndContinueLater}
            disabled={saveMutation.isPending}
            className="rounded-xl border-border text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {t('creator.humainx.profileBuilder.saveAndContinueLater', 'Save & Continue Later')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="rounded-xl text-xs font-medium text-muted-foreground"
          >
            <Link href={returnTo}>{t('creator.humainx.profileBuilder.exit', 'Exit')}</Link>
          </Button>
        </div>
      </div>

      {/* Step Stepper Navigation */}
      <div className="flex w-full items-center overflow-x-auto pb-2 scrollbar-none gap-2">
        {STEP_TITLES.map((title, idx) => {
          const isActive = step === idx;
          const isCompleted = isStepComplete(idx, formData);
          return (
            <button
              key={title}
              type="button"
              onClick={() => setStep(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : isCompleted
                    ? 'bg-secondary/70 text-foreground border-border/60'
                    : 'bg-background text-muted-foreground border-border/40 hover:border-border'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive
                    ? 'bg-primary-foreground text-primary'
                    : isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
              </span>
              <span>{t(`creator.humainx.profileBuilder.steps.${STEP_KEYS[idx]}`, title)}</span>
            </button>
          );
        })}
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <Card className="p-4 rounded-2xl border-success/30 bg-success/10 text-success space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {t('creator.humainx.profileBuilder.savedSuccess', 'Profile Saved Successfully')}
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{saveSuccessMessage}</p>
        </Card>
      )}

      {/* STEP CONTENT CONTAINER */}
      <div className="space-y-6">
        {/* STEP 1: EXPERIENCE */}
        {step === 0 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('creator.humainx.profileBuilder.step1Eyebrow', 'STEP 1')}</span>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t('creator.humainx.profileBuilder.step1Title', 'What have you already done?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.step1Desc', 'Add anything that helped you build useful skills — a job, internship, freelance work, school project, personal project, volunteering, association work or a previous business.')}
              </p>
            </div>

            <div className="space-y-4">
              {formData.experiences.map((exp, index) => (
                <Card key={exp.id || index} className="p-5 rounded-2xl border-border/70 bg-background/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      {t('creator.humainx.profileBuilder.experienceNumber', 'Experience #{{number}}', { number: index + 1 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExperience(index)}
                      className="text-destructive hover:bg-destructive/10 h-8 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> {t('creator.humainx.profileBuilder.remove', 'Remove')}
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('creator.humainx.profileBuilder.typeOfExperience', 'Type of Experience')}</Label>
                      <Select
                        value={exp.experienceType}
                        onValueChange={(val) => handleUpdateExperience(index, { experienceType: val })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder={t('creator.humainx.profileBuilder.selectType', 'Select type')} />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_TYPES.map((expType) => (
                            <SelectItem key={expType} value={expType}>{t(`creator.humainx.profileBuilder.expTypes.${expType.toLowerCase().replace(/\s+/g, '_')}`, expType)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('creator.humainx.profileBuilder.roleOrProjectTitle', 'Role or Project Title')}</Label>
                      <Input
                        value={exp.roleOrProjectTitle}
                        onChange={(e) => handleUpdateExperience(index, { roleOrProjectTitle: e.target.value })}
                        placeholder={t('creator.humainx.profileBuilder.rolePlaceholder', 'e.g. Lead Designer, Founder, Volunteer')}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">{t('creator.humainx.profileBuilder.organizationName', 'Organization, Company, or Project Name')}</Label>
                      <Input
                        value={exp.organizationOrProjectName}
                        onChange={(e) => handleUpdateExperience(index, { organizationOrProjectName: e.target.value })}
                        placeholder={t('creator.humainx.profileBuilder.organizationPlaceholder', 'e.g. Acme Corp, EcoClub, Personal App')}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('creator.humainx.profileBuilder.startDate', 'Start Date (Year or Month/Year)')}</Label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) => handleUpdateExperience(index, { startDate: e.target.value })}
                        placeholder={t('creator.humainx.profileBuilder.startDatePlaceholder', 'e.g. 2022-01')}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('creator.humainx.profileBuilder.endDate', 'End Date')}</Label>
                      <Input
                        value={exp.endDate || ''}
                        disabled={exp.isCurrent}
                        onChange={(e) => handleUpdateExperience(index, { endDate: e.target.value })}
                        placeholder={t('creator.humainx.profileBuilder.endDatePlaceholder', 'e.g. 2024-06 or Present')}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">{t('creator.humainx.profileBuilder.descriptionAccomplishments', 'Description & Key Accomplishments')}</Label>
                      <Textarea
                        value={exp.description || ''}
                        onChange={(e) => handleUpdateExperience(index, { description: e.target.value })}
                        placeholder={t('creator.humainx.profileBuilder.descriptionPlaceholder', 'Briefly summarize what you achieved or learned...')}
                        className="rounded-xl min-h-[70px]"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={handleAddExperience}
                className="w-full rounded-2xl border-dashed border-border/80 py-6 text-xs font-semibold text-primary hover:bg-primary/5"
              >
                <Plus className="w-4 h-4 mr-2" /> {t('creator.humainx.profileBuilder.addExperience', 'Add an Experience')}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: EDUCATION & LEARNING */}
        {step === 1 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('creator.humainx.profileBuilder.step2Eyebrow', 'STEP 2')}</span>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t('creator.humainx.profileBuilder.step2Title', 'What have you learned so far?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.step2Desc', 'Include university degrees, diplomas, bootcamps, online certifications, or self-directed learning paths.')}
              </p>
            </div>

            <div className="space-y-4">
              {formData.education.map((edu, index) => (
                <Card key={edu.id || index} className="p-5 rounded-2xl border-border/70 bg-background/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      {t('creator.humainx.profileBuilder.learningNumber', 'Learning #{{number}}', { number: index + 1 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEducation(index)}
                      className="text-destructive hover:bg-destructive/10 h-8 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> {t('creator.humainx.profileBuilder.remove', 'Remove')}
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('creator.humainx.profileBuilder.institution', 'Institution or Platform')}</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => handleUpdateEducation(index, { institution: e.target.value })}
                        placeholder={t('creator.humainx.profileBuilder.institutionPlaceholder', 'e.g. University of Paris, Coursera, Le Wagon')}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('creator.humainx.profileBuilder.subjectField', 'Subject or Field of Study')}</Label>
                      <Input
                        value={edu.subjectOrField}
                        onChange={(e) => handleUpdateEducation(index, { subjectOrField: e.target.value })}
                        placeholder={t('creator.humainx.profileBuilder.subjectPlaceholder', 'e.g. Business Administration, Computer Science')}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('creator.humainx.profileBuilder.degreeLevel', 'Degree / Qualification / Level')}</Label>
                      <Input
                        value={edu.qualification || edu.level || ''}
                        onChange={(e) => handleUpdateEducation(index, { qualification: e.target.value, level: e.target.value })}
                        placeholder={t('creator.humainx.profileBuilder.degreePlaceholder', "e.g. Bachelor's, Certificate, Master's")}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('creator.humainx.profileBuilder.startYear', 'Start Year')}</Label>
                        <Input
                          type="number"
                          value={edu.startYear || ''}
                          onChange={(e) => handleUpdateEducation(index, { startYear: parseInt(e.target.value) || 0 })}
                          placeholder="2020"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('creator.humainx.profileBuilder.completionYear', 'Completion Year')}</Label>
                        <Input
                          type="number"
                          value={edu.completionYear || ''}
                          onChange={(e) => handleUpdateEducation(index, { completionYear: parseInt(e.target.value) || undefined })}
                          placeholder="2024"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={handleAddEducation}
                className="w-full rounded-2xl border-dashed border-border/80 py-6 text-xs font-semibold text-primary hover:bg-primary/5"
              >
                <Plus className="w-4 h-4 mr-2" /> {t('creator.humainx.profileBuilder.addEducation', 'Add Education or Certification')}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: SKILLS */}
        {step === 2 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('creator.humainx.profileBuilder.step3Eyebrow', 'STEP 3')}</span>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t('creator.humainx.profileBuilder.step3Title', 'What can you already do?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.step3Desc', 'Declare your practical skills and proficiency. Skill level is your self-declared proficiency: Beginner, Comfortable, or Advanced. It is never guessed or auto-inferred.')}
              </p>
            </div>

            {/* Add Skill Bar */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border border-border bg-background/60">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">{t('creator.humainx.profileBuilder.skillName', 'Skill Name')}</Label>
                <Input
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder={t('creator.humainx.profileBuilder.skillNamePlaceholder', 'e.g. Figma, Python, B2B Sales, Financial Modeling')}
                  className="rounded-xl"
                />
              </div>
              <div className="w-full sm:w-48 space-y-1">
                <Label className="text-xs">{t('creator.humainx.profileBuilder.yourLevel', 'Your Level')}</Label>
                <Select
                  value={newSkillLevel}
                  onValueChange={(val) => setNewSkillLevel(val as SkillLevel)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>{t(`creator.humainx.profileBuilder.langLevels.${lvl.toLowerCase()}`, lvl)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddSkill}
                  disabled={!newSkillName.trim()}
                  className="rounded-xl font-semibold text-xs px-5 h-10 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> {t('creator.humainx.profileBuilder.addSkill', 'Add Skill')}
                </Button>
              </div>
            </div>

            {/* Active Skills List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('creator.humainx.profileBuilder.declaredSkillsCount', 'Declared Skills ({{count}})', { count: formData.skills.length })}
              </h3>
              {formData.skills.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-2xl border-border text-muted-foreground text-xs">
                  {t('creator.humainx.profileBuilder.noSkillsPrompt', 'No skills declared yet. Add at least one skill to qualify for Phase 4.')}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {formData.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card shadow-xs"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="font-semibold text-sm text-foreground truncate">
                          {skill.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {skill.level ? (
                              <span className="text-primary font-bold">{skill.level}</span>
                            ) : (
                              <span className="italic text-muted-foreground/70">{t('creator.humainx.profileBuilder.unleveled', 'Unleveled')}</span>
                            )}
                          </span>
                          {skill.source && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/70 text-muted-foreground">
                              {skill.source}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Inline Level Picker */}
                        <Select
                          value={skill.level || ''}
                          onValueChange={(val) => handleUpdateSkillLevel(skill.name, val as SkillLevel)}
                        >
                          <SelectTrigger className="h-8 rounded-lg text-xs w-28">
                            <SelectValue placeholder={t('creator.humainx.profileBuilder.setLevel', 'Set level')} />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILL_LEVELS.map((lvl) => (
                              <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSkill(skill.name)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* STEP 4: LANGUAGES */}
        {step === 3 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('creator.humainx.profileBuilder.step4Eyebrow', 'STEP 4')}</span>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t('creator.humainx.profileBuilder.step4Title', 'Which languages can you use?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.step4Desc', 'Add languages you can comfortably communicate in for business, sales, or technical work.')}
              </p>
            </div>

            <div className="space-y-4">
              {formData.languages.map((lang, index) => (
                <div key={lang.id || index} className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl border border-border bg-background/50">
                  <div className="flex-1 w-full space-y-1">
                    <Label className="text-xs">{t('creator.humainx.profileBuilder.language', 'Language')}</Label>
                    <Input
                      value={lang.language}
                      onChange={(e) => handleUpdateLanguage(index, { language: e.target.value })}
                      placeholder={t('creator.humainx.profileBuilder.languagePlaceholder', 'e.g. French, English, Spanish')}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="w-full sm:w-56 space-y-1">
                    <Label className="text-xs">{t('creator.humainx.profileBuilder.proficiencyLevel', 'Proficiency Level')}</Label>
                    <Select
                      value={lang.level}
                      onValueChange={(val) => handleUpdateLanguage(index, { level: val })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_LEVELS.map((lvl) => (
                          <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex sm:self-end pt-2 sm:pt-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLanguage(index)}
                      className="text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={handleAddLanguage}
                className="w-full rounded-2xl border-dashed border-border/80 py-6 text-xs font-semibold text-primary hover:bg-primary/5"
              >
                <Plus className="w-4 h-4 mr-2" /> {t('creator.humainx.profileBuilder.addLanguage', 'Add a Language')}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 5: CURRENT SITUATION */}
        {step === 4 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('creator.humainx.profileBuilder.step5Eyebrow', 'STEP 5')}</span>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t('creator.humainx.profileBuilder.step5Title', 'What best describes your current situation?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.step5Desc', 'This helps MBC personalize recommendations and aids matching. It is not an eligibility score.')}
              </p>
            </div>

            <RadioGroup
              value={formData.ventureContext.currentSituation}
              onValueChange={(val: string) =>
                setFormData((prev) => ({
                  ...prev,
                  ventureContext: { ...prev.ventureContext, currentSituation: val },
                }))
              }
              className="grid gap-3 sm:grid-cols-2"
            >
              {CURRENT_SITUATION_OPTIONS.map((opt) => {
                const isSelected = formData.ventureContext.currentSituation === opt;
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <RadioGroupItem value={opt} id={`situation-${opt}`} />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </Card>
        )}

        {/* STEP 6: WEEKLY AVAILABILITY */}
        {step === 5 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('creator.humainx.profileBuilder.step6Eyebrow', 'STEP 6')}</span>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t('creator.humainx.profileBuilder.step6Title', 'How much time can you realistically dedicate to your project?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.step6Desc', 'This directly drives Phase 4 roadmap pacing, realistic workload calculations, and launch timelines.')}
              </p>
            </div>

            <RadioGroup
              value={formData.ventureContext.weeklyAvailability}
              onValueChange={(val: string) =>
                setFormData((prev) => ({
                  ...prev,
                  ventureContext: { ...prev.ventureContext, weeklyAvailability: val },
                }))
              }
              className="grid gap-3 sm:grid-cols-2"
            >
              {WEEKLY_AVAILABILITY_OPTIONS.map((opt) => {
                const isSelected = formData.ventureContext.weeklyAvailability === opt;
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <RadioGroupItem value={opt} id={`avail-${opt}`} />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </Card>
        )}

        {/* STEP 7: REGION */}
        {step === 6 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('creator.humainx.profileBuilder.step7Eyebrow', 'STEP 7')}</span>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t('creator.humainx.profileBuilder.step7Title', 'Where are you based?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.step7Desc', 'Your region will be used for local grants, French administrative aids, and regional partner matching.')}
              </p>
            </div>

            <div className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('creator.humainx.profileBuilder.primaryRegion', 'Primary Region')}</Label>
                <Select
                  value={formData.ventureContext.region}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      ventureContext: { ...prev.ventureContext, region: val },
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder={t('creator.humainx.profileBuilder.selectRegion', 'Select your region')} />
                  </SelectTrigger>
                  <SelectContent>
                    {FRENCH_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t('creator.humainx.profileBuilder.cityCustomRegion', 'Or specify city/custom region')}</Label>
                <Input
                  value={formData.ventureContext.region || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ventureContext: { ...prev.ventureContext, region: e.target.value },
                    }))
                  }
                  placeholder={t('creator.humainx.profileBuilder.cityCustomPlaceholder', 'e.g. Île-de-France, Paris, Lyon')}
                  className="rounded-xl h-11"
                />
              </div>
            </div>
          </Card>
        )}

        {/* STEP 8: PREVIOUS BUSINESS EXPERIENCE */}
        {step === 7 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('creator.humainx.profileBuilder.step8Eyebrow', 'STEP 8')}</span>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t('creator.humainx.profileBuilder.step8Title', 'Have you worked on a business project before?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.step8Desc', 'Select the statement that best reflects your past entrepreneurial journey.')}
              </p>
            </div>

            <RadioGroup
              value={formData.ventureContext.previousEntrepreneurialExperience}
              onValueChange={(val: string) =>
                setFormData((prev) => ({
                  ...prev,
                  ventureContext: { ...prev.ventureContext, previousEntrepreneurialExperience: val },
                }))
              }
              className="space-y-3"
            >
              {PREVIOUS_EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = formData.ventureContext.previousEntrepreneurialExperience === opt;
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <RadioGroupItem value={opt} id={`prev-exp-${opt}`} />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </Card>
        )}

        {/* STEP 9: LEARN / DELEGATE PREFERENCE */}
        {step === 8 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card space-y-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('creator.humainx.profileBuilder.step9Eyebrow', 'STEP 9')}</span>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t('creator.humainx.profileBuilder.step9Title', 'How do you prefer to handle skills you are missing?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.step9Desc', 'This dictates whether Phase 4 suggests self-paced training modules, freelance delegates, or hybrid workflows.')}
              </p>
            </div>

            <RadioGroup
              value={formData.ventureContext.learningPreference}
              onValueChange={(val: string) => {
                const option = PROGRESS_PREFERENCE_OPTIONS.find((o) => o.label === val);
                setFormData((prev) => ({
                  ...prev,
                  ventureContext: {
                    ...prev.ventureContext,
                    learningPreference: option ? option.learning : val,
                    delegationPreference: option ? option.delegation : val,
                  },
                }));
              }}
              className="space-y-3"
            >
              {PROGRESS_PREFERENCE_OPTIONS.map((opt) => {
                const isSelected = formData.ventureContext.learningPreference === opt.learning;
                return (
                  <label
                    key={opt.label}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <RadioGroupItem value={opt.label} id={`pref-${opt.label}`} />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </Card>
        )}

        {/* STEP 10: PROFILE SUMMARY */}
        {step === 9 && (
          <Card className="p-6 sm:p-8 rounded-3xl border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.02] space-y-8 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {t('creator.humainx.profileBuilder.step10Eyebrow', 'YOUR BUILDER PROFILE')}
                </span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs font-semibold px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {t('creator.humainx.profileBuilder.readyToConfirm', 'Ready to Confirm')}
                </Badge>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {t('creator.humainx.profileBuilder.summaryTitle', 'This is how MBC understands you.')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creator.humainx.profileBuilder.summaryDesc', 'Review your profile summary below. MBC will use this information to tailor your Phase 4 construction roadmap, training suggestions, and resource recommendations.')}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Experience Summary */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> {t('creator.humainx.profileBuilder.yourExperience', 'Your Experience')}
                </span>
                <div className="text-sm font-semibold text-foreground">
                  {formData.experiences.length > 0
                    ? `${formData.experiences.length} recorded experience(s)`
                    : 'No formal experience specified'}
                </div>
                {formData.experiences.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    {formData.experiences.slice(0, 3).map((e, idx) => (
                      <li key={idx}>
                        <span className="font-medium text-foreground">{e.roleOrProjectTitle || 'Project'}</span>
                        {e.organizationOrProjectName ? ` at ${e.organizationOrProjectName}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Skills Summary */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('creator.humainx.profileBuilder.yourSkills', 'Your Skills')}
                </span>
                <div className="text-sm font-semibold text-foreground">
                  {t('creator.humainx.profileBuilder.declaredSkills', '{{count}} declared skill(s)', { count: formData.skills.length })}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.skills.map((s) => (
                    <Badge key={s.name} variant="secondary" className="text-xs font-medium">
                      {s.name} {s.level ? `(${s.level})` : ''}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Current Capacity */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" /> {t('creator.humainx.profileBuilder.yourCurrentCapacity', 'Your Current Capacity')}
                </span>
                <div className="text-sm font-semibold text-foreground">
                  {formData.ventureContext.weeklyAvailability || 'Not specified'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('creator.humainx.profileBuilder.situationPrefix', 'Situation:')} <span className="font-medium text-foreground">{formData.ventureContext.currentSituation || t('creator.humainx.profileBuilder.notSpecified', 'Not specified')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('creator.humainx.profileBuilder.regionPrefix', 'Region:')} <span className="font-medium text-foreground">{formData.ventureContext.region || t('creator.humainx.profileBuilder.notSpecified', 'Not specified')}</span>
                </div>
              </div>

              {/* Business-Building Experience */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" /> {t('creator.humainx.profileBuilder.businessExperienceCard', 'Business Experience')}
                </span>
                <div className="text-sm font-semibold text-foreground">
                  {formData.ventureContext.previousEntrepreneurialExperience || t('creator.humainx.profileBuilder.noPreviousExperience', 'No previous experience recorded')}
                </div>
              </div>

              {/* How You Prefer to Progress */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2 md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-primary" /> {t('creator.humainx.profileBuilder.howYouPreferToProgress', 'How You Prefer to Progress')}
                </span>
                <div className="text-sm font-semibold text-foreground">
                  {formData.ventureContext.learningPreference || t('creator.humainx.profileBuilder.balancedDefault', 'Balanced learning and delegation')}
                </div>
              </div>
            </div>

            {/* Summary Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  const firstIncomplete = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
                    (idx) => !isStepComplete(idx, formData)
                  );
                  setStep(firstIncomplete !== undefined ? firstIncomplete : 0);
                }}
                className="w-full sm:w-auto rounded-xl border-border text-xs font-semibold"
              >
                {t('creator.humainx.profileBuilder.editProfile', 'Edit Profile')}
              </Button>
              <Button
                onClick={handleConfirmProfile}
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-semibold px-8 h-11 shadow-sm hover:bg-primary/90"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('creator.humainx.profileBuilder.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    {t('creator.humainx.profileBuilder.confirmMyProfile', 'Confirm My Profile')}
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* BOTTOM STEP CONTROLS */}
      {step < 9 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-xl border-border text-xs font-semibold px-5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('creator.humainx.profileBuilder.back', 'Back')}
          </Button>

          <Button
            onClick={handleNextStep}
            className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold px-6 shadow-sm"
          >
            {t('creator.humainx.profileBuilder.next', 'Next')} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function HumainXProfileBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <HumainXProfileBuilderInner />
    </Suspense>
  );
}
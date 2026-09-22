import api from '@/lib/axios';
import type {
  ProfileCompletenessResponse,
  Phase4ReadinessResponse,
  HumainXFormData,
  HumainXSkill,
} from '@/types/creator/profile';

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  traceId?: string;
}

const unwrap = <T>(res: { data: ApiEnvelope<T> | T }): T => {
  const payload = res.data;
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

export function prepareHumainXPayload(
  formData: HumainXFormData,
  existingSkills: HumainXSkill[] = []
) {
  const existingByName = new Map<string, HumainXSkill>();
  for (const s of existingSkills) {
    if (s.name) existingByName.set(s.name.trim().toLowerCase(), s);
  }

  const payloadSkills = formData.skills.map((s) => {
    const trimmed = s.name.trim();
    const existing = existingByName.get(trimmed.toLowerCase());
    return {
      name: trimmed,
      level: s.level || existing?.level || null,
      source: s.source || existing?.source || 'SelfDeclared',
      verification: s.verification ?? existing?.verification ?? null,
    };
  });

  const payloadExperiences = formData.experiences.map((e) => ({
    id: e.id,
    jobTitle: e.roleOrProjectTitle,
    companyName: e.organizationOrProjectName,
    experienceType: e.experienceType,
    skillsUsed: e.skillsUsed || [],
    startDate: e.startDate,
    endDate: e.endDate,
    isCurrent: e.isCurrent ?? false,
    description: e.description,
  }));

  const payloadEducation = formData.education.map((e) => ({
    id: e.id,
    institution: e.institution,
    fieldOfStudy: e.subjectOrField,
    degree: e.qualification || e.level || '',
    startYear: e.startYear || new Date().getFullYear(),
    endYear: e.completionYear,
    description: e.level,
  }));

  const payloadLanguages = formData.languages.map((l) => ({
    id: l.id,
    language: l.language,
    proficiency: l.level,
  }));

  return {
    skills: payloadSkills,
    experiences: payloadExperiences,
    education: payloadEducation,
    languageProficiencies: payloadLanguages,
    ventureContext: {
      currentSituation: formData.ventureContext.currentSituation || null,
      weeklyAvailability: formData.ventureContext.weeklyAvailability || null,
      region: formData.ventureContext.region || null,
      previousEntrepreneurialExperience: formData.ventureContext.previousEntrepreneurialExperience || null,
      learningPreference: formData.ventureContext.learningPreference || null,
      delegationPreference: formData.ventureContext.delegationPreference || null,
    },
  };
}

export function calculateLocalCompleteness(formData: HumainXFormData): ProfileCompletenessResponse {
  const missingForPhase4: string[] = [];

  const hasSkills = formData.skills.some((s) => s.name && s.name.trim().length > 0);
  if (!hasSkills) missingForPhase4.push('Skills');

  const hasSituation = Boolean(formData.ventureContext.currentSituation?.trim());
  if (!hasSituation) missingForPhase4.push('CurrentSituation');

  const hasAvailability = Boolean(formData.ventureContext.weeklyAvailability?.trim());
  if (!hasAvailability) missingForPhase4.push('WeeklyAvailability');

  const hasRegion = Boolean(formData.ventureContext.region?.trim());
  if (!hasRegion) missingForPhase4.push('Region');

  const hasProgressPreference = Boolean(
    formData.ventureContext.learningPreference?.trim() || formData.ventureContext.delegationPreference?.trim()
  );
  if (!hasProgressPreference) missingForPhase4.push('ProgressPreference');

  const hasExperience = formData.experiences.length > 0;
  const hasEducation = formData.education.length > 0;
  const hasLanguages = formData.languages.length > 0;

  let completedCriteria = 0;
  if (hasSkills) completedCriteria++;
  if (hasSituation) completedCriteria++;
  if (hasAvailability) completedCriteria++;
  if (hasRegion) completedCriteria++;
  if (hasProgressPreference) completedCriteria++;
  if (hasExperience) completedCriteria++;
  if (hasEducation) completedCriteria++;
  if (hasLanguages) completedCriteria++;

  const profileCompletion = Math.round((completedCriteria / 8) * 100);
  const phase4Ready = missingForPhase4.length === 0;

  return {
    profileCompletion,
    phase4Ready,
    missingForPhase4,
  };
}

export interface HumainXQuickStartBackendStatus {
  version: number;
  step1ConfirmedAt: string | null;
  step2ConfirmedAt: string | null;
  step3ConfirmedAt: string | null;
  completedAt: string | null;
  completed: boolean;
  nextRequiredStep: 1 | 2 | 3 | null;
}

export const creatorProfileApi = {
  async getCompleteness(): Promise<ProfileCompletenessResponse> {
    const res = await api.get<ApiEnvelope<ProfileCompletenessResponse>>('/profile/me/completeness');
    return unwrap(res);
  },

  async getMyProfile(): Promise<any> {
    const res = await api.get<ApiEnvelope<any>>('/profile/me');
    return unwrap(res);
  },

  async getQuickStartStatus(): Promise<HumainXQuickStartBackendStatus> {
    const res = await api.get<ApiEnvelope<HumainXQuickStartBackendStatus>>('/creator/quick-start/status');
    return unwrap(res);
  },

  async confirmQuickStartStep1(payload: {
    region: string;
    currentSituation: string;
    weeklyAvailability: string;
  }): Promise<HumainXQuickStartBackendStatus> {
    const res = await api.post<ApiEnvelope<HumainXQuickStartBackendStatus>>('/creator/quick-start/step1', payload);
    return unwrap(res);
  },

  async confirmQuickStartStep2(payload: {
    skills: { name: string; level: string; source?: string; verification?: any }[];
  }): Promise<HumainXQuickStartBackendStatus> {
    const res = await api.post<ApiEnvelope<HumainXQuickStartBackendStatus>>('/creator/quick-start/step2', payload);
    return unwrap(res);
  },

  async completeQuickStart(payload: {
    previousEntrepreneurialExperience: string;
    progressPreference?: string;
    learningPreference?: string;
    delegationPreference?: string;
  }): Promise<HumainXQuickStartBackendStatus> {
    const res = await api.post<ApiEnvelope<HumainXQuickStartBackendStatus>>('/creator/quick-start/complete', payload);
    return unwrap(res);
  },

  async getPhase4Readiness(ideaId?: string | null): Promise<Phase4ReadinessResponse> {
    const res = await api.get<ApiEnvelope<Phase4ReadinessResponse>>('/creator/offer/readiness', {
      params: ideaId ? { ideaId } : {},
    });
    return unwrap(res);
  },

  async saveHumainXProfile(formData: HumainXFormData, existingSkills: HumainXSkill[] = []): Promise<any> {
    const payload = prepareHumainXPayload(formData, existingSkills);
    const res = await api.put<ApiEnvelope<any>>('/profile/me', payload);
    return unwrap(res);
  },
};

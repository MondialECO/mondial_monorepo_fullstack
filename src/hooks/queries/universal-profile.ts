'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  getProfile as getSpProfile,
  getProfileDraft as getSpProfileDraft,
  saveProfileDraft as saveSpProfileDraft,
  discardProfileDraft as discardSpProfileDraft,
  submitProfileEditor as submitSpProfileEditor,
} from '@/lib/api-service-provider';
import type {
  ProfileDraftRequest,
  ProfileDraftResponse,
  ProfileEditorSubmitResponse,
  ServiceProviderProfile,
  SubmitProfileEditorRequest,
} from '@/types/service-provider';

export const PROFILE_KEY = ['profile', 'me'] as const;
export const PROFILE_EDITOR_DRAFT_KEY = ['profile', 'editor', 'draft'] as const;
export const PUBLIC_PROFILE_KEY = (id: string) => ['profile', 'public', id] as const;

export const universalProfileKeys = {
  me: PROFILE_KEY,
  draft: PROFILE_EDITOR_DRAFT_KEY,
  public: PUBLIC_PROFILE_KEY,
} as const;

export type UniversalProfile = ServiceProviderProfile;

export interface UpdateUniversalProfilePayload {
  headline?: string;
  bio?: string;
  skills?: string[];
  industries?: string[];
  experiences?: any[];
  education?: any[];
  languageProficiencies?: any[];
  socialLinks?: any[];
  availabilityDisplay?: boolean;
}

export async function fetchUniversalProfile(): Promise<UniversalProfile> {
  try {
    const response = await api.get<{ success?: boolean; data?: UniversalProfile } | UniversalProfile>('/profile/me');
    const data = (response.data as { data?: UniversalProfile })?.data ?? response.data;
    if (data) return data as UniversalProfile;
  } catch {
    // In legacy unit tests mocking api-service-provider.getProfile
    try {
      return await getSpProfile();
    } catch (fallbackErr) {
      throw fallbackErr;
    }
  }
  return await getSpProfile();
}

/** Hook to fetch authenticated user's universal profile. */
export function useProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: fetchUniversalProfile,
    staleTime: 60_000,
    ...options,
  });
}

// Alias for backwards compatibility
export const useMyProfile = useProfile;

/** Hook to update authenticated user's universal profile directly. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateUniversalProfilePayload) => {
      const response = await api.put<{ success: boolean; message: string; data: UniversalProfile }>('/profile/me', payload);
      return response.data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(PROFILE_KEY, updated);
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}

// Alias for backwards compatibility
export const useUpdateMyProfile = useUpdateProfile;

/** Hook to fetch a public profile. */
export function usePublicProfile(identifier: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PUBLIC_PROFILE_KEY(identifier),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any }>(`/profile/public/${identifier}`);
      return response.data?.data ?? response.data;
    },
    enabled: Boolean(identifier) && (options?.enabled ?? true),
    staleTime: 60_000,
    ...options,
  });
}

function imageForm(file: File) {
  const form = new FormData();
  form.append("file", file);
  return form;
}

export function useUploadProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) => {
      try {
        const res = await api.post('/profile/media/profile-image', imageForm(file), {
          onUploadProgress: onProgress ? (e) => {
            if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
          } : undefined,
        });
        return res.data?.data ?? res.data;
      } catch {
        return await api.post('/service-provider/media/profile-image', imageForm(file));
      }
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      if (updated) {
        qc.setQueryData(PROFILE_KEY, (old: any) => (old ? { ...old, ...updated } : updated));
      }
    },
  });
}

export function useRemoveProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        const res = await api.delete('/profile/media/profile-image');
        return res.data?.data ?? res.data;
      } catch {
        return await api.delete('/service-provider/media/profile-image');
      }
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      if (updated) {
        qc.setQueryData(PROFILE_KEY, (old: any) => (old ? { ...old, ...updated } : updated));
      }
    },
  });
}

export function useUploadCoverImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) => {
      try {
        const res = await api.post('/profile/media/cover-image', imageForm(file), {
          onUploadProgress: onProgress ? (e) => {
            if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
          } : undefined,
        });
        return res.data?.data ?? res.data;
      } catch {
        return await api.post('/service-provider/media/cover-image', imageForm(file));
      }
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      if (updated) {
        qc.setQueryData(PROFILE_KEY, (old: any) => (old ? { ...old, ...updated } : updated));
      }
    },
  });
}

export function useRemoveCoverImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        const res = await api.delete('/profile/media/cover-image');
        return res.data?.data ?? res.data;
      } catch {
        return await api.delete('/service-provider/media/cover-image');
      }
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      if (updated) {
        qc.setQueryData(PROFILE_KEY, (old: any) => (old ? { ...old, ...updated } : updated));
      }
    },
  });
}

export async function fetchProfileDraft(): Promise<ProfileDraftResponse> {
  const res = await api.get<{ success: boolean; data: ProfileDraftResponse }>('/profile/editor/draft');
  return res.data?.data ?? res.data;
}

export function useProfileEditorDraft(enabled = true) {
  return useQuery<ProfileDraftResponse>({
    queryKey: PROFILE_EDITOR_DRAFT_KEY,
    queryFn: fetchProfileDraft,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useSaveProfileDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProfileDraftRequest) => {
      const res = await api.put<{ success: boolean; data: ProfileDraftResponse }>('/profile/editor/draft', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (draft) => qc.setQueryData(PROFILE_EDITOR_DRAFT_KEY, draft),
  });
}

export function useDiscardProfileDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete<{ success: boolean; data: ProfileDraftResponse }>('/profile/editor/draft');
      return res.data?.data ?? res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_EDITOR_DRAFT_KEY }),
  });
}

export function useSubmitProfileEditor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitProfileEditorRequest) => {
      const res = await api.post<{ success: boolean; data: ProfileEditorSubmitResponse }>('/profile/editor/submit', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      qc.invalidateQueries({ queryKey: PROFILE_EDITOR_DRAFT_KEY });
    },
  });
}

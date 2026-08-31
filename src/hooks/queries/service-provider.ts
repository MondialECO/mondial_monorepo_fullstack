'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPortfolioItem,
  deleteCredential,
  deletePortfolioItem,
  discardProfileDraft,
  getProfile,
  getProfileDraft,
  getSkillsTestQuestions,
  getSkillsTestStatus,
  getTrust,
  removeCoverImage,
  removePortfolioImage,
  removeProfileImage,
  saveProfileDraft,
  submitProfileEditor,
  submitSkillsTest,
  submitVerification,
  updatePortfolioItem,
  uploadCoverImage,
  uploadCredentialDocument,
  uploadPortfolioImage,
  uploadProfileImage,
  upsertCredential,
} from '@/lib/api-service-provider';
import type {
  ProfileDraftResponse,
  ServiceProviderProfile,
  SkillsTestStatus,
  TrustBreakdown,
} from '@/types/service-provider';

const PROFILE_KEY = ['serviceProvider', 'profile'] as const;
const TRUST_KEY = ['serviceProvider', 'trust'] as const;
const SKILLS_TEST_KEY = ['serviceProvider', 'skillsTest', 'status'] as const;
const EDITOR_DRAFT_KEY = ['serviceProvider', 'profileEditor', 'draft'] as const;

export const serviceProviderKeys = {
  profile: PROFILE_KEY,
  trust: TRUST_KEY,
  skillsTest: SKILLS_TEST_KEY,
  editorDraft: EDITOR_DRAFT_KEY,
} as const;

export const useServiceProviderProfile = (enabled = true) =>
  useQuery<ServiceProviderProfile>({
    queryKey: PROFILE_KEY,
    queryFn: getProfile,
    enabled,
  });

export const useAddPortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addPortfolioItem,
    onSuccess: (profile) => qc.setQueryData(PROFILE_KEY, profile),
  });
};

export const useUpdatePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePortfolioItem,
    onSuccess: (profile) => qc.setQueryData(PROFILE_KEY, profile),
  });
};

export const useDeletePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePortfolioItem,
    onSuccess: (profile) => qc.setQueryData(PROFILE_KEY, profile),
  });
};

function useProfileResultMutation<T>(mutationFn: (input: T) => Promise<ServiceProviderProfile>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (profile) => qc.setQueryData(PROFILE_KEY, profile),
  });
}

export const useUploadProfileImage = () =>
  useProfileResultMutation<{ file: File; onProgress?: (percent: number) => void }>(
    ({ file, onProgress }) => uploadProfileImage(file, onProgress)
  );

export const useRemoveProfileImage = () =>
  useProfileResultMutation<void>(() => removeProfileImage());

export const useUploadCoverImage = () =>
  useProfileResultMutation<{ file: File; onProgress?: (percent: number) => void }>(
    ({ file, onProgress }) => uploadCoverImage(file, onProgress)
  );

export const useRemoveCoverImage = () =>
  useProfileResultMutation<void>(() => removeCoverImage());

export const useUploadPortfolioImage = () =>
  useProfileResultMutation<{
    portfolioItemId: string;
    file: File;
    caption?: string | null;
    onProgress?: (percent: number) => void;
  }>(({ portfolioItemId, file, caption, onProgress }) =>
    uploadPortfolioImage(portfolioItemId, file, caption, onProgress)
  );

export const useRemovePortfolioImage = () =>
  useProfileResultMutation<string>((portfolioItemId) => removePortfolioImage(portfolioItemId));

// submit-verification returns the smaller verification projection, so we
// invalidate to pull the full profile with the updated status.
export const useSubmitVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitVerification,
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
};

// ---- Profile editor (four-step wizard) ----

// Opening the editor is a pure server read — no write happens because the page
// mounted. `staleTime: Infinity` also stops a background refetch from clobbering
// the provider's in-progress local edits.
export const useProfileEditorDraft = (enabled = true) =>
  useQuery<ProfileDraftResponse>({
    queryKey: EDITOR_DRAFT_KEY,
    queryFn: getProfileDraft,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

// A draft save touches only the stored draft, so the published profile cache is
// deliberately left alone.
export const useSaveProfileDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveProfileDraft,
    onSuccess: (draft) => qc.setQueryData(EDITOR_DRAFT_KEY, draft),
  });
};

export const useDiscardProfileDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: discardProfileDraft,
    onSuccess: (draft) => qc.setQueryData(EDITOR_DRAFT_KEY, draft),
  });
};

// Final submit is the only path that publishes. It returns the freshly published
// profile, so we seed it and refresh just the profile-scoped queries — never a
// blanket Service Provider invalidation.
export const useSubmitProfileEditor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitProfileEditor,
    onSuccess: (result) => {
      qc.setQueryData(PROFILE_KEY, result.profile);
      qc.removeQueries({ queryKey: EDITOR_DRAFT_KEY });
      qc.invalidateQueries({ queryKey: TRUST_KEY });
    },
  });
};

// Credentials are independent records: they persist immediately and must survive
// a failed profile submit, so they never touch the draft cache.
export const useUpsertCredential = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertCredential,
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
};

export const useUploadCredentialDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      credentialId,
      file,
      onProgress,
    }: {
      credentialId: string;
      file: File;
      onProgress?: (percent: number) => void;
    }) => uploadCredentialDocument(credentialId, file, onProgress),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
};

export const useDeleteCredential = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
};

// ---- Module 1: Profile & Trust ----

// Trust + skills-test are only meaningful once verified; callers pass `enabled`
// so the panels stay dormant (no request) until the badge is granted.
export const useServiceProviderTrust = (enabled = true) =>
  useQuery<TrustBreakdown>({
    queryKey: TRUST_KEY,
    queryFn: getTrust,
    enabled,
  });

export const useSkillsTestStatus = (enabled = true) =>
  useQuery<SkillsTestStatus>({
    queryKey: SKILLS_TEST_KEY,
    queryFn: getSkillsTestStatus,
    enabled,
  });

// Questions are fetched imperatively when the provider starts a test (a GET with
// a param), so this is exposed as a mutation rather than a standing query.
export const useStartSkillsTest = () =>
  useMutation({ mutationFn: (category: string) => getSkillsTestQuestions(category) });

// A graded submission changes the trust score and the category's cooldown, so we
// refresh trust, the skills-test status, and the profile (trustScore lives there too).
export const useSubmitSkillsTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitSkillsTest,
    onSuccess: (result) => {
      qc.setQueryData(TRUST_KEY, result.trust);
      qc.invalidateQueries({ queryKey: SKILLS_TEST_KEY });
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
};

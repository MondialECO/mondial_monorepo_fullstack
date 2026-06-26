import axios from '@/lib/axios';
import { CreateIdeaModel, SaveIdeaResponse } from '@/types/creator/create-idea-model';

export const saveIdeaDraftApi = async (
  model: CreateIdeaModel
): Promise<SaveIdeaResponse> => {
  const formData = new FormData();

  // Append DTO fields
  Object.entries(model).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      key === 'media' ||
      key === 'documents' ||
      key === 'id'
    ) return;

    formData.append(key, String(value));
  });

  // Media
  model.media?.forEach(file => {
    formData.append('media', file);
  });

  // Documents
  model.documents?.forEach(file => {
    formData.append('documents', file);
  });

  const response = await axios.post<SaveIdeaResponse>(
    `/creator/new-idea/${model.id ?? ''}`,
    formData
  );

  return response.data;
};






export const getDashboardStats = async () => {
  const response = await axios.get("/creator/dashboard");
  return response.data;
}

export const getDashboardMyIdeas = async () => {
  const response = await axios.get("/creator/my-ideas");
  return response.data;
}

export const pauseIdeaApi = async (ideaId: string) => {
  const response = await axios.post(`/creator/toggle-idea/${ideaId}`);
  return response.data;
}

export const getInvestorIdeas = async () => {
  const response = await axios.get("/creator/investor-ideas");
  return response.data;
}

export const getProfile = async () => {
  const response = await axios.get("/creator/profile");
  return response.data;
}

export const getBilling = async () => {
  const response = await axios.get("/creator/billing");
  return response.data;
}

export const getSettings = async () => {
  const response = await axios.get("/creator/settings");
  return response.data;
}
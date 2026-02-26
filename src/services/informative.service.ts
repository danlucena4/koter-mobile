import { AxiosError } from 'axios';
import api from '../lib/api';
import { Informative, InformativeCategory, PaginatedResponse } from '../@types/informative';

type PaginationParams = {
  page?: number;
  pageSize?: number;
};

type InformativeFilters = {
  category?: InformativeCategory;
  stateId?: string;
  companyId?: string;
  search?: string;
};

const mojibakePattern = /Ã.|Â.|â[\u0080-\u00bf]/;

const decodeUtf8FromLatin1 = (value: string) => {
  if (!value || !mojibakePattern.test(value)) {
    return value;
  }

  let encoded = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code > 255) {
      return value;
    }
    encoded += `%${code.toString(16).padStart(2, '0')}`;
  }

  try {
    return decodeURIComponent(encoded);
  } catch {
    return value;
  }
};

const normalizeInformative = (informative: Informative): Informative => ({
  ...informative,
  title: decodeUtf8FromLatin1(informative.title || ''),
  content: decodeUtf8FromLatin1(informative.content || ''),
});

export const informativeService = {
  async fetchActiveInformatives(
    { page = 1, pageSize = 10 }: PaginationParams,
    filters?: InformativeFilters
  ): Promise<PaginatedResponse<Informative>> {
    try {
      const response = await api.get<PaginatedResponse<Informative>>('/informatives/active', {
        params: {
          page,
          pageSize,
          ...filters,
        },
      });

      return {
        ...response.data,
        data: Array.isArray(response.data.data)
          ? response.data.data.map(normalizeInformative)
          : [],
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      throw new Error(
        axiosError.response?.data?.message || 'Não foi possível carregar os informativos.'
      );
    }
  },

  async getInformativeById(id: string): Promise<Informative> {
    try {
      const response = await api.get<{ informative: Informative }>(`/informatives/${id}`);
      return normalizeInformative(response.data.informative);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      throw new Error(
        axiosError.response?.data?.message || 'Não foi possível carregar o informativo.'
      );
    }
  },
};

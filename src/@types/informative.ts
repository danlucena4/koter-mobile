export enum InformativeCategory {
  UPDATE = 0,
  CAMPAIGN = 1,
  NEWS = 2,
}

export interface Informative {
  id: string;
  stateId?: string | null;
  companyId?: string | null;
  title: string;
  category: InformativeCategory;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: T[];
}

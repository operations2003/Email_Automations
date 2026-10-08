export interface Company {
  id: string;
  name: string;
  email: string;
  description?: string;
  website?: string;
  industry?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Admin user ID who created this company
}

export interface CreateCompanyRequest {
  name: string;
  email: string;
  description?: string;
  website?: string;
  industry?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  email?: string;
  description?: string;
  website?: string;
  industry?: string;
  isActive?: boolean;
}

export interface CompanyResponse {
  success: boolean;
  company?: Company;
  companies?: Company[];
  error?: string;
  message?: string;
}
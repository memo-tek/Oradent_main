import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/lib/api';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  insuranceCompany?: string;
  insurancePlan?: string;
  groupNumber?: string;
  memberId?: string;
  subscriberName?: string;
  subscriberDob?: string;
  coveragePercent?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  smoking: boolean;
  alcohol: boolean;
  pregnancy: boolean;
  status: 'active' | 'inactive' | 'archived';
  lastVisit?: string;
  avatarUrl?: string;
  accountBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientListResponse {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CreatePatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'lastVisit' | 'accountBalance' | 'avatarUrl'>;
export type UpdatePatientInput = Partial<CreatePatientInput>;

export function usePatients(params: PatientListParams = {}) {
  const queryString = new URLSearchParams();
  if (params.search) queryString.set('search', params.search);
  if (params.status) queryString.set('status', params.status);
  if (params.page) queryString.set('page', String(params.page));
  if (params.limit) queryString.set('limit', String(params.limit));
  if (params.sortBy) queryString.set('sortBy', params.sortBy);
  if (params.sortOrder) queryString.set('sortOrder', params.sortOrder);

  return useQuery<PatientListResponse>({
    queryKey: ['patients', params],
    queryFn: () => apiGet<PatientListResponse>(`/api/patients?${queryString.toString()}`),
  });
}

export function usePatient(id: string | undefined) {
  return useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: () => apiGet<Patient>(`/api/patients/${id}`),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientInput) =>
      apiPost<Patient, CreatePatientInput>('/api/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePatientInput) =>
      apiPut<Patient, UpdatePatientInput>(`/api/patients/${id}`, data),
    onSuccess: (updatedPatient) => {
      queryClient.setQueryData(['patient', id], updatedPatient);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

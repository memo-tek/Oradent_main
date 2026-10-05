import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/lib/api';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  chair: string;
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  procedures?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TodayScheduleItem {
  id: string;
  time: string;
  patientName: string;
  patientId: string;
  type: string;
  chair: string;
  status: Appointment['status'];
  duration: number;
  provider: string;
}

export interface AppointmentListParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  providerId?: string;
  patientId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentListResponse {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CreateAppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'patientName' | 'providerName'>;
export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

export function useAppointments(params: AppointmentListParams = {}) {
  const queryString = new URLSearchParams();
  if (params.date) queryString.set('date', params.date);
  if (params.startDate) queryString.set('startDate', params.startDate);
  if (params.endDate) queryString.set('endDate', params.endDate);
  if (params.providerId) queryString.set('providerId', params.providerId);
  if (params.patientId) queryString.set('patientId', params.patientId);
  if (params.status) queryString.set('status', params.status);
  if (params.page) queryString.set('page', String(params.page));
  if (params.limit) queryString.set('limit', String(params.limit));

  return useQuery<AppointmentListResponse>({
    queryKey: ['appointments', params],
    queryFn: () => apiGet<AppointmentListResponse>(`/api/appointments?${queryString.toString()}`),
  });
}

export function useTodaySchedule() {
  return useQuery<TodayScheduleItem[]>({
    queryKey: ['todaySchedule'],
    queryFn: () => apiGet<TodayScheduleItem[]>('/api/appointments/today/schedule'),
    refetchInterval: 60_000,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentInput) =>
      apiPost<Appointment, CreateAppointmentInput>('/api/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaySchedule'] });
    },
  });
}

export function useUpdateAppointment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAppointmentInput) =>
      apiPut<Appointment, UpdateAppointmentInput>(`/api/appointments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaySchedule'] });
    },
  });
}

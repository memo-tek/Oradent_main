import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/lib/api';

export interface ToothCondition {
  toothNumber: number;
  conditions: string[];
  surfaces?: string[];
  notes?: string;
  restorations?: Restoration[];
}

export interface Restoration {
  id: string;
  type: string;
  surface: string;
  material?: string;
  date?: string;
  status: 'existing' | 'planned' | 'completed';
}

export interface DentalChartData {
  patientId: string;
  teeth: ToothCondition[];
  lastUpdated: string;
  updatedBy?: string;
}

export interface UpdateToothInput {
  toothNumber: number;
  conditions?: string[];
  surfaces?: string[];
  notes?: string;
  restorations?: Restoration[];
}

export function useDentalChart(patientId: string | undefined) {
  return useQuery<DentalChartData>({
    queryKey: ['dentalChart', patientId],
    queryFn: () => apiGet<DentalChartData>(`/api/dental-chart/${patientId}`),
    enabled: !!patientId,
  });
}

export function useUpdateTooth(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateToothInput) =>
      apiPut<DentalChartData, UpdateToothInput>(
        `/api/dental-chart/${patientId}/tooth/${data.toothNumber}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dentalChart', patientId] });
    },
  });
}

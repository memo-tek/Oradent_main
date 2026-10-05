import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';

export interface XrayAnalysisResult {
  id: string;
  imageId: string;
  findings: AnalysisFinding[];
  summary: string;
  confidence: number;
  analyzedAt: string;
}

export interface AnalysisFinding {
  type: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface TreatmentSuggestion {
  id: string;
  patientId: string;
  suggestions: SuggestionItem[];
  generatedAt: string;
}

export interface SuggestionItem {
  procedureCode: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  toothNumber?: number;
  reasoning: string;
  estimatedCost?: number;
}

export interface GeneratedNote {
  id: string;
  patientId: string;
  appointmentId?: string;
  content: string;
  type: 'progress' | 'treatment' | 'consultation';
  generatedAt: string;
}

export function useAnalyzeXray() {
  return useMutation({
    mutationFn: (data: { imageId: string; patientId: string }) =>
      apiPost<XrayAnalysisResult>('/api/ai/analyze-xray', data),
  });
}

export function useSuggestTreatment() {
  return useMutation({
    mutationFn: (data: { patientId: string; context?: string }) =>
      apiPost<TreatmentSuggestion>('/api/ai/suggest-treatment', data),
  });
}

export function useGenerateNote() {
  return useMutation({
    mutationFn: (data: {
      patientId: string;
      appointmentId?: string;
      type: 'progress' | 'treatment' | 'consultation';
      context?: string;
    }) => apiPost<GeneratedNote>('/api/ai/generate-note', data),
  });
}

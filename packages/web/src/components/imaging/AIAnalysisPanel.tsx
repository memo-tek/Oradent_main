'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Brain,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ApiClientError, apiGet, apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AIAnalysisPanelProps {
  imageId: string;
  patientId: string;
  onClose: () => void;
}

interface Finding {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  toothNumber?: number;
  confidence: number;
}

interface AnalysisResult {
  id: string;
  imageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  findings: Finding[];
  summary: string;
  analyzedAt: string;
}

function normalizeAnalysisResponse(response: unknown): AnalysisResult {
  let record = response;
  while (
    record &&
    typeof record === 'object' &&
    'data' in record &&
    (record as { data?: unknown }).data !== undefined
  ) {
    record = (record as { data: unknown }).data;
  }

  if (!record || typeof record !== 'object') {
    throw new Error('The analysis response was empty or invalid.');
  }

  const savedAnalysis = record as Record<string, unknown>;
  const output =
    savedAnalysis.output && typeof savedAnalysis.output === 'object'
      ? (savedAnalysis.output as Record<string, unknown>)
      : savedAnalysis;
  const findings = Array.isArray(savedAnalysis.findings)
    ? savedAnalysis.findings
    : output.findings;

  if (!Array.isArray(findings)) {
    throw new Error('The analysis response did not include findings.');
  }

  return {
    ...(output as Partial<AnalysisResult>),
    id: String(savedAnalysis.id ?? output.id ?? ''),
    imageId: String(savedAnalysis.imageId ?? output.imageId ?? ''),
    status:
      savedAnalysis.status === 'pending' ||
      savedAnalysis.status === 'processing' ||
      savedAnalysis.status === 'failed'
        ? savedAnalysis.status
        : 'completed',
    findings: findings as Finding[],
    summary: String(savedAnalysis.summary ?? output.summary ?? ''),
    analyzedAt: String(savedAnalysis.analyzedAt ?? output.analyzedAt ?? ''),
  };
}

const SEVERITY_STYLES: Record<string, { bg: string; icon: typeof CheckCircle2 }> = {
  low: { bg: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle2 },
  medium: { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: Info },
  high: { bg: 'bg-red-50 border-red-200 text-red-800', icon: AlertTriangle },
};

export function AIAnalysisPanel({
  imageId,
  patientId,
  onClose,
}: AIAnalysisPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();
  const analysisQueryKey = ['ai-analysis', imageId];

  const { data: analysis, isLoading } = useQuery<AnalysisResult | null>({
    queryKey: analysisQueryKey,
    queryFn: async () => {
      try {
        const response = await apiGet<unknown>(`/api/ai/xray-analysis/${imageId}`);
        return normalizeAnalysisResponse(response);
      } catch (error) {
        if (error instanceof ApiClientError && error.statusCode === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const runAnalysis = useMutation({
    mutationFn: async () =>
      normalizeAnalysisResponse(await apiPost<unknown>(
        `/api/ai/analyze-xray`,
        { imageId, patientId }
      )),
    onMutate: () => setIsRunning(true),
    onSuccess: async (result) => {
      setIsRunning(false);
      queryClient.setQueryData(analysisQueryKey, result);
      await queryClient.invalidateQueries({ queryKey: analysisQueryKey, exact: true });
    },
    onError: () => setIsRunning(false),
  });

  const hasResults =
    analysis && analysis.status === 'completed';

  return (
    <Dialog.Root open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-600" />
              <Dialog.Title className="text-lg font-semibold text-stone-900">
                AI Analysis
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                <p className="mt-3 text-sm text-stone-500">Loading analysis...</p>
              </div>
            ) : isRunning || analysis?.status === 'processing' ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <Brain className="h-12 w-12 text-teal-600" />
                  <Loader2 className="absolute -right-1 -top-1 h-5 w-5 animate-spin text-teal-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-stone-700">
                  Analyzing Image
                </h3>
                <p className="mt-1 text-center text-sm text-stone-500">
                  Our AI is examining the X-ray for potential findings. This
                  typically takes 15-30 seconds.
                </p>
              </div>
            ) : hasResults ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <h3 className="text-sm font-semibold text-stone-700">
                    Summary
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {analysis.summary}
                  </p>
                </div>

                {/* Findings */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-stone-700">
                    Findings ({analysis.findings.length})
                  </h3>
                  <div className="space-y-3">
                    {analysis.findings.map((finding) => {
                      const style = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.low;
                      const Icon = style.icon;
                      return (
                        <div
                          key={finding.id}
                          className={cn(
                            'rounded-lg border p-4',
                            style.bg
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {finding.type}
                                  {finding.toothNumber &&
                                    ` - Tooth #${finding.toothNumber}`}
                                </p>
                                <span className="text-xs font-medium opacity-75">
                                  {Math.round(finding.confidence * 100)}%
                                  confidence
                                </span>
                              </div>
                              <p className="mt-1 text-sm opacity-90">
                                {finding.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-stone-300" />
                <h3 className="mt-4 text-lg font-medium text-stone-700">
                  No Analysis Yet
                </h3>
                <p className="mt-1 text-center text-sm text-stone-500">
                  Run AI analysis to detect potential findings in this X-ray
                  image.
                </p>
                {runAnalysis.error && (
                  <p role="alert" className="mt-3 text-center text-sm text-red-600">
                    {runAnalysis.error.message}
                  </p>
                )}
                <button
                  onClick={() => runAnalysis.mutate()}
                  disabled={runAnalysis.isPending}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  <Brain className="h-4 w-4" />
                  Run AI Analysis
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {hasResults && (
            <div className="border-t border-stone-200 px-6 py-4">
              <p className="text-xs text-stone-400">
                AI analysis is provided as a clinical decision support tool. All
                findings should be verified by a licensed dental professional.
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

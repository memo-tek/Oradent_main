'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Brain,
  FileText,
  ClipboardList,
  ShieldCheck,
  History,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeneratedNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icdCodes?: { code: string; description: string }[];
  cdtCodes?: { code: string; description: string }[];
}

interface TreatmentItem {
  id: string;
  priority: number;
  procedure: string;
  cdtCode: string;
  tooth?: string;
  urgency: 'high' | 'medium' | 'low';
  estimatedCost?: number;
  notes?: string;
}

interface TreatmentSuggestion {
  patientName?: string;
  items: TreatmentItem[];
  summary?: string;
}

interface PreAuthLetter {
  letter: string;
  patientName?: string;
  treatmentDescription?: string;
}

interface AnalysisHistoryEntry {
  id: string;
  type: string;
  createdAt: string;
  summary: string;
  status: 'completed' | 'pending' | 'failed';
}

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const noteSchema = z.object({
  briefNote: z.string().min(1, 'Please enter clinical notes'),
  noteType: z.enum(['general', 'periodic', 'limited', 'comprehensive', 'emergency']),
  patientId: z.string().optional(),
});

const treatmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
});

const preAuthSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  treatmentPlanId: z.string().min(1, 'Treatment plan ID is required'),
});

const historySchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
});

type NoteFormData = z.infer<typeof noteSchema>;
type TreatmentFormData = z.infer<typeof treatmentSchema>;
type PreAuthFormData = z.infer<typeof preAuthSchema>;
type HistoryFormData = z.infer<typeof historySchema>;

// ---------------------------------------------------------------------------
// Disclaimer Banner
// ---------------------------------------------------------------------------

function AiDisclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      <span>AI-generated content requires clinical review</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared spinner
// ---------------------------------------------------------------------------

function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-teal-600', className)} />;
}

// ---------------------------------------------------------------------------
// 1. Smart Clinical Notes
// ---------------------------------------------------------------------------

function SmartClinicalNotes() {
  const [expanded, setExpanded] = useState(true);
  const [result, setResult] = useState<GeneratedNote | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { noteType: 'general', briefNote: '', patientId: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: NoteFormData) =>
      apiPost<GeneratedNote>('/api/ai/generate-note', {
        briefNote: data.briefNote,
        noteType: data.noteType,
        ...(data.patientId ? { patientId: data.patientId } : {}),
      }),
    onSuccess: (data) => setResult(data),
  });

  const onSubmit = (data: NoteFormData) => {
    setResult(null);
    mutation.mutate(data);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-2.5">
            <FileText className="h-5 w-5 text-teal-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-stone-900">Smart Clinical Notes</h3>
            <p className="text-xs text-stone-500">Generate structured SOAP notes from brief observations</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-stone-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-5 pb-5 pt-4 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Note Type</label>
                <select
                  {...register('noteType')}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="general">General</option>
                  <option value="periodic">Periodic Exam</option>
                  <option value="limited">Limited Exam</option>
                  <option value="comprehensive">Comprehensive Exam</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Patient ID <span className="text-stone-400">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. PAT-001"
                  {...register('patientId')}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Brief Clinical Notes</label>
              <textarea
                rows={4}
                placeholder="Enter brief clinical observations, findings, and notes..."
                {...register('briefNote')}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              {errors.briefNote && (
                <p className="mt-1 text-xs text-red-500">{errors.briefNote.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              Generate SOAP Note
            </button>
          </form>

          {mutation.isPending && (
            <div className="flex items-center justify-center py-6">
              <Spinner />
              <span className="ml-2 text-sm text-stone-500">Generating clinical note...</span>
            </div>
          )}

          {mutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to generate note. Please try again.'}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <AiDisclaimer />
              <div className="rounded-lg border border-stone-200 bg-stone-50 divide-y divide-stone-200">
                {(['subjective', 'objective', 'assessment', 'plan'] as const).map((section) => (
                  <div key={section} className="px-4 py-3">
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-teal-700">
                      {section.charAt(0).toUpperCase()} &mdash; {section}
                    </h4>
                    <p className="whitespace-pre-wrap text-sm text-stone-700">{result[section]}</p>
                  </div>
                ))}
              </div>

              {result.icdCodes && result.icdCodes.length > 0 && (
                <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-700">ICD-10 Codes</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.icdCodes.map((c) => (
                      <span
                        key={c.code}
                        className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
                      >
                        {c.code}
                        <span className="ml-1 text-purple-600">{c.description}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.cdtCodes && result.cdtCodes.length > 0 && (
                <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-700">CDT Codes</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.cdtCodes.map((c) => (
                      <span
                        key={c.code}
                        className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800"
                      >
                        {c.code}
                        <span className="ml-1 text-teal-600">{c.description}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Treatment Plan Suggestions
// ---------------------------------------------------------------------------

function TreatmentPlanSuggestions() {
  const [expanded, setExpanded] = useState(true);
  const [result, setResult] = useState<TreatmentSuggestion | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: { patientId: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: TreatmentFormData) =>
      apiPost<TreatmentSuggestion>('/api/ai/suggest-treatment', { patientId: data.patientId }),
    onSuccess: (data) => setResult(data),
  });

  const onSubmit = (data: TreatmentFormData) => {
    setResult(null);
    mutation.mutate(data);
  };

  const urgencyColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2.5">
            <ClipboardList className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-stone-900">Treatment Plan Suggestions</h3>
            <p className="text-xs text-stone-500">AI-powered prioritized treatment recommendations</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-stone-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-5 pb-5 pt-4 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-stone-600">Patient ID</label>
              <input
                type="text"
                placeholder="e.g. PAT-001"
                {...register('patientId')}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              {errors.patientId && (
                <p className="mt-1 text-xs text-red-500">{errors.patientId.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? <Spinner className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4" />}
              Suggest Plan
            </button>
          </form>

          {mutation.isPending && (
            <div className="flex items-center justify-center py-6">
              <Spinner />
              <span className="ml-2 text-sm text-stone-500">Analyzing patient records...</span>
            </div>
          )}

          {mutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to generate suggestions. Please try again.'}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <AiDisclaimer />

              {result.patientName && (
                <p className="text-sm text-stone-600">
                  Suggestions for <span className="font-medium text-stone-900">{result.patientName}</span>
                </p>
              )}

              {result.summary && (
                <p className="rounded-lg bg-purple-50 px-4 py-3 text-sm text-purple-800">{result.summary}</p>
              )}

              <div className="rounded-lg border border-stone-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Procedure</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">CDT</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Tooth</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Urgency</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-stone-500">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, idx) => (
                      <tr key={item.id ?? idx} className="border-b border-stone-100 last:border-0">
                        <td className="px-3 py-2 text-stone-500">{item.priority}</td>
                        <td className="px-3 py-2 font-medium text-stone-800">{item.procedure}</td>
                        <td className="px-3 py-2 font-mono text-xs text-stone-600">{item.cdtCode}</td>
                        <td className="px-3 py-2 text-stone-600">{item.tooth ?? '—'}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                              urgencyColors[item.urgency] ?? 'bg-stone-100 text-stone-600'
                            )}
                          >
                            {item.urgency}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-stone-700">
                          {item.estimatedCost != null
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                                item.estimatedCost
                              )
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Insurance Pre-Auth Letter
// ---------------------------------------------------------------------------

function InsurancePreAuthLetter() {
  const [expanded, setExpanded] = useState(true);
  const [result, setResult] = useState<PreAuthLetter | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PreAuthFormData>({
    resolver: zodResolver(preAuthSchema),
    defaultValues: { patientId: '', treatmentPlanId: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: PreAuthFormData) =>
      apiPost<PreAuthLetter>('/api/ai/pre-auth-letter', {
        patientId: data.patientId,
        treatmentPlanId: data.treatmentPlanId,
      }),
    onSuccess: (data) => setResult(data),
  });

  const onSubmit = (data: PreAuthFormData) => {
    setResult(null);
    setCopied(false);
    mutation.mutate(data);
  };

  const handleCopy = async () => {
    if (!result?.letter) return;
    try {
      await navigator.clipboard.writeText(result.letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-2.5">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-stone-900">Insurance Pre-Auth Letter</h3>
            <p className="text-xs text-stone-500">Generate pre-authorization letters for insurance claims</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-stone-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-5 pb-5 pt-4 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Patient ID</label>
                <input
                  type="text"
                  placeholder="e.g. PAT-001"
                  {...register('patientId')}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.patientId && (
                  <p className="mt-1 text-xs text-red-500">{errors.patientId.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Treatment Plan ID</label>
                <input
                  type="text"
                  placeholder="e.g. TP-001"
                  {...register('treatmentPlanId')}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.treatmentPlanId && (
                  <p className="mt-1 text-xs text-red-500">{errors.treatmentPlanId.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              Generate Letter
            </button>
          </form>

          {mutation.isPending && (
            <div className="flex items-center justify-center py-6">
              <Spinner />
              <span className="ml-2 text-sm text-stone-500">Drafting pre-authorization letter...</span>
            </div>
          )}

          {mutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to generate letter. Please try again.'}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <AiDisclaimer />

              <div className="relative rounded-lg border border-stone-200 bg-stone-50">
                <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2">
                  <span className="text-xs font-medium text-stone-500">Generated Pre-Auth Letter</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto px-4 py-3">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-stone-700 leading-relaxed">
                    {result.letter}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. AI Analysis History
// ---------------------------------------------------------------------------

function AiAnalysisHistory() {
  const [expanded, setExpanded] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HistoryFormData>({
    resolver: zodResolver(historySchema),
    defaultValues: { patientId: '' },
  });

  const { data: history, isLoading, isError, error } = useQuery<AnalysisHistoryEntry[]>({
    queryKey: ['ai-history', activePatientId],
    queryFn: () => apiGet<AnalysisHistoryEntry[]>(`/api/ai/history/${activePatientId}`),
    enabled: !!activePatientId,
  });

  const onSubmit = (data: HistoryFormData) => {
    setActivePatientId(data.patientId);
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
  };

  const typeLabels: Record<string, string> = {
    'generate-note': 'Clinical Note',
    'suggest-treatment': 'Treatment Plan',
    'pre-auth-letter': 'Pre-Auth Letter',
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-stone-100 p-2.5">
            <History className="h-5 w-5 text-stone-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-stone-900">AI Analysis History</h3>
            <p className="text-xs text-stone-500">View past AI-generated analyses for a patient</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-stone-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-5 pb-5 pt-4 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-stone-600">Patient ID</label>
              <input
                type="text"
                placeholder="e.g. PAT-001"
                {...register('patientId')}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              {errors.patientId && (
                <p className="mt-1 text-xs text-red-500">{errors.patientId.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Spinner className="h-4 w-4 text-white" /> : <History className="h-4 w-4" />}
              Load History
            </button>
          </form>

          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Spinner />
              <span className="ml-2 text-sm text-stone-500">Loading analysis history...</span>
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error instanceof Error ? error.message : 'Failed to load history. Please try again.'}
            </div>
          )}

          {history && history.length === 0 && (
            <div className="rounded-lg border border-stone-200 bg-stone-50 py-8 text-center">
              <History className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-2 text-sm text-stone-500">No analysis history found for this patient.</p>
            </div>
          )}

          {history && history.length > 0 && (
            <div className="rounded-lg border border-stone-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Summary</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id} className="border-b border-stone-100 last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap text-stone-600">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-2 text-stone-700 font-medium">
                        {typeLabels[entry.type] ?? entry.type}
                      </td>
                      <td className="px-3 py-2 text-stone-600 max-w-xs truncate">{entry.summary}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                            statusColors[entry.status] ?? 'bg-stone-100 text-stone-600'
                          )}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AiAssistantPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2.5">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">AI Assistant</h1>
            <p className="text-sm text-stone-500">
              AI-powered tools to streamline clinical documentation and treatment planning
            </p>
          </div>
        </div>
      </div>

      {/* Global disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-medium text-amber-800">Clinical Review Required</p>
          <p className="text-xs text-amber-700">
            All AI-generated content is intended as a clinical decision support tool only. Output must be
            reviewed and verified by a licensed dental professional before use in patient records.
          </p>
        </div>
      </div>

      {/* Tool cards */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SmartClinicalNotes />
        <TreatmentPlanSuggestions />
        <InsurancePreAuthLetter />
        <AiAnalysisHistory />
      </div>
    </div>
  );
}

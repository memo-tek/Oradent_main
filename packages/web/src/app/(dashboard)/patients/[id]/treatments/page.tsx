'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Printer,
} from 'lucide-react';
import { useState } from 'react';

interface TreatmentPlanItem {
  id: string;
  cdtCode: string;
  description: string;
  toothNumber: number | null;
  surfaces: string[];
  fee: number;
  insurancePays: number;
  patientPays: number;
  priority: number;
  status: string;
  sortOrder: number;
}

interface TreatmentPlan {
  id: string;
  name: string;
  status: string;
  items: TreatmentPlanItem[];
  totalFee: number;
  insuranceEst: number;
  patientEst: number;
  presentedAt: string | null;
  acceptedAt: string | null;
  notes: string | null;
  aiGenerated: boolean;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PROPOSED: 'bg-stone-100 text-stone-700',
  PRESENTED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-teal-100 text-teal-700',
  DECLINED: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
  2: { label: 'Recommended', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'Elective', color: 'bg-blue-100 text-blue-700' },
};

export default function TreatmentPlansPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery<TreatmentPlan[]>({
    queryKey: ['treatment-plans', params.id],
    queryFn: () => apiGet(`/api/treatments/plans/${params.id}`),
    enabled: !!params.id,
  });

  const updateStatus = useMutation({
    mutationFn: ({ planId, status }: { planId: string; status: string }) =>
      apiPatch(`/api/treatments/plans/${planId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans', params.id] });
    },
  });

  const handleDownloadPDF = async (planId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/treatments/plans/${planId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('oradent_token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `treatment-plan.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-12">
        <FileText className="h-12 w-12 text-stone-300" />
        <h3 className="mt-4 text-lg font-semibold text-stone-900">No Treatment Plans</h3>
        <p className="mt-1 text-sm text-stone-500">
          Use the AI Assistant to generate treatment plan suggestions for this patient.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-stone-900">Treatment Plans</h2>
      </div>

      {plans.map((plan) => {
        const isExpanded = expandedPlan === plan.id;
        const groupedItems = [
          { priority: 1, items: plan.items.filter((i) => i.priority === 1) },
          { priority: 2, items: plan.items.filter((i) => i.priority === 2) },
          { priority: 3, items: plan.items.filter((i) => i.priority === 3) },
        ].filter((g) => g.items.length > 0);

        return (
          <div
            key={plan.id}
            className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Plan Header */}
            <button
              onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
              className="flex w-full items-center justify-between p-5 text-left hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-teal-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900">{plan.name}</h3>
                    {plan.aiGenerated && (
                      <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[plan.status] || STATUS_STYLES.PROPOSED
                      }`}
                    >
                      {plan.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {plan.items.length} procedures &middot;{' '}
                    {formatCurrency(plan.totalFee)} total &middot;{' '}
                    <span className="text-teal-600 font-medium">
                      {formatCurrency(plan.patientEst)} patient est.
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-stone-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-stone-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-stone-100">
                {/* Action Buttons */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-100 bg-stone-50">
                  {plan.status === 'PROPOSED' && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({ planId: plan.id, status: 'PRESENTED' })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Mark as Presented
                    </button>
                  )}
                  {(plan.status === 'PROPOSED' || plan.status === 'PRESENTED') && (
                    <>
                      <button
                        onClick={() =>
                          updateStatus.mutate({ planId: plan.id, status: 'ACCEPTED' })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Patient Accepted
                      </button>
                      <button
                        onClick={() =>
                          updateStatus.mutate({ planId: plan.id, status: 'DECLINED' })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Declined
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDownloadPDF(plan.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                </div>

                {/* Items grouped by priority */}
                <div className="divide-y divide-stone-100">
                  {groupedItems.map((group) => {
                    const priority = PRIORITY_LABELS[group.priority];
                    return (
                      <div key={group.priority}>
                        <div className="px-5 py-2 bg-stone-50">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priority.color}`}
                          >
                            Priority {group.priority} &mdash; {priority.label}
                          </span>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs text-stone-500 border-b border-stone-100">
                              <th className="px-5 py-2 text-left font-medium">CDT Code</th>
                              <th className="px-3 py-2 text-left font-medium">Procedure</th>
                              <th className="px-3 py-2 text-center font-medium">Tooth</th>
                              <th className="px-3 py-2 text-right font-medium">Fee</th>
                              <th className="px-3 py-2 text-right font-medium">Insurance</th>
                              <th className="px-5 py-2 text-right font-medium">Your Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {group.items.map((item) => (
                              <tr key={item.id} className="text-sm">
                                <td className="px-5 py-2.5 font-mono text-xs text-stone-600">
                                  {item.cdtCode}
                                </td>
                                <td className="px-3 py-2.5 text-stone-900">
                                  {item.description}
                                  {item.surfaces.length > 0 && (
                                    <span className="ml-1 text-xs text-stone-400">
                                      ({item.surfaces.join('')})
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center text-stone-600">
                                  {item.toothNumber ? `#${item.toothNumber}` : '-'}
                                </td>
                                <td className="px-3 py-2.5 text-right text-stone-600">
                                  {formatCurrency(item.fee)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-stone-600">
                                  {formatCurrency(item.insurancePays)}
                                </td>
                                <td className="px-5 py-2.5 text-right font-medium text-stone-900">
                                  {formatCurrency(item.patientPays)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-t border-stone-200 bg-stone-50 px-5 py-4">
                  <div className="flex justify-end">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between gap-12">
                        <span className="text-stone-500">Total Fees</span>
                        <span className="text-stone-900">{formatCurrency(plan.totalFee)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-12">
                        <span className="text-stone-500">Insurance Estimate</span>
                        <span className="text-stone-600">
                          -{formatCurrency(plan.insuranceEst)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-12 border-t border-stone-200 pt-1">
                        <span className="font-semibold text-stone-900">Patient Estimate</span>
                        <span className="font-bold text-teal-600 text-base">
                          {formatCurrency(plan.patientEst)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {plan.notes && (
                  <div className="border-t border-stone-100 px-5 py-3 bg-amber-50">
                    <p className="text-xs font-medium text-amber-800">Notes</p>
                    <p className="mt-1 text-sm text-amber-700">{plan.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

'use client';

import {
  CheckCircle2,
  Clock,
  PlayCircle,
  FileText,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface TreatmentRecord {
  id: string;
  date: string;
  procedureCode: string;
  description: string;
  toothNumber?: number;
  surface?: string;
  provider: string;
  fee: number;
  status: 'completed' | 'planned' | 'in_progress';
  notes?: string;
}

interface TreatmentTimelineProps {
  treatments: TreatmentRecord[];
}

const STATUS_CONFIG: Record<
  TreatmentRecord['status'],
  { label: string; icon: typeof CheckCircle2; color: string; bg: string; line: string }
> = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-100',
    line: 'bg-green-300',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    line: 'bg-blue-300',
  },
  planned: {
    label: 'Planned',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    line: 'bg-amber-300',
  },
};

export function TreatmentTimeline({ treatments }: TreatmentTimelineProps) {
  // Group treatments by date
  const grouped = treatments.reduce<Record<string, TreatmentRecord[]>>(
    (acc, treatment) => {
      const dateKey = treatment.date.split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(treatment);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey, dateIdx) => (
        <div key={dateKey} className="relative">
          {/* Date header */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200">
              <FileText className="h-4 w-4 text-stone-600" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900">
              {formatDate(dateKey)}
            </h3>
            <span className="text-xs text-stone-400">
              {grouped[dateKey].length} procedure{grouped[dateKey].length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Treatments for this date */}
          <div className="ml-4 space-y-3 border-l-2 border-stone-200 pl-7">
            {grouped[dateKey].map((treatment, idx) => {
              const config = STATUS_CONFIG[treatment.status];
              const Icon = config.icon;

              return (
                <div
                  key={treatment.id}
                  className="relative rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute -left-[2.15rem] top-4 h-3 w-3 rounded-full border-2 border-white',
                      config.bg
                    )}
                  />

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs font-medium text-stone-600">
                          {treatment.procedureCode}
                        </span>
                        <h4 className="text-sm font-medium text-stone-900">
                          {treatment.description}
                        </h4>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                        {treatment.toothNumber && (
                          <span>Tooth #{treatment.toothNumber}</span>
                        )}
                        {treatment.surface && (
                          <span>Surface: {treatment.surface}</span>
                        )}
                        <span>Provider: {treatment.provider}</span>
                      </div>

                      {treatment.notes && (
                        <p className="mt-2 text-sm text-stone-500 italic">
                          {treatment.notes}
                        </p>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col items-end gap-2">
                      <span className="text-sm font-semibold text-stone-900">
                        {formatCurrency(treatment.fee)}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          config.bg,
                          config.color
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

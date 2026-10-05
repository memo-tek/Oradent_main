'use client';

import { useParams } from 'next/navigation';
import { Save, RotateCcw } from 'lucide-react';
import { useDentalChart } from '@/hooks/useDentalChart';
import DentalChart from '@/components/dental-chart/DentalChart';
import { formatDate } from '@/lib/formatters';

export default function DentalChartPage() {
  const params = useParams<{ id: string }>();
  const { data: chartData, isLoading, refetch } = useDentalChart(params.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-stone-200" />
        <div className="h-[500px] animate-pulse rounded-xl bg-stone-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Dental Chart</h2>
          {chartData?.lastUpdated && (
            <p className="mt-1 text-sm text-stone-500">
              Last updated: {formatDate(chartData.lastUpdated)}
              {chartData.updatedBy && ` by ${chartData.updatedBy}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors">
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        {chartData ? (
          <DentalChart />
        ) : (
          <div className="flex h-96 items-center justify-center text-stone-400">
            No chart data available. Start by selecting a tooth.
          </div>
        )}
      </div>
    </div>
  );
}

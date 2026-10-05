'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import {
  PieChart as PieChartIcon,
  Clock,
  Users,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// ---------- Types ----------

interface RevenueReport {
  data: Array<{
    period: string;
    amount: number;
  }>;
  methodBreakdown: Record<string, number>;
  total: number;
  startDate: string;
  endDate: string;
}

interface ProcedureDataPoint {
  code: string;
  description: string;
  count: number;
  revenue: number;
}

interface AgingReport {
  aging: {
    current: number;
    thirtyDays: number;
    sixtyDays: number;
    ninetyDays: number;
    overNinety: number;
  };
  details: Array<{
    daysPastDue: number;
  }>;
}

interface AgingBucket {
  bucket: string;
  amount: number;
  count: number;
}

interface ProviderProductivity {
  id: string;
  name: string;
  role: string;
  completedAppointments: number;
  treatmentsPerformed: number;
}

function toAgingBuckets(report: AgingReport): AgingBucket[] {
  const buckets = [
    { bucket: 'Current', amount: report.aging.current, matches: (days: number) => days === 0 },
    { bucket: '1-30', amount: report.aging.thirtyDays, matches: (days: number) => days >= 1 && days <= 30 },
    { bucket: '31-60', amount: report.aging.sixtyDays, matches: (days: number) => days >= 31 && days <= 60 },
    { bucket: '61-90', amount: report.aging.ninetyDays, matches: (days: number) => days >= 61 && days <= 90 },
    { bucket: '90+', amount: report.aging.overNinety, matches: (days: number) => days > 90 },
  ];

  return buckets.map(({ bucket, amount, matches }) => ({
    bucket,
    amount,
    count: report.details.filter((detail) => matches(detail.daysPastDue)).length,
  }));
}

// ---------- Constants ----------

const PERIOD_OPTIONS = [
  { label: 'Monthly', value: 'month' },
  { label: 'Weekly', value: 'week' },
  { label: 'Daily', value: 'day' },
] as const;

const PIE_COLORS = [
  '#0d9488', // teal-600
  '#14b8a6', // teal-500
  '#5eead4', // teal-300
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#f97316', // orange-500
];

const AGING_COLORS: Record<string, string> = {
  Current: 'bg-teal-500',
  '1-30': 'bg-amber-400',
  '31-60': 'bg-orange-500',
  '61-90': 'bg-red-400',
  '90+': 'bg-red-600',
};

// ---------- Skeletons ----------

function ChartSkeleton() {
  return (
    <div className="flex h-72 items-end gap-3 px-6 pb-4">
      {[40, 65, 50, 80, 55, 70, 45, 60, 75, 50, 85, 62].map((h, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-t bg-stone-200"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />
      ))}
    </div>
  );
}

// ---------- Custom tooltip ----------

function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-medium text-stone-500">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ---------- Page ----------

export default function ReportsPage() {
  const [period, setPeriod] = useState<string>('month');
  const [startDate, setStartDate] = useState(() =>
    format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(() =>
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );

  // --- Queries ---

  const {
    data: revenueData,
    isLoading: revenueLoading,
  } = useQuery<RevenueReport>({
    queryKey: ['reports-revenue', period, startDate, endDate],
    queryFn: () =>
      apiGet(
        `/api/reports/revenue?period=${period}&start=${startDate}&end=${endDate}`
      ),
  });

  const {
    data: procedureData,
    isLoading: procedureLoading,
  } = useQuery<ProcedureDataPoint[]>({
    queryKey: ['reports-procedures', startDate, endDate],
    queryFn: () =>
      apiGet(
        `/api/reports/procedures?start=${startDate}&end=${endDate}`
      ),
  });

  const {
    data: agingData,
    isLoading: agingLoading,
  } = useQuery<AgingBucket[]>({
    queryKey: ['reports-aging'],
    queryFn: async () => toAgingBuckets(await apiGet<AgingReport>('/api/reports/aging')),
  });

  const {
    data: providerData,
    isLoading: providerLoading,
  } = useQuery<ProviderProductivity[]>({
    queryKey: ['reports-provider-productivity', startDate, endDate],
    queryFn: () =>
      apiGet(
        `/api/reports/provider-productivity?start=${startDate}&end=${endDate}`
      ),
  });

  // --- Computed ---

  const agingTotal = agingData?.reduce((sum, b) => sum + b.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Reports</h1>
          <p className="text-sm text-stone-500">
            Practice analytics and performance metrics
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
            <CalendarDays className="h-4 w-4 text-stone-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-0 bg-transparent text-sm text-stone-700 focus:outline-none"
            />
            <span className="text-stone-300">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-0 bg-transparent text-sm text-stone-700 focus:outline-none"
            />
          </div>

          <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={
                  period === opt.value
                    ? 'rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white'
                    : 'rounded-md px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100'
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">Collections Overview</h2>
              <p className="text-xs text-stone-500">Payments collected over time</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          {revenueLoading ? (
            <ChartSkeleton />
          ) : revenueData && revenueData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={revenueData.data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12, fill: '#78716c' }}
                  axisLine={{ stroke: '#d6d3d1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#78716c' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Bar
                  dataKey="amount"
                  name="Collections"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-stone-400">
              No collections data available for the selected period.
            </div>
          )}
        </div>
      </div>

      {/* Middle Row: Procedure Mix + Aging */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Procedure Mix */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
            <div className="rounded-lg bg-violet-50 p-2">
              <PieChartIcon className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">Procedure Mix</h2>
              <p className="text-xs text-stone-500">Procedures by count</p>
            </div>
          </div>
          <div className="p-4">
            {procedureLoading ? (
              <ChartSkeleton />
            ) : procedureData && procedureData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={procedureData}
                    dataKey="count"
                    nameKey="description"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={60}
                    paddingAngle={2}
                    label={({ description, percent }: { description: string; percent: number }) =>
                      `${description} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: '#a8a29e' }}
                  >
                    {procedureData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} procedures`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e7e5e4',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-stone-400">
                No procedure data available.
              </div>
            )}
          </div>
        </div>

        {/* Aging Report */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
            <div className="rounded-lg bg-amber-50 p-2">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">Aging Report</h2>
              <p className="text-xs text-stone-500">
                Outstanding balances by age &middot;{' '}
                <span className="font-medium text-stone-700">
                  {formatCurrency(agingTotal)} total
                </span>
              </p>
            </div>
          </div>
          <div className="p-6">
            {agingLoading ? (
              <TableSkeleton rows={5} />
            ) : agingData && agingData.length > 0 ? (
              <div className="space-y-5">
                {/* Stacked bar overview */}
                <div className="flex h-6 w-full overflow-hidden rounded-full">
                  {agingData.map((bucket) => {
                    const pct = agingTotal > 0 ? (bucket.amount / agingTotal) * 100 : 0;
                    return (
                      <div
                        key={bucket.bucket}
                        className={`${AGING_COLORS[bucket.bucket] ?? 'bg-stone-400'} transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`${bucket.bucket}: ${formatCurrency(bucket.amount)}`}
                      />
                    );
                  })}
                </div>

                {/* Bucket details */}
                <div className="space-y-3">
                  {agingData.map((bucket) => {
                    const pct = agingTotal > 0 ? (bucket.amount / agingTotal) * 100 : 0;
                    return (
                      <div
                        key={bucket.bucket}
                        className="flex items-center justify-between rounded-lg border border-stone-100 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-3 w-3 rounded-full ${AGING_COLORS[bucket.bucket] ?? 'bg-stone-400'}`}
                          />
                          <div>
                            <p className="text-sm font-medium text-stone-700">
                              {bucket.bucket === 'Current'
                                ? 'Current'
                                : `${bucket.bucket} days`}
                            </p>
                            <p className="text-xs text-stone-400">
                              {bucket.count} account{bucket.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-stone-900">
                            {formatCurrency(bucket.amount)}
                          </p>
                          <p className="text-xs text-stone-400">{pct.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-stone-400">
                No aging data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provider Productivity Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">
                Provider Productivity
              </h2>
              <p className="text-xs text-stone-500">
                Performance metrics by provider
              </p>
            </div>
          </div>
        </div>

        {providerLoading ? (
          <TableSkeleton rows={4} />
        ) : providerData && providerData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-6 py-3 text-left font-medium text-stone-500">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-stone-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-stone-500">
                    Appointments completed
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-stone-500">
                    Procedures performed
                  </th>
                </tr>
              </thead>
              <tbody>
                {providerData.map((provider) => (
                  <tr
                    key={provider.id}
                    className="border-b border-stone-100 transition-colors hover:bg-stone-50"
                  >
                    <td className="px-6 py-4 font-medium text-stone-900">
                      {provider.name}
                    </td>
                    <td className="px-6 py-4 text-stone-700">
                      {provider.role}
                    </td>
                    <td className="px-6 py-4 text-right text-stone-700">
                      {provider.completedAppointments}
                    </td>
                    <td className="px-6 py-4 text-right text-stone-700">
                      {provider.treatmentsPerformed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-stone-400">
            No provider productivity data available.
          </div>
        )}
      </div>
    </div>
  );
}

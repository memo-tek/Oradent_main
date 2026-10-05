'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import {
  Calendar,
  DollarSign,
  Users,
  FileWarning,
  Plus,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import RevenueCard from '@/components/dashboard/RevenueCard';
import PatientStatsCard from '@/components/dashboard/PatientStatsCard';
import PendingClaimsCard from '@/components/dashboard/PendingClaimsCard';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';

interface DashboardStats {
  todayAppointments: number;
  monthRevenue: number;
  revenueTrend?: number;
  activePatients: number;
  patientsTrend?: number;
  pendingClaims: number;
  pendingClaimsAmount?: number;
  aiInsights?: {
    id: string;
    type: 'reminder' | 'alert' | 'suggestion';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
  }[];
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-stone-200 animate-pulse rounded-lg" />
      </div>
      <div className="h-8 w-24 bg-stone-200 animate-pulse rounded" />
      <div className="h-4 w-32 bg-stone-200 animate-pulse rounded mt-2" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiGet('/api/reports/dashboard'),
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
          <p className="text-stone-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/patients?new=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Patient
          </Link>
          <Link
            href="/appointments?new=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
          >
            <Calendar className="w-4 h-4" />
            New Appointment
          </Link>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        {isLoading ? (
          <StatCardSkeleton />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-lg bg-teal-100">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              {stats?.todayAppointments !== undefined && stats.todayAppointments > 0 && (
                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>
            <p className="text-2xl font-semibold text-stone-900">
              {stats?.todayAppointments ?? 0}
            </p>
            <p className="text-sm text-stone-500 mt-1">Today&apos;s Appointments</p>
          </div>
        )}

        {/* Month Revenue */}
        <RevenueCard
          revenue={stats?.monthRevenue}
          trend={stats?.revenueTrend}
          isLoading={isLoading}
        />

        {/* Active Patients */}
        <PatientStatsCard
          activePatients={stats?.activePatients}
          trend={stats?.patientsTrend}
          isLoading={isLoading}
        />

        {/* Pending Claims */}
        <PendingClaimsCard
          pendingClaims={stats?.pendingClaims}
          totalAmount={stats?.pendingClaimsAmount}
          isLoading={isLoading}
        />
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodaySchedule />
        </div>

        {/* Quick Actions & AI sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/patients?new=true"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors group"
              >
                <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                  <Users className="w-4 h-4 text-teal-600" />
                </div>
                <span className="text-sm font-medium text-stone-700">New Patient</span>
              </Link>
              <Link
                href="/appointments?new=true"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors group"
              >
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-stone-700">New Appointment</span>
              </Link>
              <Link
                href="/ai-assistant"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors group"
              >
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-stone-700">AI Analysis</span>
              </Link>
            </div>
          </div>

          {/* AI Insights */}
          <AIInsightsCard
            insights={stats?.aiInsights}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

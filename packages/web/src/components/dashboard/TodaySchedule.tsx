'use client';

import { useTodaySchedule, type TodayScheduleItem } from '@/hooks/useAppointments';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

const statusColors: Record<string, string> = {
  scheduled: 'bg-stone-100 text-stone-700',
  confirmed: 'bg-blue-100 text-blue-700',
  'checked-in': 'bg-teal-100 text-teal-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-rose-100 text-rose-700',
};

function ScheduleSkeleton() {
  return (
    <div className="space-y-3 p-6 pt-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
          <div className="w-16 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-32 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-24 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-16 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-20 h-5 bg-stone-200 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

function ScheduleRow({ item }: { item: TodayScheduleItem }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/patients/${item.patientId}`)}
      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-stone-50 transition-colors text-left"
    >
      <span className="text-sm font-medium text-stone-900 w-16 shrink-0 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-stone-400" />
        {item.time}
      </span>
      <span className="text-sm font-medium text-stone-900 flex-1 min-w-0 truncate">
        {item.patientName}
      </span>
      <span className="text-sm text-stone-500 w-28 shrink-0 truncate hidden sm:block">
        {item.type}
      </span>
      <span className="text-sm text-stone-500 w-16 shrink-0 hidden md:block">
        {item.chair}
      </span>
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${
          statusColors[item.status] || 'bg-stone-100 text-stone-700'
        }`}
      >
        {item.status.replace('-', ' ')}
      </span>
    </button>
  );
}

export default function TodaySchedule() {
  const { data: schedule, isLoading } = useTodaySchedule();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200">
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Today&apos;s Schedule
        </h2>
        <span className="text-sm text-stone-500">
          {schedule?.length ?? 0} appointments
        </span>
      </div>

      {isLoading ? (
        <ScheduleSkeleton />
      ) : !schedule || schedule.length === 0 ? (
        <div className="py-12 text-center text-stone-500 text-sm px-6 pb-6">
          No appointments scheduled for today
        </div>
      ) : (
        <div className="px-6 pb-6 space-y-1">
          <div className="flex items-center gap-4 px-3 pb-2 border-b border-stone-100">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider w-16 shrink-0">
              Time
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider flex-1">
              Patient
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider w-28 shrink-0 hidden sm:block">
              Type
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider w-16 shrink-0 hidden md:block">
              Chair
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider w-20 shrink-0">
              Status
            </span>
          </div>
          {schedule.map((item) => (
            <ScheduleRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export { TodaySchedule };

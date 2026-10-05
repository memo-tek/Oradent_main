import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_LABELS,
} from '@/lib/constants';

interface Appointment {
  id: string;
  patientName: string;
  providerName: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  chairName: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
  compact?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-teal-100 text-teal-700',
  CHECKED_IN: 'bg-amber-100 text-amber-700',
  IN_CHAIR: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-stone-100 text-stone-600',
  CANCELLED: 'bg-stone-100 text-stone-500',
  NO_SHOW: 'bg-red-100 text-red-700',
  RESCHEDULED: 'bg-indigo-100 text-indigo-700',
};

export function AppointmentCard({
  appointment,
  onClick,
  compact = false,
}: AppointmentCardProps) {
  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  const typeLabel = APPOINTMENT_TYPE_LABELS[appointment.type] || appointment.type;
  const statusLabel = APPOINTMENT_STATUS_LABELS[appointment.status] || appointment.status;
  const statusStyle = STATUS_STYLES[appointment.status] || 'bg-stone-100 text-stone-600';

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(appointment)}
        className="flex w-full items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left hover:bg-stone-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-stone-900">
              {appointment.patientName}
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                statusStyle
              )}
            >
              {statusLabel}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
            <Clock className="h-3 w-3" />
            <span>
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </span>
            <span className="text-stone-300">|</span>
            <span>{typeLabel}</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick?.(appointment)}
      className="w-full rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-stone-400" />
            <span className="text-sm font-semibold text-stone-900">
              {appointment.patientName}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </span>
          </div>
          <div className="mt-1 text-xs text-stone-500">
            {appointment.providerName} &middot; {appointment.chairName}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              statusStyle
            )}
          >
            {statusLabel}
          </span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
            {typeLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

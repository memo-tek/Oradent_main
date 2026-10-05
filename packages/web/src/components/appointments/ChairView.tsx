'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from '@/lib/constants';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  providerColor: string;
  chairId: string;
  chairName: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason?: string;
  notes?: string;
}

interface ChairViewProps {
  appointments: Appointment[];
  currentDate: Date;
  onEventClick: (appointment: Appointment) => void;
  onSlotClick: (date: string, time: string) => void;
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8am - 5pm
const SLOT_HEIGHT = 60; // px per 30 min
const CHAIRS = ['Chair 1', 'Chair 2', 'Chair 3'];

export function ChairView({
  appointments,
  currentDate,
  onEventClick,
  onSlotClick,
}: ChairViewProps) {
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const chairGroups = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    CHAIRS.forEach((chair) => {
      groups[chair] = [];
    });

    appointments.forEach((apt) => {
      const aptDate = apt.startTime.split('T')[0];
      if (aptDate === dateStr) {
        const chairKey = apt.chairName || 'Chair 1';
        if (groups[chairKey]) {
          groups[chairKey].push(apt);
        }
      }
    });

    return groups;
  }, [appointments, dateStr]);

  const getPositionStyles = (apt: Appointment) => {
    const start = new Date(apt.startTime);
    const end = new Date(apt.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 8) * SLOT_HEIGHT * 2;
    const height = (endHour - startHour) * SLOT_HEIGHT * 2;
    return { top: `${top}px`, height: `${Math.max(height, 30)}px` };
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const nowDateStr = format(now, 'yyyy-MM-dd');
    if (nowDateStr !== dateStr) return null;
    const hours = now.getHours() + now.getMinutes() / 60;
    if (hours < 8 || hours > 17) return null;
    return (hours - 8) * SLOT_HEIGHT * 2;
  };

  const currentTimePos = getCurrentTimePosition();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr] border-b border-stone-200">
          <div className="border-r border-stone-200 bg-stone-50 p-3">
            <span className="text-xs font-medium text-stone-500">Time</span>
          </div>
          {CHAIRS.map((chair) => (
            <div
              key={chair}
              className="border-r border-stone-200 bg-stone-50 p-3 text-center last:border-r-0"
            >
              <span className="text-sm font-semibold text-stone-700">{chair}</span>
              <span className="ml-2 text-xs text-stone-400">
                {chairGroups[chair]?.length || 0} appts
              </span>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative grid grid-cols-[80px_1fr_1fr_1fr]">
          {/* Time labels */}
          <div className="border-r border-stone-200">
            {HOURS.map((hour) => (
              <div key={hour} className="relative" style={{ height: `${SLOT_HEIGHT * 2}px` }}>
                <span className="absolute -top-2 right-3 text-xs text-stone-400">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
                <div
                  className="absolute right-0 top-0 w-3 border-t border-stone-200"
                />
                <div
                  className="absolute right-0 top-1/2 w-2 border-t border-stone-100"
                />
              </div>
            ))}
          </div>

          {/* Chair columns */}
          {CHAIRS.map((chair) => (
            <div
              key={chair}
              className="relative border-r border-stone-200 last:border-r-0"
            >
              {/* Grid lines */}
              {HOURS.map((hour) => (
                <div key={hour} style={{ height: `${SLOT_HEIGHT * 2}px` }}>
                  <div
                    className="h-1/2 border-b border-stone-100 cursor-pointer hover:bg-teal-50/50 transition-colors"
                    onClick={() =>
                      onSlotClick(dateStr, `${hour.toString().padStart(2, '0')}:00`)
                    }
                  />
                  <div
                    className="h-1/2 border-b border-stone-200 cursor-pointer hover:bg-teal-50/50 transition-colors"
                    onClick={() =>
                      onSlotClick(dateStr, `${hour.toString().padStart(2, '0')}:30`)
                    }
                  />
                </div>
              ))}

              {/* Appointments */}
              {chairGroups[chair]?.map((apt) => {
                const pos = getPositionStyles(apt);
                const bgColor = apt.providerColor || APPOINTMENT_TYPE_COLORS[apt.type] || '#14b8a6';
                return (
                  <button
                    key={apt.id}
                    onClick={() => onEventClick(apt)}
                    className="absolute inset-x-1 overflow-hidden rounded-lg p-2 text-left transition-opacity hover:opacity-90"
                    style={{
                      ...pos,
                      backgroundColor: bgColor,
                    }}
                  >
                    <div className="truncate text-xs font-semibold text-white">
                      {apt.patientName}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/80">
                      {APPOINTMENT_TYPE_LABELS[apt.type] || apt.type}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/70">
                      {format(new Date(apt.startTime), 'h:mm a')} -{' '}
                      {format(new Date(apt.endTime), 'h:mm a')}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Current time indicator */}
          {currentTimePos !== null && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${currentTimePos}px` }}
            >
              <div className="flex items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-0.5 flex-1 bg-red-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

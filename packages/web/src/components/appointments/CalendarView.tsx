'use client';

import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { cn } from '@/lib/utils';
import {
  APPOINTMENT_TYPE_COLORS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_COLORS,
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

interface CalendarViewProps {
  appointments: Appointment[];
  currentDate: Date;
  view: string;
  onEventClick: (appointment: Appointment) => void;
  onSlotClick: (date: string, time: string) => void;
  onDateChange: (date: Date) => void;
  onViewChange: (view: string) => void;
}

export function CalendarView({
  appointments,
  currentDate,
  view,
  onEventClick,
  onSlotClick,
  onDateChange,
  onViewChange,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.gotoDate(currentDate);
    }
  }, [currentDate]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(view);
    }
  }, [view]);

  const events = appointments.map((apt) => ({
    id: apt.id,
    title: apt.patientName,
    start: apt.startTime,
    end: apt.endTime,
    backgroundColor: apt.providerColor || APPOINTMENT_TYPE_COLORS[apt.type] || '#14b8a6',
    borderColor: apt.providerColor || APPOINTMENT_TYPE_COLORS[apt.type] || '#14b8a6',
    extendedProps: {
      appointment: apt,
      type: apt.type,
      status: apt.status,
      chairName: apt.chairName,
      providerName: apt.providerName,
    },
  }));

  return (
    <div className="p-4 oradent-calendar">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        initialDate={currentDate}
        headerToolbar={false}
        events={events}
        slotMinTime="07:00:00"
        slotMaxTime="18:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        allDaySlot={false}
        weekends={true}
        nowIndicator={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '08:00',
          endTime: '17:00',
        }}
        height="auto"
        contentHeight={600}
        eventClick={(info) => {
          const apt = info.event.extendedProps.appointment as Appointment;
          onEventClick(apt);
        }}
        dateClick={(info) => {
          const date = info.dateStr.split('T')[0];
          const time = info.dateStr.includes('T')
            ? info.dateStr.split('T')[1]?.substring(0, 5) || '09:00'
            : '09:00';
          onSlotClick(date, time);
        }}
        select={(info) => {
          const date = info.startStr.split('T')[0];
          const time = info.startStr.includes('T')
            ? info.startStr.split('T')[1]?.substring(0, 5) || '09:00'
            : '09:00';
          onSlotClick(date, time);
        }}
        eventContent={(arg) => {
          const apt = arg.event.extendedProps;
          const typeLabel = APPOINTMENT_TYPE_LABELS[apt.type] || apt.type;
          const isTimeGrid = view.startsWith('timeGrid');

          return (
            <div className="flex h-full flex-col overflow-hidden px-1.5 py-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-xs font-semibold text-white">
                  {arg.event.title}
                </span>
              </div>
              {isTimeGrid && (
                <>
                  <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-white/20 px-1.5 py-0 text-[10px] font-medium text-white">
                    {typeLabel}
                  </span>
                  <span className="mt-0.5 text-[10px] text-white/80">
                    {apt.chairName}
                  </span>
                </>
              )}
            </div>
          );
        }}
      />
      <style jsx global>{`
        .oradent-calendar .fc {
          font-family: inherit;
        }
        .oradent-calendar .fc-theme-standard td,
        .oradent-calendar .fc-theme-standard th {
          border-color: #e7e5e4;
        }
        .oradent-calendar .fc-theme-standard .fc-scrollgrid {
          border-color: #e7e5e4;
        }
        .oradent-calendar .fc-timegrid-slot {
          height: 3rem;
        }
        .oradent-calendar .fc-event {
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .oradent-calendar .fc-event:hover {
          opacity: 0.9;
        }
        .oradent-calendar .fc-col-header-cell {
          padding: 8px 0;
          font-weight: 500;
          color: #57534e;
          font-size: 0.875rem;
        }
        .oradent-calendar .fc-timegrid-slot-label {
          font-size: 0.75rem;
          color: #78716c;
        }
        .oradent-calendar .fc-day-today {
          background-color: #f0fdfa !important;
        }
        .oradent-calendar .fc-non-business {
          background-color: #fafaf9;
        }
        .oradent-calendar .fc-now-indicator-line {
          border-color: #ef4444;
          border-width: 2px;
        }
        .oradent-calendar .fc-now-indicator-arrow {
          border-color: #ef4444;
        }
      `}</style>
    </div>
  );
}

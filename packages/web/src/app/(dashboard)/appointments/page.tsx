'use client';

import { useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  List,
  Clock,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  APPOINTMENT_TYPE_COLORS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_COLORS,
} from '@/lib/constants';
import { CalendarView } from '@/components/appointments/CalendarView';
import { AppointmentModal } from '@/components/appointments/AppointmentModal';
import { ChairView } from '@/components/appointments/ChairView';

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

type ViewMode = 'calendar' | 'chair';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<string>('timeGridWeek');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newSlotData, setNewSlotData] = useState<{ date: string; time: string } | null>(null);

  const fetchAppointments = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const data = await apiGet<Appointment[]>(
        `/api/appointments?start=${start}&end=${end}`
      );
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const start = format(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      'yyyy-MM-dd'
    );
    const end = format(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
      'yyyy-MM-dd'
    );
    fetchAppointments(start, end);
  }, [currentDate, fetchAppointments]);

  const handleEventClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewSlotData(null);
    setModalOpen(true);
  };

  const handleSlotClick = (date: string, time: string) => {
    setSelectedAppointment(null);
    setNewSlotData({ date, time });
    setModalOpen(true);
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setNewSlotData(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
    setNewSlotData(null);
  };

  const handleSave = () => {
    handleModalClose();
    const start = format(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      'yyyy-MM-dd'
    );
    const end = format(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
      'yyyy-MM-dd'
    );
    fetchAppointments(start, end);
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else {
      const offset = direction === 'prev' ? -1 : 1;
      if (calendarView === 'dayGridMonth') {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
      } else if (calendarView === 'timeGridWeek') {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset * 7);
        setCurrentDate(newDate);
      } else {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset);
        setCurrentDate(newDate);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-teal-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('chair')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'chair'
                  ? 'bg-teal-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Chair View
            </button>
          </div>

          {viewMode === 'calendar' && (
            <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1">
              <button
                onClick={() => setCalendarView('timeGridDay')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  calendarView === 'timeGridDay'
                    ? 'bg-stone-200 text-stone-900'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Day
              </button>
              <button
                onClick={() => setCalendarView('timeGridWeek')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  calendarView === 'timeGridWeek'
                    ? 'bg-stone-200 text-stone-900'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Week
              </button>
              <button
                onClick={() => setCalendarView('dayGridMonth')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  calendarView === 'dayGridMonth'
                    ? 'bg-stone-200 text-stone-900'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Month
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateDate('today')}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <h2 className="ml-2 text-lg font-semibold text-stone-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>
        </div>

        <button
          onClick={handleNewAppointment}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </button>
      </div>

      {/* Calendar / Chair View */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-[600px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              <p className="text-sm text-stone-500">Loading appointments...</p>
            </div>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            appointments={appointments}
            currentDate={currentDate}
            view={calendarView}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
            onDateChange={setCurrentDate}
            onViewChange={setCalendarView}
          />
        ) : (
          <ChairView
            appointments={appointments}
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        open={modalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        appointment={selectedAppointment}
        initialDate={newSlotData?.date}
        initialTime={newSlotData?.time}
      />
    </div>
  );
}

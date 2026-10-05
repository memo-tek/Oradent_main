'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Search,
  AlertTriangle,
  Clock,
  User,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_DURATIONS,
} from '@/lib/constants';

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  providerId: z.string().min(1, 'Provider is required'),
  chairId: z.string().min(1, 'Chair is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  type: z.string().min(1, 'Appointment type is required'),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Provider {
  id: string;
  name: string;
  role: string;
  color: string;
}

interface Chair {
  id: string;
  name: string;
  isActive: boolean;
}

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

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  appointment?: Appointment | null;
  initialDate?: string;
  initialTime?: string;
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export function AppointmentModal({
  open,
  onClose,
  onSave,
  appointment,
  initialDate,
  initialTime,
}: AppointmentModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = !!appointment;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: '',
      providerId: '',
      chairId: '',
      date: initialDate || '',
      startTime: initialTime || '09:00',
      duration: 30,
      type: 'EXAM',
      reason: '',
      notes: '',
    },
  });

  const watchType = watch('type');
  const watchDate = watch('date');
  const watchStartTime = watch('startTime');
  const watchProviderId = watch('providerId');
  const watchChairId = watch('chairId');

  useEffect(() => {
    if (open) {
      fetchProviders();
      fetchChairs();

      if (appointment) {
        const startDate = new Date(appointment.startTime);
        const endDate = new Date(appointment.endTime);
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMin = Math.round(durationMs / 60000);

        reset({
          patientId: appointment.patientId,
          providerId: appointment.providerId,
          chairId: appointment.chairId,
          date: appointment.startTime.split('T')[0],
          startTime: appointment.startTime.split('T')[1]?.substring(0, 5) || '09:00',
          duration: durationMin,
          type: appointment.type,
          reason: appointment.reason || '',
          notes: appointment.notes || '',
        });
        setSelectedPatient({
          id: appointment.patientId,
          firstName: appointment.patientName.split(' ')[0] || '',
          lastName: appointment.patientName.split(' ').slice(1).join(' ') || '',
          phone: '',
        });
      } else {
        reset({
          patientId: '',
          providerId: '',
          chairId: '',
          date: initialDate || '',
          startTime: initialTime || '09:00',
          duration: 30,
          type: 'EXAM',
          reason: '',
          notes: '',
        });
        setSelectedPatient(null);
      }
    }
  }, [open, appointment, initialDate, initialTime, reset]);

  useEffect(() => {
    if (watchType) {
      const defaultDuration = APPOINTMENT_TYPE_DURATIONS[watchType];
      if (defaultDuration && !appointment) {
        setValue('duration', defaultDuration);
      }
    }
  }, [watchType, setValue, appointment]);

  const fetchProviders = async () => {
    try {
      const data = await apiGet<Provider[]>('/api/settings/providers');
      setProviders(data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const fetchChairs = async () => {
    try {
      const data = await apiGet<Chair[]>('/api/settings/chairs');
      setChairs(data.filter((c) => c.isActive));
    } catch (error) {
      console.error('Failed to fetch chairs:', error);
    }
  };

  const searchPatients = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const data = await apiGet<{ patients: Patient[] }>(`/api/patients?search=${encodeURIComponent(query)}`);
        setSearchResults(data.patients);
      } catch (error) {
        console.error('Failed to search patients:', error);
      }
    },
    []
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (patientSearch) {
        searchPatients(patientSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch, searchPatients]);

  const checkConflicts = async () => {
    try {
      const data = await apiGet<{ hasConflict: boolean; message?: string }>(
        `/api/appointments/check-conflict?date=${watchDate}&time=${watchStartTime}&providerId=${watchProviderId}&chairId=${watchChairId}${appointment ? `&excludeId=${appointment.id}` : ''}`
      );
      setConflictWarning(data.hasConflict ? data.message || 'Time slot conflict detected' : null);
    } catch {
      setConflictWarning(null);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (watchDate && watchStartTime && (watchProviderId || watchChairId)) {
      checkConflicts();
    }
  }, [watchDate, watchStartTime, watchProviderId, watchChairId]);

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patientId', patient.id);
    setShowSearch(false);
    setPatientSearch('');
    setSearchResults([]);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        startTime: `${data.date}T${data.startTime}:00`,
      };

      if (isEditing && appointment) {
        await apiPut(`/api/appointments/${appointment.id}`, payload);
      } else {
        await apiPost('/api/appointments', payload);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save appointment:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-stone-900">
              {isEditing ? 'Edit Appointment' : 'New Appointment'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Patient Search */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Patient
              </label>
              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-stone-400" />
                    <span className="text-sm font-medium text-stone-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                    {selectedPatient.phone && (
                      <span className="text-xs text-stone-500">{selectedPatient.phone}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setValue('patientId', '');
                      setShowSearch(true);
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search patients by name or phone..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowSearch(true);
                    }}
                    onFocus={() => setShowSearch(true)}
                    className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg">
                      {searchResults.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => selectPatient(patient)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-stone-50"
                        >
                          <User className="h-4 w-4 text-stone-400" />
                          <div>
                            <div className="font-medium text-stone-900">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-xs text-stone-500">{patient.phone}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.patientId && (
                <p className="mt-1 text-xs text-red-500">{errors.patientId.message}</p>
              )}
            </div>

            {/* Provider + Chair row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Provider
                </label>
                <select
                  {...register('providerId')}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select provider</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
                {errors.providerId && (
                  <p className="mt-1 text-xs text-red-500">{errors.providerId.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Chair
                </label>
                <select
                  {...register('chairId')}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select chair</option>
                  {chairs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.chairId && (
                  <p className="mt-1 text-xs text-red-500">{errors.chairId.message}</p>
                )}
              </div>
            </div>

            {/* Date + Time + Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Date
                </label>
                <input
                  type="date"
                  {...register('date')}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Start Time
                </label>
                <input
                  type="time"
                  {...register('startTime')}
                  step="1800"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.startTime && (
                  <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Duration
                </label>
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Appointment Type
              </label>
              <select
                {...register('type')}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {Object.entries(APPOINTMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Reason
              </label>
              <input
                type="text"
                {...register('reason')}
                placeholder="Brief reason for visit"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Additional notes..."
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Conflict Warning */}
            {conflictWarning && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-sm text-amber-700">{conflictWarning}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditing ? 'Update' : 'Create Appointment'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

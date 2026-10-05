'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Users,
  Armchair,
  SlidersHorizontal,
  Save,
  Plus,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Bell,
  X,
} from 'lucide-react';
import { apiGet, apiPut, apiPost } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import type { Practice, PracticeSettings, Provider, Chair, ProviderRole } from '@/types';

// ═══════════════════ SCHEMAS ═══════════════════

const practiceSchema = z.object({
  name: z.string().min(1, 'Practice name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
});

type PracticeFormData = z.infer<typeof practiceSchema>;

const chairSchema = z.object({
  name: z.string().min(1, 'Chair name is required'),
});

type ChairFormData = z.infer<typeof chairSchema>;

const preferencesSchema = z.object({
  appointmentDuration: z.coerce.number().min(5, 'Minimum 5 minutes').max(480, 'Maximum 8 hours'),
  workingHoursStart: z.string().min(1, 'Start time is required'),
  workingHoursEnd: z.string().min(1, 'End time is required'),
  workingDays: z.array(z.number()).min(1, 'Select at least one working day'),
  reminderHoursBefore: z.coerce.number().min(1, 'Minimum 1 hour').max(168, 'Maximum 7 days'),
  currency: z.string().min(1, 'Currency is required'),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

// ═══════════════════ CONSTANTS ═══════════════════

const TABS = [
  { id: 'practice', label: 'Practice Info', icon: Building2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'chairs', label: 'Chairs', icon: Armchair },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
] as const;

type TabId = (typeof TABS)[number]['id'];

const ROLE_COLORS: Record<ProviderRole, string> = {
  OWNER: 'bg-purple-100 text-purple-700 border-purple-200',
  DENTIST: 'bg-teal-100 text-teal-700 border-teal-200',
  HYGIENIST: 'bg-blue-100 text-blue-700 border-blue-200',
  ASSISTANT: 'bg-amber-100 text-amber-700 border-amber-200',
  FRONT_DESK: 'bg-stone-100 text-stone-700 border-stone-200',
};

const ROLE_LABELS: Record<ProviderRole, string> = {
  OWNER: 'Owner',
  DENTIST: 'Dentist',
  HYGIENIST: 'Hygienist',
  ASSISTANT: 'Assistant',
  FRONT_DESK: 'Front Desk',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ═══════════════════ TOAST ═══════════════════

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// ═══════════════════ SKELETON COMPONENTS ═══════════════════

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
      <div className="h-10 animate-pulse rounded-lg bg-stone-200" />
    </div>
  );
}

function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <FieldSkeleton key={i} />
      ))}
    </div>
  );
}

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-200" />
      ))}
    </div>
  );
}

// ═══════════════════ PRACTICE INFO TAB ═══════════════════

function PracticeInfoTab({ addToast }: { addToast: (type: 'success' | 'error', msg: string) => void }) {
  const practice = useAppStore((s) => s.practice);
  const updatePractice = useAppStore((s) => s.updatePractice);
  const queryClient = useQueryClient();

  const {
    data: practiceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['settings', 'practice'],
    queryFn: () => apiGet<Practice>('/api/settings/practice'),
    initialData: practice || undefined,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<PracticeFormData>({
    resolver: zodResolver(practiceSchema),
    values: practiceData
      ? {
          name: practiceData.name,
          address: practiceData.address,
          phone: practiceData.phone,
          email: practiceData.email,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: PracticeFormData) => apiPut<Practice>('/api/settings/practice', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'practice'] });
      updatePractice(data);
      reset(data);
      addToast('success', 'Practice information updated successfully');
    },
    onError: () => {
      addToast('error', 'Failed to update practice information');
    },
  });

  const onSubmit = (data: PracticeFormData) => mutation.mutate(data);

  if (error) {
    return (
      <ErrorCard message="Failed to load practice information. Please try again." />
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-stone-900">Practice Information</h2>
        <p className="mt-1 text-sm text-stone-500">
          Update your practice details visible to staff and on documents.
        </p>
      </div>
      <div className="p-6">
        {isLoading ? (
          <FormSkeleton fields={4} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-stone-400" />
                  Practice Name
                </span>
              </label>
              <input
                {...register('name')}
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                  'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                  errors.name ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                )}
                placeholder="e.g. Bright Smile Dental"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-stone-400" />
                  Address
                </span>
              </label>
              <input
                {...register('address')}
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                  'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                  errors.address ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                )}
                placeholder="123 Main St, Suite 100, City, ST 12345"
              />
              {errors.address && (
                <p className="mt-1.5 text-xs text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-stone-400" />
                    Phone
                  </span>
                </label>
                <input
                  {...register('phone')}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    errors.phone ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                  )}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-stone-400" />
                    Email
                  </span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    errors.email ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                  )}
                  placeholder="office@practice.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-stone-100 pt-5">
              <button
                type="submit"
                disabled={!isDirty || mutation.isPending}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors',
                  isDirty && !mutation.isPending
                    ? 'bg-teal-600 hover:bg-teal-700'
                    : 'cursor-not-allowed bg-stone-300'
                )}
              >
                <Save className="h-4 w-4" />
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ═══════════════════ TEAM TAB ═══════════════════

const inviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  title: z.string().min(1, 'Title is required'),
  role: z.enum(['DENTIST', 'HYGIENIST', 'ASSISTANT', 'FRONT_DESK'] as const),
  temporaryPassword: z.string().min(8, 'Minimum 8 characters'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

function TeamTab({ addToast }: { addToast: (type: 'success' | 'error', msg: string) => void }) {
  const [showInvite, setShowInvite] = useState(false);
  const queryClient = useQueryClient();
  const currentProvider = useAppStore((s) => s.provider);
  const isOwner = currentProvider?.role === 'OWNER';

  const {
    data: providers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['settings', 'providers'],
    queryFn: () => apiGet<Provider[]>('/api/settings/providers'),
  });

  const {
    register: registerInvite,
    handleSubmit: handleInviteSubmit,
    formState: { errors: inviteErrors },
    reset: resetInvite,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'DENTIST', temporaryPassword: '' },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormData) => apiPost('/api/settings/providers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'providers'] });
      setShowInvite(false);
      resetInvite();
      addToast('success', 'Team member invited successfully');
    },
    onError: (error: Error) => {
      addToast('error', error.message || 'Failed to invite team member.');
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPut(`/api/settings/providers/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'providers'] });
      addToast('success', 'Provider status updated');
    },
    onError: () => addToast('error', 'Failed to update provider'),
  });

  if (error) {
    return <ErrorCard message="Failed to load team members. Please try again." />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Team Members</h2>
            <p className="mt-1 text-sm text-stone-500">
              Manage providers and staff associated with your practice.
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Invite Member
            </button>
          )}
        </div>
        <div className="p-6">
          {isLoading ? (
            <CardSkeleton rows={4} />
          ) : !providers || providers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No team members</h3>
              <p className="mt-1 text-xs text-stone-500">
                No providers have been added to this practice yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between rounded-lg border border-stone-200 px-5 py-4 transition-colors hover:bg-stone-50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: provider.color || '#14b8a6' }}
                    >
                      {provider.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">{provider.name}</p>
                      <p className="text-xs text-stone-500">
                        {provider.title} {provider.email ? `- ${provider.email}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        ROLE_COLORS[provider.role]
                      )}
                    >
                      {ROLE_LABELS[provider.role]}
                    </span>
                    {isOwner && provider.role !== 'OWNER' ? (
                      <button
                        onClick={() =>
                          toggleActive.mutate({ id: provider.id, isActive: !provider.isActive })
                        }
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors',
                          provider.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        )}
                      >
                        {provider.isActive ? 'Active' : 'Inactive'}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          provider.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-stone-100 text-stone-500'
                        )}
                      >
                        {provider.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-900">Invite Team Member</h3>
              <button
                onClick={() => { setShowInvite(false); resetInvite(); }}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={handleInviteSubmit((data) => inviteMutation.mutate(data))}
              className="p-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Full Name</label>
                <input
                  {...registerInvite('name')}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    inviteErrors.name ? 'border-red-300 bg-red-50' : 'border-stone-300'
                  )}
                  placeholder="Dr. Jane Smith"
                />
                {inviteErrors.name && <p className="mt-1 text-xs text-red-600">{inviteErrors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
                <input
                  {...registerInvite('email')}
                  type="email"
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    inviteErrors.email ? 'border-red-300 bg-red-50' : 'border-stone-300'
                  )}
                  placeholder="jane@practice.com"
                />
                {inviteErrors.email && <p className="mt-1 text-xs text-red-600">{inviteErrors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Title</label>
                  <input
                    {...registerInvite('title')}
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                      inviteErrors.title ? 'border-red-300 bg-red-50' : 'border-stone-300'
                    )}
                    placeholder="DDS"
                  />
                  {inviteErrors.title && <p className="mt-1 text-xs text-red-600">{inviteErrors.title.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Role</label>
                  <select
                    {...registerInvite('role')}
                    className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="DENTIST">Dentist</option>
                    <option value="HYGIENIST">Hygienist</option>
                    <option value="ASSISTANT">Assistant</option>
                    <option value="FRONT_DESK">Front Desk</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Temporary Password</label>
                <input
                  {...registerInvite('temporaryPassword')}
                  type="password"
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    inviteErrors.temporaryPassword ? 'border-red-300 bg-red-50' : 'border-stone-300'
                  )}
                  placeholder="Min. 8 characters"
                />
                {inviteErrors.temporaryPassword && <p className="mt-1 text-xs text-red-600">{inviteErrors.temporaryPassword.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInvite(false); resetInvite(); }}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-stone-300"
                >
                  <Mail className="h-4 w-4" />
                  {inviteMutation.isPending ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════ CHAIRS TAB ═══════════════════

function ChairsTab({ addToast }: { addToast: (type: 'success' | 'error', msg: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: chairs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['settings', 'chairs'],
    queryFn: () => apiGet<Chair[]>('/api/settings/chairs'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChairFormData>({
    resolver: zodResolver(chairSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ChairFormData) => apiPost<Chair>('/api/settings/chairs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'chairs'] });
      reset();
      setShowForm(false);
      addToast('success', 'Chair added successfully');
    },
    onError: () => {
      addToast('error', 'Failed to add chair');
    },
  });

  const onSubmit = (data: ChairFormData) => mutation.mutate(data);

  if (error) {
    return <ErrorCard message="Failed to load chairs. Please try again." />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Operatory Chairs</h2>
            <p className="mt-1 text-sm text-stone-500">
              Manage the chairs and operatories in your practice.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Chair
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <CardSkeleton rows={3} />
          ) : !chairs || chairs.length === 0 ? (
            <div className="py-12 text-center">
              <Armchair className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No chairs configured</h3>
              <p className="mt-1 text-xs text-stone-500">
                Add operatory chairs to start scheduling appointments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chairs.map((chair) => (
                <div
                  key={chair.id}
                  className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3.5 transition-colors hover:bg-stone-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
                      <Armchair className="h-4 w-4 text-teal-600" />
                    </div>
                    <span className="text-sm font-medium text-stone-900">{chair.name}</span>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      chair.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-stone-100 text-stone-500'
                    )}
                  >
                    {chair.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Chair Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-900">Add New Chair</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Chair Name
                </label>
                <input
                  {...register('name')}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    errors.name ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                  )}
                  placeholder="e.g. Chair 1, Operatory A"
                  autoFocus
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                  }}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  <Plus className="h-4 w-4" />
                  {mutation.isPending ? 'Adding...' : 'Add Chair'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════ PREFERENCES TAB ═══════════════════

function PreferencesTab({ addToast }: { addToast: (type: 'success' | 'error', msg: string) => void }) {
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['settings', 'preferences'],
    queryFn: () => apiGet<PracticeSettings>('/api/settings/practice'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    values: settings
      ? {
          appointmentDuration: settings.appointmentDuration,
          workingHoursStart: settings.workingHoursStart,
          workingHoursEnd: settings.workingHoursEnd,
          workingDays: settings.workingDays,
          reminderHoursBefore: settings.reminderHoursBefore,
          currency: settings.currency,
        }
      : undefined,
  });

  const workingDays = watch('workingDays') || [];

  const toggleDay = (day: number) => {
    const current = workingDays;
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    setValue('workingDays', updated, { shouldDirty: true });
  };

  const mutation = useMutation({
    mutationFn: (data: PreferencesFormData) =>
      apiPut<PracticeSettings>('/api/settings/practice/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'preferences'] });
      addToast('success', 'Preferences updated successfully');
    },
    onError: () => {
      addToast('error', 'Failed to update preferences');
    },
  });

  const onSubmit = (data: PreferencesFormData) => mutation.mutate(data);

  if (error) {
    return <ErrorCard message="Failed to load preferences. Please try again." />;
  }

  return (
    <div className="space-y-6">
      {/* Appointment Settings */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Scheduling Preferences</h2>
          <p className="mt-1 text-sm text-stone-500">
            Configure default appointment duration, working hours, and reminder settings.
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <FormSkeleton fields={5} />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Appointment Duration */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-stone-400" />
                    Default Appointment Duration (minutes)
                  </span>
                </label>
                <input
                  {...register('appointmentDuration')}
                  type="number"
                  min={5}
                  max={480}
                  className={cn(
                    'w-full max-w-xs rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    errors.appointmentDuration
                      ? 'border-red-300 bg-red-50'
                      : 'border-stone-300 bg-white'
                  )}
                />
                {errors.appointmentDuration && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.appointmentDuration.message}
                  </p>
                )}
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Working Hours Start
                  </label>
                  <input
                    {...register('workingHoursStart')}
                    type="time"
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 transition-colors',
                      'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                      errors.workingHoursStart
                        ? 'border-red-300 bg-red-50'
                        : 'border-stone-300 bg-white'
                    )}
                  />
                  {errors.workingHoursStart && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.workingHoursStart.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Working Hours End
                  </label>
                  <input
                    {...register('workingHoursEnd')}
                    type="time"
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 transition-colors',
                      'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                      errors.workingHoursEnd
                        ? 'border-red-300 bg-red-50'
                        : 'border-stone-300 bg-white'
                    )}
                  />
                  {errors.workingHoursEnd && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.workingHoursEnd.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Working Days */}
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Working Days
                </label>
                <div className="flex gap-2">
                  {DAY_LABELS.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={cn(
                        'flex h-10 w-12 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                        workingDays.includes(index)
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-stone-300 bg-white text-stone-500 hover:bg-stone-50'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.workingDays && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.workingDays.message}</p>
                )}
              </div>

              {/* Reminder Settings */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-stone-400" />
                    Send Reminder (hours before appointment)
                  </span>
                </label>
                <input
                  {...register('reminderHoursBefore')}
                  type="number"
                  min={1}
                  max={168}
                  className={cn(
                    'w-full max-w-xs rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    errors.reminderHoursBefore
                      ? 'border-red-300 bg-red-50'
                      : 'border-stone-300 bg-white'
                  )}
                />
                {errors.reminderHoursBefore && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.reminderHoursBefore.message}
                  </p>
                )}
              </div>

              {/* Currency */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Currency
                </label>
                <select
                  {...register('currency')}
                  className={cn(
                    'w-full max-w-xs rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    errors.currency ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                  )}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
                {errors.currency && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.currency.message}</p>
                )}
              </div>

              <div className="flex justify-end border-t border-stone-100 pt-5">
                <button
                  type="submit"
                  disabled={!isDirty || mutation.isPending}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors',
                    isDirty && !mutation.isPending
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'cursor-not-allowed bg-stone-300'
                  )}
                >
                  <Save className="h-4 w-4" />
                  {mutation.isPending ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ SHARED COMPONENTS ═══════════════════

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
      <p className="mt-3 text-sm font-medium text-red-700">{message}</p>
    </div>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm transition-all animate-in slide-in-from-right',
            toast.type === 'success'
              ? 'border-green-200 bg-white text-green-800'
              : 'border-red-200 bg-white text-red-800'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-2 shrink-0 rounded p-0.5 hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('practice');
  const { toasts, addToast, removeToast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage your practice configuration, team, and preferences.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'practice' && <PracticeInfoTab addToast={addToast} />}
      {activeTab === 'team' && <TeamTab addToast={addToast} />}
      {activeTab === 'chairs' && <ChairsTab addToast={addToast} />}
      {activeTab === 'preferences' && <PreferencesTab addToast={addToast} />}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

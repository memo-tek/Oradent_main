'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SubmitErrorHandler } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCreatePatient } from '@/hooks/usePatient';

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  insuranceCompany: z.string().optional(),
  insurancePlan: z.string().optional(),
  groupNumber: z.string().optional(),
  memberId: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  open: boolean;
  onClose: () => void;
}

export function PatientForm({ open, onClose }: PatientFormProps) {
  const [step, setStep] = useState<'info' | 'insurance'>('info');
  const createPatient = useCreatePatient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      await createPatient.mutateAsync({
        ...data,
        secondaryPhone: undefined,
        subscriberName: undefined,
        subscriberDob: undefined,
        coveragePercent: undefined,
        emergencyContactName: undefined,
        emergencyContactPhone: undefined,
        emergencyContactRelationship: undefined,
        allergies: [],
        medications: [],
        conditions: [],
        smoking: false,
        alcohol: false,
        pregnancy: false,
        status: 'active',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create patient:', error);
    }
  };

  const onError: SubmitErrorHandler<PatientFormData> = (formErrors) => {
    const infoFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'email'] as const;
    if (infoFields.some((field) => formErrors[field])) {
      setStep('info');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-stone-900">
              New Patient
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Step Indicator */}
          <div className="mb-6 flex gap-2">
            <button
              type="button"
              onClick={() => setStep('info')}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
                step === 'info'
                  ? 'bg-teal-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Personal Info
            </button>
            <button
              type="button"
              onClick={() => setStep('insurance')}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
                step === 'insurance'
                  ? 'bg-teal-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Insurance
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
            {step === 'info' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      {...register('firstName')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      {...register('lastName')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Gender
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Address
                    </label>
                    <input
                      type="text"
                      {...register('address')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      City
                    </label>
                    <input
                      type="text"
                      {...register('city')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      State
                    </label>
                    <input
                      type="text"
                      {...register('state')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      ZIP
                    </label>
                    <input
                      type="text"
                      {...register('zip')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 'insurance' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Insurance Company
                  </label>
                  <input
                    type="text"
                    {...register('insuranceCompany')}
                    placeholder="e.g., Delta Dental"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    {...register('insurancePlan')}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Group Number
                    </label>
                    <input
                      type="text"
                      {...register('groupNumber')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Member ID
                    </label>
                    <input
                      type="text"
                      {...register('memberId')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </>
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
              {step === 'info' ? (
                <button
                  type="button"
                  onClick={() => setStep('insurance')}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createPatient.isPending}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {createPatient.isPending ? 'Creating...' : 'Create Patient'}
                </button>
              )}
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Search, User } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

const invoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  date: z.string().min(1, 'Date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z
    .array(
      z.object({
        cdtCode: z.string().min(1, 'CDT code required'),
        description: z.string().min(1, 'Description required'),
        toothNumber: z.string().optional(),
        quantity: z.number().min(1),
        fee: z.number().min(0),
      })
    )
    .min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface CreateInvoiceProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  defaultPatientId?: string;
}

export function CreateInvoice({ open, onClose, onSave, defaultPatientId }: CreateInvoiceProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patientId: defaultPatientId || '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [{ cdtCode: '', description: '', toothNumber: '', quantity: 1, fee: 0 }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  const total = watchItems.reduce((sum, item) => sum + (item.fee || 0) * (item.quantity || 1), 0);

  // Auto-load patient when defaultPatientId is provided
  useEffect(() => {
    if (defaultPatientId && !selectedPatient) {
      apiGet<Patient>(`/api/patients/${defaultPatientId}`)
        .then((p) => {
          setSelectedPatient({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone });
          setValue('patientId', p.id);
        })
        .catch(() => {});
    }
  }, [defaultPatientId, selectedPatient, setValue]);

  const searchPatients = useCallback(async (query: string) => {
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
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (patientSearch) searchPatients(patientSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch, searchPatients]);

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patientId', patient.id);
    setShowSearch(false);
    setPatientSearch('');
    setSearchResults([]);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const onSubmit = async (data: InvoiceFormData) => {
    setSaving(true);
    try {
      await apiPost('/api/billing/invoices', data);
      onSave();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-stone-900">
              Create Invoice
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Patient */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Patient</label>
              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-stone-400" />
                    <span className="text-sm font-medium">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setValue('patientId', '');
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
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowSearch(true);
                    }}
                    className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPatient(p)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50"
                        >
                          <User className="h-4 w-4 text-stone-400" />
                          {p.firstName} {p.lastName}
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Invoice Date</label>
                <input
                  type="date"
                  {...register('date')}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Due Date</label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-stone-700">Line Items</label>
                <button
                  type="button"
                  onClick={() =>
                    append({ cdtCode: '', description: '', toothNumber: '', quantity: 1, fee: 0 })
                  }
                  className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[100px_1fr_70px_60px_100px_32px] gap-2 items-end">
                    <div>
                      {index === 0 && <span className="mb-1 block text-xs text-stone-400">CDT Code</span>}
                      <input
                        {...register(`items.${index}.cdtCode`)}
                        placeholder="D0120"
                        className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      {index === 0 && <span className="mb-1 block text-xs text-stone-400">Description</span>}
                      <input
                        {...register(`items.${index}.description`)}
                        placeholder="Description"
                        className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      {index === 0 && <span className="mb-1 block text-xs text-stone-400">Tooth</span>}
                      <input
                        {...register(`items.${index}.toothNumber`)}
                        placeholder="#"
                        className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      {index === 0 && <span className="mb-1 block text-xs text-stone-400">Qty</span>}
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm text-center focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      {index === 0 && <span className="mb-1 block text-xs text-stone-400">Fee</span>}
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.fee`, { valueAsNumber: true })}
                        placeholder="0.00"
                        className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm text-right focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      {index === 0 && <span className="mb-1 block text-xs text-stone-400">&nbsp;</span>}
                      <button
                        type="button"
                        onClick={() => fields.length > 1 && remove(index)}
                        disabled={fields.length <= 1}
                        className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {errors.items && (
                <p className="mt-1 text-xs text-red-500">
                  {typeof errors.items.message === 'string' ? errors.items.message : 'Fix item errors'}
                </p>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-end border-t border-stone-200 pt-3">
              <div className="text-right">
                <span className="text-sm text-stone-500">Total: </span>
                <span className="text-lg font-bold text-stone-900">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Notes</label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Optional notes..."
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

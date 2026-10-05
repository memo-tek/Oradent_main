'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, DollarSign } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.string().min(1, 'Payment method is required'),
  referenceNumber: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientName: string;
  total: number;
  amountPaid: number;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  invoice: Invoice;
}

export function PaymentModal({ open, onClose, onSave, invoice }: PaymentModalProps) {
  const [saving, setSaving] = useState(false);
  const balance = invoice.total - invoice.amountPaid;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: balance,
      method: 'CREDIT_CARD',
      referenceNumber: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    setSaving(true);
    try {
      await apiPost(`/api/billing/invoices/${invoice.id}/payments`, data);
      onSave();
    } catch (error) {
      console.error('Failed to record payment:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-stone-900">
              Record Payment
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Invoice Summary */}
          <div className="mb-5 rounded-lg bg-stone-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Invoice</span>
              <span className="font-mono font-medium text-stone-700">{invoice.invoiceNumber}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-stone-500">Patient</span>
              <span className="font-medium text-stone-700">{invoice.patientName}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-stone-500">Total</span>
              <span className="font-medium text-stone-700">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-stone-500">Paid</span>
              <span className="font-medium text-green-600">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-stone-200 pt-2 text-sm">
              <span className="font-medium text-stone-700">Balance Due</span>
              <span className="font-bold text-red-600">{formatCurrency(balance)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Method</label>
                <select
                  {...register('method')}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Date</label>
                <input
                  type="date"
                  {...register('date')}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Reference / Check #
              </label>
              <input
                type="text"
                {...register('referenceNumber')}
                placeholder="Optional"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Notes</label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Optional notes..."
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

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
                {saving ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

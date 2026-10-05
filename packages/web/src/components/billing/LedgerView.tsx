'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'charge' | 'payment' | 'adjustment' | 'insurance';
  amount: number;
  balance: number;
  reference?: string;
  provider?: string;
}

interface LedgerViewProps {
  patientId: string;
  patientName: string;
  onBack: () => void;
}

export function LedgerView({ patientId, patientName, onBack }: LedgerViewProps) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, [patientId]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await apiGet<LedgerEntry[]>(`/api/billing/ledger/${patientId}`);
      setEntries(data);
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const TYPE_STYLES: Record<string, { label: string; style: string; icon: typeof ArrowDownLeft }> = {
    charge: { label: 'Charge', style: 'text-red-600', icon: ArrowUpRight },
    payment: { label: 'Payment', style: 'text-green-600', icon: ArrowDownLeft },
    adjustment: { label: 'Adjustment', style: 'text-amber-600', icon: ArrowDownLeft },
    insurance: { label: 'Insurance', style: 'text-blue-600', icon: ArrowDownLeft },
  };

  const currentBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Patient Ledger</h3>
            <p className="text-xs text-stone-500">{patientName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500">Current Balance</p>
          <p
            className={cn(
              'text-lg font-bold',
              currentBalance > 0 ? 'text-red-600' : 'text-green-600'
            )}
          >
            {formatCurrency(currentBalance)}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="px-4 py-3 text-left font-medium text-stone-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500">Description</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500">Type</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500">Reference</th>
              <th className="px-4 py-3 text-right font-medium text-stone-500">Amount</th>
              <th className="px-4 py-3 text-right font-medium text-stone-500">Balance</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const typeInfo = TYPE_STYLES[entry.type] || TYPE_STYLES.charge;
              const Icon = typeInfo.icon;
              return (
                <tr
                  key={entry.id}
                  className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-4 py-3 text-stone-600">
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {entry.description}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Icon className={cn('h-3.5 w-3.5', typeInfo.style)} />
                      <span className={cn('text-xs font-medium', typeInfo.style)}>
                        {typeInfo.label}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">
                    {entry.reference || '-'}
                  </td>
                  <td className={cn('px-4 py-3 text-right font-medium', typeInfo.style)}>
                    {entry.type === 'charge' ? '' : '-'}
                    {formatCurrency(Math.abs(entry.amount))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-stone-900">
                    {formatCurrency(entry.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {!loading && entries.length === 0 && (
        <div className="py-12 text-center text-sm text-stone-400">
          No ledger entries found.
        </div>
      )}
    </div>
  );
}

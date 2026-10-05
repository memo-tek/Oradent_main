'use client';

import { useState, Fragment } from 'react';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Eye,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INVOICE_STATUS_LABELS } from '@/lib/constants';

interface InvoiceItem {
  id: string;
  cdtCode: string;
  description: string;
  quantity: number;
  fee: number;
  toothNumber?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  status: string;
  items: InvoiceItem[];
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onRecordPayment: (invoice: Invoice) => void;
  onViewLedger: (invoice: Invoice) => void;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-stone-100 text-stone-600',
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  VOID: 'bg-stone-100 text-stone-500',
  WRITE_OFF: 'bg-purple-100 text-purple-700',
};

export function InvoiceTable({
  invoices,
  onRecordPayment,
  onViewLedger,
}: InvoiceTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'total' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const filtered = invoices
    .filter(
      (inv) =>
        inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'date') return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortField === 'total') return dir * (a.total - b.total);
      return dir * a.status.localeCompare(b.status);
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Search */}
      <div className="border-b border-stone-200 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200">
            <th className="px-4 py-3 text-left font-medium text-stone-500">Invoice #</th>
            <th className="px-4 py-3 text-left font-medium text-stone-500">Patient</th>
            <th
              className="cursor-pointer px-4 py-3 text-left font-medium text-stone-500 hover:text-stone-700"
              onClick={() => toggleSort('date')}
            >
              <span className="flex items-center gap-1">
                Date <SortIcon field="date" />
              </span>
            </th>
            <th
              className="cursor-pointer px-4 py-3 text-right font-medium text-stone-500 hover:text-stone-700"
              onClick={() => toggleSort('total')}
            >
              <span className="flex items-center justify-end gap-1">
                Total <SortIcon field="total" />
              </span>
            </th>
            <th className="px-4 py-3 text-right font-medium text-stone-500">Balance</th>
            <th
              className="cursor-pointer px-4 py-3 text-left font-medium text-stone-500 hover:text-stone-700"
              onClick={() => toggleSort('status')}
            >
              <span className="flex items-center gap-1">
                Status <SortIcon field="status" />
              </span>
            </th>
            <th className="px-4 py-3 text-right font-medium text-stone-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((invoice) => (
            <Fragment key={invoice.id}>
              <tr
                className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs font-medium text-teal-600">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-4 py-3 font-medium text-stone-900">
                  {invoice.patientName}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {format(new Date(invoice.date), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 text-right font-medium text-stone-900">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="px-4 py-3 text-right text-stone-600">
                  {formatCurrency(invoice.total - invoice.amountPaid)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_STYLES[invoice.status] || 'bg-stone-100 text-stone-600'
                    )}
                  >
                    {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === invoice.id ? null : invoice.id)
                      }
                      className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
                      <button
                        onClick={() => onRecordPayment(invoice)}
                        className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                        title="Record payment"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onViewLedger(invoice)}
                      className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                      title="View ledger"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              {expandedId === invoice.id && (
                <tr className="border-b border-stone-100 bg-stone-50">
                  <td colSpan={7} className="px-8 py-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Line Items
                    </h4>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-stone-400">
                          <th className="pb-1 text-left font-medium">CDT Code</th>
                          <th className="pb-1 text-left font-medium">Description</th>
                          <th className="pb-1 text-left font-medium">Tooth</th>
                          <th className="pb-1 text-right font-medium">Qty</th>
                          <th className="pb-1 text-right font-medium">Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr key={item.id} className="text-stone-600">
                            <td className="py-1 font-mono">{item.cdtCode}</td>
                            <td className="py-1">{item.description}</td>
                            <td className="py-1">{item.toothNumber || '-'}</td>
                            <td className="py-1 text-right">{item.quantity}</td>
                            <td className="py-1 text-right">{formatCurrency(item.fee)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-stone-400">
          No invoices found.
        </div>
      )}
    </div>
  );
}

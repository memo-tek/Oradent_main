'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { InvoiceTable } from '@/components/billing/InvoiceTable';
import { CreateInvoice } from '@/components/billing/CreateInvoice';
import { PaymentModal } from '@/components/billing/PaymentModal';
import { InsuranceClaimForm } from '@/components/billing/InsuranceClaimForm';
import { LedgerView } from '@/components/billing/LedgerView';
import {
  CLAIM_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from '@/lib/constants';

interface BillingSummary {
  totalOutstanding: number;
  mtdRevenue: number;
  pendingClaims: number;
  collectionRate: number;
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

interface InvoiceItem {
  id: string;
  cdtCode: string;
  description: string;
  quantity: number;
  fee: number;
  toothNumber?: string;
}

interface Claim {
  id: string;
  claimNumber: string;
  patientName: string;
  insuranceProvider: string;
  submittedDate: string;
  amount: number;
  status: string;
}

interface FeeScheduleEntry {
  id: string;
  cdtCode: string;
  description: string;
  category: string;
  fee: number;
  insuranceAllowance: number;
}

const CLAIM_PIPELINE_STAGES = ['DRAFTED', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'PAID'];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [summary, setSummary] = useState<BillingSummary>({
    totalOutstanding: 0,
    mtdRevenue: 0,
    pendingClaims: 0,
    collectionRate: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [feeSchedule, setFeeSchedule] = useState<FeeScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingFee, setEditingFee] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, invoiceData, claimData, feeData] = await Promise.all([
        apiGet<BillingSummary>('/api/billing/summary'),
        apiGet<Invoice[] & { invoices?: Invoice[] }>('/api/billing/invoices'),
        apiGet<Claim[]>('/api/billing/claims'),
        apiGet<FeeScheduleEntry[]>('/api/billing/fee-schedule'),
      ]);
      setSummary(summaryData);
      setInvoices(invoiceData.invoices ?? invoiceData);
      setClaims(claimData);
      setFeeSchedule(feeData);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const claimsByStage = CLAIM_PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = claims.filter((c) => c.status === stage);
      return acc;
    },
    {} as Record<string, Claim[]>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Outstanding</p>
              <p className="text-xl font-bold text-stone-900">
                {formatCurrency(summary.totalOutstanding)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">MTD Revenue</p>
              <p className="text-xl font-bold text-stone-900">
                {formatCurrency(summary.mtdRevenue)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Pending Claims</p>
              <p className="text-xl font-bold text-stone-900">
                {formatCurrency(summary.pendingClaims)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Collection Rate</p>
              <p className="text-xl font-bold text-stone-900">
                {summary.collectionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <Tabs.List className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
            {['invoices', 'payments', 'claims', 'fee-schedule'].map((tab) => (
              <Tabs.Trigger
                key={tab}
                value={tab}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                {tab === 'fee-schedule'
                  ? 'Fee Schedule'
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {activeTab === 'invoices' && (
            <button
              onClick={() => setShowCreateInvoice(true)}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </button>
          )}
          {activeTab === 'claims' && (
            <button
              onClick={() => setShowClaimForm(true)}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              New Claim
            </button>
          )}
        </div>

        {/* Invoices Tab */}
        <Tabs.Content value="invoices" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          ) : (
            <InvoiceTable
              invoices={invoices}
              onRecordPayment={(invoice) => {
                setSelectedInvoice(invoice);
                setShowPaymentModal(true);
              }}
              onViewLedger={(invoice) => {
                setSelectedInvoice(invoice);
              }}
            />
          )}
        </Tabs.Content>

        {/* Payments Tab */}
        <Tabs.Content value="payments" className="mt-4">
          {selectedInvoice ? (
            <LedgerView
              patientId={selectedInvoice.patientId}
              patientName={selectedInvoice.patientName}
              onBack={() => setSelectedInvoice(null)}
            />
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
              <DollarSign className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-lg font-medium text-stone-700">Payment History</h3>
              <p className="mt-1 text-sm text-stone-500">
                Select a patient from the Invoices tab to view their payment ledger.
              </p>
            </div>
          )}
        </Tabs.Content>

        {/* Claims Tab - Pipeline View */}
        <Tabs.Content value="claims" className="mt-4">
          <div className="grid grid-cols-5 gap-3">
            {CLAIM_PIPELINE_STAGES.map((stage) => (
              <div key={stage} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {CLAIM_STATUS_LABELS[stage] || stage}
                  </h4>
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600">
                    {claimsByStage[stage]?.length || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {claimsByStage[stage]?.map((claim) => (
                    <div
                      key={claim.id}
                      className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm"
                    >
                      <p className="text-sm font-medium text-stone-900">
                        {claim.patientName}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {claim.claimNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {claim.insuranceProvider}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-700">
                        {formatCurrency(claim.amount)}
                      </p>
                    </div>
                  ))}
                  {(!claimsByStage[stage] || claimsByStage[stage].length === 0) && (
                    <p className="py-4 text-center text-xs text-stone-400">
                      No claims
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Tabs.Content>

        {/* Fee Schedule Tab */}
        <Tabs.Content value="fee-schedule" className="mt-4">
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-medium text-stone-500">CDT Code</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Fee</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Insurance Allowance</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeSchedule.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-stone-900">
                      {entry.cdtCode}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{entry.description}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingFee === entry.id ? (
                        <input
                          type="number"
                          defaultValue={entry.fee}
                          className="w-24 rounded border border-stone-200 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          onBlur={(e) => {
                            setEditingFee(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingFee(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-stone-900">
                          {formatCurrency(entry.fee)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-600">
                      {formatCurrency(entry.insuranceAllowance)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingFee(entry.id)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {feeSchedule.length === 0 && !loading && (
              <div className="py-12 text-center text-sm text-stone-400">
                No fee schedule entries found.
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Modals */}
      {showCreateInvoice && (
        <CreateInvoice
          open={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          onSave={() => {
            setShowCreateInvoice(false);
            fetchData();
          }}
        />
      )}

      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          onSave={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            fetchData();
          }}
          invoice={selectedInvoice}
        />
      )}

      {showClaimForm && (
        <InsuranceClaimForm
          open={showClaimForm}
          onClose={() => setShowClaimForm(false)}
          onSave={() => {
            setShowClaimForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

  'use client';

  import { useState } from 'react';
  import { useParams } from 'next/navigation';
  import { DollarSign, FileText, CreditCard, Plus } from 'lucide-react';
  import { useInvoices, usePayments } from '@/hooks/useBilling';
  import { formatCurrency, formatDate } from '@/lib/formatters';
  import { CreateInvoice } from '@/components/billing/CreateInvoice';
  import { PaymentModal } from '@/components/billing/PaymentModal';

  export default function PatientBillingPage() {
    const params = useParams<{ id: string }>();
    const [showCreateInvoice, setShowCreateInvoice] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

    const { data: invoiceData, isLoading: invoicesLoading } = useInvoices({
      patientId: params.id,
    });
    const { data: paymentData, isLoading: paymentsLoading } = usePayments(params.id);

    const invoices = invoiceData?.invoices ?? [];
    const payments = paymentData?.payments ?? [];

    const totalBalance = invoices.reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const isLoading = invoicesLoading || paymentsLoading;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900">Billing</h2>
          <button
            onClick={() => setShowCreateInvoice(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </div>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 p-2.5">
                <DollarSign className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Outstanding Balance</p>
                <p className="text-xl font-bold text-stone-900">
                  {isLoading ? (
                    <span className="inline-block h-7 w-24 animate-pulse rounded bg-stone-200" />
                  ) : (
                    formatCurrency(totalBalance)
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2.5">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Total Paid</p>
                <p className="text-xl font-bold text-stone-900">
                  {isLoading ? (
                    <span className="inline-block h-7 w-24 animate-pulse rounded bg-stone-200" />
                  ) : (
                    formatCurrency(totalPaid)
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Invoices</p>
                <p className="text-xl font-bold text-stone-900">
                  {isLoading ? (
                    <span className="inline-block h-7 w-24 animate-pulse rounded bg-stone-200" />
                  ) : (
                    invoices.length
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-stone-900">Invoices</h3>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-200" />
              ))}
            </div>
          ) : invoices.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-6 py-3 text-left font-medium text-stone-500">Invoice #</th>
                  <th className="px-6 py-3 text-left font-medium text-stone-500">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-stone-500">Status</th>
                  <th className="px-6 py-3 text-right font-medium text-stone-500">Total</th>
                  <th className="px-6 py-3 text-right font-medium text-stone-500">Balance</th>
                  <th className="px-6 py-3 text-right font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-stone-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-3 text-stone-600">{formatDate(invoice.date)}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : invoice.status === 'partial'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-stone-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-stone-900">
                      {formatCurrency(invoice.total - invoice.amountPaid)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(invoice.id);
                            setShowPayment(true);
                          }}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-sm text-stone-400">
              No invoices yet.
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-stone-900">Payment History</h3>
          </div>
          {payments.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-6 py-3 text-left font-medium text-stone-500">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-stone-500">Method</th>
                  <th className="px-6 py-3 text-left font-medium text-stone-500">Reference</th>
                  <th className="px-6 py-3 text-right font-medium text-stone-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-3 text-stone-600">{formatDate(payment.date)}</td>
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                        {payment.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-stone-500">{payment.reference || '-'}</td>
                    <td className="px-6 py-3 text-right font-medium text-green-700">
                      +{formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-sm text-stone-400">
              No payments recorded.
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreateInvoice && (
          <CreateInvoice
            open={showCreateInvoice}
            onClose={() => setShowCreateInvoice(false)}
            onSave={() => setShowCreateInvoice(false)}
            defaultPatientId={params.id}
          />
        )}

        {showPayment && selectedInvoiceId && (
          <PaymentModal
            open={showPayment}
            onClose={() => {
              setShowPayment(false);
              setSelectedInvoiceId(null);
            }}
            onSave={() => {
              setShowPayment(false);
              setSelectedInvoiceId(null);
            }}
            invoice={invoices.find((i) => i.id === selectedInvoiceId)!}
          />
        )}
      </div>
    );
  }

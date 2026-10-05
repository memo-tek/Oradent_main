import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  procedureCode: string;
  description: string;
  toothNumber?: number;
  quantity: number;
  unitPrice: number;
  total: number;
  insuranceCoverage?: number;
  patientResponsibility?: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  method: 'cash' | 'credit_card' | 'debit_card' | 'check' | 'insurance' | 'other';
  reference?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceListParams {
  patientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaymentListResponse {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type CreateInvoiceInput = {
  patientId: string;
  items: Omit<InvoiceItem, 'id'>[];
  dueDate: string;
  notes?: string;
};

export type RecordPaymentInput = {
  invoiceId: string;
  patientId: string;
  amount: number;
  method: Payment['method'];
  reference?: string;
  notes?: string;
};

export function useInvoices(params: InvoiceListParams = {}) {
  const queryString = new URLSearchParams();
  if (params.patientId) queryString.set('patientId', params.patientId);
  if (params.status) queryString.set('status', params.status);
  if (params.startDate) queryString.set('startDate', params.startDate);
  if (params.endDate) queryString.set('endDate', params.endDate);
  if (params.page) queryString.set('page', String(params.page));
  if (params.limit) queryString.set('limit', String(params.limit));

  return useQuery<InvoiceListResponse>({
    queryKey: ['invoices', params],
    queryFn: () => apiGet<InvoiceListResponse>(`/api/billing/invoices?${queryString.toString()}`),
  });
}

export function usePayments(patientId: string | undefined) {
  return useQuery<PaymentListResponse>({
    queryKey: ['payments', patientId],
    queryFn: () => apiGet<PaymentListResponse>(`/api/billing/payments?patientId=${patientId}`),
    enabled: !!patientId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) =>
      apiPost<Invoice, CreateInvoiceInput>('/api/billing/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordPaymentInput) =>
      apiPost<Payment, RecordPaymentInput>('/api/billing/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

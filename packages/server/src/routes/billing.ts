import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { generateInvoiceNumber } from '../utils/formatters';

const router = Router();
router.use(authenticate);

const createInvoiceSchema = z.object({
  patientId: z.string(),
  treatmentIds: z.array(z.string()).optional(),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  insurancePortion: z.number().min(0).optional(),
  notes: z.string().optional(),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
});

const paymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().min(0.01),
  method: z.enum(['CASH', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'FINANCING', 'OTHER']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Billing summary
router.get('/summary', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const practiceInvoiceWhere = { patient: { practiceId } };

  const [invoices, mtdPayments, pendingClaims] = await Promise.all([
    prisma.invoice.findMany({
      where: practiceInvoiceWhere,
      select: {
        total: true,
        status: true,
        payments: { select: { amount: true } },
      },
    }),
    prisma.payment.aggregate({
      where: {
        invoice: practiceInvoiceWhere,
        date: { gte: monthStart, lte: now },
      },
      _sum: { amount: true },
    }),
    prisma.insuranceClaim.count({
      where: {
        invoice: {
          patient: { practiceId },
        },
        status: { in: ['SUBMITTED', 'IN_REVIEW'] },
      },
    }),
  ]);

  const invoiceTotals = invoices.reduce(
    (totals, invoice) => {
      const amountPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      totals.total += invoice.total;
      if (invoice.status !== 'PAID' && invoice.status !== 'VOID') {
        totals.outstanding += invoice.total - amountPaid;
      }
      totals.paid += amountPaid;
      return totals;
    },
    { total: 0, outstanding: 0, paid: 0 }
  );

  res.json({
    totalOutstanding: invoiceTotals.outstanding,
    mtdRevenue: mtdPayments._sum.amount || 0,
    pendingClaims,
    collectionRate: invoiceTotals.total > 0
      ? (invoiceTotals.paid / invoiceTotals.total) * 100
      : 0,
  });
});

// List invoices
router.get('/invoices', async (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  const status = req.query.status as string;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

  const where: Record<string, unknown> = {
    patient: { practiceId: req.auth!.practiceId },
  };
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        payments: true,
        treatments: {
          select: {
            id: true,
            cdtCode: true,
            description: true,
            toothNumber: true,
            fee: true,
          },
        },
        insuranceClaim: { select: { id: true, status: true, claimNumber: true } },
        _count: { select: { treatments: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.invoice.count({ where: where as any }),
  ]);

  const invoiceData = invoices.map((invoice) => ({
    ...invoice,
    patientName: `${invoice.patient.firstName} ${invoice.patient.lastName}`,
    amountPaid: invoice.payments.reduce((sum, payment) => sum + payment.amount, 0),
    items: invoice.treatments.map((treatment) => ({
      id: treatment.id,
      cdtCode: treatment.cdtCode,
      description: treatment.description,
      toothNumber: treatment.toothNumber == null ? undefined : String(treatment.toothNumber),
      quantity: 1,
      fee: treatment.fee,
    })),
  }));

  res.json({ invoices: invoiceData, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// List payments
router.get('/payments', async (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

  const where = {
    invoice: {
      patient: {
        practiceId: req.auth!.practiceId,
        ...(patientId ? { id: patientId } : {}),
      },
    },
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({ payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// Get single invoice
router.get('/invoices/:id', async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
    include: {
      patient: true,
      treatments: true,
      payments: true,
      insuranceClaim: true,
    },
  });

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  res.json(invoice);
});

// Create invoice
router.post('/invoices', async (req: Request, res: Response) => {
  const data = createInvoiceSchema.parse(req.body);
  const discount = data.discount || 0;
  const taxAmount = data.taxAmount || 0;
  const insurancePortion = data.insurancePortion || 0;
  const total = data.subtotal - discount + taxAmount;
  const patientPortion = total - insurancePortion;

  const dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Validate that treatments belong to the same patient and practice
  if (data.treatmentIds && data.treatmentIds.length > 0) {
    const validTreatments = await prisma.treatment.count({
      where: {
        id: { in: data.treatmentIds },
        patientId: data.patientId,
        patient: { practiceId: req.auth!.practiceId },
      },
    });
    if (validTreatments !== data.treatmentIds.length) {
      res.status(400).json({ error: 'One or more treatments do not belong to this patient' });
      return;
    }
  }

  const invoice = await prisma.invoice.create({
    data: {
      patientId: data.patientId,
      invoiceNumber: generateInvoiceNumber(),
      dueDate,
      subtotal: data.subtotal,
      taxAmount,
      discount,
      total,
      insurancePortion,
      patientPortion,
      notes: data.notes,
      ...(data.treatmentIds && data.treatmentIds.length > 0
        ? { treatments: { connect: data.treatmentIds.map((id) => ({ id })) } }
        : {}),
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      treatments: true,
    },
  });

  res.status(201).json(invoice);
});

// Record payment
router.post('/payments', async (req: Request, res: Response) => {
  const data = paymentSchema.parse(req.body);

  const payment = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: data.invoiceId, patient: { practiceId: req.auth!.practiceId } },
      include: { payments: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + data.amount;
    const newStatus = totalPaid >= invoice.total ? 'PAID' : 'PARTIALLY_PAID';

    const newPayment = await tx.payment.create({ data });
    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: { status: newStatus },
    });

    return newPayment;
  });

  res.status(201).json(payment);
});

// Insurance claims
const claimSchema = z.object({
  invoiceId: z.string(),
  amountClaimed: z.number().min(0),
  preAuthNumber: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/claims', async (req: Request, res: Response) => {
  const claims = await prisma.insuranceClaim.findMany({
    where: {
      invoice: { patient: { practiceId: req.auth!.practiceId } },
    },
    include: {
      invoice: {
        select: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              insurancePrimary: { select: { company: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(claims.map((claim) => ({
    id: claim.id,
    claimNumber: claim.claimNumber,
    patientName: `${claim.invoice.patient.firstName} ${claim.invoice.patient.lastName}`,
    insuranceProvider: claim.invoice.patient.insurancePrimary?.company ?? '',
    submittedDate: claim.submittedAt,
    amount: claim.amountClaimed,
    status: claim.status,
  })));
});

router.post('/claims', async (req: Request, res: Response) => {
  const data = claimSchema.parse(req.body);

  const invoice = await prisma.invoice.findFirst({
    where: { id: data.invoiceId, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const claim = await prisma.insuranceClaim.create({
    data: {
      ...data,
      attachments: [],
    },
  });

  res.status(201).json(claim);
});

router.patch('/claims/:id/status', async (req: Request, res: Response) => {
  const { status, amountApproved, amountPaid, denialReason } = z.object({
    status: z.enum([
      'DRAFTED', 'SUBMITTED', 'IN_REVIEW', 'APPROVED',
      'PARTIALLY_APPROVED', 'DENIED', 'APPEALED', 'PAID', 'WRITE_OFF',
    ]),
    amountApproved: z.number().optional(),
    amountPaid: z.number().optional(),
    denialReason: z.string().optional(),
  }).parse(req.body);

  const claim = await prisma.insuranceClaim.findFirst({
    where: { id: req.params.id, invoice: { patient: { practiceId: req.auth!.practiceId } } },
  });
  if (!claim) {
    res.status(404).json({ error: 'Claim not found' });
    return;
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'SUBMITTED') updateData.submittedAt = new Date();
  if (status === 'PAID') updateData.paidAt = new Date();
  if (amountApproved !== undefined) updateData.amountApproved = amountApproved;
  if (amountPaid !== undefined) updateData.amountPaid = amountPaid;
  if (denialReason) updateData.denialReason = denialReason;

  const updatedClaim = await prisma.insuranceClaim.update({
    where: { id: req.params.id },
    data: updateData as any,
  });

  res.json(updatedClaim);
});

// Patient ledger (paginated with aggregated summary)
router.get('/ledger/:patientId', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

  const [invoices, total, chargesAgg, paymentsAgg] = await Promise.all([
    prisma.invoice.findMany({
      where: { patientId: req.params.patientId },
      include: {
        treatments: { select: { cdtCode: true, description: true, fee: true } },
        payments: true,
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where: { patientId: req.params.patientId } }),
    prisma.invoice.aggregate({
      where: { patientId: req.params.patientId },
      _sum: { total: true },
    }),
    prisma.payment.aggregate({
      where: { invoice: { patientId: req.params.patientId } },
      _sum: { amount: true },
    }),
  ]);

  const totalCharges = chargesAgg._sum.total || 0;
  const totalPayments = paymentsAgg._sum.amount || 0;
  const balance = Math.round((totalCharges - totalPayments) * 100) / 100;

  res.json({
    invoices,
    summary: { totalCharges, totalPayments, balance },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Fee schedule
router.get('/fee-schedule', async (req: Request, res: Response) => {
  const fees = await prisma.feeScheduleItem.findMany({
    where: { practiceId: req.auth!.practiceId },
    orderBy: { cdtCode: 'asc' },
  });

  res.json(fees);
});

router.put('/fee-schedule', async (req: Request, res: Response) => {
  const feeSchema = z.object({
    items: z.array(z.object({
      cdtCode: z.string(),
      description: z.string(),
      fee: z.number().min(0),
      category: z.string(),
    })),
  });

  const { items } = feeSchema.parse(req.body);

  const results = await prisma.$transaction(
    items.map((item) =>
      prisma.feeScheduleItem.upsert({
        where: {
          practiceId_cdtCode: {
            practiceId: req.auth!.practiceId,
            cdtCode: item.cdtCode,
          },
        },
        create: { ...item, practiceId: req.auth!.practiceId },
        update: { description: item.description, fee: item.fee, category: item.category },
      })
    )
  );

  res.json(results);
});

export default router;

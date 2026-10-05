import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { cached } from '../utils/cache';

const router = Router();
router.use(authenticate);

// Dashboard stats with trend data (cached 60s)
router.get('/dashboard', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;

  const stats = await cached(`dashboard:${practiceId}`, 60, async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const [
    todayAppointments,
    monthRevenue,
    lastMonthRevenue,
    activePatients,
    lastMonthPatients,
    pendingClaims,
    pendingClaimsAmount,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: today, lt: tomorrow },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        invoice: { patient: { practiceId } },
        date: { gte: monthStart },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        invoice: { patient: { practiceId } },
        date: { gte: lastMonthStart, lt: monthStart },
      },
    }),
    prisma.patient.count({
      where: { practiceId, status: 'ACTIVE' },
    }),
    prisma.patient.count({
      where: {
        practiceId,
        status: 'ACTIVE',
        createdAt: { lt: monthStart },
      },
    }),
    prisma.insuranceClaim.count({
      where: {
        invoice: { patient: { practiceId } },
        status: { in: ['SUBMITTED', 'IN_REVIEW'] },
      },
    }),
    prisma.insuranceClaim.aggregate({
      _sum: { amountClaimed: true },
      where: {
        invoice: { patient: { practiceId } },
        status: { in: ['SUBMITTED', 'IN_REVIEW'] },
      },
    }),
  ]);

  const currentRevenue = monthRevenue._sum.amount || 0;
  const prevRevenue = lastMonthRevenue._sum.amount || 0;
  const revenueTrend = prevRevenue > 0
    ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
    : 0;

  const patientsTrend = lastMonthPatients > 0
    ? activePatients - lastMonthPatients
    : 0;

  return {
    todayAppointments,
    monthRevenue: currentRevenue,
    revenueTrend,
    activePatients,
    patientsTrend,
    pendingClaims,
    pendingClaimsAmount: pendingClaimsAmount._sum.amountClaimed || 0,
  };
  });

  res.json(stats);
});

// Revenue report
router.get('/revenue', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const period = (req.query.period as string) || 'month';
  const startDate = req.query.start ? new Date(req.query.start as string) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.end ? new Date(req.query.end as string) : new Date();

  const payments = await prisma.payment.findMany({
    where: {
      invoice: { patient: { practiceId } },
      date: { gte: startDate, lte: endDate },
    },
    select: { amount: true, date: true, method: true },
    orderBy: { date: 'asc' },
  });

  // Group by period
  const grouped: Record<string, number> = {};
  for (const payment of payments) {
    const date = new Date(payment.date);
    let key: string;
    if (period === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    grouped[key] = (grouped[key] || 0) + payment.amount;
  }

  // Payment method breakdown
  const methodBreakdown: Record<string, number> = {};
  for (const payment of payments) {
    methodBreakdown[payment.method] = (methodBreakdown[payment.method] || 0) + payment.amount;
  }

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    data: Object.entries(grouped).map(([period, amount]) => ({ period, amount: Math.round(amount * 100) / 100 })),
    methodBreakdown,
    total: Math.round(total * 100) / 100,
    startDate,
    endDate,
  });
});

// Procedure mix
router.get('/procedures', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const startDate = req.query.start ? new Date(req.query.start as string) : new Date(new Date().getFullYear(), 0, 1);

  const treatments = await prisma.treatment.findMany({
    where: {
      provider: { practiceId },
      date: { gte: startDate },
    },
    select: { cdtCode: true, description: true, fee: true },
  });

  const procedureMap: Record<string, { count: number; revenue: number; description: string }> = {};
  for (const t of treatments) {
    if (!procedureMap[t.cdtCode]) {
      procedureMap[t.cdtCode] = { count: 0, revenue: 0, description: t.description };
    }
    procedureMap[t.cdtCode].count++;
    procedureMap[t.cdtCode].revenue += t.fee;
  }

  const procedures = Object.entries(procedureMap)
    .map(([code, data]) => ({
      code,
      ...data,
      revenue: Math.round(data.revenue * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count);

  res.json(procedures);
});

// Aging report
router.get('/aging', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const now = new Date();

  const invoices = await prisma.invoice.findMany({
    where: {
      patient: { practiceId },
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      payments: true,
    },
  });

  const aging = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, overNinety: 0 };
  const details: unknown[] = [];

  for (const inv of invoices) {
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    const balance = inv.total - paid;
    if (balance <= 0) continue;

    const daysPast = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysPast <= 0) aging.current += balance;
    else if (daysPast <= 30) aging.thirtyDays += balance;
    else if (daysPast <= 60) aging.sixtyDays += balance;
    else if (daysPast <= 90) aging.ninetyDays += balance;
    else aging.overNinety += balance;

    details.push({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      patient: inv.patient,
      total: inv.total,
      paid,
      balance: Math.round(balance * 100) / 100,
      dueDate: inv.dueDate,
      daysPastDue: Math.max(0, daysPast),
    });
  }

  for (const key of Object.keys(aging) as Array<keyof typeof aging>) {
    aging[key] = Math.round(aging[key] * 100) / 100;
  }

  const totalOutstanding = aging.current + aging.thirtyDays + aging.sixtyDays + aging.ninetyDays + aging.overNinety;

  res.json({ aging, totalOutstanding: Math.round(totalOutstanding * 100) / 100, details });
});

// Provider productivity
router.get('/provider-productivity', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const startDate = req.query.start ? new Date(req.query.start as string) : new Date(new Date().getFullYear(), 0, 1);

  const providers = await prisma.provider.findMany({
    where: { practiceId, isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      _count: {
        select: {
          appointments: {
            where: { startTime: { gte: startDate }, status: 'COMPLETED' },
          },
          treatments: {
            where: { date: { gte: startDate } },
          },
        },
      },
    },
  });

  const result = providers.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    completedAppointments: p._count.appointments,
    treatmentsPerformed: p._count.treatments,
  }));

  res.json(result);
});

// Recall / Recare report (patients overdue for hygiene)
router.get('/recall', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const monthsOverdue = parseInt(req.query.months as string) || 6;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsOverdue);

  const patients = await prisma.patient.findMany({
    where: {
      practiceId,
      status: 'ACTIVE',
      OR: [
        { lastVisit: { lt: cutoff } },
        { lastVisit: null },
      ],
      nextAppointment: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      lastVisit: true,
      insurancePrimary: { select: { company: true, remainingBenefit: true, expirationDate: true } },
    },
    orderBy: { lastVisit: 'asc' },
    take: 200,
  });

  const result = patients.map((p) => ({
    ...p,
    daysSinceLastVisit: p.lastVisit
      ? Math.floor((Date.now() - p.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : null,
    benefitsExpiringSoon: p.insurancePrimary?.expirationDate
      ? p.insurancePrimary.expirationDate.getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000
      : false,
  }));

  res.json({ patients: result, total: result.length, criteria: { monthsOverdue } });
});

// Appointment type breakdown
router.get('/appointment-types', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const startDate = req.query.start ? new Date(req.query.start as string) : new Date(new Date().getFullYear(), 0, 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      provider: { practiceId },
      startTime: { gte: startDate },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: { type: true, status: true },
  });

  const typeBreakdown: Record<string, { total: number; completed: number }> = {};
  for (const apt of appointments) {
    if (!typeBreakdown[apt.type]) typeBreakdown[apt.type] = { total: 0, completed: 0 };
    typeBreakdown[apt.type].total++;
    if (apt.status === 'COMPLETED') typeBreakdown[apt.type].completed++;
  }

  const result = Object.entries(typeBreakdown)
    .map(([type, data]) => ({ type, ...data, completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  res.json(result);
});

// Treatment acceptance rate
router.get('/treatment-acceptance', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const startDate = req.query.start ? new Date(req.query.start as string) : new Date(new Date().getFullYear(), 0, 1);

  const plans = await prisma.treatmentPlan.findMany({
    where: {
      patient: { practiceId },
      createdAt: { gte: startDate },
    },
    select: { status: true, totalFee: true, patientEst: true },
  });

  const total = plans.length;
  const accepted = plans.filter(p => ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status)).length;
  const declined = plans.filter(p => p.status === 'DECLINED').length;
  const pending = plans.filter(p => ['PROPOSED', 'PRESENTED'].includes(p.status)).length;
  const totalValue = plans.reduce((s, p) => s + p.totalFee, 0);
  const acceptedValue = plans
    .filter(p => ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status))
    .reduce((s, p) => s + p.totalFee, 0);

  res.json({
    total,
    accepted,
    declined,
    pending,
    acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    totalValue: Math.round(totalValue * 100) / 100,
    acceptedValue: Math.round(acceptedValue * 100) / 100,
  });
});

export default router;

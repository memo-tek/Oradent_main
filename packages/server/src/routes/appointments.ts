import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

const router = Router();
router.use(authenticate);

const createAppointmentSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  chairId: z.string().optional(),
  startTime: z.string().transform((s) => new Date(s)),
  duration: z.number().min(15).max(480),
  type: z.enum([
    'EXAM', 'CLEANING', 'FILLING', 'CROWN', 'ROOT_CANAL',
    'EXTRACTION', 'IMPLANT', 'COSMETIC', 'EMERGENCY',
    'CONSULTATION', 'FOLLOW_UP', 'OTHER',
  ]),
  reason: z.string().optional(),
  procedures: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringRule: z.string().optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  status: z.enum([
    'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_CHAIR',
    'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED',
  ]).optional(),
});

// List appointments with date range
router.get('/', async (req: Request, res: Response) => {
  const start = req.query.start ? new Date(req.query.start as string) : new Date();
  const end = req.query.end
    ? new Date(req.query.end as string)
    : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const providerId = req.query.providerId as string;
  const chairId = req.query.chairId as string;
  const status = req.query.status as string;

  const where: Record<string, unknown> = {
    provider: { practiceId: req.auth!.practiceId },
    startTime: { gte: start },
    endTime: { lte: end },
  };

  if (providerId) where.providerId = providerId;
  if (chairId) where.chairId = chairId;
  if (status) where.status = status;

  const appointments = await prisma.appointment.findMany({
    where: where as any,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, name: true, color: true } },
      chair: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  res.json(appointments);
});

// Today's appointments (must be before /:id to avoid matching "today" as an id)
router.get('/today/schedule', async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      provider: { practiceId: req.auth!.practiceId },
      startTime: { gte: today, lt: tomorrow },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, name: true, color: true } },
      chair: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  res.json(appointments);
});

// Check for scheduling conflicts
router.get('/check-conflict', async (req: Request, res: Response) => {
  const date = req.query.date as string;
  const time = req.query.time as string;
  const providerId = req.query.providerId as string;
  const chairId = req.query.chairId as string;
  const excludeId = req.query.excludeId as string;
  const duration = parseInt(req.query.duration as string) || 30;

  if (!date || !time) {
    res.json({ hasConflict: false });
    return;
  }

  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  const where: Record<string, unknown> = {
    provider: { practiceId: req.auth!.practiceId },
    status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
    OR: [
      ...(providerId
        ? [{
            providerId,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          }]
        : []),
      ...(chairId
        ? [{
            chairId,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          }]
        : []),
    ],
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const conflict = await prisma.appointment.findFirst({
    where: where as any,
    include: {
      provider: { select: { name: true } },
      chair: { select: { name: true } },
    },
  });

  if (conflict) {
    res.json({
      hasConflict: true,
      message: `Conflicts with existing appointment for ${conflict.provider?.name || 'provider'}`,
    });
  } else {
    res.json({ hasConflict: false });
  }
});

// Get single appointment
router.get('/:id', async (req: Request, res: Response) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: req.params.id,
      provider: { practiceId: req.auth!.practiceId },
    },
    include: {
      patient: true,
      provider: { select: { id: true, name: true, color: true, title: true } },
      chair: true,
    },
  });

  if (!appointment) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }

  res.json(appointment);
});

// Create appointment (with race-condition protection)
router.post('/', async (req: Request, res: Response) => {
  const data = createAppointmentSchema.parse(req.body);
  const endTime = new Date(data.startTime.getTime() + data.duration * 60 * 1000);

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          provider: { practiceId: req.auth!.practiceId },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
          OR: [
            {
              providerId: data.providerId,
              startTime: { lt: endTime },
              endTime: { gt: data.startTime },
            },
            ...(data.chairId
              ? [{
                  chairId: data.chairId,
                  startTime: { lt: endTime },
                  endTime: { gt: data.startTime },
                }]
              : []),
          ],
        },
      });

      if (conflict) {
        throw new ConflictError('Time slot conflicts with existing appointment');
      }

      return tx.appointment.create({
        data: {
          ...data,
          endTime,
          procedures: data.procedures || [],
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          provider: { select: { id: true, name: true, color: true } },
          chair: { select: { id: true, name: true } },
        },
      });
    });

    res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

// Update appointment
router.put('/:id', async (req: Request, res: Response) => {
  const data = updateAppointmentSchema.parse(req.body);

  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, provider: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }

  const updateData: Record<string, unknown> = { ...data };

  if (data.startTime && data.duration) {
    updateData.endTime = new Date(data.startTime.getTime() + data.duration * 60 * 1000);
  } else if (data.startTime) {
    updateData.endTime = new Date(data.startTime.getTime() + existing.duration * 60 * 1000);
  } else if (data.duration) {
    updateData.endTime = new Date(existing.startTime.getTime() + data.duration * 60 * 1000);
  }

  // Status-specific timestamps
  if (data.status === 'CONFIRMED') updateData.confirmedAt = new Date();
  if (data.status === 'CHECKED_IN') updateData.checkedInAt = new Date();
  if (data.status === 'IN_CHAIR') updateData.seatedAt = new Date();
  if (data.status === 'COMPLETED') updateData.completedAt = new Date();

  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: updateData as any,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      provider: { select: { id: true, name: true, color: true } },
      chair: { select: { id: true, name: true } },
    },
  });

  res.json(appointment);
});

// Delete appointment
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, provider: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }

  await prisma.appointment.delete({ where: { id: req.params.id } });
  res.json({ message: 'Appointment deleted' });
});

export default router;

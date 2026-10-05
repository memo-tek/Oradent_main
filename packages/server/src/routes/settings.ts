import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { authenticate, authorize, generateToken, generateRefreshToken } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get practice settings
router.get('/practice', async (req: Request, res: Response) => {
  const practice = await prisma.practice.findUnique({
    where: { id: req.auth!.practiceId },
    include: { settings: true, chairs: true, providers: { select: { id: true, name: true, email: true, role: true, title: true, color: true, isActive: true } } },
  });

  if (!practice) {
    res.status(404).json({ error: 'Practice not found' });
    return;
  }

  res.json(practice);
});

// Update practice info
router.put('/practice', authorize('OWNER'), async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    taxId: z.string().optional(),
    npi: z.string().optional(),
  });

  const data = schema.parse(req.body);

  const practice = await prisma.practice.update({
    where: { id: req.auth!.practiceId },
    data,
  });

  res.json(practice);
});

// Update practice settings
router.put('/practice/settings', authorize('OWNER'), async (req: Request, res: Response) => {
  const schema = z.object({
    appointmentDuration: z.number().min(15).max(240).optional(),
    workingHoursStart: z.string().optional(),
    workingHoursEnd: z.string().optional(),
    workingDays: z.array(z.number().min(0).max(6)).optional(),
    reminderHoursBefore: z.number().min(1).max(72).optional(),
    currency: z.string().optional(),
  });

  const data = schema.parse(req.body);

  const settings = await prisma.practiceSettings.upsert({
    where: { practiceId: req.auth!.practiceId },
    create: { practiceId: req.auth!.practiceId, ...data },
    update: data,
  });

  res.json(settings);
});

// Manage providers
router.get('/providers', async (req: Request, res: Response) => {
  const providers = await prisma.provider.findMany({
    where: { practiceId: req.auth!.practiceId },
    select: { id: true, name: true, email: true, role: true, title: true, color: true, isActive: true, npi: true, licenseNumber: true },
  });

  res.json(providers);
});

// List chairs
router.get('/chairs', async (req: Request, res: Response) => {
  const chairs = await prisma.chair.findMany({
    where: { practiceId: req.auth!.practiceId },
    select: { id: true, name: true, isActive: true },
    orderBy: { name: 'asc' },
  });

  res.json(chairs);
});

// Manage chairs
router.post('/chairs', authorize('OWNER'), async (req: Request, res: Response) => {
  const { name } = z.object({ name: z.string().min(1) }).parse(req.body);

  const chair = await prisma.chair.create({
    data: { practiceId: req.auth!.practiceId, name },
  });

  res.status(201).json(chair);
});

router.put('/chairs/:id', authorize('OWNER'), async (req: Request, res: Response) => {
  const { name, isActive } = z.object({
    name: z.string().optional(),
    isActive: z.boolean().optional(),
  }).parse(req.body);

  const chair = await prisma.chair.update({
    where: { id: req.params.id },
    data: { ...(name && { name }), ...(isActive !== undefined && { isActive }) },
  });

  res.json(chair);
});

// Invite a new provider (OWNER only)
router.post('/providers', authorize('OWNER'), async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    role: z.enum(['DENTIST', 'HYGIENIST', 'ASSISTANT', 'FRONT_DESK']),
    title: z.string().default('DDS'),
    npi: z.string().optional(),
    licenseNumber: z.string().optional(),
    color: z.string().default('#6366f1'),
    temporaryPassword: z.string().min(8),
  });

  const data = schema.parse(req.body);

  const existing = await prisma.provider.findUnique({ where: { email: data.email } });
  if (existing) {
    res.status(409).json({ error: 'A provider with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.temporaryPassword, 12);

  const provider = await prisma.provider.create({
    data: {
      practiceId: req.auth!.practiceId,
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      title: data.title,
      npi: data.npi,
      licenseNumber: data.licenseNumber,
      color: data.color,
    },
    select: { id: true, name: true, email: true, role: true, title: true, color: true, isActive: true },
  });

  res.status(201).json(provider);
});

// Update provider (OWNER only)
router.put('/providers/:id', authorize('OWNER'), async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    role: z.enum(['OWNER', 'DENTIST', 'HYGIENIST', 'ASSISTANT', 'FRONT_DESK']).optional(),
    title: z.string().optional(),
    color: z.string().optional(),
    npi: z.string().optional(),
    licenseNumber: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  const data = schema.parse(req.body);

  const existing = await prisma.provider.findFirst({
    where: { id: req.params.id, practiceId: req.auth!.practiceId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }

  const provider = await prisma.provider.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, role: true, title: true, color: true, isActive: true, npi: true, licenseNumber: true },
  });

  res.json(provider);
});

// Reset provider password (OWNER only)
router.post('/providers/:id/reset-password', authorize('OWNER'), async (req: Request, res: Response) => {
  const { newPassword } = z.object({ newPassword: z.string().min(8) }).parse(req.body);

  const existing = await prisma.provider.findFirst({
    where: { id: req.params.id, practiceId: req.auth!.practiceId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.provider.update({
    where: { id: req.params.id },
    data: { passwordHash },
  });

  res.json({ message: 'Password reset successfully' });
});

export default router;

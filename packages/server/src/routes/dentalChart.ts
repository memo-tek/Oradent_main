import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const conditionSchema = z.object({
  type: z.enum([
    'cavity', 'filling', 'crown', 'bridge', 'implant', 'missing',
    'rootCanal', 'extraction', 'veneer', 'sealant', 'fracture',
    'abscess', 'impacted', 'recession', 'mobility', 'furcation', 'watchItem',
  ]),
  surfaces: z.array(z.enum(['M', 'O', 'I', 'D', 'B', 'L', 'F', 'P'])).default([]),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  providerId: z.string().optional(),
});

const updateToothSchema = z.object({
  conditions: z.array(conditionSchema).optional(),
  status: z.enum(['PRESENT', 'MISSING', 'IMPACTED', 'UNERUPTED', 'IMPLANT', 'PONTIC']).optional(),
  isDeciduous: z.boolean().optional(),
});

// Get full dental chart for a patient
router.get('/:patientId', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const chart = await prisma.toothCondition.findMany({
    where: { patientId: req.params.patientId },
    orderBy: { toothNumber: 'asc' },
  });

  res.json(chart);
});

// Get single tooth
router.get('/:patientId/tooth/:toothNumber', async (req: Request, res: Response) => {
  const toothNumber = parseInt(req.params.toothNumber);
  if (isNaN(toothNumber) || toothNumber < 1 || toothNumber > 32) {
    res.status(400).json({ error: 'Invalid tooth number (1-32)' });
    return;
  }

  const tooth = await prisma.toothCondition.findUnique({
    where: {
      patientId_toothNumber: {
        patientId: req.params.patientId,
        toothNumber,
      },
    },
  });

  res.json(tooth || { toothNumber, conditions: [], status: 'PRESENT' });
});

// Update a specific tooth
router.put('/:patientId/tooth/:toothNumber', async (req: Request, res: Response) => {
  const toothNumber = parseInt(req.params.toothNumber);
  if (isNaN(toothNumber) || toothNumber < 1 || toothNumber > 32) {
    res.status(400).json({ error: 'Invalid tooth number (1-32)' });
    return;
  }

  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const data = updateToothSchema.parse(req.body);

  const tooth = await prisma.toothCondition.upsert({
    where: {
      patientId_toothNumber: {
        patientId: req.params.patientId,
        toothNumber,
      },
    },
    create: {
      patientId: req.params.patientId,
      toothNumber,
      conditions: data.conditions || [],
      status: data.status || 'PRESENT',
      isDeciduous: data.isDeciduous || false,
    },
    update: {
      ...(data.conditions !== undefined && { conditions: data.conditions }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.isDeciduous !== undefined && { isDeciduous: data.isDeciduous }),
    },
  });

  res.json(tooth);
});

// Batch update multiple teeth
router.put('/:patientId/batch', async (req: Request, res: Response) => {
  const batchSchema = z.object({
    teeth: z.array(
      z.object({
        toothNumber: z.number().min(1).max(32),
        conditions: z.array(conditionSchema).optional(),
        status: z.enum(['PRESENT', 'MISSING', 'IMPACTED', 'UNERUPTED', 'IMPLANT', 'PONTIC']).optional(),
      })
    ),
  });

  const { teeth } = batchSchema.parse(req.body);

  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const results = await prisma.$transaction(
    teeth.map((tooth) =>
      prisma.toothCondition.upsert({
        where: {
          patientId_toothNumber: {
            patientId: req.params.patientId,
            toothNumber: tooth.toothNumber,
          },
        },
        create: {
          patientId: req.params.patientId,
          toothNumber: tooth.toothNumber,
          conditions: tooth.conditions || [],
          status: tooth.status || 'PRESENT',
        },
        update: {
          ...(tooth.conditions !== undefined && { conditions: tooth.conditions }),
          ...(tooth.status !== undefined && { status: tooth.status }),
        },
      })
    )
  );

  res.json(results);
});

export default router;

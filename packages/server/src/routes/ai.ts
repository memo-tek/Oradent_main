import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { analyzeXray } from '../services/xrayAnalyzer';
import { suggestTreatment } from '../services/treatmentEngine';
import { generateSmartNote } from '../services/smartNotes';
import { draftPreAuthLetter } from '../services/insuranceAI';

const router = Router();
router.use(authenticate);
router.use(aiLimiter);

// Analyze X-ray
router.post('/analyze-xray', async (req: Request, res: Response) => {
  const { imageId, patientId } = z.object({
    imageId: z.string(),
    patientId: z.string(),
  }).parse(req.body);

  const image = await prisma.dentalImage.findFirst({
    where: { id: imageId, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!image) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  let result: Awaited<ReturnType<typeof analyzeXray>>;
  try {
    result = await analyzeXray(image.filePath, image.type);
  } catch (error) {
    const err = error as { status?: number; statusCode?: number; message?: string };
    const status = err.status ?? err.statusCode;
    res.status(status === 429 || status === 503 ? status : 500).json({
      error: err.message || 'X-ray analysis failed',
    });
    return;
  }

  const analysis = await prisma.aIAnalysis.create({
    data: {
      patientId,
      imageId,
      type: 'xray_analysis',
      input: { imageType: image.type, fileName: image.fileName },
      output: result,
      confidence: result.overallConfidence,
      findings: result.findings,
      model: 'claude-sonnet-4-20250514',
    },
  });

  res.json(analysis);
});

// Suggest treatment
router.post('/suggest-treatment', async (req: Request, res: Response) => {
  const { patientId } = z.object({
    patientId: z.string(),
  }).parse(req.body);

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, practiceId: req.auth!.practiceId },
    include: {
      dentalChart: true,
      medicalHistory: true,
      insurancePrimary: true,
    },
  });

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const feeSchedule = await prisma.feeScheduleItem.findMany({
    where: { practiceId: req.auth!.practiceId },
  });

  const result = await suggestTreatment(
    patient.dentalChart,
    patient.medicalHistory,
    patient.insurancePrimary,
    feeSchedule
  );

  const analysis = await prisma.aIAnalysis.create({
    data: {
      patientId,
      type: 'treatment_suggestion',
      input: { dentalChart: patient.dentalChart.length, hasInsurance: !!patient.insurancePrimary },
      output: result,
      model: 'claude-sonnet-4-20250514',
    },
  });

  res.json(analysis);
});

// Generate smart clinical note
router.post('/generate-note', async (req: Request, res: Response) => {
  const { patientId, briefNote, noteType } = z.object({
    patientId: z.string(),
    briefNote: z.string().min(5),
    noteType: z.string().default('progress'),
  }).parse(req.body);

  const result = await generateSmartNote(briefNote, noteType);

  const analysis = await prisma.aIAnalysis.create({
    data: {
      patientId,
      type: 'smart_note',
      input: { briefNote, noteType },
      output: result,
      model: 'claude-sonnet-4-20250514',
    },
  });

  res.json(analysis);
});

// Draft pre-authorization letter
router.post('/pre-auth-letter', async (req: Request, res: Response) => {
  const { patientId, treatmentPlanId } = z.object({
    patientId: z.string(),
    treatmentPlanId: z.string(),
  }).parse(req.body);

  const [patient, plan, practice] = await Promise.all([
    prisma.patient.findFirst({
      where: { id: patientId, practiceId: req.auth!.practiceId },
      include: { insurancePrimary: true, dentalChart: true },
    }),
    prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
      include: { items: true },
    }),
    prisma.practice.findUnique({ where: { id: req.auth!.practiceId } }),
  ]);

  if (!patient || !plan || !practice) {
    res.status(404).json({ error: 'Patient, treatment plan, or practice not found' });
    return;
  }

  const result = await draftPreAuthLetter(patient, plan, practice);

  const analysis = await prisma.aIAnalysis.create({
    data: {
      patientId,
      type: 'pre_auth_letter',
      input: { treatmentPlanId, procedureCount: plan.items.length },
      output: result,
      model: 'claude-sonnet-4-20250514',
    },
  });

  res.json(analysis);
});

// Get X-ray analysis by image ID
router.get('/xray-analysis/:imageId', async (req: Request, res: Response) => {
  const analysis = await prisma.aIAnalysis.findFirst({
    where: {
      imageId: req.params.imageId,
      type: 'xray_analysis',
      patient: { practiceId: req.auth!.practiceId },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!analysis) {
    res.status(404).json({ error: 'No analysis found for this image' });
    return;
  }

  res.json(analysis);
});

// Get AI analysis history
router.get('/history/:patientId', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const analyses = await prisma.aIAnalysis.findMany({
    where: { patientId: req.params.patientId },
    include: { image: { select: { id: true, fileName: true, type: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(analyses);
});

// Accept/reject AI finding
router.patch('/analysis/:id/review', async (req: Request, res: Response) => {
  const { accepted } = z.object({ accepted: z.boolean() }).parse(req.body);

  const analysis = await prisma.aIAnalysis.update({
    where: { id: req.params.id },
    data: {
      accepted,
      reviewedBy: req.auth!.providerId,
      reviewedAt: new Date(),
    },
  });

  res.json(analysis);
});

export default router;

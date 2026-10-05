import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import { getFileUrl, deleteFile } from '../config/storage';

const router = Router();
router.use(authenticate);

// List images for a patient
router.get('/:patientId', async (req: Request, res: Response) => {
  const type = req.query.type as string;
  const where: Record<string, unknown> = {
    patientId: req.params.patientId,
    patient: { practiceId: req.auth!.practiceId },
  };
  if (type) where.type = type;

  const images = await prisma.dentalImage.findMany({
    where: where as any,
    include: {
      aiAnalyses: { select: { id: true, type: true, confidence: true, accepted: true, createdAt: true } },
    },
    orderBy: { dateTaken: 'desc' },
  });

  const imagesWithUrls = images.map((img) => ({
    ...img,
    url: getFileUrl(img.filePath),
  }));

  res.json(imagesWithUrls);
});

// Upload image
router.post('/:patientId', uploadImage.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const bodySchema = z.object({
    type: z.enum([
      'PERIAPICAL', 'BITEWING', 'PANORAMIC', 'CEPHALOMETRIC',
      'CBCT', 'INTRAORAL_PHOTO', 'EXTRAORAL_PHOTO', 'OTHER',
    ]),
    toothNumbers: z.string().transform((s) => s ? JSON.parse(s) : []).optional(),
    notes: z.string().optional(),
  });

  const data = bodySchema.parse(req.body);

  const image = await prisma.dentalImage.create({
    data: {
      patientId: req.params.patientId,
      type: data.type,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      toothNumbers: (data.toothNumbers as number[]) || [],
      notes: data.notes,
    },
  });

  res.status(201).json({
    ...image,
    url: getFileUrl(image.filePath),
  });
});

// Update image annotations
router.put('/:imageId/annotations', async (req: Request, res: Response) => {
  const { annotations } = z.object({
    annotations: z.any(),
  }).parse(req.body);

  const image = await prisma.dentalImage.update({
    where: { id: req.params.imageId },
    data: { annotations },
  });

  res.json(image);
});

// Delete image
router.delete('/:imageId', async (req: Request, res: Response) => {
  const image = await prisma.dentalImage.findFirst({
    where: { id: req.params.imageId, patient: { practiceId: req.auth!.practiceId } },
  });

  if (!image) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  deleteFile(image.filePath);
  await prisma.dentalImage.delete({ where: { id: req.params.imageId } });

  res.json({ message: 'Image deleted' });
});

export default router;

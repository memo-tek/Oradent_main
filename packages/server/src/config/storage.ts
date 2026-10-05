import fs from 'fs';
import path from 'path';
import { env } from './env';

const uploadDir = path.resolve(env.UPLOAD_DIR);

export function ensureUploadDir(): void {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

export function getUploadPath(patientId: string, filename: string): string {
  const patientDir = path.join(uploadDir, patientId);
  if (!fs.existsSync(patientDir)) {
    fs.mkdirSync(patientDir, { recursive: true });
  }
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(patientDir, `${timestamp}-${safeName}`);
}

export function getFileUrl(filePath: string): string {
  const relative = path.relative(uploadDir, filePath);
  return `/uploads/${relative}`;
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export { uploadDir };

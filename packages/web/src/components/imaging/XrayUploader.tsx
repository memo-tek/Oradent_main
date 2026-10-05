'use client';

import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, FileImage, Loader2 } from 'lucide-react';
import { apiUpload } from '@/lib/api';

interface XrayUploaderProps {
  patientId: string;
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

const IMAGE_TYPES = [
  { value: 'PERIAPICAL', label: 'Periapical' },
  { value: 'BITEWING', label: 'Bitewing' },
  { value: 'PANORAMIC', label: 'Panoramic' },
  { value: 'CEPHALOMETRIC', label: 'Cephalometric' },
  { value: 'CBCT', label: 'CBCT' },
  { value: 'INTRAORAL_PHOTO', label: 'Intraoral Photo' },
  { value: 'OTHER', label: 'Other' },
];
export function XrayUploader({
  patientId,
  open,
  onClose,
  onUploaded,
}: XrayUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [imageType, setImageType] = useState('PERIAPICAL');
  const [toothNumber, setToothNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', imageType);
        if (toothNumber) formData.append('toothNumber', toothNumber);

        await apiUpload(`/api/imaging/${patientId}`, formData);
      }
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-stone-900">
              Upload X-ray
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${dragActive
                ? 'border-teal-500 bg-teal-50'
                : 'border-stone-300 bg-stone-50 hover:border-stone-400'
                }`}
            >
              <Upload className="h-8 w-8 text-stone-400" />
              <p className="mt-2 text-sm font-medium text-stone-700">
                Drag and drop images here
              </p>
              <p className="mt-1 text-xs text-stone-500">or</p>
              <label className="mt-2 cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-teal-600 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50">
                Browse Files
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>

            {/* Selected files */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-stone-400" />
                      <span className="text-sm text-stone-700 truncate max-w-[300px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-stone-400">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Image Type
                </label>
                <select
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {IMAGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Tooth # (optional)
                </label>
                <input
                  type="number"
                  min={1}
                  max={32}
                  value={toothNumber}
                  onChange={(e) => setToothNumber(e.target.value)}
                  placeholder="e.g., 14"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload {files.length > 0 ? `(${files.length})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

'use client';

import { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Brain, Download } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { formatDate } from '@/lib/formatters';

interface XrayImage {
  id: string;
  patientId: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  type: string;
  toothNumber?: number;
  uploadedAt: string;
  uploadedBy: string;
  aiAnalyzed: boolean;
  analysisId?: string;
}

interface XrayViewerProps {
  image: XrayImage;
  onClose: () => void;
  onAnalyze: () => void;
}

export function XrayViewer({ image, onClose, onAnalyze }: XrayViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <Dialog.Root open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-4 z-50 flex flex-col rounded-2xl bg-stone-900 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-700 px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">
                {image.filename}
              </Dialog.Title>
              <p className="mt-0.5 text-sm text-stone-400">
                {image.type}{image.toothNumber ? ` - Tooth #${image.toothNumber}` : ''} | Uploaded {formatDate(image.uploadedAt)} by {image.uploadedBy}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onAnalyze}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
              >
                <Brain className="h-4 w-4" />
                {image.aiAnalyzed ? 'View Analysis' : 'AI Analysis'}
              </button>
              <Dialog.Close asChild>
                <button className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-center gap-2 border-b border-stone-700 px-6 py-2">
            <button
              onClick={handleZoomOut}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[4rem] text-center text-sm text-stone-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="mx-2 h-5 w-px bg-stone-700" />
            <button
              onClick={handleRotate}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white"
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <div className="mx-2 h-5 w-px bg-stone-700" />
            <a
              href={image.url}
              download={image.filename}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>

          {/* Image area */}
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <img
              src={image.url}
              alt={image.filename}
              className="max-h-full max-w-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

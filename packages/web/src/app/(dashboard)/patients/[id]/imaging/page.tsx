'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Upload, Image as ImageIcon, Brain } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { XrayGallery } from '@/components/imaging/XrayGallery';
import { XrayUploader } from '@/components/imaging/XrayUploader';
import { XrayViewer } from '@/components/imaging/XrayViewer';
import { AIAnalysisPanel } from '@/components/imaging/AIAnalysisPanel';

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

export default function ImagingPage() {
  const params = useParams<{ id: string }>();
  const [showUploader, setShowUploader] = useState(false);
  const [selectedImage, setSelectedImage] = useState<XrayImage | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { data: images, isLoading, refetch } = useQuery<XrayImage[]>({
    queryKey: ['xrays', params.id],
    queryFn: () => apiGet<XrayImage[]>(`/api/imaging/${params.id}`),
    enabled: !!params.id,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Imaging</h2>
          <p className="mt-1 text-sm text-stone-500">
            {images?.length ?? 0} images on file
          </p>
        </div>
        <button
          onClick={() => setShowUploader(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload X-ray
        </button>
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-xl bg-stone-200"
            />
          ))}
        </div>
      ) : images && images.length > 0 ? (
        <XrayGallery
          images={images}
          onSelect={(img) => setSelectedImage(img)}
        />
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <ImageIcon className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-lg font-medium text-stone-700">
            No Images Yet
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Upload X-rays and dental images for this patient.
          </p>
          <button
            onClick={() => setShowUploader(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload First Image
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <XrayUploader
          patientId={params.id}
          open={showUploader}
          onClose={() => setShowUploader(false)}
          onUploaded={() => {
            setShowUploader(false);
            refetch();
          }}
        />
      )}

      {/* Image Viewer */}
      {selectedImage && (
        <XrayViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onAnalyze={() => setShowAnalysis(true)}
        />
      )}

      {/* AI Analysis */}
      {showAnalysis && selectedImage && (
        <AIAnalysisPanel
          imageId={selectedImage.id}
          patientId={params.id}
          onClose={() => setShowAnalysis(false)}
        />
      )}
    </div>
  );
}

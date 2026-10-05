'use client';

export interface ChairStatus {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  currentPatient?: string;
  currentProcedure?: string;
  provider?: string;
}

interface ChairStatusCardProps {
  chairs?: ChairStatus[];
  isLoading?: boolean;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  available: { color: 'bg-green-500', label: 'Available' },
  occupied: { color: 'bg-red-500', label: 'Occupied' },
  cleaning: { color: 'bg-amber-500', label: 'Cleaning' },
  maintenance: { color: 'bg-stone-400', label: 'Maintenance' },
};

export default function ChairStatusCard({ chairs, isLoading }: ChairStatusCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="w-28 h-5 bg-stone-200 animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-3 h-3 bg-stone-200 animate-pulse rounded-full" />
              <div className="w-20 h-4 bg-stone-200 animate-pulse rounded" />
              <div className="flex-1" />
              <div className="w-16 h-4 bg-stone-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <h3 className="text-lg font-semibold text-stone-900 mb-4">Chair Status</h3>
      {!chairs || chairs.length === 0 ? (
        <p className="text-sm text-stone-500">No chairs configured</p>
      ) : (
        <div className="space-y-3">
          {chairs.map((chair) => {
            const config = statusConfig[chair.status] || statusConfig.available;
            return (
              <div key={chair.id} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full shrink-0 ${config.color}`} />
                <span className="text-sm font-medium text-stone-900">{chair.name}</span>
                <span className="flex-1" />
                <div className="text-right">
                  <span className="text-xs text-stone-500">{config.label}</span>
                  {chair.currentPatient && (
                    <p className="text-xs text-stone-400 truncate max-w-[140px]">
                      {chair.currentPatient}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

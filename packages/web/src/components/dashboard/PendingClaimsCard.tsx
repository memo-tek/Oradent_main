'use client';

interface PendingClaimsCardProps {
  pendingClaims?: number;
  totalAmount?: number;
  isLoading?: boolean;
}

export default function PendingClaimsCard({ pendingClaims, totalAmount, isLoading }: PendingClaimsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-amber-100 animate-pulse rounded-lg" />
          <div className="w-28 h-4 bg-stone-200 animate-pulse rounded" />
        </div>
        <div className="w-20 h-8 bg-stone-200 animate-pulse rounded" />
        <div className="w-24 h-4 bg-stone-200 animate-pulse rounded mt-2" />
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalAmount ?? 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
        </div>
        <span className="text-sm font-medium text-stone-500">Pending Claims</span>
      </div>
      <p className="text-2xl font-semibold text-stone-900">
        {pendingClaims ?? 0}
      </p>
      {totalAmount !== undefined && (
        <p className="text-sm text-stone-500 mt-2">
          <span className="font-mono">{formattedAmount}</span> total value
        </p>
      )}
    </div>
  );
}

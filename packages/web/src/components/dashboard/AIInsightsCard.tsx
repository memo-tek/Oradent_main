'use client';

interface AIInsight {
  id: string;
  type: 'reminder' | 'alert' | 'suggestion';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface AIInsightsCardProps {
  insights?: AIInsight[];
  isLoading?: boolean;
}

const typeIcons: Record<string, { bg: string; text: string }> = {
  reminder: { bg: 'bg-blue-100', text: 'text-blue-600' },
  alert: { bg: 'bg-red-100', text: 'text-red-600' },
  suggestion: { bg: 'bg-teal-100', text: 'text-teal-600' },
};

export default function AIInsightsCard({ insights, isLoading }: AIInsightsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-24 h-5 bg-stone-200 animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-stone-50">
              <div className="w-40 h-4 bg-stone-200 animate-pulse rounded mb-2" />
              <div className="w-full h-3 bg-stone-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-teal-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-stone-900">AI Insights</h3>
      </div>

      {!insights || insights.length === 0 ? (
        <div className="py-8 text-center">
          <svg
            className="w-10 h-10 text-stone-300 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
            />
          </svg>
          <p className="text-sm text-stone-500">
            AI insights will appear here as data is analyzed.
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Schedule appointments and record treatments to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const colors = typeIcons[insight.type] || typeIcons.suggestion;
            return (
              <div
                key={insight.id}
                className={`p-3 rounded-lg border border-stone-100 hover:bg-stone-50 transition-colors ${
                  insight.actionUrl ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${colors.bg.replace('100', '500')}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900">
                      {insight.title}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

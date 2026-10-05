  'use client';

  import { useState } from 'react';
  import { useRouter, useSearchParams } from 'next/navigation';
  import { Plus } from 'lucide-react';
  import { usePatients } from '@/hooks/usePatient';
  import { PatientList } from '@/components/patients/PatientList';
  import { PatientSearch } from '@/components/patients/PatientSearch';
  import { PatientForm } from '@/components/patients/PatientForm';

  const STATUS_TABS = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Archived', value: 'archived' },
  ];

  export default function PatientsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [page, setPage] = useState(1);
    const [showNewPatient, setShowNewPatient] = useState(
      searchParams.get('new') === 'true'
    );

    const { data, isLoading } = usePatients({
      search,
      status: status || undefined,
      page,
      limit: 20,
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Patients</h1>
            <p className="mt-1 text-sm text-stone-500">
              {data?.pagination?.total ?? 0} patients total
            </p>
          </div>
          <button
            onClick={() => setShowNewPatient(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Patient
          </button>
        </div>

        {/* Search & Filters */}
        <PatientSearch value={search} onChange={setSearch} />

        {/* Status Tabs */}
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${status === tab.value
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Patient Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-200" />
            ))}
          </div>
        ) : (
          <PatientList
            patients={data?.patients ?? []}
            onSelect={(id) => router.push(`/patients/${id}`)}
          />
        )}

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-6 py-3 shadow-sm">
            <p className="text-sm text-stone-500">
              Page {data.pagination.page} of {data.pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page >= data.pagination.pages}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* New Patient Modal */}
        {showNewPatient && (
          <PatientForm
            open={showNewPatient}
            onClose={() => setShowNewPatient(false)}
          />
        )}
      </div>
    );
  }
'use client';

import { User, Phone, Mail, Calendar } from 'lucide-react';
import type { Patient } from '@/hooks/usePatient';
import { formatDate, formatAge, formatPhone, getInitials } from '@/lib/formatters';

interface PatientListProps {
  patients: Patient[];
  onSelect: (id: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-stone-100 text-stone-600',
  archived: 'bg-amber-100 text-amber-700',
};

export function PatientList({ patients, onSelect }: PatientListProps) {
  if (patients.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
        <User className="mx-auto h-12 w-12 text-stone-300" />
        <h3 className="mt-3 text-lg font-medium text-stone-700">
          No Patients Found
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200">
            <th className="px-4 py-3 text-left font-medium text-stone-500">
              Patient
            </th>
            <th className="px-4 py-3 text-left font-medium text-stone-500">
              Contact
            </th>
            <th className="px-4 py-3 text-left font-medium text-stone-500">
              Age
            </th>
            <th className="px-4 py-3 text-left font-medium text-stone-500">
              Last Visit
            </th>
            <th className="px-4 py-3 text-left font-medium text-stone-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr
              key={patient.id}
              onClick={() => onSelect(patient.id)}
              className="cursor-pointer border-b border-stone-100 transition-colors hover:bg-stone-50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                    {getInitials(`${patient.firstName} ${patient.lastName}`)}
                  </div>
                  <div>
                    <div className="font-medium text-stone-900">
                      {patient.firstName} {patient.lastName}
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <Mail className="h-3 w-3" />
                        {patient.email}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-stone-600">
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  {formatPhone(patient.phone)}
                </div>
              </td>
              <td className="px-4 py-3 text-stone-600">
                {formatAge(patient.dateOfBirth)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-stone-600">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  {formatDate(patient.lastVisit)}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    STATUS_BADGE[patient.status] || 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {patient.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  Shield,
  Calendar,
  FileText,
  Image,
  DollarSign,
  ClipboardList,
  Activity,
} from 'lucide-react';
import { usePatient } from '@/hooks/usePatient';
import {
  formatDate,
  formatAge,
  formatPhone,
  getInitials,
} from '@/lib/formatters';

const TABS = [
  { label: 'Chart', href: 'chart', icon: ClipboardList },
  { label: 'Treatments', href: 'treatments', icon: FileText },
  { label: 'History', href: 'history', icon: Activity },
  { label: 'Imaging', href: 'imaging', icon: Image },
  { label: 'Billing', href: 'billing', icon: DollarSign },
];

export default function PatientProfilePage() {
  const params = useParams<{ id: string }>();
  const { data: patient, isLoading } = usePatient(params.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-xl bg-stone-200" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-stone-200 bg-white">
        <p className="text-stone-500">Patient not found.</p>
      </div>
    );
  }

  const fullName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700">
            {getInitials(fullName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-stone-900">{fullName}</h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${patient.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : patient.status === 'inactive'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-stone-100 text-stone-600'
                  }`}
              >
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                DOB: {formatDate(patient.dateOfBirth)} ({formatAge(patient.dateOfBirth)})
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {formatPhone(patient.phone)}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {patient.email}
              </span>
              {patient.insuranceCompany && (
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {patient.insuranceCompany}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex gap-1 border-t border-stone-100 pt-4">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={`/patients/${params.id}/${tab.href}`}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {patient.lastVisit ? (
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-teal-500" />
                <div>
                  <p className="text-sm text-stone-700">Last visit</p>
                  <p className="text-xs text-stone-500">{formatDate(patient.lastVisit)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-400">No recent activity</p>
            )}
          </div>
        </div>

        {/* Medical Alerts */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">Medical Alerts</h3>
          <div className="mt-4 space-y-2">
            {(patient.allergies?.length ?? 0) > 0 ? (
              <div>
                <p className="text-xs font-medium text-stone-500">Allergies</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(patient.allergies ?? []).map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-400">No allergies recorded</p>
            )}
            {(patient.medications?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-500">Medications</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(patient.medications ?? []).map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Summary */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">Account Summary</h3>
          <div className="mt-4">
            <p className="text-xs text-stone-500">Balance</p>
            <p className="text-2xl font-bold text-stone-900">
              ${(patient.accountBalance ?? 0).toFixed(2)}
            </p>
          </div>
          <Link
            href={`/patients/${params.id}/billing`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View Billing
            <DollarSign className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

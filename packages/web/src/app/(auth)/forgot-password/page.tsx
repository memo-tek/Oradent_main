'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(
      'Password recovery is not available yet. Please contact your practice administrator.'
    );
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Forgot password?</h1>
        <p className="mt-1 text-sm text-stone-500">
          Enter your email address to get help accessing your account.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-stone-700"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="dr.smith@oradent.com"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2"
        >
          Send recovery instructions
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-medium text-teal-600 hover:text-teal-700"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

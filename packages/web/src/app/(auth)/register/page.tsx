"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const registerSchema = z.object({
  practiceName: z.string().min(2, "Practice name is required"),
  practiceAddress: z.string().min(5, "Address is required"),
  practicePhone: z.string().min(7, "Phone number is required"),
  practiceEmail: z.string().email("Please enter a valid email address"),
  providerName: z.string().min(2, "Provider name is required"),
  providerEmail: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  title: z.enum(["DDS", "DMD"], {
    required_error: "Please select a title",
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      practiceName: "",
      practiceAddress: "",
      practicePhone: "",
      practiceEmail: "",
      providerName: "",
      providerEmail: "",
      password: "",
      title: undefined,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Registration failed. Please try again."
        );
      }

      const result = await response.json();

      localStorage.setItem("oradent_token", result.token || result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem("oradent_refresh_token", result.refreshToken);
      }

      router.push("/");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              d="M12 2C9.5 2 7.5 3 6.5 5C5.5 7 5 9 5 11C5 13 5.5 15 6 17C6.5 19 7 21 8.5 22C9.5 22.5 10.5 21 11 19C11.3 17.5 11.7 17.5 12 17.5C12.3 17.5 12.7 17.5 13 19C13.5 21 14.5 22.5 15.5 22C17 21 17.5 19 18 17C18.5 15 19 13 19 11C19 9 18.5 7 17.5 5C16.5 3 14.5 2 12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-stone-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Set up your dental practice on Oradent
        </p>
      </div>

      {/* Error display */}
      {serverError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Practice Information */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-stone-800">
            Practice Information
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="practiceName"
                className="mb-1.5 block text-sm font-medium text-stone-700"
              >
                Practice name
              </label>
              <input
                id="practiceName"
                type="text"
                placeholder="Bright Smile Dental"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
                  errors.practiceName
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-stone-300"
                }`}
                {...register("practiceName")}
              />
              {errors.practiceName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.practiceName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="practiceAddress"
                className="mb-1.5 block text-sm font-medium text-stone-700"
              >
                Address
              </label>
              <input
                id="practiceAddress"
                type="text"
                placeholder="123 Main St, Suite 100, City, ST 12345"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
                  errors.practiceAddress
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-stone-300"
                }`}
                {...register("practiceAddress")}
              />
              {errors.practiceAddress && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.practiceAddress.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="practicePhone"
                  className="mb-1.5 block text-sm font-medium text-stone-700"
                >
                  Phone
                </label>
                <input
                  id="practicePhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
                    errors.practicePhone
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-stone-300"
                  }`}
                  {...register("practicePhone")}
                />
                {errors.practicePhone && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.practicePhone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="practiceEmail"
                  className="mb-1.5 block text-sm font-medium text-stone-700"
                >
                  Practice email
                </label>
                <input
                  id="practiceEmail"
                  type="email"
                  placeholder="info@practice.com"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
                    errors.practiceEmail
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-stone-300"
                  }`}
                  {...register("practiceEmail")}
                />
                {errors.practiceEmail && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.practiceEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-stone-200" />

        {/* Provider Information */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-stone-800">
            Provider Information
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label
                  htmlFor="providerName"
                  className="mb-1.5 block text-sm font-medium text-stone-700"
                >
                  Full name
                </label>
                <input
                  id="providerName"
                  type="text"
                  placeholder="Dr. John Smith"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
                    errors.providerName
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-stone-300"
                  }`}
                  {...register("providerName")}
                />
                {errors.providerName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.providerName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="mb-1.5 block text-sm font-medium text-stone-700"
                >
                  Title
                </label>
                <select
                  id="title"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-stone-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
                    errors.title
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-stone-300"
                  }`}
                  {...register("title")}
                >
                  <option value="">Select</option>
                  <option value="DDS">DDS</option>
                  <option value="DMD">DMD</option>
                </select>
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="providerEmail"
                className="mb-1.5 block text-sm font-medium text-stone-700"
              >
                Email address
              </label>
              <input
                id="providerEmail"
                type="email"
                autoComplete="email"
                placeholder="dr.smith@practice.com"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
                  errors.providerEmail
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-stone-300"
                }`}
                {...register("providerEmail")}
              />
              {errors.providerEmail && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.providerEmail.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-stone-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-stone-300"
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-teal-600 hover:text-teal-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

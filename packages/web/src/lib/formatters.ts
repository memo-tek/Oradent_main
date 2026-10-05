import { format, formatDistanceToNow, differenceInYears, parseISO } from "date-fns";

/**
 * Format a number as USD currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string or Date object as a readable date (e.g., "Jan 15, 2025").
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

/**
 * Format a date string or Date object as a readable date with time (e.g., "Jan 15, 2025 2:30 PM").
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy h:mm a");
}

/**
 * Format a date as a short time (e.g., "2:30 PM").
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}

/**
 * Format a date as relative time (e.g., "3 days ago").
 */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a US phone number (e.g., "(555) 123-4567").
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "N/A";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Get initials from a full name (e.g., "John Doe" -> "JD").
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate a patient's age from their date of birth.
 */
export function getPatientAge(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;
  const d = typeof dob === "string" ? parseISO(dob) : dob;
  return differenceInYears(new Date(), d);
}

/**
 * Format a patient's age with label (e.g., "34 yrs").
 */
export function formatAge(dob: string | Date | null | undefined): string {
  const age = getPatientAge(dob);
  if (age === null) return "N/A";
  return `${age} yrs`;
}

/**
 * Format a tooth number with universal numbering (1-32 for permanent, A-T for deciduous).
 */
export function formatToothNumber(num: number, isDeciduous: boolean = false): string {
  if (isDeciduous) {
    const letter = String.fromCharCode(64 + num); // 1->A, 2->B, etc.
    return `#${letter}`;
  }
  return `#${num}`;
}

/**
 * Format a patient's full name.
 */
export function formatPatientName(
  firstName: string | undefined,
  lastName: string | undefined
): string {
  if (!firstName && !lastName) return "Unknown";
  return `${firstName || ""} ${lastName || ""}`.trim();
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

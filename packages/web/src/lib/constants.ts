import {
  Calendar,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  Stethoscope,
  Image,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

// ═══════════════════ APPOINTMENT TYPES ═══════════════════

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  EXAM: "Exam",
  CLEANING: "Cleaning",
  FILLING: "Filling",
  CROWN: "Crown",
  ROOT_CANAL: "Root Canal",
  EXTRACTION: "Extraction",
  IMPLANT: "Implant",
  COSMETIC: "Cosmetic",
  EMERGENCY: "Emergency",
  CONSULTATION: "Consultation",
  FOLLOW_UP: "Follow Up",
  OTHER: "Other",
};

export const APPOINTMENT_TYPE_COLORS: Record<string, string> = {
  EXAM: "#14b8a6",
  CLEANING: "#22c55e",
  FILLING: "#3b82f6",
  CROWN: "#f59e0b",
  ROOT_CANAL: "#8b5cf6",
  EXTRACTION: "#64748b",
  IMPLANT: "#06b6d4",
  COSMETIC: "#ec4899",
  EMERGENCY: "#ef4444",
  CONSULTATION: "#6366f1",
  FOLLOW_UP: "#a855f7",
  OTHER: "#78716c",
};

export const APPOINTMENT_TYPE_DURATIONS: Record<string, number> = {
  EXAM: 30,
  CLEANING: 60,
  FILLING: 45,
  CROWN: 90,
  ROOT_CANAL: 90,
  EXTRACTION: 60,
  IMPLANT: 120,
  COSMETIC: 60,
  EMERGENCY: 30,
  CONSULTATION: 30,
  FOLLOW_UP: 20,
  OTHER: 30,
};

// ═══════════════════ APPOINTMENT STATUS ═══════════════════

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  IN_CHAIR: "In Chair",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
  RESCHEDULED: "Rescheduled",
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#3b82f6",
  CONFIRMED: "#14b8a6",
  CHECKED_IN: "#f59e0b",
  IN_CHAIR: "#8b5cf6",
  COMPLETED: "#22c55e",
  CANCELLED: "#64748b",
  NO_SHOW: "#ef4444",
  RESCHEDULED: "#6366f1",
};

// ═══════════════════ TOOTH CONDITIONS ═══════════════════

export const TOOTH_CONDITION_TYPES: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  cavity: { label: "Cavity", color: "#ef4444", icon: "circle" },
  filling: { label: "Filling", color: "#3b82f6", icon: "square" },
  filling_composite: { label: "Composite Filling", color: "#3b82f6", icon: "square" },
  filling_amalgam: { label: "Amalgam Filling", color: "#64748b", icon: "square" },
  crown: { label: "Crown", color: "#f59e0b", icon: "pentagon" },
  root_canal: { label: "Root Canal", color: "#8b5cf6", icon: "triangle" },
  extraction_needed: { label: "Extraction Needed", color: "#ef4444", icon: "x" },
  missing: { label: "Missing", color: "#64748b", icon: "x" },
  implant: { label: "Implant", color: "#06b6d4", icon: "diamond" },
  bridge: { label: "Bridge", color: "#f97316", icon: "link" },
  veneer: { label: "Veneer", color: "#ec4899", icon: "rectangle" },
  sealant: { label: "Sealant", color: "#22c55e", icon: "shield" },
  watch: { label: "Watch", color: "#eab308", icon: "eye" },
  fracture: { label: "Fracture", color: "#ef4444", icon: "zap" },
  abscess: { label: "Abscess", color: "#dc2626", icon: "alert" },
  impacted: { label: "Impacted", color: "#78716c", icon: "arrow-down" },
  periodontal: { label: "Periodontal Issue", color: "#f97316", icon: "waves" },
};

export const TOOTH_SURFACES = ["M", "O", "D", "B", "L"] as const;
export type ToothSurface = (typeof TOOTH_SURFACES)[number];

export const TOOTH_SURFACE_LABELS: Record<string, string> = {
  M: "Mesial",
  O: "Occlusal",
  D: "Distal",
  B: "Buccal",
  L: "Lingual",
};

// ═══════════════════ CDT CODE CATEGORIES ═══════════════════

export const CDT_CATEGORIES: Record<string, { label: string; range: string }> = {
  diagnostic: { label: "Diagnostic", range: "D0100-D0999" },
  preventive: { label: "Preventive", range: "D1000-D1999" },
  restorative: { label: "Restorative", range: "D2000-D2999" },
  endodontics: { label: "Endodontics", range: "D3000-D3999" },
  periodontics: { label: "Periodontics", range: "D4000-D4999" },
  prosthodontics_removable: { label: "Prosthodontics (Removable)", range: "D5000-D5899" },
  maxillofacial: { label: "Maxillofacial Prosthetics", range: "D5900-D5999" },
  implant: { label: "Implant Services", range: "D6000-D6199" },
  prosthodontics_fixed: { label: "Prosthodontics (Fixed)", range: "D6200-D6999" },
  oral_surgery: { label: "Oral & Maxillofacial Surgery", range: "D7000-D7999" },
  orthodontics: { label: "Orthodontics", range: "D8000-D8999" },
  adjunctive: { label: "Adjunctive General Services", range: "D9000-D9999" },
};

// ═══════════════════ INVOICE STATUS ═══════════════════

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
  WRITE_OFF: "Write Off",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#78716c",
  PENDING: "#f59e0b",
  PARTIALLY_PAID: "#3b82f6",
  PAID: "#22c55e",
  OVERDUE: "#ef4444",
  VOID: "#64748b",
  WRITE_OFF: "#a855f7",
};

// ═══════════════════ CLAIM STATUS ═══════════════════

export const CLAIM_STATUS_LABELS: Record<string, string> = {
  DRAFTED: "Drafted",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  PARTIALLY_APPROVED: "Partially Approved",
  DENIED: "Denied",
  APPEALED: "Appealed",
  PAID: "Paid",
  WRITE_OFF: "Write Off",
};

// ═══════════════════ PROVIDER ROLES ═══════════════════

export const PROVIDER_ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  DENTIST: "Dentist",
  HYGIENIST: "Hygienist",
  ASSISTANT: "Assistant",
  FRONT_DESK: "Front Desk",
};

// ═══════════════════ NAVIGATION ═══════════════════

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: { label: string; href: string }[];
  roles?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Schedule",
    href: "/schedule",
    icon: Calendar,
  },
  {
    label: "Patients",
    href: "/patients",
    icon: Users,
  },
  {
    label: "Clinical",
    href: "/clinical",
    icon: Stethoscope,
    children: [
      { label: "Dental Chart", href: "/clinical/chart" },
      { label: "Treatment Plans", href: "/clinical/treatment-plans" },
      { label: "Clinical Notes", href: "/clinical/notes" },
      { label: "Perio Chart", href: "/clinical/perio" },
    ],
  },
  {
    label: "Imaging",
    href: "/imaging",
    icon: Image,
  },
  {
    label: "Billing",
    href: "/billing",
    icon: DollarSign,
    children: [
      { label: "Invoices", href: "/billing/invoices" },
      { label: "Payments", href: "/billing/payments" },
      { label: "Insurance Claims", href: "/billing/claims" },
      { label: "Fee Schedule", href: "/billing/fee-schedule" },
    ],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    children: [
      { label: "Production", href: "/reports/production" },
      { label: "Collections", href: "/reports/collections" },
      { label: "Appointments", href: "/reports/appointments" },
      { label: "Patients", href: "/reports/patients" },
    ],
    roles: ["OWNER", "DENTIST"],
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["OWNER"],
    children: [
      { label: "Practice", href: "/settings/practice" },
      { label: "Providers", href: "/settings/providers" },
      { label: "Chairs", href: "/settings/chairs" },
      { label: "Fee Schedule", href: "/settings/fee-schedule" },
      { label: "Integrations", href: "/settings/integrations" },
    ],
  },
];

// ═══════════════════ MISC ═══════════════════

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Check",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  INSURANCE: "Insurance",
  FINANCING: "Financing",
  OTHER: "Other",
};

export const ITEMS_PER_PAGE = 25;

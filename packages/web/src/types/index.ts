// ═══════════════════ ENUMS ═══════════════════

export type ProviderRole = "OWNER" | "DENTIST" | "HYGIENIST" | "ASSISTANT" | "FRONT_DESK";

export type PatientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ToothStatus = "PRESENT" | "MISSING" | "IMPACTED" | "UNERUPTED" | "IMPLANT" | "PONTIC";

export type AppointmentType =
  | "EXAM"
  | "CLEANING"
  | "FILLING"
  | "CROWN"
  | "ROOT_CANAL"
  | "EXTRACTION"
  | "IMPLANT"
  | "COSMETIC"
  | "EMERGENCY"
  | "CONSULTATION"
  | "FOLLOW_UP"
  | "OTHER";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_CHAIR"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export type TreatmentPlanStatus =
  | "PROPOSED"
  | "PRESENTED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED";

export type ImageType =
  | "PERIAPICAL"
  | "BITEWING"
  | "PANORAMIC"
  | "CEPHALOMETRIC"
  | "CBCT"
  | "INTRAORAL_PHOTO"
  | "EXTRAORAL_PHOTO"
  | "OTHER";

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID"
  | "WRITE_OFF";

export type PaymentMethod =
  | "CASH"
  | "CHECK"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "INSURANCE"
  | "FINANCING"
  | "OTHER";

export type ClaimStatus =
  | "DRAFTED"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "PARTIALLY_APPROVED"
  | "DENIED"
  | "APPEALED"
  | "PAID"
  | "WRITE_OFF";

// ═══════════════════ PRACTICE & AUTH ═══════════════════

export interface Practice {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
  taxId: string | null;
  npi: string | null;
  settings?: PracticeSettings;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeSettings {
  id: string;
  practiceId: string;
  appointmentDuration: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  reminderHoursBefore: number;
  currency: string;
}

export interface Provider {
  id: string;
  practiceId: string;
  email: string;
  name: string;
  title: string;
  role: ProviderRole;
  npi: string | null;
  licenseNumber: string | null;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chair {
  id: string;
  practiceId: string;
  name: string;
  isActive: boolean;
}

// ═══════════════════ PATIENTS ═══════════════════

export interface Patient {
  id: string;
  practiceId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string | null;
  email: string | null;
  phone: string;
  phoneSecondary: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  medicalHistory?: MedicalHistory;
  insurancePrimary?: InsuranceInfo;
  insuranceSecondary?: InsuranceInfo;
  dentalChart?: ToothCondition[];
  appointments?: Appointment[];
  treatmentPlans?: TreatmentPlan[];
  invoices?: Invoice[];
  clinicalNotes?: ClinicalNote[];
  status: PatientStatus;
  lastVisit: string | null;
  nextAppointment: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalHistory {
  id: string;
  patientId: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  bloodType: string | null;
  isPregnant: boolean;
  smokingStatus: string | null;
  alcoholUse: string | null;
  previousSurgeries: string[];
  familyHistory: string[];
  lastPhysical: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface InsuranceInfo {
  id: string;
  company: string;
  planName: string | null;
  groupNumber: string | null;
  memberId: string;
  subscriberName: string;
  subscriberDob: string | null;
  relationship: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  annualMax: number | null;
  remainingBenefit: number | null;
  deductible: number | null;
  deductibleMet: number | null;
  coveragePercent: CoveragePercent;
  verifiedAt: string | null;
  notes: string | null;
}

export interface CoveragePercent {
  preventive: number;
  basic: number;
  major: number;
  orthodontic: number;
}

// ═══════════════════ DENTAL CHARTING ═══════════════════

export interface ToothCondition {
  id: string;
  patientId: string;
  toothNumber: number;
  conditions: ToothConditionEntry[];
  status: ToothStatus;
  isDeciduous: boolean;
  updatedAt: string;
}

export interface ToothConditionEntry {
  type: string;
  surfaces?: string[];
  notes?: string;
  date?: string;
  providerId?: string;
}

export interface PerioReading {
  id: string;
  patientId: string;
  date: string;
  providerId: string;
  readings: PerioToothReading[];
  notes: string | null;
  createdAt: string;
}

export interface PerioToothReading {
  toothNumber: number;
  buccal: [number, number, number];
  lingual: [number, number, number];
  bleeding: boolean[];
  furcation?: number;
  mobility?: number;
  recession?: [number, number, number];
}

// ═══════════════════ APPOINTMENTS ═══════════════════

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  providerId: string;
  provider?: Provider;
  chairId: string | null;
  chair?: Chair;
  startTime: string;
  endTime: string;
  duration: number;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string | null;
  procedures: string[];
  notes: string | null;
  confirmedAt: string | null;
  checkedInAt: string | null;
  seatedAt: string | null;
  completedAt: string | null;
  reminderSent: boolean;
  isRecurring: boolean;
  recurringRule: string | null;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════ TREATMENTS ═══════════════════

export interface TreatmentPlan {
  id: string;
  patientId: string;
  patient?: Patient;
  name: string;
  status: TreatmentPlanStatus;
  items: TreatmentPlanItem[];
  totalFee: number;
  insuranceEst: number;
  patientEst: number;
  presentedAt: string | null;
  acceptedAt: string | null;
  notes: string | null;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentPlanItem {
  id: string;
  treatmentPlanId: string;
  toothNumber: number | null;
  surfaces: string[];
  cdtCode: string;
  description: string;
  fee: number;
  insurancePays: number;
  patientPays: number;
  priority: number;
  status: string;
  sortOrder: number;
}

export interface Treatment {
  id: string;
  patientId: string;
  patient?: Patient;
  providerId: string;
  provider?: Provider;
  date: string;
  toothNumber: number | null;
  surfaces: string[];
  cdtCode: string;
  description: string;
  diagnosisCodes: string[];
  fee: number;
  notes: string | null;
  status: string;
  invoiceId: string | null;
  createdAt: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  patient?: Patient;
  providerId: string;
  provider?: Provider;
  date: string;
  type: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  vitals: VitalsData | null;
  aiAssisted: boolean;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VitalsData {
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

// ═══════════════════ IMAGING & AI ═══════════════════

export interface DentalImage {
  id: string;
  patientId: string;
  type: ImageType;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  toothNumbers: number[];
  dateTaken: string;
  notes: string | null;
  aiAnalyses?: AIAnalysis[];
  annotations: ImageAnnotation[] | null;
  createdAt: string;
}

export interface ImageAnnotation {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  color?: string;
}

export interface AIAnalysis {
  id: string;
  patientId: string;
  imageId: string | null;
  type: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  confidence: number | null;
  findings: AIFinding[] | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  accepted: boolean;
  model: string;
  tokensUsed: number | null;
  costUsd: number | null;
  createdAt: string;
}

export interface AIFinding {
  type: string;
  location?: string;
  toothNumber?: number;
  confidence: number;
  description: string;
  severity?: "low" | "medium" | "high";
  recommendation?: string;
}

// ═══════════════════ BILLING & INSURANCE ═══════════════════

export interface FeeScheduleItem {
  id: string;
  practiceId: string;
  cdtCode: string;
  description: string;
  fee: number;
  category: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patient?: Patient;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  treatments?: Treatment[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  insurancePortion: number;
  patientPortion: number;
  status: InvoiceStatus;
  payments?: Payment[];
  insuranceClaim?: InsuranceClaim;
  notes: string | null;
  pdfPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  date: string;
  notes: string | null;
}

export interface InsuranceClaim {
  id: string;
  invoiceId: string;
  claimNumber: string | null;
  status: ClaimStatus;
  submittedAt: string | null;
  paidAt: string | null;
  amountClaimed: number;
  amountApproved: number | null;
  amountPaid: number | null;
  denialReason: string | null;
  preAuthNumber: string | null;
  preAuthLetter: string | null;
  attachments: string[];
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════ AUDIT ═══════════════════

export interface AuditLog {
  id: string;
  providerId: string | null;
  provider?: Provider;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

// ═══════════════════ API RESPONSE TYPES ═══════════════════

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  provider: Provider;
  practice: Practice;
}

export interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  monthlyRevenue: number;
  pendingClaims: number;
  upcomingAppointments: Appointment[];
  recentPatients: Patient[];
  revenueByMonth: { month: string; amount: number }[];
  appointmentsByType: { type: string; count: number }[];
}

export interface ScheduleFilters {
  providerId?: string;
  chairId?: string;
  date: string;
  view: "day" | "week" | "month";
}

export interface PatientSearchParams {
  query?: string;
  status?: PatientStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

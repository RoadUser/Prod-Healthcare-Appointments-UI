export type ErrorCode =
  | "OK"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "ACCESS_DENIED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "POLICY_VIOLATION"
  | "VALIDATION_FAILED"
  | "INTERNAL_ERROR";

export interface ContractError {
  code: ErrorCode | string;
  message: string;
  details?: unknown | null;
}

export interface ContractEvent<T = unknown> {
  type: string;
  data: T;
}

export type ContractResponse<T> =
  | { success: T; events?: ContractEvent[]; promiseId?: string }
  | { error: ContractError; promiseId?: string };

export type AppointmentStatus =
  | "BOOKED"
  | "CANCELLED_PATIENT"
  | "CANCELLED_DOCTOR"
  | "COMPLETED"
  | "NO_SHOW";

export interface Policy {
  cancellationWindowMinutes: number;
  rescheduleWindowMinutes: number;
  allowPatientNotes: boolean;
  overbookReasonCodes: string[];
}

export interface Clinic {
  id: string;
  name: string;
  active: boolean;
}

export interface DoctorAvailabilityRule {
  dayOfWeek: number; // 0..6 (UTC)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface DoctorExceptionDay {
  date: string; // YYYY-MM-DD
  available: boolean;
}

export interface DoctorBlackoutRange {
  startUtc: string; // ISO Z
  endUtc: string; // ISO Z
}

export interface Doctor {
  id: string;
  clinicId: string;
  displayName: string;
  specialty: string;
  timeZone: string;
  active: boolean;
  appointmentDurationsMinutes: number[];
  bufferMinutes: number;
  maxDailyAppointments: number;
  overbookingAllowed: boolean;
}

export interface DoctorDetail extends Doctor {
  availabilityRules: DoctorAvailabilityRule[];
  exceptionDays: DoctorExceptionDay[];
  blackoutRanges: DoctorBlackoutRange[];
}

export interface Patient {
  id: string; // pubkey hex
  displayName: string;
  timeZone: string;
  contactHash: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: AppointmentStatus;
  reasonCode: string;
  notesBlobRef: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface AppointmentSlot {
  doctorId: string;
  slotStartUtc: string;
  slotEndUtc: string;
  durationMinutes: number;
}

// Requests
export interface RegisterPatientInput {
  displayName: string;
  timeZone: string;
  contactHash: string;
  preferences?: unknown;
}

export interface ListClinicsInput {
  active?: boolean;
}

export interface CreateClinicInput {
  name: string;
}

export interface SetClinicActiveInput {
  clinicId: string;
  active: boolean;
}

export interface ListDoctorsInput {
  clinicId?: string;
  specialty?: string;
  active?: boolean;
}

export interface GetDoctorInput {
  doctorId: string;
}

export interface GetAvailabilityInput {
  doctorId: string;
  startDateUtc: string;
  endDateUtc: string;
}

export interface AddDoctorInput {
  clinicId: string;
  displayName: string;
  specialty: string;
  timeZone: string;
  appointmentDurationsMinutes: number[];
  bufferMinutes: number;
  maxDailyAppointments: number;
  overbookingAllowed: boolean;
}

export interface UpdateDoctorInput {
  doctorId: string;
  fields: {
    displayName?: string;
    specialty?: string;
    timeZone?: string;
    appointmentDurationsMinutes?: number[];
    bufferMinutes?: number;
    maxDailyAppointments?: number;
    overbookingAllowed?: boolean;
    ownerPubKeyHex?: string;
  };
}

export interface SetDoctorActiveInput {
  doctorId: string;
  active: boolean;
}

export interface SetDoctorAvailabilityInput {
  doctorId: string;
  availabilityRules: DoctorAvailabilityRule[];
  exceptionDays: DoctorExceptionDay[];
  blackoutRanges: DoctorBlackoutRange[];
}

export interface SetPolicyInput extends Policy {}

export interface BookAppointmentInput {
  doctorId: string;
  slotStartUtc: string;
  durationMinutes: number;
  reasonCode: string;
  notesBlobRef?: string;
}

export interface CancelAppointmentInput {
  appointmentId: string;
  reasonCode: string;
}

export interface RescheduleAppointmentInput {
  appointmentId: string;
  newSlotStartUtc: string;
}

export interface ListAppointmentsByPatientInput {
  startDateUtc: string;
  endDateUtc: string;
  status?: string;
}

export interface ViewScheduleInput {
  doctorId: string;
  startDateUtc: string;
  endDateUtc: string;
  status?: string;
}

export interface BlockTimeInput {
  doctorId: string;
  startUtc: string;
  endUtc: string;
  reasonCode: string;
}

export interface CancelAppointmentByDoctorInput {
  doctorId: string;
  appointmentId: string;
  reasonCode: string;
}

export interface MarkAppointmentInput {
  doctorId: string;
  appointmentId: string;
}

export interface ListAppointmentsByDoctorInput {
  doctorId: string;
  startDateUtc: string;
  endDateUtc: string;
  status?: string;
}

export interface GetAppointmentInput {
  appointmentId: string;
}

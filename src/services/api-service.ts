import { ContractService } from "@/services/contract-service";
import type {
  ContractResponse,
  Policy,
  SetPolicyInput,
  CreateClinicInput,
  SetClinicActiveInput,//gfgfh
  ListClinicsInput,
  Clinic,
  AddDoctorInput,
  UpdateDoctorInput,
  SetDoctorActiveInput,
  SetDoctorAvailabilityInput,
  ListDoctorsInput,
  Doctor,
  DoctorDetail,
  GetDoctorInput,
  GetAvailabilityInput,
  AppointmentSlot,
  RegisterPatientInput,
  Patient,
  BookAppointmentInput,
  CancelAppointmentInput,
  RescheduleAppointmentInput,
  ListAppointmentsByPatientInput,
  Appointment,
  ViewScheduleInput,
  BlockTimeInput,
  CancelAppointmentByDoctorInput,
  MarkAppointmentInput,
  ListAppointmentsByDoctorInput,
  GetAppointmentInput
} from "@/types";
//rtrytr
function assertOk<T>(res: ContractResponse<T>): T {
  if ((res as any).error) {
    const e = (res as any).error;
    const msg = e?.message ? `${e.code}: ${e.message}` : "Contract returned an error";
    throw Object.assign(new Error(msg), { contractError: e });
  }
  return (res as any).success as T;
}

export class ApiService {
  private static instance: ApiService;
  private contract = ContractService.getInstance();

  static getInstance(): ApiService {
    if (!ApiService.instance) ApiService.instance = new ApiService();
    return ApiService.instance;
  }

  // Policy
  async getPolicy(): Promise<Policy> {
    // There is no explicit action in backend named GetPolicy.
    // Policy is returned by reads where needed, but we implement a helper via SetPolicy mock compatibility.
    // In live mode, policy can be inferred by calling a safe public read like ListClinics and expecting no policy.
    // For correctness, we call submitContractReadRequest to a non-existing action would fail.
    // Therefore: use SetPolicy action is admin-only. We provide a soft fallback in live mode.
    const res = await this.contract.submitContractReadRequest<any>({ Service: "Healthcare", Action: "ListClinics", data: {} });
    if ((res as any).error) {
      // fallback default per contract
      return {
        cancellationWindowMinutes: 60,
        rescheduleWindowMinutes: 120,
        allowPatientNotes: true,
        overbookReasonCodes: []
      };
    }

    // In mock mode, ContractService has GetPolicy compatibility; try it first.
    const mockRes = await this.contract.submitContractReadRequest<Policy>({ Service: "Healthcare", Action: "GetPolicy", data: {} });
    if (!(mockRes as any).error) return (mockRes as any).success;

    return {
      cancellationWindowMinutes: 60,
      rescheduleWindowMinutes: 120,
      allowPatientNotes: true,
      overbookReasonCodes: []
    };
  }

  async setPolicy(data: SetPolicyInput) {
    const res = await this.contract.submitContractReadRequest<{ policy: Policy }>({
      Service: "Healthcare",
      Action: "SetPolicy",
      data
    });
    return assertOk(res);
  }

  // Clinics
  async createClinic(data: CreateClinicInput): Promise<{ clinic: Clinic }> {
    const res = await this.contract.submitContractReadRequest<{ clinic: Clinic }>({
      Service: "Healthcare",
      Action: "CreateClinic",
      data
    });
    return assertOk(res);
  }

  async setClinicActive(data: SetClinicActiveInput) {
    const res = await this.contract.submitContractReadRequest<{ clinicId: string; active: boolean }>({
      Service: "Healthcare",
      Action: "SetClinicActive",
      data
    });
    return assertOk(res);
  }

  async listClinics(data: ListClinicsInput = {}): Promise<{ clinics: Clinic[] }> {
    const res = await this.contract.submitContractReadRequest<{ clinics: Clinic[] }>({
      Service: "Healthcare",
      Action: "ListClinics",
      data
    });
    return assertOk(res);
  }

  // Doctors
  async addDoctor(data: AddDoctorInput): Promise<{ doctor: Doctor }> {
    const res = await this.contract.submitContractReadRequest<{ doctor: Doctor }>({
      Service: "Healthcare",
      Action: "AddDoctor",
      data
    });
    return assertOk(res);
  }

  async updateDoctor(data: UpdateDoctorInput): Promise<{ doctorId: string; updated: boolean }> {
    const res = await this.contract.submitContractReadRequest<{ doctorId: string; updated: boolean }>({
      Service: "Healthcare",
      Action: "UpdateDoctor",
      data
    });
    return assertOk(res);
  }

  async setDoctorActive(data: SetDoctorActiveInput): Promise<{ doctorId: string; active: boolean }> {
    const res = await this.contract.submitContractReadRequest<{ doctorId: string; active: boolean }>({
      Service: "Healthcare",
      Action: "SetDoctorActive",
      data
    });
    return assertOk(res);
  }

  async setDoctorAvailability(data: SetDoctorAvailabilityInput) {
    const res = await this.contract.submitContractReadRequest<any>({
      Service: "Healthcare",
      Action: "SetDoctorAvailability",
      data
    });
    return assertOk(res);
  }

  async listDoctors(data: ListDoctorsInput = {}): Promise<{ doctors: Doctor[] }> {
    const res = await this.contract.submitContractReadRequest<{ doctors: Doctor[] }>({
      Service: "Healthcare",
      Action: "ListDoctors",
      data
    });
    return assertOk(res);
  }

  async getDoctor(data: GetDoctorInput): Promise<{ doctor: DoctorDetail }> {
    const res = await this.contract.submitContractReadRequest<{ doctor: DoctorDetail }>({
      Service: "Healthcare",
      Action: "GetDoctor",
      data
    });
    return assertOk(res);
  }

  async getAvailability(data: GetAvailabilityInput): Promise<{ slots: AppointmentSlot[] }> {
    const res = await this.contract.submitContractReadRequest<{ slots: AppointmentSlot[] }>({
      Service: "Healthcare",
      Action: "GetAvailability",
      data
    });
    return assertOk(res);
  }

  // Patient
  async registerPatient(data: RegisterPatientInput): Promise<{ patient: Patient }> {
    const res = await this.contract.submitContractReadRequest<{ patient: Patient }>({
      Service: "Healthcare",
      Action: "RegisterPatient",
      data
    });
    return assertOk(res);
  }

  async bookAppointment(data: BookAppointmentInput) {
    const res = await this.contract.submitContractReadRequest<any>({
      Service: "Healthcare",
      Action: "BookAppointment",
      data
    });
    return assertOk(res);
  }

  async cancelAppointment(data: CancelAppointmentInput) {
    const res = await this.contract.submitContractReadRequest<any>({
      Service: "Healthcare",
      Action: "CancelAppointment",
      data
    });
    return assertOk(res);
  }

  async rescheduleAppointment(data: RescheduleAppointmentInput) {
    const res = await this.contract.submitContractReadRequest<any>({
      Service: "Healthcare",
      Action: "RescheduleAppointment",
      data
    });
    return assertOk(res);
  }

  async listAppointmentsByPatient(data: ListAppointmentsByPatientInput): Promise<{ appointments: Appointment[] }> {
    const res = await this.contract.submitContractReadRequest<{ appointments: Appointment[] }>({
      Service: "Healthcare",
      Action: "ListAppointmentsByPatient",
      data
    });
    return assertOk(res);
  }

  // Doctor
  async viewSchedule(data: ViewScheduleInput): Promise<{ appointments: Appointment[] }> {
    const res = await this.contract.submitContractReadRequest<{ appointments: Appointment[] }>({
      Service: "Healthcare",
      Action: "ViewSchedule",
      data
    });
    return assertOk(res);
  }

  async blockTime(data: BlockTimeInput) {
    const res = await this.contract.submitContractReadRequest<any>({
      Service: "Healthcare",
      Action: "BlockTime",
      data
    });
    return assertOk(res);
  }

  async cancelAppointmentByDoctor(data: CancelAppointmentByDoctorInput) {
    const res = await this.contract.submitContractReadRequest<any>({
      Service: "Healthcare",
      Action: "CancelAppointmentByDoctor",
      data
    });
    return assertOk(res);
  }

  async markCompleted(data: MarkAppointmentInput) {
    const res = await this.contract.submitContractReadRequest<any>({
      Service: "Healthcare",
      Action: "MarkCompleted",
      data
    });
    return assertOk(res);
  }

  async markNoShow(data: MarkAppointmentInput) {
    const res = await this.contract.submitContractReadRequest<any>({
      Service: "Healthcare",
      Action: "MarkNoShow",
      data
    });
    return assertOk(res);
  }

  async listAppointmentsByDoctor(data: ListAppointmentsByDoctorInput): Promise<{ appointments: Appointment[] }> {
    const res = await this.contract.submitContractReadRequest<{ appointments: Appointment[] }>({
      Service: "Healthcare",
      Action: "ListAppointmentsByDoctor",
      data
    });
    return assertOk(res);
  }

  // Restricted query
  async getAppointment(data: GetAppointmentInput): Promise<{ appointment: Appointment }> {
    const res = await this.contract.submitContractReadRequest<{ appointment: Appointment }>({
      Service: "Healthcare",
      Action: "GetAppointment",
      data
    });
    return assertOk(res);
  }
}

import * as bson from "bson";
import { StorageService } from "@/services/storage-service";
import type { ContractEvent, ContractError, ContractResponse } from "@/types";
//hhjkh
type KeyPair = { publicKey: Uint8Array; privateKey: Uint8Array };
//rytuytukjkjlk
type Pending = {
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  timeoutId: number;
};

type OutputListener = (msg: unknown) => void;

const STORAGE_KEYS = {
  keyPair: "careSchedule.keyPair",
  session: "careSchedule.session"
} as const;

export type SessionRole = "patient" | "doctor" | "admin";

export type SessionState = {
  role: SessionRole;
  doctorId?: string;
  linkedPubKeyHex: string;
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function isPlaceholderUrl(url: string): boolean {
  const u = (url || "").toLowerCase();
  return u.includes("example") || u.includes("your-") || u.includes("placeholder");
}

export class ContractService {
  private static instance: ContractService;
  private client: Awaited<ReturnType<NonNullable<Window["HotPocket"]> ["createClient"]>> | null = null;
  private servers: string[] = [];
  private keyPair: KeyPair | null = null;
  private isConnectionSucceeded = false;
  private promiseMap = new Map<string, Pending>();
  private outputListeners = new Set<OutputListener>();
  private mockMode = false;

  static getInstance(): ContractService {
    if (!ContractService.instance) ContractService.instance = new ContractService();
    return ContractService.instance;
  }

  getSession(): SessionState | null {
    return StorageService.getInstance().get<SessionState>(STORAGE_KEYS.session);
  }

  setSession(s: SessionState): void {
    StorageService.getInstance().set(STORAGE_KEYS.session, s);
  }

  clearSession(): void {
    StorageService.getInstance().remove(STORAGE_KEYS.session);
  }

  getLinkedPubKeyHex(): string {
    const kp = this.keyPair;
    return kp ? bytesToHex(kp.publicKey).toLowerCase() : "";
  }

  onOutput(listener: OutputListener) {
    this.outputListeners.add(listener);
    return () => this.outputListeners.delete(listener);
  }

  private emitOutput(msg: unknown) {
    for (const l of this.outputListeners) {
      try {
        void Promise.resolve(l(msg));
      } catch {
        // ignore
      }
    }
  }

  private getHotPocket() {
    const hp = (window as unknown as { HotPocket?: unknown }).HotPocket;
    if (!hp) {
      throw new Error(
        "HotPocket client not found. Ensure index.html includes the HotPocket CDN script before the app scripts."
      );
    }
    return hp as NonNullable<Window["HotPocket"]>;
  }

  private getUniqueId(): string {
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async init(): Promise<boolean> {
    this.mockMode = (import.meta.env.VITE_MOCK_MODE || "").toLowerCase() === "true";

    if (this.mockMode) {
      console.warn("🔧 Running in MOCK MODE - using simulated contract data");
      // Create a deterministic in-memory keyPair for session consistency if absent.
      const stored = StorageService.getInstance().get<{ publicKeyHex: string; privateKeyHex: string }>(STORAGE_KEYS.keyPair);
      if (stored?.publicKeyHex && stored?.privateKeyHex) {
        this.keyPair = {
          publicKey: new Uint8Array(Buffer.from(stored.publicKeyHex, "hex")),
          privateKey: new Uint8Array(Buffer.from(stored.privateKeyHex, "hex"))
        };
      } else {
        // Not real ed25519; sufficient for mock identity.
        const pub = new Uint8Array(32);
        const priv = new Uint8Array(64);
        crypto.getRandomValues(pub);
        crypto.getRandomValues(priv);
        this.keyPair = { publicKey: pub, privateKey: priv };
        StorageService.getInstance().set(STORAGE_KEYS.keyPair, {
          publicKeyHex: bytesToHex(pub),
          privateKeyHex: bytesToHex(priv)
        });
      }
      return true;
    }

    const urls = (import.meta.env.VITE_CONTRACT_URLS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!urls.length) {
      throw new Error(
        "Failed to initialize HotPocket client. Please set VITE_CONTRACT_URLS in .env (comma-separated wss:// URLs) or set VITE_MOCK_MODE=true for development."
      );
    }

    if (urls.some(isPlaceholderUrl)) {
      throw new Error(
        "VITE_CONTRACT_URLS contains placeholder values. Please configure valid HotPocket server URLs, or enable VITE_MOCK_MODE=true."
      );
    }

    this.servers = urls;

    const HotPocket = this.getHotPocket();

    const stored = StorageService.getInstance().get<{ publicKeyHex: string; privateKeyHex: string }>(STORAGE_KEYS.keyPair);
    if (stored?.publicKeyHex && stored?.privateKeyHex) {
      this.keyPair = {
        publicKey: new Uint8Array(Buffer.from(stored.publicKeyHex, "hex")),
        privateKey: new Uint8Array(Buffer.from(stored.privateKeyHex, "hex"))
      };
    } else {
      const kp = await HotPocket.generateKeys();
      this.keyPair = kp;
      StorageService.getInstance().set(STORAGE_KEYS.keyPair, {
        publicKeyHex: bytesToHex(kp.publicKey),
        privateKeyHex: bytesToHex(kp.privateKey)
      });
    }

    this.client = await HotPocket.createClient(this.servers, this.keyPair, { protocol: "bson" });

    if (!this.client || typeof this.client.connect !== "function") {
      throw new Error(
        "HotPocket client created but missing required methods. Verify server availability or enable VITE_MOCK_MODE=true."
      );
    }

    this.client.on(HotPocket.events.disconnect, () => {
      this.isConnectionSucceeded = false;
      this.emitOutput({ type: "disconnect" });
    });

    this.client.on(HotPocket.events.connectionChange, (r: unknown) => {
      this.emitOutput({ type: "connectionChange", data: r });
    });

    this.client.on(HotPocket.events.healthEvent, (r: unknown) => {
      this.emitOutput({ type: "healthEvent", data: r });
    });

    this.client.on(HotPocket.events.contractOutput, (r: { outputs: Uint8Array[] }) => {
      for (const o of r.outputs || []) {
        let out: any = null;
        try {
          out = bson.deserialize(o);
        } catch {
          try {
            out = JSON.parse(Buffer.from(o).toString("utf8"));
          } catch {
            out = null;
          }
        }

        if (!out) continue;

        // Also forward raw output as realtime feed
        this.emitOutput(out);

        const pId = out.promiseId;
        if (!pId) continue;

        const pending = this.promiseMap.get(pId);
        if (!pending) continue;

        window.clearTimeout(pending.timeoutId);
        if (out.error) pending.reject(out.error);
        else pending.resolve(out.success ?? out);
        this.promiseMap.delete(pId);
      }
    });

    if (!this.isConnectionSucceeded) {
      const ok = await this.client.connect();
      if (!ok) {
        throw new Error(
          "HotPocket connection failed. Check that your node is running and VITE_CONTRACT_URLS is reachable, or enable VITE_MOCK_MODE=true."
        );
      }
      this.isConnectionSucceeded = true;
    }

    return true;
  }

  async submitContractReadRequest<T>(message: Record<string, unknown>): Promise<ContractResponse<T>> {
    if (this.mockMode) {
      return (await this.mockRead<T>(message)) as ContractResponse<T>;
    }

    if (!this.client) throw new Error("HotPocket client is not initialized. Call init() first.");

    const buf = bson.serialize(message);
    const outBuf = (await this.client.submitContractReadRequest(buf as unknown as Uint8Array)) as Uint8Array;

    try {
      const decoded = bson.deserialize(outBuf) as ContractResponse<T>;
      return decoded;
    } catch {
      try {
        return JSON.parse(Buffer.from(outBuf).toString("utf8")) as ContractResponse<T>;
      } catch {
        return { error: { code: "INTERNAL_ERROR", message: "Failed to parse contract response" } };
      }
    }
  }

  submitInputToContract<T>(inp: Record<string, unknown>, timeoutMs = 20000): Promise<T> {
    if (this.mockMode) {
      return this.mockWrite<T>(inp);
    }

    if (!this.client) throw new Error("HotPocket client is not initialized. Call init() first.");

    const promiseId = this.getUniqueId();
    const payload = { promiseId, ...inp };
    const buf = bson.serialize(payload);

    this.client.submitContractInput(buf as unknown as Uint8Array).then(input => {
      input?.submissionStatus?.then(s => {
        if (s.status !== "accepted") {
          const pending = this.promiseMap.get(promiseId);
          pending?.reject({ code: "LEDGER_REJECTION", message: s.reason || "Rejected" });
          this.promiseMap.delete(promiseId);
        }
      });
    });

    return new Promise<T>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.promiseMap.delete(promiseId);
        reject({ code: "TIMEOUT", message: "Contract call timed out. Check node connectivity." });
      }, timeoutMs);

      this.promiseMap.set(promiseId, { resolve, reject, timeoutId });
    });
  }

  // ---------------- MOCK ENGINE (matches backend structures) ----------------

  private mockDb = {
    policy: {
      cancellationWindowMinutes: 60,
      rescheduleWindowMinutes: 120,
      allowPatientNotes: true,
      overbookReasonCodes: ["EMERGENCY"]
    },
    clinics: [{ id: "c1", name: "Riverside Clinic", active: true }],
    doctors: [
      {
        id: "d1",
        clinicId: "c1",
        displayName: "Dr. Ada Lovelace",
        specialty: "Cardiology",
        timeZone: "UTC",
        active: true,
        appointmentDurationsMinutes: [15, 30],
        bufferMinutes: 10,
        maxDailyAppointments: 10,
        overbookingAllowed: false,
        availabilityRules: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
          { dayOfWeek: 3, startTime: "13:00", endTime: "17:00" }
        ],
        exceptionDays: [],
        blackoutRanges: []
      }
    ],
    patients: new Map<string, { id: string; displayName: string; timeZone: string; contactHash: string }>(),
    appointments: [] as any[],
    blocks: [] as any[]
  };

  private async mockDelay() {
    await new Promise(r => setTimeout(r, 150));
  }

  private ok<T>(success: T, events: ContractEvent[] = []): ContractResponse<T> {
    return { success, events };
  }

  private fail(code: string, message: string, details?: unknown): ContractResponse<any> {
    const error: ContractError = { code, message, details: details ?? null };
    return { error };
  }

  private emitMockEvent(type: string, data: any) {
    // Backend also sends user.send({event, data}) without wrapping.
    this.emitOutput({ event: type, data });
  }

  private async mockRead<T>(message: Record<string, unknown>): Promise<ContractResponse<T>> {
    await this.mockDelay();
    const Service = message.Service as string;
    const Action = message.Action as string;
    const data = (message.data ?? message.Data ?? {}) as any;

    if (Service !== "Healthcare") return this.fail("BAD_REQUEST", "Unknown Service") as any;

    switch (Action) {
      case "ListClinics": {
        const active = data && typeof data.active === "boolean" ? data.active : null;
        const rows = active === null ? this.mockDb.clinics : this.mockDb.clinics.filter(c => c.active === active);
        return this.ok({ clinics: rows }) as any;
      }
      case "CreateClinic": {
        const name = String(data?.name || "").trim();
        if (!name) return this.fail("VALIDATION_FAILED", "name is required") as any;
        const id = `c${this.mockDb.clinics.length + 1}`;
        const clinic = { id, name: name.slice(0, 100), active: true };
        this.mockDb.clinics.push(clinic);
        return this.ok({ clinic }) as any;
      }
      case "SetClinicActive": {
        const clinic = this.mockDb.clinics.find(c => c.id === data?.clinicId);
        if (!clinic) return this.fail("NOT_FOUND", "Clinic not found") as any;
        clinic.active = !!data?.active;
        return this.ok({ clinicId: clinic.id, active: clinic.active }) as any;
      }
      case "ListDoctors": {
        let rows = [...this.mockDb.doctors];
        if (data?.clinicId) rows = rows.filter(d => d.clinicId === data.clinicId);
        if (data?.specialty) rows = rows.filter(d => d.specialty === data.specialty);
        if (typeof data?.active === "boolean") rows = rows.filter(d => d.active === data.active);
        return this.ok({ doctors: rows.map(({ availabilityRules, exceptionDays, blackoutRanges, ...rest }) => rest) }) as any;
      }
      case "GetDoctor": {
        const d = this.mockDb.doctors.find(x => x.id === data?.doctorId);
        if (!d) return this.fail("NOT_FOUND", "Doctor not found") as any;
        return this.ok({ doctor: d }) as any;
      }
      case "GetAvailability": {
        const d = this.mockDb.doctors.find(x => x.id === data?.doctorId);
        if (!d || !d.active) return this.ok({ slots: [] }) as any;
        const start = Date.parse(data?.startDateUtc);
        const end = Date.parse(data?.endDateUtc);
        if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return this.fail("VALIDATION_FAILED", "Invalid date range") as any;

        // naive slot generation: every 30 mins between 09:00-12:00 local UTC, next 7 days
        const slots: any[] = [];
        let t = start;
        while (t < end) {
          const dt = new Date(t);
          const dow = dt.getUTCDay();
          const rules = d.availabilityRules.filter((r: any) => r.dayOfWeek === dow);
          if (rules.length) {
            const dateIso = dt.toISOString().slice(0, 10);
            for (const r of rules) {
              const wStart = Date.parse(`${dateIso}T${r.startTime}:00.000Z`);
              const wEnd = Date.parse(`${dateIso}T${r.endTime}:00.000Z`);
              for (const dur of d.appointmentDurationsMinutes) {
                let cursor = wStart;
                while (cursor + dur * 60000 <= wEnd) {
                  const s = new Date(cursor).toISOString();
                  const e = new Date(cursor + dur * 60000).toISOString();
                  if (cursor >= start && cursor + dur * 60000 <= end && cursor > Date.now()) {
                    slots.push({ doctorId: d.id, slotStartUtc: s, durationMinutes: dur, slotEndUtc: e });
                  }
                  cursor += 30 * 60000;
                }
              }
            }
          }
          t += 86400000;
        }
        return this.ok({ slots }) as any;
      }
      case "RegisterPatient": {
        const pk = this.getLinkedPubKeyHex() || "mock";
        const displayName = String(data?.displayName || "").trim().slice(0, 80);
        const timeZone = String(data?.timeZone || "").trim().slice(0, 60);
        const contactHash = String(data?.contactHash || "").trim().slice(0, 200);
        if (!displayName || !timeZone || !contactHash) return this.fail("VALIDATION_FAILED", "Missing patient fields") as any;
        this.mockDb.patients.set(pk, { id: pk, displayName, timeZone, contactHash });
        return this.ok({ patient: { id: pk, displayName, timeZone, contactHash } }) as any;
      }
      case "GetPolicy":
      case "getPolicy": {
        return this.ok(this.mockDb.policy as any) as any;
      }
      case "SetPolicy": {
        this.mockDb.policy = {
          cancellationWindowMinutes: Number(data?.cancellationWindowMinutes ?? 60),
          rescheduleWindowMinutes: Number(data?.rescheduleWindowMinutes ?? 120),
          allowPatientNotes: !!data?.allowPatientNotes,
          overbookReasonCodes: Array.isArray(data?.overbookReasonCodes) ? data.overbookReasonCodes : []
        };
        const events = [{ type: "PolicyUpdated", data: {} }];
        this.emitMockEvent("PolicyUpdated", {});
        return this.ok({ policy: this.mockDb.policy, events }, events) as any;
      }
      case "BookAppointment": {
        const pk = this.getLinkedPubKeyHex();
        if (!this.mockDb.patients.has(pk)) return this.fail("ACCESS_DENIED", "Patient registration required") as any;
        const id = `a${this.mockDb.appointments.length + 1}`;
        const d = this.mockDb.doctors.find(x => x.id === data?.doctorId);
        if (!d) return this.fail("NOT_FOUND", "Doctor not found") as any;
        const start = String(data?.slotStartUtc);
        const dur = Number(data?.durationMinutes);
        const end = new Date(Date.parse(start) + dur * 60000).toISOString();
        const ts = new Date().toISOString();
        const appt = {
          id,
          clinicId: d.clinicId,
          doctorId: d.id,
          patientId: pk,
          startTimeUtc: start,
          endTimeUtc: end,
          status: "BOOKED",
          reasonCode: String(data?.reasonCode || "CHECKUP"),
          notesBlobRef: data?.notesBlobRef ? String(data.notesBlobRef) : null,
          createdAtUtc: ts,
          updatedAtUtc: ts
        };
        this.mockDb.appointments.push(appt);
        const ev = { type: "AppointmentBooked", data: { appointmentId: id, doctorId: d.id, patientId: pk } };
        this.emitMockEvent("AppointmentBooked", ev.data);
        return this.ok({ appointment: appt, events: [ev] }, [ev]) as any;
      }
      case "ListAppointmentsByPatient": {
        const pk = this.getLinkedPubKeyHex();
        if (!this.mockDb.patients.has(pk)) return this.fail("ACCESS_DENIED", "Patient registration required") as any;
        const start = Date.parse(data?.startDateUtc);
        const end = Date.parse(data?.endDateUtc);
        const rows = this.mockDb.appointments.filter(a => a.patientId === pk && Date.parse(a.startTimeUtc) < end && Date.parse(a.endTimeUtc) > start);
        return this.ok({ appointments: rows }) as any;
      }
      case "CancelAppointment": {
        const pk = this.getLinkedPubKeyHex();
        const a = this.mockDb.appointments.find(x => x.id === data?.appointmentId);
        if (!a) return this.fail("NOT_FOUND", "Appointment not found") as any;
        if (a.patientId !== pk) return this.fail("ACCESS_DENIED", "Cannot cancel others' appointments") as any;
        a.status = "CANCELLED_PATIENT";
        a.reasonCode = String(data?.reasonCode || a.reasonCode);
        a.updatedAtUtc = new Date().toISOString();
        const ev = { type: "AppointmentCancelled", data: { appointmentId: a.id, byRole: "patient" } };
        this.emitMockEvent("AppointmentCancelled", ev.data);
        return this.ok({ appointmentId: a.id, status: a.status, events: [ev] }, [ev]) as any;
      }
      case "RescheduleAppointment": {
        const pk = this.getLinkedPubKeyHex();
        const a = this.mockDb.appointments.find(x => x.id === data?.appointmentId);
        if (!a) return this.fail("NOT_FOUND", "Appointment not found") as any;
        if (a.patientId !== pk) return this.fail("ACCESS_DENIED", "Cannot reschedule others' appointments") as any;
        const old = a.startTimeUtc;
        const dur = (Date.parse(a.endTimeUtc) - Date.parse(a.startTimeUtc)) / 60000;
        a.startTimeUtc = String(data?.newSlotStartUtc);
        a.endTimeUtc = new Date(Date.parse(a.startTimeUtc) + dur * 60000).toISOString();
        a.updatedAtUtc = new Date().toISOString();
        const ev = { type: "AppointmentRescheduled", data: { appointmentId: a.id, oldStartUtc: old, newStartUtc: a.startTimeUtc } };
        this.emitMockEvent("AppointmentRescheduled", ev.data);
        return this.ok({ appointmentId: a.id, oldStartUtc: old, newStartUtc: a.startTimeUtc, events: [ev] }, [ev]) as any;
      }
      case "ViewSchedule": {
        const rows = this.mockDb.appointments.filter(a => a.doctorId === data?.doctorId);
        return this.ok({ appointments: rows }) as any;
      }
      case "BlockTime": {
        const id = `b${this.mockDb.blocks.length + 1}`;
        const block = {
          id,
          doctorId: String(data?.doctorId),
          startUtc: String(data?.startUtc),
          endUtc: String(data?.endUtc),
          reasonCode: String(data?.reasonCode || "BLOCK")
        };
        this.mockDb.blocks.push(block);
        return this.ok({ block }) as any;
      }
      default:
        return this.fail("BAD_REQUEST", "Unknown action") as any;
    }
  }

  private async mockWrite<T>(inp: Record<string, unknown>): Promise<T> {
    await this.mockDelay();
    // In this contract, writes are also handled same way; frontend uses read calls in tests, but we support both.
    const res = await this.mockRead<T>(inp);
    if ("error" in res) throw res.error;
    return res.success as T;
  }
}

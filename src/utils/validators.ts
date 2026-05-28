export function requireString(v: unknown, field: string, maxLen?: number): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(`${field} is required`);
  const s = v.trim();
  if (maxLen && s.length > maxLen) throw new Error(`${field} too long (max ${maxLen})`);
  return s;
}

export function requireBoolean(v: unknown, field: string): boolean {
  if (typeof v !== "boolean") throw new Error(`${field} must be boolean`);
  return v;
}

export function requireInt(v: unknown, field: string, min?: number, max?: number): number {
  if (!Number.isInteger(v)) throw new Error(`${field} must be an integer`);
  const n = v as number;
  if (min !== undefined && n < min) throw new Error(`${field} must be >= ${min}`);
  if (max !== undefined && n > max) throw new Error(`${field} must be <= ${max}`);
  return n;
}

export function requireUtcIso(v: unknown, field: string): string {
  const s = requireString(v, field, 40);
  const t = Date.parse(s);
  if (Number.isNaN(t)) throw new Error(`${field} must be an ISO timestamp`);
  if (!s.endsWith("Z")) throw new Error(`${field} must be UTC (end with Z)`);
  return s;
}

export function requireDateIso(v: unknown, field: string): string {
  const s = requireString(v, field, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`${field} must be YYYY-MM-DD`);
  return s;
}

export function requireTimeHHMM(v: unknown, field: string): string {
  const s = requireString(v, field, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s)) throw new Error(`${field} must be HH:MM`);
  return s;
}

export function sanitizeReasonCode(v: unknown): string {
  const s = requireString(v, "reasonCode", 32);
  if (!/^[A-Za-z0-9_\-\.]{1,32}$/.test(s)) throw new Error("reasonCode contains invalid characters");
  return s;
}

export function toUtcIsoFromLocalDateTimeInput(local: string): string {
  // local format from <input type="datetime-local"> => "YYYY-MM-DDTHH:mm"
  // Interpret as local time, convert to UTC ISO Z.
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid local datetime");
  return d.toISOString();
}

export function toLocalDateTimeInputFromUtcIso(utcIso: string): string {
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function formatLocal(utcIso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return utcIso;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...opts
  }).format(d);
}

export function startOfLocalDayToUtcIso(date: Date): string {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  return local.toISOString();
}

export function addDaysUtcIso(utcIso: string, days: number): string {
  const t = Date.parse(utcIso);
  return new Date(t + days * 86400000).toISOString();
}

export function isPastUtc(utcIso: string): boolean {
  const t = Date.parse(utcIso);
  return t < Date.now();
}

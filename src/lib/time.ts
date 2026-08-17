export function isValidTime(t: string | null | undefined): boolean {
  if (!t) return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t.trim());
}

export function slotLabel(time: string | null | undefined, slotMinutes: number): string {
  if (!isValidTime(time)) return "—";
  const [h, m] = time!.split(":").map(Number);
  const total = h * 60 + m;
  const width = slotMinutes || 30;
  const start = Math.floor(total / width) * width;
  const end = start + width;
  const fmt = (mins: number) => {
    const hh = Math.floor(mins / 60) % 24;
    const mm = mins % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  return `${fmt(start)}–${fmt(end)}`;
}

export function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Converte un valore orario di Excel (numero decimale, frazione di giorno) in HH:MM. */
export function excelTimeToHHMM(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const totalMin = Math.round(parseFloat(trimmed) * 24 * 60);
    const hh = Math.floor(totalMin / 60) % 24;
    const mm = totalMin % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  return trimmed;
}

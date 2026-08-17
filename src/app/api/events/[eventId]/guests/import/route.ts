import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAdminSession } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isValidTime, excelTimeToHHMM } from "@/lib/time";
import { generateQrToken } from "@/lib/qrToken";
import type { ImportRowResult } from "@/lib/types";

function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/à/g, "a")
    .replace(/è/g, "e")
    .replace(/é/g, "e")
    .replace(/ì/g, "i")
    .replace(/ò/g, "o")
    .replace(/ù/g, "u");
}

/**
 * Modalità "preview" (default): legge il file, restituisce l'anteprima
 * con errori/duplicati SENZA scrivere nel database.
 * Modalità "confirm": riceve le righe già validate dal client e le
 * inserisce come nuovi invitati.
 */
export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const db = createAdminSupabaseClient();
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
    }

    let workbook: XLSX.WorkBook;
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      workbook = XLSX.read(buf, { type: "buffer" });
    } catch {
      return NextResponse.json({ error: "Impossibile leggere il file. Verifica che sia un .xlsx valido." }, { status: 400 });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (raw.length === 0) {
      return NextResponse.json({ error: "Il file sembra vuoto." }, { status: 400 });
    }

    const keys = Object.keys(raw[0]);
    const findKey = (candidates: string[]) => keys.find((k) => candidates.includes(normalizeHeader(k)));
    const kNome = findKey(["nome", "first name", "firstname"]);
    const kCognome = findKey(["cognome", "last name", "lastname", "surname"]);
    const kOrario = findKey(["orario", "ora", "time", "orario previsto", "arrivo"]);

    if (!kNome || !kCognome || !kOrario) {
      return NextResponse.json(
        { error: "Colonne non riconosciute. Il file deve contenere Nome, Cognome e Orario." },
        { status: 400 }
      );
    }

    const { data: existing } = await db.from("guests").select("first_name, last_name, expected_arrival").eq("event_id", params.eventId);
    const existingKeys = new Set(
      (existing || []).map((g) => `${g.first_name}|${g.last_name}|${g.expected_arrival}`.toLowerCase())
    );

    const seen = new Set<string>();
    const rows: ImportRowResult[] = raw.map((r, idx) => {
      const firstName = String(r[kNome] ?? "").trim();
      const lastName = String(r[kCognome] ?? "").trim();
      const time = excelTimeToHHMM(String(r[kOrario] ?? "").trim());
      const errors: string[] = [];
      if (!firstName) errors.push("nome mancante");
      if (!lastName) errors.push("cognome mancante");
      if (!isValidTime(time)) errors.push("orario non valido");
      const dupKey = `${firstName}|${lastName}|${time}`.toLowerCase();
      const isDuplicate = existingKeys.has(dupKey) || seen.has(dupKey);
      if (errors.length === 0) seen.add(dupKey);
      return { rowNum: idx + 2, firstName, lastName, time, errors, isDuplicate };
    });

    return NextResponse.json({ rows });
  }

  // --- modalità conferma: JSON con le righe valide da inserire ---
  const body = await req.json();
  const rows: Array<{ firstName: string; lastName: string; time: string }> = body.rows || [];
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Nessuna riga da importare." }, { status: 400 });
  }

  const toInsert = rows.map((r) => ({
    event_id: params.eventId,
    first_name: r.firstName,
    last_name: r.lastName,
    expected_arrival: r.time,
    registration_status: "not_registered" as const,
    qr_token: generateQrToken(),
    checked_in: false
  }));

  const { data, error } = await db.from("guests").insert(toInsert).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ imported: data.length });
}

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAdminSession } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const db = createAdminSupabaseClient();
  const { data: event } = await db.from("events").select("name").eq("id", params.eventId).maybeSingle();
  const { data: guests, error } = await db
    .from("guests")
    .select("*")
    .eq("event_id", params.eventId)
    .order("expected_arrival", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (guests || []).map((g) => ({
    Nome: g.first_name,
    Cognome: g.last_name,
    "Orario previsto": g.expected_arrival || "",
    Registrazione: g.registration_status === "registered" ? "Sì" : "No",
    "Check-in": g.checked_in ? "Sì" : "No",
    "Data check-in": g.check_in_timestamp ? new Date(g.check_in_timestamp).toLocaleDateString("it-IT") : "",
    "Ora check-in": g.check_in_time || ""
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Invitati");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const safeName = (event?.name || "evento").replace(/[^a-z0-9]+/gi, "_").toLowerCase();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="invitati_${safeName}.xlsx"`
    }
  });
}

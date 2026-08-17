import { randomBytes } from "crypto";

/**
 * Genera un token casuale e non prevedibile da associare al QR
 * dell'invitato. Non contiene nome, cognome né altri dati personali:
 * è solo un identificativo opaco collegato al record nel database.
 */
export function generateQrToken(): string {
  return randomBytes(18).toString("hex");
}

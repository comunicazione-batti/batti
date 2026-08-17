export type EventStatus = "active" | "closed";

export interface EventRecord {
  id: string;
  name: string;
  date: string | null;
  description: string | null;
  status: EventStatus;
  slot_minutes: number;
  created_at: string;
}

export type RegistrationStatus = "not_registered" | "registered";

export interface GuestRecord {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  expected_arrival: string | null;
  registration_status: RegistrationStatus;
  qr_token: string;
  checked_in: boolean;
  check_in_time: string | null;
  check_in_timestamp: string | null;
  operator: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestPublic {
  id: string;
  firstName: string;
  lastName: string;
  expectedArrival: string | null;
  registrationStatus: RegistrationStatus;
  qrToken: string;
}

export interface ImportRowResult {
  rowNum: number;
  firstName: string;
  lastName: string;
  time: string;
  errors: string[];
  isDuplicate: boolean;
}

export type ScanResultKind = "ok" | "used" | "bad";

export interface ScanResponse {
  kind: ScanResultKind;
  title: string;
  sub?: string;
  name?: string;
  expected?: string | null;
  actual?: string | null;
}

import { parsePhoneNumberFromString } from "libphonenumber-js";

/** Les numéros béninois ont 10 chiffres (préfixe 01) depuis le 30/11/2024 ; les anciens numéros à 8 chiffres sont convertis. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  let candidate = digits;
  if (!candidate.startsWith("+")) {
    if (/^\d{8}$/.test(candidate)) candidate = `+22901${candidate}`;
    else if (/^01\d{8}$/.test(candidate)) candidate = `+229${candidate}`;
    else if (/^229/.test(candidate)) candidate = `+${candidate}`;
    else candidate = `+${candidate}`;
  }
  const p = parsePhoneNumberFromString(candidate);
  return p?.isValid() ? p.number : null;
}


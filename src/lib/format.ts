import { COUNTRY_CODES } from './constants';
import type { Item } from '../types';

export function iso(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${day < 10 ? '0' : ''}${day}`;
}

export function parseDate(s: string): Date {
  return new Date(`${s}T12:00:00`);
}

export function fmtDate(s: string): string {
  return parseDate(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** True for any campus place whose name contains "classroom". Those need a room number. */
export function isClassroom(location: string): boolean {
  return /classroom/i.test(location);
}

export function placeLabel(it: Pick<Item, 'location' | 'classroom_no'>): string {
  return isClassroom(it.location) && it.classroom_no ? `${it.location} ${it.classroom_no}` : it.location;
}

/**
 * Builds an international number like +919876543210.
 * Typing a full number that starts with + always wins. Otherwise the country code from the dropdown is used.
 * Returns null if it does not look like a real number.
 */
export function toE164(input: string, cc = '+91'): string | null {
  const raw = input.trim();
  const digits = raw.replace(/[^\d]/g, '');
  if (raw.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (!cc) return null;
  if (cc === '+91') {
    if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
    return null;
  }
  const full = cc.replace('+', '') + digits.replace(/^0+/, '');
  return full.length >= 8 && full.length <= 15 ? `+${full}` : null;
}

export function showPhone(e164: string): string {
  return e164.startsWith('+91') && e164.length === 13 ? `+91 ${e164.slice(3, 8)} ${e164.slice(8)}` : e164;
}

export function waLink(e164: string): string {
  return `https://wa.me/${e164.replace('+', '')}`;
}

/** Splits +919876543210 into the dropdown value (+91) and the rest, for editing in the form. */
export function splitPhone(e164: string): { cc: string; national: string } {
  const known = COUNTRY_CODES.filter((c) => c.code).sort((a, b) => b.code.length - a.code.length);
  const hit = known.find((c) => e164.startsWith(c.code));
  return hit ? { cc: hit.code, national: e164.slice(hit.code.length) } : { cc: '+91', national: e164 };
}

/** Turns "Main gate, Canteen, Library" into a clean list. At most 30 places of up to 40 characters each. */
export function parsePlaces(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of text.split(/[,\n]/)) {
    const p = part.trim().slice(0, 40);
    const key = p.toLowerCase();
    if (p && !seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out.slice(0, 30);
}

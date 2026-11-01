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

export function placeLabel(it: Pick<Item, 'location' | 'classroom_no'>): string {
  return it.location === 'Classroom' ? `Classroom ${it.classroom_no ?? ''}`.trim() : it.location;
}

/** Turns 9876543210, 919876543210 or +919876543210 into +919876543210. Returns null if it is not a valid Indian mobile number. */
export function toE164(input: string): string | null {
  const digits = input.replace(/[^\d]/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  return null;
}

export function showPhone(e164: string): string {
  return e164.startsWith('+91') ? `+91 ${e164.slice(3, 8)} ${e164.slice(8)}` : e164;
}

export function waLink(e164: string): string {
  return `https://wa.me/${e164.replace('+', '')}`;
}

import type { Factor, Item, MatchResult } from '../types';
import { isClassroom, parseDate, placeLabel } from './format';

/** Starting weights. These are proposed values, not validated accuracy measurements. */
const STOP = new Set(['a', 'an', 'the', 'of', 'with', 'and', 'in', 'for', 'pair', 'my', 'small', 'big', 'new', 'old']);
const SYN: Record<string, string> = {
  earbuds: 'earbud', earphones: 'earbud', earphone: 'earbud', airpods: 'earbud', airpod: 'earbud', earpods: 'earbud', buds: 'earbud',
  headphones: 'earbud', headphone: 'earbud', spectacles: 'glasses', glasses: 'glasses', eyeglasses: 'glasses', specs: 'glasses',
  purse: 'wallet', flask: 'bottle', backpack: 'bag', rucksack: 'bag', satchel: 'bag', smartphone: 'phone', mobile: 'phone',
  cellphone: 'phone', keychain: 'key', keys: 'key', identity: 'id', hoody: 'hoodie',
};

function canon(w: string): string {
  if (SYN[w]) return SYN[w];
  const s = w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w;
  return SYN[s] || s;
}

function tokens(s: string): string[] {
  const out: string[] = [];
  s.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .forEach((w) => {
      if (!w || STOP.has(w)) return;
      const c = canon(w);
      if (!out.includes(c)) out.push(c);
    });
  return out;
}

function dice(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.length || !B.length) return 0;
  const n = A.filter((t) => B.includes(t)).length;
  return (2 * n) / (A.length + B.length);
}

export function compare(lost: Item, found: Item): { score: number; factors: Factor[] } {
  const f: Factor[] = [];

  const sName = dice(lost.name, found.name);
  f.push({ k: 'Item name', w: 25, s: sName, r: sName >= 0.75 ? 'Names describe the same thing.' : sName > 0 ? 'Names share some words.' : 'Names share no words.' });

  const sCat = lost.category === found.category ? 1 : 0;
  f.push({ k: 'Category', w: 15, s: sCat, r: sCat ? `Both are ${lost.category}.` : 'Different categories.' });

  const close = (lost.colour === 'Silver' && found.colour === 'Grey') || (lost.colour === 'Grey' && found.colour === 'Silver');
  const sCol = lost.colour === found.colour ? 1 : close ? 0.5 : 0;
  f.push({ k: 'Colour', w: 15, s: sCol, r: sCol === 1 ? `Both are ${lost.colour}.` : sCol ? 'Close shades.' : `Lost as ${lost.colour}, found as ${found.colour}.` });

  // Every college has different places, so location scoring only compares names. Same place scores full,
  // two rooms in the classroom area score well, any two different places on one campus still score a little.
  const la = placeLabel(lost);
  const fb = placeLabel(found);
  const samePlace = lost.location.trim().toLowerCase() === found.location.trim().toLowerCase();
  let sLoc = 0.3;
  let locReason = `${la} and ${fb} are different places on campus.`;
  if (samePlace) {
    const sameRoom = !isClassroom(lost.location) || (lost.classroom_no ?? '').trim().toLowerCase() === (found.classroom_no ?? '').trim().toLowerCase();
    sLoc = sameRoom ? 1 : 0.6;
    locReason = sameRoom ? `Same place: ${la}.` : `Both in the classroom area, but different rooms (${la} and ${fb}).`;
  }
  f.push({ k: 'Location', w: 20, s: sLoc, r: locReason });

  const dd = Math.round((parseDate(found.item_date).getTime() - parseDate(lost.item_date).getTime()) / 86400000);
  const sDate = dd < 0 ? 0 : Math.max(0, 1 - dd / 7);
  f.push({ k: 'Date', w: 15, s: sDate, r: dd < 0 ? 'Found before it was reported lost.' : dd === 0 ? 'Found the same day it was lost.' : `Found ${dd} day${dd > 1 ? 's' : ''} after it was lost.` });

  const lb = lost.brand.trim().toLowerCase();
  const fbr = found.brand.trim().toLowerCase();
  const sBr = lb && fbr ? (lb === fbr ? 1 : 0) : 0.5;
  f.push({ k: 'Brand', w: 10, s: sBr, r: lb && fbr ? (lb === fbr ? `Same brand: ${lost.brand}.` : 'Different brands.') : 'Brand unknown on one report, so it counts half.' });

  const score = f.reduce((sum, x) => sum + x.w * x.s, 0);
  return { score: Math.round(score), factors: f };
}

export function matchesFor(it: Item, all: Item[]): MatchResult[] {
  if (it.status !== 'active') return [];
  const out: MatchResult[] = [];
  for (const o of all) {
    if (o.id === it.id || o.type === it.type || o.status !== 'active') continue;
    const lost = it.type === 'lost' ? it : o;
    const found = it.type === 'found' ? it : o;
    const m = compare(lost, found);
    if (m.score >= 50) out.push({ other: o, score: m.score, factors: m.factors });
  }
  return out.sort((x, y) => y.score - x.score).slice(0, 3);
}

import { fmtDate, placeLabel } from '../lib/format';
import type { MatchResult } from '../types';

export default function MatchList({ matches, onOpen }: { matches: MatchResult[]; onOpen: (id: string) => void }) {
  if (!matches.length) return <p className="warn">No likely matches yet. Check back as new reports come in.</p>;
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {matches.map((m) => (
        <div className="match" key={m.other.id}>
          <div className="score">{m.score}<small>%</small></div>
          <div>
            <strong>{m.other.name}</strong>
            <span className={`pill ${m.other.type}`}>{m.other.type.toUpperCase()}</span>
            <p className="sub">{placeLabel(m.other)}, {fmtDate(m.other.item_date)}</p>
            <details>
              <summary>Why this matched</summary>
              <ul className="why">
                {m.factors.map((x) => (
                  <li key={x.k}>
                    <b style={{ textAlign: 'left' }}>{x.k}</b>
                    <span className="track"><i className={`fill ${x.s >= 0.7 ? '' : x.s >= 0.35 ? 'mid' : 'low'}`} style={{ width: `${Math.round(x.s * 100)}%` }} /></span>
                    <b>{Math.round(x.w * x.s)}/{x.w}</b>
                    <span className="r">{x.r}</span>
                  </li>
                ))}
              </ul>
            </details>
            <div className="mact">
              <button type="button" className="btn plain sm" onClick={() => onOpen(m.other.id)}>View item and contact</button>
            </div>
          </div>
        </div>
      ))}
      <p className="warn">A match score is a suggestion. Check the details before you meet or hand anything over.</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { isConfigured, supabase } from '../lib/supabase';
import type { College } from '../types';
import Modal from './Modal';

/** Searches colleges by name or city as the student types. Shows the first 30 matches. */
export function useCollegeSearch(q: string) {
  const [results, setResults] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConfigured) return;
    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(async () => {
      const clean = q.replace(/[%,()*]/g, ' ').trim();
      const base = supabase.from('colleges').select('*');
      const filtered = clean ? base.or(`name.ilike.%${clean}%,city.ilike.%${clean}%`) : base;
      const { data, error: err } = await filtered.order('name').limit(30);
      if (cancelled) return;
      setLoading(false);
      if (err) setError(err.message);
      else {
        setError('');
        setResults((data ?? []) as College[]);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  return { results, loading, error };
}

export function CollegeList({ results, loading, error, onPick }: { results: College[]; loading: boolean; error: string; onPick: (c: College) => void }) {
  if (error) return <p className="err" role="alert">{error}</p>;
  if (!loading && results.length === 0) return <p className="hint">No college found with that name. Try a different spelling or the city.</p>;
  return (
    <ul className="collist">
      {results.map((c) => (
        <li key={c.id}>
          <button type="button" className="colbtn" onClick={() => onPick(c)}>
            <b>{c.name}</b>
            <small>{c.city}, {c.country}</small>
          </button>
        </li>
      ))}
    </ul>
  );
}

function PickerBody() {
  const { closePicker, chooseCollege } = useCollege();
  const { openAuth } = useAuth();
  const [q, setQ] = useState('');
  const { results, loading, error } = useCollegeSearch(q);

  return (
    <>
      <div className="dhead">
        <h3 id="picker-title">Choose your college</h3>
        <button type="button" className="btn plain sm" onClick={closePicker}>Close</button>
      </div>
      <div className="dbody">
        <div>
          <label htmlFor="pick-q">Search by college name or city</label>
          <input id="pick-q" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sanghvi, Mumbai, IIT, Manchester" autoFocus />
        </div>
        <CollegeList results={results} loading={loading} error={error} onPick={chooseCollege} />
        <p className="hint">Each college has its own lost and found. Students only see reports from their own college once they log in.</p>
        <div>
          <button type="button" className="btn sm" onClick={() => { closePicker(); openAuth('signup'); }}>My college is not listed. Sign up to add it</button>
        </div>
      </div>
    </>
  );
}

export default function CollegePicker() {
  const { pickerOpen, closePicker } = useCollege();
  return (
    <Modal open={pickerOpen} onClose={closePicker} labelledBy="picker-title" narrow>
      <PickerBody />
    </Modal>
  );
}

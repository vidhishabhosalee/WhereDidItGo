import { useState } from 'react';
import { DEFAULT_PLACES } from '../lib/constants';
import { parsePlaces } from '../lib/format';
import type { CollegeChoice } from '../types';
import { CollegeList, useCollegeSearch } from './CollegePicker';

interface Props {
  value: CollegeChoice | null;
  onChange: (v: CollegeChoice | null) => void;
}

/** College chooser used on signup: search the list, or add a college that is not there yet. */
export default function CollegeField({ value, onChange }: Props) {
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [places, setPlaces] = useState(DEFAULT_PLACES.join(', '));
  const [error, setError] = useState('');
  const { results, loading, error: searchError } = useCollegeSearch(adding || value ? '' : q);

  if (value) {
    const label = value.kind === 'existing' ? `${value.college.name}, ${value.college.city}` : `${value.name.trim()}, ${value.city.trim()} (new college)`;
    return (
      <div>
        <span className="lbl">College</span>
        <div className="chosen">
          <b>{label}</b>
          <button type="button" className="btn plain sm" onClick={() => onChange(null)}>Change</button>
        </div>
      </div>
    );
  }

  if (adding) {
    const useNew = () => {
      if (name.trim().length < 3) return setError('Enter the full college name.');
      if (city.trim().length < 2) return setError('Enter the city.');
      if (!country.trim()) return setError('Enter the country.');
      if (parsePlaces(places).length < 2) return setError('List at least two campus places, separated by commas.');
      setError('');
      onChange({ kind: 'new', name, city, country, places });
    };
    return (
      <div className="addcollege">
        <span className="lbl">Add your college</span>
        <div>
          <label htmlFor="nc-name">College name</label>
          <input id="nc-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="nc-city">City</label>
            <input id="nc-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nc-country">Country</label>
            <input id="nc-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="nc-places">Places on your campus where things get lost</label>
          <textarea id="nc-places" value={places} onChange={(e) => setPlaces(e.target.value)} />
          <p className="hint">Separate with commas. Keep a place called Classroom if you want people to add a room number.</p>
        </div>
        {error && <p className="err" role="alert">{error}</p>}
        <div className="row">
          <button type="button" className="btn sm" onClick={useNew}>Use this college</button>
          <button type="button" className="btn plain sm" onClick={() => { setAdding(false); setError(''); }}>Back to search</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="col-q">College</label>
      <input id="col-q" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by college name or city" autoComplete="off" />
      <div style={{ marginTop: 10 }}>
        <CollegeList results={results} loading={loading} error={searchError} onPick={(c) => onChange({ kind: 'existing', college: c })} />
      </div>
      <button type="button" className="btn plain sm" style={{ marginTop: 10 }} onClick={() => { setAdding(true); setName(q.trim()); }}>My college is not listed</button>
    </div>
  );
}

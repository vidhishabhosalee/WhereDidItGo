import { useMemo } from 'react';
import { useCollege } from '../context/CollegeContext';
import { CATS, COLOURS, DEFAULT_PLACES } from '../lib/constants';
import type { Item } from '../types';
import ItemCard from './ItemCard';

export interface Filters {
  type: 'all' | 'lost' | 'found';
  cat: string;
  q: string;
  col: string;
  loc: string;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: Filters = { type: 'all', cat: '', q: '', col: '', loc: '', from: '', to: '' };

interface Props {
  items: Item[];
  loading: boolean;
  filters: Filters;
  onFilters: (f: Filters) => void;
  onOpen: (id: string) => void;
}

export default function Browse({ items, loading, filters, onFilters, onOpen }: Props) {
  const { college, openPicker } = useCollege();
  const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch });
  const places = college?.locations?.length ? college.locations : DEFAULT_PLACES;

  const list = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items.filter((it) => {
      if (it.status !== 'active') return false;
      if (filters.type !== 'all' && it.type !== filters.type) return false;
      if (filters.cat && it.category !== filters.cat) return false;
      if (filters.col && it.colour !== filters.col) return false;
      if (filters.loc && it.location !== filters.loc) return false;
      if (filters.from && it.item_date < filters.from) return false;
      if (filters.to && it.item_date > filters.to) return false;
      if (q && `${it.name} ${it.description} ${it.brand}`.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }, [items, filters]);

  const anyActive = items.some((i) => i.status === 'active');

  return (
    <section id="browse" className="pad">
      <div className="wrap">
        <div className="sec-head">
          <h2>Explore &amp; search</h2>
          <p>{college ? `Every open report at ${college.name}. Filter by what it is, what colour it was and where it happened.` : 'Choose your college to see what has been lost and found there.'}</p>
        </div>

        {!college ? (
          <div className="gate">
            <h3>Pick a college first</h3>
            <p>Every college has its own lost and found, so you only see reports from the college you choose.</p>
            <button className="btn cobalt" type="button" onClick={openPicker}>Choose your college</button>
          </div>
        ) : (
          <>
            <div className="seg" role="group" aria-label="Report type">
              {(['all', 'lost', 'found'] as const).map((t) => (
                <button key={t} type="button" aria-pressed={filters.type === t} onClick={() => set({ type: t })}>
                  {t === 'all' ? 'All' : t === 'lost' ? 'Lost' : 'Found'}
                </button>
              ))}
            </div>

            <div className="tools">
              <div className="f wide">
                <label htmlFor="q">Search item name</label>
                <input id="q" type="text" value={filters.q} onChange={(e) => set({ q: e.target.value })} placeholder="earbuds, bottle, ID card" />
              </div>
              <div className="f">
                <label htmlFor="fcat">Category</label>
                <select id="fcat" value={filters.cat} onChange={(e) => set({ cat: e.target.value })}>
                  <option value="">All categories</option>
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="f sm">
                <label htmlFor="fcol">Colour</label>
                <select id="fcol" value={filters.col} onChange={(e) => set({ col: e.target.value })}>
                  <option value="">Any</option>
                  {COLOURS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="f">
                <label htmlFor="floc">Location</label>
                <select id="floc" value={filters.loc} onChange={(e) => set({ loc: e.target.value })}>
                  <option value="">Anywhere on campus</option>
                  {places.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="f">
                <label htmlFor="fdfrom">From date</label>
                <input id="fdfrom" type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} />
              </div>
              <div className="f">
                <label htmlFor="fdto">Until date</label>
                <input id="fdto" type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} />
              </div>
              <div className="f sm" style={{ alignContent: 'end' }}>
                <button className="btn plain sm" type="button" onClick={() => onFilters({ ...EMPTY_FILTERS, type: filters.type })}>Clear filters</button>
              </div>
            </div>

            <p className="count" aria-live="polite">{loading ? 'Loading reports' : `${list.length} ${list.length === 1 ? 'report' : 'reports'} showing`}</p>
            <div className="grid">
              {list.map((it) => <ItemCard key={it.id} item={it} onOpen={onOpen} />)}
              {!loading && list.length === 0 && (
                <div className="empty" style={{ gridColumn: '1 / -1' }}>
                  {anyActive
                    ? 'Nothing matches those filters. Clear a filter or post a report so people can find you.'
                    : `No reports at ${college.name} yet. Be the first to post something lost or found.`}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthDialog from './components/AuthDialog';
import Browse, { EMPTY_FILTERS, type Filters } from './components/Browse';
import CollegePicker from './components/CollegePicker';
import ItemDialog from './components/ItemDialog';
import ReportForm from './components/ReportForm';
import Toast from './components/Toast';
import { useAuth } from './context/AuthContext';
import { useCollege } from './context/CollegeContext';
import { CATS } from './lib/constants';
import { fmtDate, placeLabel } from './lib/format';
import { isConfigured, supabase } from './lib/supabase';
import type { Item, ItemType } from './types';

export default function App() {
  const { profile, session, loading: authLoading, openAuth, requireAuth, signOut } = useAuth();
  const { college, myCollege, ready, openPicker, chooseCollege } = useCollege();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [rtype, setRtype] = useState<ItemType>('lost');
  const askedForCollege = useRef(false);

  const collegeId = college?.id ?? null;

  const load = useCallback(async () => {
    if (!isConfigured || !collegeId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('items').select('*').eq('college_id', collegeId).order('created_at', { ascending: false });
    if (error) setLoadError(error.message);
    else {
      setLoadError('');
      setItems((data ?? []) as Item[]);
    }
    setLoading(false);
  }, [collegeId]);

  useEffect(() => {
    setLoading(true);
    setFilters(EMPTY_FILTERS);
    setOpenId(null);
    load();
  }, [load]);

  // First visit with no saved college and no login: ask which college they want to see.
  useEffect(() => {
    if (askedForCollege.current || !ready || authLoading || college || profile || !isConfigured) return;
    askedForCollege.current = true;
    openPicker();
  }, [ready, authLoading, college, profile, openPicker]);

  const active = useMemo(() => items.filter((i) => i.status === 'active'), [items]);
  const returned = useMemo(() => items.filter((i) => i.status === 'returned'), [items]);
  const lostCount = active.filter((i) => i.type === 'lost').length;
  const foundCount = active.filter((i) => i.type === 'found').length;
  const openItem = items.find((i) => i.id === openId) ?? null;

  function startReport(t: ItemType) {
    requireAuth(() => {
      setRtype(t);
      // Reports always go to the student's own college, so show that college's list.
      if (myCollege && college?.id !== myCollege.id) chooseCollege(myCollege);
      setTimeout(() => document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  }

  function pickCategory(c: string) {
    setFilters({ ...filters, cat: c });
    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
  }

  const stats: [number, string][] = [
    [items.length, 'Reports filed'],
    [lostCount, 'Still looking'],
    [foundCount, 'Waiting for an owner'],
    [returned.length, 'Reunited'],
  ];

  return (
    <>
      {!isConfigured && (
        <div className="setup-note">
          <div className="wrap">Supabase is not connected yet. Copy .env.example to .env, add your project URL and anon key, then restart. See README.md.</div>
        </div>
      )}

      <nav className="top" aria-label="Main">
        <div className="wrap">
          <a className="logo" href="#top"><i aria-hidden="true" />WhereDidItGo</a>
          <div className="navlinks">
            <a href="#browse">Browse</a>
            <a href="#report">Report</a>
            <a href="#reunited">Reunited</a>
          </div>
          <div className="navcta">
            <button className="btn lost sm" type="button" onClick={() => startReport('lost')}>Report lost</button>
            <button className="btn cobalt sm hide-sm" type="button" onClick={() => startReport('found')}>Report found</button>
            {session && profile ? (
              <>
                <span className="who">Hi, {profile.full_name.split(' ')[0]}</span>
                <button className="btn plain sm" type="button" onClick={signOut}>Log out</button>
              </>
            ) : (
              <>
                <button className="btn plain sm" type="button" onClick={() => openAuth('login')}>Log in</button>
                <button className="btn sm hide-sm" type="button" onClick={() => openAuth('signup')}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="collegebar">
        <div className="wrap">
          <span>
            {college ? (
              <>{profile ? 'Your college:' : 'Showing lost and found at'} <b>{college.name}</b>, {college.city}</>
            ) : (
              'No college selected yet'
            )}
          </span>
          {/* Logged-in students are tied to their own college. Only visitors can switch. */}
          {!profile && <button className="btn plain sm" type="button" onClick={openPicker}>{college ? 'Change college' : 'Choose your college'}</button>}
        </div>
      </div>

      <header className="hero" id="top">
        <div className="wrap">
          <div>
            <h1><span>Lost</span><span>something?</span><span className="mark">Let's find it.</span></h1>
            <p className="sub">
              {college
                ? `One place at ${college.name} to report, search and recover belongings, without digging through group chats and notice boards.`
                : 'One place for every college to report, search and recover belongings. Pick your college to get started.'}
            </p>
            <div className="ctas">
              <button className="btn lost big" type="button" onClick={() => startReport('lost')}>Report lost item</button>
              <button className="btn big" type="button" onClick={() => startReport('found')}>Report found item</button>
            </div>
          </div>
          <div className="ticket" aria-label="Reports open right now">
            <div className="t-top">
              <div className="t-label">Open right now{college ? ` at ${college.name}` : ''}</div>
              <div className="t-score">{active.length}<small>reports</small></div>
              <div className="t-name">{lostCount} lost, {foundCount} found</div>
            </div>
            <div className="perf" />
            <div className="t-bot">Post what you lost or found. Likely matches are suggested the moment a report goes up.</div>
          </div>
        </div>
      </header>

      <section className="cats" aria-label="Popular categories">
        <div className="wrap">
          <h2>Popular categories</h2>
          {CATS.map((c) => (
            <button key={c} className="cat-btn" type="button" onClick={() => pickCategory(c)}>
              {c} <b>{active.filter((i) => i.category === c).length}</b>
            </button>
          ))}
        </div>
      </section>

      {loadError && (
        <div className="setup-note"><div className="wrap">Could not load reports: {loadError}</div></div>
      )}

      <Browse items={items} loading={loading} filters={filters} onFilters={setFilters} onOpen={setOpenId} />

      <section id="report" className="pad report">
        <div className="wrap">
          <div className="sec-head">
            <h2>Make a report</h2>
            <p>Takes about a minute. Your name and phone number are shown on the report so the other person can reach you directly.</p>
          </div>
          <ReportForm items={items} type={rtype} onTypeChange={setRtype} onCreated={load} onOpen={setOpenId} />
        </div>
      </section>

      <section id="reunited" className="pad">
        <div className="wrap">
          <div className="sec-head">
            <h2>Back where they belong</h2>
            <p>Items their owners have marked as returned.</p>
          </div>
          {returned.length ? (
            <div className="reunited-list">
              {returned.map((i) => (
                <div className="rcard" key={i.id}>
                  <span className="pill found" style={{ margin: 0, justifySelf: 'start', background: 'var(--ok)' }}>RETURNED</span>
                  <h3>{i.name}</h3>
                  <p className="m">{i.category}, {placeLabel(i)}, {fmtDate(i.item_date)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">Nothing has been returned yet. When an owner marks a report as returned, it shows up here.</div>
          )}
        </div>
      </section>

      <section className="stats" aria-label="Community statistics">
        <div className="wrap">
          {stats.map(([n, label]) => (
            <div className="stat" key={label}><b>{n}</b><span>{label}</span></div>
          ))}
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span className="logo" style={{ fontSize: '1.4rem' }}>WhereDidItGo</span>
          <span>Lost something? Found something? Let's bring it home.</span>
        </div>
      </footer>

      <ItemDialog item={openItem} items={items} onClose={() => setOpenId(null)} onOpen={setOpenId} onChanged={load} />
      <AuthDialog />
      <CollegePicker />
      <Toast />
    </>
  );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { CATS, COLOURS, DEFAULT_PLACES } from '../lib/constants';
import { iso, isClassroom, splitPhone, toE164 } from '../lib/format';
import { matchesFor } from '../lib/matching';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import type { Item, ItemType } from '../types';
import MatchList from './MatchList';
import PhoneInput from './PhoneInput';

interface Props {
  items: Item[];
  type: ItemType;
  onTypeChange: (t: ItemType) => void;
  onCreated: () => void;
  onOpen: (id: string) => void;
}

export default function ReportForm({ items, type, onTypeChange, onCreated, onOpen }: Props) {
  const { profile, session, loading, openAuth } = useAuth();
  const { myCollege } = useCollege();
  const today = iso(new Date());
  const places = myCollege?.locations?.length ? myCollege.locations : DEFAULT_PLACES;

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATS[0]);
  const [brand, setBrand] = useState('');
  const [colour, setColour] = useState(COLOURS[0]);
  const [location, setLocation] = useState('');
  const [classroomNo, setClassroomNo] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [cc, setCc] = useState('+91');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Item | null>(null);

  // The chosen place falls back to the first place of the student's college until they pick one.
  const loc = places.includes(location) ? location : places[0];
  const room = isClassroom(loc);

  // Pre-fill the public contact details from the profile once. The student can change them per report.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!profile || prefilled.current) return;
    prefilled.current = true;
    const sp = splitPhone(profile.phone);
    setContactName(profile.full_name);
    setCc(sp.cc);
    setContactPhone(sp.national);
  }, [profile]);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const lost = type === 'lost';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!session || !profile) return openAuth('login');
    if (!name.trim()) return setError('Add an item name.');
    if (room && !classroomNo.trim()) return setError('Enter the classroom number.');
    if (!date) return setError('Choose the date.');
    if (contactName.trim().length < 2) return setError('Add the name people should contact.');
    const phone = toE164(contactPhone, cc);
    if (!phone) return setError('Enter a mobile number people can call.');
    if (file && file.size > 5 * 1024 * 1024) return setError('Choose a photo under 5 MB.');

    setError('');
    setBusy(true);

    let photoUrl: string | null = null;
    if (file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${session.user.id}/${crypto.randomUUID()}.${ext || 'jpg'}`;
      const up = await supabase.storage.from('item-photos').upload(path, file, { contentType: file.type });
      if (up.error) {
        setBusy(false);
        return setError(`Photo upload failed: ${up.error.message}`);
      }
      photoUrl = supabase.storage.from('item-photos').getPublicUrl(path).data.publicUrl;
    }

    const { data, error: err } = await supabase
      .from('items')
      .insert({
        user_id: session.user.id,
        college_id: profile.college_id,
        type,
        name: name.trim(),
        category,
        brand: brand.trim(),
        colour,
        location: loc,
        classroom_no: room ? classroomNo.trim() : null,
        item_date: date,
        item_time: time || null,
        description: description.trim(),
        photo_url: photoUrl,
        contact_name: contactName.trim(),
        contact_phone: phone,
      })
      .select()
      .single();

    setBusy(false);
    if (err || !data) return setError(err?.message ?? 'Could not save the report.');

    setCreated(data as Item);
    onCreated();
    toast('Report posted');
    setName(''); setBrand(''); setDescription(''); setFile(null); setClassroomNo(''); setTime(''); setDate(today);
  }

  if (loading) return <p className="warn">Checking your login</p>;

  if (!profile) {
    return (
      <div className="gate">
        <h3>Log in to post a report</h3>
        <p>Posting a lost or found report needs an account, verified with an OTP sent to your email. It keeps reports genuine and lets people reach you.</p>
        <div className="row">
          <button className="btn cobalt" type="button" onClick={() => openAuth('login')}>Log in</button>
          <button className="btn" type="button" onClick={() => openAuth('signup')}>Sign up</button>
        </div>
      </div>
    );
  }

  if (!myCollege) return <p className="warn">Loading your college</p>;

  const matches = created ? matchesFor(created, items) : [];

  return (
    <>
      <p className="posting-to">Posting to <b>{myCollege.name}</b>, {myCollege.city}</p>

      <div className="seg" role="group" aria-label="What are you reporting">
        <button type="button" aria-pressed={lost} onClick={() => onTypeChange('lost')}>I lost something</button>
        <button type="button" aria-pressed={!lost} onClick={() => onTypeChange('found')}>I found something</button>
      </div>

      <form className="formcard" onSubmit={submit} noValidate>
        <div className="fgrid">
          <div>
            <label htmlFor="r-name">Item name</label>
            <input id="r-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Wireless earbuds" />
          </div>
          <div>
            <label htmlFor="r-cat">Category</label>
            <select id="r-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="r-brand">Brand <span className="hint">(leave blank if unknown)</span></label>
            <input id="r-brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="boAt" />
          </div>
          <div>
            <label htmlFor="r-col">Colour</label>
            <select id="r-col" value={colour} onChange={(e) => setColour(e.target.value)}>
              {COLOURS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="r-loc">{lost ? 'Last seen location' : 'Location where found'}</label>
            <select id="r-loc" value={loc} onChange={(e) => setLocation(e.target.value)}>
              {places.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          {room && (
            <div>
              <label htmlFor="r-room">Classroom number</label>
              <input id="r-room" type="text" value={classroomNo} onChange={(e) => setClassroomNo(e.target.value)} placeholder="304" maxLength={12} />
            </div>
          )}
          <div>
            <label htmlFor="r-date">{lost ? 'Date lost' : 'Date found'}</label>
            <input id="r-date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="r-time">Approximate time</label>
            <input id="r-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="full">
            <label htmlFor="r-desc">Description</label>
            <textarea id="r-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Black case with scratches" />
          </div>
          <div className="full">
            <label htmlFor="r-photo">Photograph</label>
            <div className="photo-row">
              <input id="r-photo" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {preview && <img src={preview} alt="Preview of the chosen photograph" />}
            </div>
          </div>

          <div className="full contactbox">
            <h4>Contact details everyone can see</h4>
            <p className="hint">Anyone who {lost ? 'finds your item' : 'recognises this item'} can call or message you directly with these.</p>
            <div className="two">
              <div>
                <label htmlFor="r-cname">Your name</label>
                <input id="r-cname" type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="r-cphone">Your phone number</label>
                <PhoneInput id="r-cphone" value={contactPhone} onChange={setContactPhone} cc={cc} onCc={setCc} />
              </div>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 26 }}>
          <button className={`btn big ${lost ? 'lost' : 'cobalt'}`} type="submit" disabled={busy}>
            {busy ? 'Posting' : lost ? 'Post lost report' : 'Post found report'}
          </button>
          {error && <span className="err" role="alert">{error}</span>}
        </div>
      </form>

      {created && (
        <div className="result">
          <h3>Your report is live</h3>
          <p style={{ fontWeight: 500 }}>People at your college can now see it and contact you on the number you gave.</p>
          <MatchList matches={matches} onOpen={onOpen} />
        </div>
      )}
    </>
  );
}

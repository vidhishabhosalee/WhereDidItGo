import { useEffect, useState, type FormEvent } from 'react';
import { useAuth, type AuthMode } from '../context/AuthContext';
import { BRANCHES, YEARS } from '../lib/constants';
import { toE164 } from '../lib/format';
import { toast } from '../lib/toast';
import Modal from './Modal';

type Step = 'details' | 'otp' | 'complete';

const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

function AuthForm() {
  const { auth, closeAuth, sendOtp, verifyOtp, saveProfile } = useAuth();
  const [mode, setMode] = useState<AuthMode>(auth.mode);
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const cleanEmail = email.trim().toLowerCase();
  const e164 = toE164(phone);

  /** Checks name, branch, year and phone. Email is checked separately because login only needs that. */
  function validateProfile(): string {
    if (name.trim().length < 2) return 'Enter your full name.';
    if (!branch) return 'Choose your branch.';
    if (!year) return 'Choose your year.';
    if (!e164) return 'Enter a 10 digit mobile number.';
    return '';
  }

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    const problem = !validEmail(email) ? 'Enter a valid email address.' : mode === 'signup' ? validateProfile() : '';
    if (problem) return setError(problem);
    setError('');
    setBusy(true);
    const err = await sendOtp(cleanEmail);
    setBusy(false);
    if (err) return setError(err);
    setStep('otp');
    setCooldown(30);
    setOtp('');
  }

  async function resend() {
    if (cooldown > 0) return;
    setBusy(true);
    const err = await sendOtp(cleanEmail);
    setBusy(false);
    if (err) return setError(err);
    setError('');
    setCooldown(30);
    toast('A new code is on its way');
  }

  function finish(msg: string) {
    const done = auth.onDone;
    closeAuth();
    toast(msg);
    done?.();
  }

  async function checkCode(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) return setError('Enter the 6 digit code from your email.');
    setError('');
    setBusy(true);
    const res = await verifyOtp(cleanEmail, otp.trim());
    if (res.error) {
      setBusy(false);
      return setError(res.error);
    }
    if (res.hasProfile) {
      setBusy(false);
      return finish('Email verified. You are logged in.');
    }
    if (mode === 'signup' && !validateProfile()) {
      const err = await saveProfile({ full_name: name.trim(), branch, year, email: cleanEmail, phone: e164! });
      setBusy(false);
      if (err) return setError(err);
      return finish('Account created. You can post reports now.');
    }
    setBusy(false);
    setStep('complete');
  }

  async function completeProfile(e: FormEvent) {
    e.preventDefault();
    const problem = validateProfile();
    if (problem) return setError(problem);
    setError('');
    setBusy(true);
    const err = await saveProfile({ full_name: name.trim(), branch, year, email: cleanEmail, phone: e164! });
    setBusy(false);
    if (err) return setError(err);
    finish('Account created. You can post reports now.');
  }

  const profileFields = (
    <>
      <div>
        <label htmlFor="a-name">Full name</label>
        <input id="a-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="a-branch">Branch</label>
          <select id="a-branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">Select</option>
            {BRANCHES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="a-year">Year</label>
          <select id="a-year" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select</option>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="a-phone">Mobile number</label>
        <div className="phone-row">
          <span>+91</span>
          <input id="a-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <p className="hint">People who find your item will use this number to contact you.</p>
      </div>
    </>
  );

  const emailField = (
    <div>
      <label htmlFor="a-email">Email</label>
      <input id="a-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <p className="hint">We email a 6 digit code to verify this address.</p>
    </div>
  );

  return (
    <>
      <div className="dhead">
        <h3 id="auth-title">{step === 'otp' ? 'Enter the code' : step === 'complete' ? 'Finish signup' : mode === 'login' ? 'Log in' : 'Sign up'}</h3>
        <button type="button" className="btn plain sm" onClick={closeAuth}>Close</button>
      </div>
      <div className="dbody">
        {step === 'details' && (
          <>
            <div className="seg" style={{ marginBottom: 0 }} role="group" aria-label="Log in or sign up">
              <button type="button" aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setError(''); }}>Log in</button>
              <button type="button" aria-pressed={mode === 'signup'} onClick={() => { setMode('signup'); setError(''); }}>Sign up</button>
            </div>
            <form className="authform" onSubmit={sendCode} noValidate>
              {mode === 'signup' && profileFields}
              {emailField}
              {error && <p className="err" role="alert">{error}</p>}
              <button className="btn cobalt" type="submit" disabled={busy}>{busy ? 'Sending code' : 'Send OTP'}</button>
              <p className="hint">You need an account to post a lost or found report. Browsing is open to everyone.</p>
            </form>
          </>
        )}

        {step === 'otp' && (
          <form className="authform" onSubmit={checkCode} noValidate>
            <p>We emailed a 6 digit code to <b>{cleanEmail}</b>. Check your spam folder if it does not show up.</p>
            <div>
              <label htmlFor="a-otp">OTP</label>
              <input id="a-otp" className="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus />
            </div>
            {error && <p className="err" role="alert">{error}</p>}
            <button className="btn cobalt" type="submit" disabled={busy}>{busy ? 'Checking' : 'Verify and continue'}</button>
            <div className="row">
              <button type="button" className="btn plain sm" onClick={resend} disabled={busy || cooldown > 0}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}</button>
              <button type="button" className="btn plain sm" onClick={() => { setStep('details'); setError(''); }}>Change email</button>
            </div>
          </form>
        )}

        {step === 'complete' && (
          <form className="authform" onSubmit={completeProfile} noValidate>
            <p>Your email is verified, but there is no account for it yet. Add your details to finish.</p>
            {profileFields}
            {error && <p className="err" role="alert">{error}</p>}
            <button className="btn cobalt" type="submit" disabled={busy}>{busy ? 'Saving' : 'Create account'}</button>
          </form>
        )}
      </div>
    </>
  );
}

export default function AuthDialog() {
  const { auth, closeAuth } = useAuth();
  return (
    <Modal open={auth.open} onClose={closeAuth} labelledBy="auth-title" narrow>
      <AuthForm />
    </Modal>
  );
}

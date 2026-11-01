import { useEffect, useRef, useState } from 'react';

export default function Toast() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      setShow(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setShow(false), 3000);
    };
    window.addEventListener('wdig-toast', on);
    return () => window.removeEventListener('wdig-toast', on);
  }, []);

  return (
    <div className={`toast ${show ? 'show' : ''}`} role="status" aria-live="polite">
      {msg}
    </div>
  );
}

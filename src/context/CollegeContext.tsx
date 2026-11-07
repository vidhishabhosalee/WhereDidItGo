import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isConfigured, supabase } from '../lib/supabase';
import type { College } from '../types';
import { useAuth } from './AuthContext';

const KEY = 'wdig-college';

interface Ctx {
  /** The college whose lost and found list is on screen. */
  college: College | null;
  /** The logged-in student's own college. Reports are posted here. */
  myCollege: College | null;
  /** False until the saved college choice has been looked up. */
  ready: boolean;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  chooseCollege: (c: College) => void;
}

const CollegeContext = createContext<Ctx | null>(null);

async function fetchCollege(id: string): Promise<College | null> {
  const { data } = await supabase.from('colleges').select('*').eq('id', id).maybeSingle();
  return (data as College | null) ?? null;
}

function remember(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* private window or blocked storage: the choice just is not remembered */
  }
}

export function CollegeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [college, setCollege] = useState<College | null>(null);
  const [myCollege, setMyCollege] = useState<College | null>(null);
  const [ready, setReady] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Restore the college this browser picked last time.
  useEffect(() => {
    if (!isConfigured) {
      setReady(true);
      return;
    }
    let id: string | null = null;
    try {
      id = localStorage.getItem(KEY);
    } catch {
      id = null;
    }
    if (!id) {
      setReady(true);
      return;
    }
    fetchCollege(id).then((c) => {
      if (c) setCollege((prev) => prev ?? c);
      setReady(true);
    });
  }, []);

  // A logged-in student always lands on their own college.
  const myCollegeId = profile?.college_id ?? null;
  useEffect(() => {
    if (!myCollegeId) {
      setMyCollege(null);
      return;
    }
    fetchCollege(myCollegeId).then((c) => {
      setMyCollege(c);
      if (c) {
        setCollege(c);
        remember(c.id);
      }
    });
  }, [myCollegeId]);

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);
  const chooseCollege = useCallback((c: College) => {
    setCollege(c);
    remember(c.id);
    setPickerOpen(false);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ college, myCollege, ready, pickerOpen, openPicker, closePicker, chooseCollege }),
    [college, myCollege, ready, pickerOpen, openPicker, closePicker, chooseCollege],
  );

  return <CollegeContext.Provider value={value}>{children}</CollegeContext.Provider>;
}

export function useCollege(): Ctx {
  const c = useContext(CollegeContext);
  if (!c) throw new Error('useCollege must be used inside CollegeProvider');
  return c;
}

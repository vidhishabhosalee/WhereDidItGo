export type ItemType = 'lost' | 'found';

export interface College {
  id: string;
  name: string;
  city: string;
  country: string;
  locations: string[];
}

/** What a student picked on signup: an existing college, or a new one to create after the email is verified. */
export type CollegeChoice =
  | { kind: 'existing'; college: College }
  | { kind: 'new'; name: string; city: string; country: string; places: string };

export interface Item {
  id: string;
  user_id: string;
  college_id: string;
  type: ItemType;
  name: string;
  category: string;
  brand: string;
  colour: string;
  location: string;
  classroom_no: string | null;
  item_date: string; // yyyy-mm-dd
  item_time: string | null;
  description: string;
  photo_url: string | null;
  contact_name: string;
  contact_phone: string;
  status: 'active' | 'returned';
  created_at: string;
}

export interface Profile {
  id: string;
  college_id: string;
  full_name: string;
  branch: string;
  year: string;
  email: string;
  phone: string;
}

export interface Factor {
  k: string;
  w: number;
  s: number;
  r: string;
}

export interface MatchResult {
  other: Item;
  score: number;
  factors: Factor[];
}

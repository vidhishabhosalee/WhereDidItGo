export const CATS = ['Electronics', 'Documents & IDs', 'Bags & accessories', 'Books & stationery', 'Clothing', 'Jewellery', 'Other belongings'];
export const COLOURS = ['Black', 'White', 'Grey', 'Silver', 'Blue', 'Red', 'Green', 'Brown', 'Gold', 'Multicolour'];
export const YEARS = ['FY', 'SY', 'TY', 'BE', 'Other'];

/** Offered as suggestions when typing a branch. Students can type any branch. */
export const BRANCH_SUGGESTIONS = ['CE', 'IT', 'CSE-DS', 'EXTC', 'MECH', 'AIML', 'AIDS', 'CSE (ICB)'];

/** Pre-filled campus places when a student adds a new college. They can edit the list. */
export const DEFAULT_PLACES = ['Main gate', 'Canteen', 'Library', 'Ground', 'Parking', 'Classroom', 'Other'];

export const HEX: Record<string, string> = {
  Black: '#16181f',
  White: '#ffffff',
  Grey: '#9aa0ad',
  Silver: '#cdd3de',
  Blue: '#2f6bff',
  Red: '#e5322d',
  Green: '#1fa463',
  Brown: '#7a4b2a',
  Gold: '#d9a514',
  Multicolour: 'conic-gradient(#e5322d,#ffd23f,#1fa463,#2f6bff,#e5322d)',
};

export const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: '+91', label: 'India +91' },
  { code: '+1', label: 'US / Canada +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+61', label: 'Australia +61' },
  { code: '+971', label: 'UAE +971' },
  { code: '+966', label: 'Saudi Arabia +966' },
  { code: '+65', label: 'Singapore +65' },
  { code: '+49', label: 'Germany +49' },
  { code: '+33', label: 'France +33' },
  { code: '+977', label: 'Nepal +977' },
  { code: '+880', label: 'Bangladesh +880' },
  { code: '+94', label: 'Sri Lanka +94' },
  { code: '+92', label: 'Pakistan +92' },
  { code: '', label: 'Other (type + and country code)' },
];

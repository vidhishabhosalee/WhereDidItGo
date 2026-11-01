export const CATS = ['Electronics', 'Documents & IDs', 'Bags & accessories', 'Books & stationery', 'Clothing', 'Jewellery', 'Other belongings'];
export const COLOURS = ['Black', 'White', 'Grey', 'Silver', 'Blue', 'Red', 'Green', 'Brown', 'Gold', 'Multicolour'];
export const BRANCHES = ['CE', 'IT', 'CSE-DS', 'EXTC', 'MECH', 'AIML', 'AIDS', 'CSE (ICB)'];
export const YEARS = ['FY', 'SY', 'TY', 'BE'];
export const LOCATIONS = ['Outer canteen', 'Inner canteen', 'Main gate', 'Canopy area', 'Library', 'Gym', 'Classroom'];

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

/** Rough positions on a campus grid, used only to score how close two places are. Edit to match your campus. */
export const PLACE_XY: Record<string, [number, number]> = {
  'Outer canteen': [8, 6],
  'Inner canteen': [6, 4],
  'Main gate': [1, 8],
  'Canopy area': [4, 7],
  Library: [2, 1],
  Gym: [9, 1],
  Classroom: [4, 3],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        card: 'var(--card)',
        cobalt: 'var(--cobalt)',
        lost: 'var(--lost)',
        sun: 'var(--sun)',
      },
    },
  },
  plugins: [],
};

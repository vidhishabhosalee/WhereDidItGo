# WhereDidItGo

Campus lost and found. React + TypeScript + Tailwind CSS on the front end, Supabase for the database, phone OTP login and photo storage.

## What it does

- Anyone can browse lost and found reports.
- Posting a report needs an account. Signup collects name, branch, year, email and phone, and the email address is verified with a 6 digit OTP before the account exists.
- Reports use the campus locations: Outer canteen, Inner canteen, Main gate, Canopy area, Library, Gym, and Classroom (with the room number typed in).
- Each report shows the poster's name and phone number publicly, so a finder or owner can call or WhatsApp directly.
- A rule-based matcher suggests likely matches and shows why (name, category, colour, location, date, brand).
- Owners can mark their own reports as returned or delete them. Returned items appear under "Back where they belong". All counts come from the database, nothing is hard-coded.

## Set up (about 15 minutes)

1. **Create a Supabase project** at https://supabase.com.
2. **Create the tables.** Open SQL Editor, paste everything from `supabase/schema.sql`, and run it. This creates `profiles`, `items`, the `item-photos` storage bucket and all Row Level Security policies.
3. **Set up email login.**
   - Authentication, then Sign In / Providers, then Email: keep it enabled and set the email OTP length to 6.
   - Authentication, then Emails, then Templates: edit both "Confirm signup" and "Magic Link" so the body contains `{{ .Token }}` (the 6 digit code), for example `<h2>Your WhereDidItGo code</h2><p>Enter this code: <b>{{ .Token }}</b></p>`.
   - Authentication, then Emails, then SMTP Settings: add your own email service (Brevo, Resend or Gmail with an app password). Supabase's built-in sender only emails a few team addresses and allows very few per hour, so students will not receive codes without this.
4. **Add your keys.** Copy `.env.example` to `.env`. Fill in the Project URL and the anon public key from Project Settings, then API.
5. **Run it.**
   ```
   npm install
   npm run dev
   ```
6. **Deploy.** Push to GitHub and import the repo in Netlify or Vercel. Add the same two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the host's settings. Build command `npm run build`, output folder `dist`.

## Good to know

- The email address is the verified credential. The phone number is typed in and not verified, because it is shown publicly so people can contact each other.
- Phone numbers on reports are public by design. The `profiles` table stays private: each student can only read their own row.
- Edit `PLACE_XY` in `src/lib/constants.ts` to match your real campus layout. It only affects how the matcher scores distance between places.
- Not included yet: notifications by email, admin moderation, abuse reporting, image similarity, map view.

## Project layout

```
supabase/schema.sql        tables, security rules, photo bucket
src/context/AuthContext    OTP login, profile, session
src/components/            AuthDialog, ReportForm, Browse, ItemDialog, MatchList
src/lib/matching.ts        the matching engine
src/lib/constants.ts       branches, years, locations, categories
```

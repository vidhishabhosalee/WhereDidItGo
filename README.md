# WhereDidItGo

Lost and found for every college. React + TypeScript + Tailwind CSS on the front end, Supabase for the database, email OTP login and photo storage.

## What it does

- Every college has its own lost and found. Visitors pick a college (search by name or city) and only see that college's reports. The choice is remembered in the browser.
- Anyone can browse. Posting a report needs an account.
- Signup collects college, name, branch, year, mobile number and email. The email address is verified with a 6 digit OTP before the account exists.
- A student who cannot find their college can add it during signup, with a list of places on their campus (canteen, library, classroom and so on). Other students can then find it.
- Reports use the places of the poster's own college. Any place called Classroom asks for a room number.
- Each report shows the poster's name and phone number publicly, so a finder or owner can call or WhatsApp directly. Phone numbers from any country work.
- A rule-based matcher suggests likely matches inside the same college and shows why (name, category, colour, location, date, brand).
- Owners can mark their own reports as returned or delete them. Returned items appear under "Back where they belong". All counts come from the database.

## Set up a new project (about 15 minutes)

1. **Create a Supabase project** at https://supabase.com.
2. **Create the tables.** Open SQL Editor, paste everything from `supabase/schema.sql`, and run it. This creates `colleges` (with DJ Sanghvi College of Engineering, Mumbai as the first one), `profiles`, `items`, the `item-photos` storage bucket and all Row Level Security policies.
3. **Set up email login.**
   - Authentication, then Sign In / Providers, then Email: keep it enabled and set the email OTP length to 6.
   - Authentication, then Emails, then SMTP Settings: add your own email service (Brevo, Resend or Gmail with an app password). Supabase's built-in sender only emails a few team addresses.
   - Authentication, then Emails, then Templates: edit both "Confirm signup" and "Magic Link" so the body contains `{{ .Token }}`, for example `<h2>Your WhereDidItGo code</h2><p>Enter this code: <b>{{ .Token }}</b></p>`.
4. **Add your keys.** Copy `.env.example` to `.env`. Fill in the Project URL and the anon public key from Project Settings, then API.
5. **Run it.**
   ```
   npm install
   npm run dev
   ```
6. **Deploy.** Push to GitHub and import the repo in Vercel or Netlify. Add the same two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the host's settings. Build command `npm run build`, output folder `dist`.

## Already running the single-college version?

Do not run `schema.sql` again. Run `supabase/migrate-multi-college.sql` once in the SQL Editor instead. It adds the colleges table, moves every existing profile and report to DJ Sanghvi, and loosens the branch, year and place checks so other colleges can use their own.

## Good to know

- The email address is the verified credential. The phone number is typed in and not verified, because it is shown publicly so people can contact each other.
- Phone numbers on reports are public by design. The `profiles` table stays private: each student can only read their own row.
- Anyone logged in can add a college. There is no review step yet, so a duplicate or joke college is possible. An admin tool to merge or remove colleges is a good next addition.
- College search shows the first 30 matches. With many thousands of colleges, add a trigram index on `colleges.name` for faster search.
- Matching only compares reports inside one college. Location scoring compares place names, since every college has different places.
- Not included yet: admin moderation, abuse reporting, email notifications, image similarity, map view.

## Project layout

```
supabase/schema.sql                  tables and security rules for a new project
supabase/migrate-multi-college.sql   upgrade for an existing single-college database
src/context/AuthContext              email OTP login, profile, college creation
src/context/CollegeContext           which college is on screen, picker state
src/components/                      CollegePicker, CollegeField, AuthDialog, ReportForm, Browse, ItemDialog
src/lib/matching.ts                  the matching engine
src/lib/constants.ts                 categories, colours, branch suggestions, country codes
```

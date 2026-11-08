# Oscar's Music

Songbook, collections, calendar and booking site for Oscar Nash.

- **Front end:** Vite + React + TypeScript, hash routing, hosted on GitHub Pages.
- **Back end:** Supabase (Postgres, Auth, Storage, one Edge Function `contact`), email through Resend.
- **Brand:** see the comment at the top of `src/styles.css`.

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in the two VITE_ values
npm run dev
```

## Database and functions
```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push --remote
npx supabase functions deploy contact --no-verify-jwt
npx supabase secrets set RESEND_API_KEY=... CONTACT_TO=oscar@nash.je CONTACT_FROM="Oscar's Music <hello@yourdomain>"
```

## Admins
The sign-in page is at `/#/admin`. It is not linked from the public pages.
Admins are the emails in the `admins` table. Sign-ups are switched off, so an admin also needs an Auth user
(Supabase dashboard > Authentication > Users > Add user).

## Launch checklist
- Remove the `noindex` meta tag in `index.html` and the preview banner in `src/App.tsx`.
- Verify a sending domain in Resend and set `CONTACT_FROM`.
- Add the donation link on the About page (admin edit form).

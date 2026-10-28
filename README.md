# CampusPulse – Report it. Track it. Improve campus life.
React + Vite + Supabase. Works in **demo mode** (fictional data, nothing saved) until you add Supabase keys.

## Run locally (Windows PowerShell)
```powershell
cd campuspulse
npm install
Copy-Item .env.example .env   # then edit .env with your Supabase values
npm run dev                   # open http://localhost:5173
```

## Supabase setup
1. supabase.com → New project. 2. SQL Editor → paste `supabase/schema.sql` → Run.
3. **Before the demo, change the staff passcode:** run
   `update public.admin_settings set code_hash = encode(extensions.digest('YOUR-NEW-CODE','sha256'),'hex');`
4. Project Settings → API: copy the Project URL and the publishable (anon) key into `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). Never use the service-role key.

## Security model and limitations
- RLS is on. Anyone can read issues and submit new ones (forced to status "Submitted", length-checked). There are no UPDATE/DELETE policies, so the browser cannot edit or delete rows directly.
- Status/priority changes go through the `update_issue` database function, which requires a shared **staff passcode** (hashed in DB). This is an MVP stand-in for real login: a shared passcode can be leaked or guessed, and there is no rate limiting. Next step: Supabase Auth with a staff role.
- Anonymous submissions can be spammed (no CAPTCHA/rate limit).

## Priority rules (rule-based, not AI) – see `src/priority.js`
Safety category or hazard words → High · Electrical hazards → High · Water outage → High · Other water → Medium · Broken Infrastructure/Equipment → Medium · everything else → Low. Staff can override.

## Git + GitHub (PowerShell)
```powershell
git init; git add .; git commit -m "Initial Vite + React project"
# after each feature: git add .; git commit -m "Add issue form"   (dashboard, form, supabase, status, priority, fixes, README)
# create an empty repo on github.com (no README), then:
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/campuspulse.git
git push -u origin main
```
Check `git status` never lists `.env`.

## Deploy on Vercel
vercel.com → Add New Project → import the GitHub repo (Vite is auto-detected) → Environment Variables: add the two `VITE_` values → Deploy. Then open the URL, submit an issue, and confirm it appears in Supabase Table Editor.

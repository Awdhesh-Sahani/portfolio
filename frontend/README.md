# Awdhesh Sahani Portfolio

Static portfolio frontend, private content dashboard, Supabase database/storage, and a Vercel serverless contact endpoint powered by Resend.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. In Supabase Authentication, create the admin user and disable public sign-ups. Add that user's UUID to `public.portfolio_admins`:

   ```sql
   insert into public.portfolio_admins (user_id)
   values ('YOUR_AUTH_USER_UUID');
   ```

5. Start the frontend with `npm run dev`. The admin page is at `/dashboard.html`. To test the email API locally, install the Vercel CLI and run `vercel dev` with the server-only environment variables configured; Vite's dev server alone does not run the `/api` function.

The frontend uses the Supabase publishable (or legacy anon) key only. Database row-level security restricts writes, uploads, inbox access and deletes to the admin UUID in `portfolio_admins`. The `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) must remain server-side.

## Deploying

Deploy the project to Vercel. Configure these environment variables in the Vercel project settings:

| Variable | Use |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL, exposed to the frontend |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key, exposed to the frontend |
| `SUPABASE_URL` | Supabase project URL for the contact API |
| `SUPABASE_SECRET_KEY` | Server-only Supabase secret key for storing contact messages; legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported |
| `RESEND_API_KEY` | Server-only Resend API key |

Redeploy after changing environment variables. Contact form submissions are stored in `public.contact_messages` and emailed to `awdheshsahani6392789729@gmail.com` using the existing Resend integration. The sender address remains `onboarding@resend.dev`; configure a verified Resend sender if your Resend account requires one.

## Dashboard

Visit `/dashboard.html` on the deployed site and sign in with the admin user. The dashboard can create, edit and delete skills, projects, education, certificates and hire highlights; edit profile/contact/social details; upload images and PDFs (10 MB maximum); and review or delete contact form submissions. Uploaded portfolio files are served by the public `portfolio-assets` bucket, while upload and delete operations require admin authorization.

The initial content is inserted by `supabase/schema.sql`. If you have already edited the static website, update that seed JSON before running the schema so those edits appear in the database-backed portfolio.

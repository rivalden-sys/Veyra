# Veyra Foundation

Production foundation for a multi-tenant Veyra application on Next.js 16 App Router, TypeScript, Tailwind CSS, and Supabase.

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Supabase

Apply migrations in `supabase/migrations` in timestamp order. Google OAuth and Magic Link must be enabled in Supabase Auth settings, with callback URLs pointing to:

- `http://localhost:3000/auth/callback`
- your production `https://.../auth/callback`

No demo data is included.

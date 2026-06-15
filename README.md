# Phoenix Finance OS

Premium Personal CFO Dashboard built with Next.js 15, TypeScript, Tailwind CSS, ShadCN-style UI primitives, Supabase, PostgreSQL, and Recharts.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase

Create a Supabase project, run `supabase/schema.sql`, then add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The current dashboard ships with realistic seed data in `lib/finance-data.ts` so the product experience is available before live bank feeds are connected.

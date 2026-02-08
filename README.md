## Local development

To run the app locally, create a `.env.local` file in the project root with:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://....supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

- **DATABASE_URL** — Postgres connection string (e.g. from [Supabase](https://supabase.com) → Project Settings → Database → Connection string, “URI”).
- **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY** — From Supabase → Project Settings → API (Project URL and anon/public key).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Web Migration

This project now has a web-first runtime path:

- Frontend: existing React/Vite app.
- API: Vercel serverless function at `/api/commands`.
- Persistence: PostgreSQL through Prisma 7.
- Compatibility layer: imports from `@tauri-apps/api/*` are aliased to web adapters in `src/lib`.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a PostgreSQL database.
3. Run `npm install`.
4. Run `npm run prisma:push` to create tables.
5. Use Vercel's local runtime for API routes, for example `npx vercel dev`.

`npm run dev` still starts the plain Vite dev server. That is useful for UI-only work, but API calls require a Vercel-compatible runtime.

## Current Porting Status

The first web pass ports the app shell, session state, saves, settings, manager profiles, generated careers, basic team management, inbox actions, finances, simple transfers/contracts, and day advancement.

The original Rust/Tauri backend remains in `src-tauri` as a reference while the deeper simulation systems are ported. Complex match-day live simulation, detailed contract negotiations, scouting reports, historical stats, and season rollover still need parity work in the Node/Prisma command layer.

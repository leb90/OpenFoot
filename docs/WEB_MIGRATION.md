# Web Migration

The project is now web-only. The old native runtime has been removed from the repository, and new backend work should target the Node/Prisma command layer.

## Active Runtime

- Frontend: React, TypeScript, Vite, Tailwind CSS.
- API: local Node server for development, with a Vercel-compatible function at `/api/commands` for later deployment.
- Server logic: Node modules in `server/`.
- Persistence: PostgreSQL through Prisma 7.
- Deployment target: Vercel.

## Local Setup

1. Create or update `.env`.
2. Set `DATABASE_URL` to a PostgreSQL database.
3. Run `npm install`.
4. Run `npm run prisma:push` to create tables.
5. Run the local app:

```bash
npm run dev
```

This starts Vite and the local API server together. If PowerShell blocks `npm.ps1`, use:

```bash
npm.cmd run dev
```

## Current Porting Status

The web command layer currently supports the app shell, sessions, saves, settings, manager profiles, generated careers, team selection, basic squad management, inbox actions, finances, simple transfers and contracts, training updates, and day advancement.

Deeper parity work remains for advanced match simulation, detailed scouting reports, long-term historical stats, season rollover, richer transfer AI, and fully normalized persistence beyond snapshots.

## Development Rule

Do not add native-only code back into the app. New features should run through:

```text
src/lib/apiClient.ts -> api/commands.js -> server/gameCommands.js -> Prisma/PostgreSQL
```

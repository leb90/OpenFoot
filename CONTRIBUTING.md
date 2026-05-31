# Contributing

Thanks for helping improve OpenFoot Manager. The project is now a web app built with React, Vite, Vercel-style API routes, Prisma, and PostgreSQL.

## Prerequisites

- Node.js LTS
- npm
- PostgreSQL
- A local `.env` file with `DATABASE_URL`

## Local Setup

Install dependencies:

```bash
npm install
```

Create the database tables:

```bash
npm run prisma:push
```

Run the app:

```bash
npm run dev
```

For API route behavior that matches Vercel more closely, use:

```bash
npx vercel dev
```

## Project Layout

- `src/` - React frontend, routes, stores, services, and UI components.
- `api/` - Vercel serverless entry points.
- `server/` - Node command handlers, game state helpers, and Prisma access.
- `server/data/` - Seed data used by the game generator.
- `prisma/` - PostgreSQL schema.
- `docs/` - Technical and gameplay documentation.
- `scripts/` - Local maintenance scripts.

## Code Style

- Keep TypeScript strict and explicit where it helps readability.
- Prefer existing components, stores, and service patterns before adding new abstractions.
- Use Prisma for database reads and writes.
- Keep command behavior in `server/gameCommands.js` or a nearby server module.
- Keep frontend API calls behind the shared `invoke()` helper in `src/lib/apiClient.ts`.

## Checks

Run the core checks before opening a pull request:

```bash
npm run prisma:validate
npm test
npm run build
```

For translation coverage and hardcoded frontend string candidates:

```bash
npm run audit:i18n
```

## Pull Requests

1. Open an issue for larger changes before starting work.
2. Use a focused branch for the change.
3. Include tests when behavior changes.
4. Update docs when setup, architecture, or gameplay behavior changes.
5. Make sure the checks above pass before requesting review.

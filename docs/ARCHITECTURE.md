# Architecture

OpenFoot Manager is now a full web application. The runtime is React on the client, Vercel-compatible Node API routes on the server, and PostgreSQL through Prisma for persistence.

## Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React + TypeScript | UI, routing, game screens, and interaction |
| Styling | Tailwind CSS | Utility-first visual system |
| State | Zustand | Client-side game and settings state |
| API | Local Node server, Vercel-compatible function | Web command boundary at `/api/commands` |
| Server logic | Node.js modules | Game command handlers and simulation helpers |
| Persistence | PostgreSQL + Prisma | Saves, sessions, manager profiles, and game data |
| Build | Vite | Frontend dev server and production bundle |
| Tests | Vitest + Testing Library | Unit and component coverage |

## Project Structure

```text
openfootmanager/
  api/
    commands.js              # Vercel-compatible HTTP entry point
  prisma/
    schema.prisma            # PostgreSQL data model
  server/
    data/                    # Default teams and names
    gameCommands.js          # Command dispatcher and mutations
    gameFactory.js           # New-game/world generation helpers
    localServer.js           # Local API server for development
    prisma.js                # Prisma client setup
    session.js               # Web session cookie and persistence helpers
  src/
    components/              # UI components and feature tabs
    hooks/                   # Shared React hooks
    i18n/                    # Translation setup and locale files
    lib/
      apiClient.ts           # Browser command client
      webWindow.ts           # Browser-safe window adapter
    pages/                   # Route-level screens
    services/                # Feature-specific command wrappers
    store/                   # Zustand stores
  docs/                      # Documentation
  scripts/                   # Maintenance scripts
```

## Request Flow

The browser calls `invoke(command, args)` from `src/lib/apiClient.ts`.

```text
React UI
  -> src/lib/apiClient.ts
  -> POST /api/commands
  -> server/session.js
  -> server/gameCommands.js
  -> Prisma
  -> PostgreSQL
```

`api/commands.js` accepts only `POST` requests. It reads `{ command, args }`, loads or creates the web session, runs the command, and returns `{ data }` or `{ error }`.

## Persistence Model

Prisma is the source of truth for database structure. The main models are:

- `WebSession` - browser session state, active save pointer, draft game, live match, settings, and imported worlds.
- `GameSave` - persisted game snapshots and stats snapshots.
- `ManagerProfile` - reusable manager identities.
- `GameMeta`, `Manager`, `Team`, `Player`, `Staff`, `League`, `Fixture`, `Standing`, `Message`, `News`, and related tables for structured game data.

The current command layer still stores broad game snapshots for speed of migration while also defining structured tables for long-term persistence work.

## Frontend State

- `gameStore` keeps active game state, manager info, and active-game flags.
- `settingsStore` loads and saves user settings through the command API.
- Feature services in `src/services/` wrap command names so components do not need to know API details.

## Routes

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `MainMenu` | New game, load game, manager profiles, settings |
| `/team-selection` | `TeamSelection` | Club selection |
| `/dashboard` | `Dashboard` | Main game workspace |
| `/match` | `MatchSimulation` | Match-day flow |
| `/settings` | `Settings` | App preferences |

## Game Command Boundary

The command boundary intentionally keeps the frontend close to its earlier service shape:

- Components call service functions or `invoke()`.
- `invoke()` posts to `/api/commands`.
- `runCommand()` in `server/gameCommands.js` maps command names to server behavior.
- Mutations update the session draft, active save, or structured Prisma tables.

This lets the existing UI stay functional while backend behavior moves into web-native modules.

## Deployment

The current priority is local development. Vite proxies `/api` to `server/localServer.js`, so the full app runs without Vercel.

Run the local stack:

```bash
npm run dev
```

Later, Vercel can host the frontend build and serverless API routes. Production will require a PostgreSQL database and a `DATABASE_URL` environment variable configured in Vercel.

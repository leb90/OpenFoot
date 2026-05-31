<div align="center">

![Openfoot logo](images/openfootlogo.svg)

[![License: GPL v3](https://img.shields.io/github/license/leb90/OpenFoot)](https://www.gnu.org/licenses/gpl-3.0)
[![React](https://shields.io/badge/-React-1434A4?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/-Prisma-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Last commit](https://img.shields.io/github/last-commit/leb90/OpenFoot)](https://github.com/leb90/OpenFoot/commits/main)

**A free and open source football management simulation game**

[Features](#features) | [Screenshots](#screenshots) | [Development](#development) | [Contributing](#contributing) | [License](#license)

</div>

---

**OpenFoot Manager** is a free and open source football/soccer manager game, licensed under the [GPLv3](LICENSE.md), inspired by classic football management sims.

## Features

- Text-based match simulation with event-driven commentary and score progression.
- Squad management for roles, depth planning, tactics, and player development.
- Transfer and contract workflows for buying, selling, and negotiating.
- Training and staff systems for long-term club improvement.
- Dynamic inbox and news generation.
- Scouting support for discovering and evaluating talent.
- PostgreSQL persistence through Prisma.
- Vercel-ready web API routes.
- React, TypeScript, Vite, Tailwind CSS, Zustand, and i18n foundations.
- Free and open source under GPLv3.

## Screenshots

Click any image to open the full-size version.

<a href="images/screenshots/inbox.png"><img src="images/screenshots/inbox.png" alt="Inbox screen" width="220" /></a>
<a href="images/screenshots/news.png"><img src="images/screenshots/news.png" alt="News screen" width="220" /></a>
<a href="images/screenshots/manage_squad.png"><img src="images/screenshots/manage_squad.png" alt="Manage squad screen" width="220" /></a>

<a href="images/screenshots/matchlive.png"><img src="images/screenshots/matchlive.png" alt="Match live screen" width="220" /></a>
<a href="images/screenshots/training.png"><img src="images/screenshots/training.png" alt="Training screen" width="220" /></a>
<a href="images/screenshots/playertalk.png"><img src="images/screenshots/playertalk.png" alt="Player talk screen" width="220" /></a>

<a href="images/screenshots/presstalk.png"><img src="images/screenshots/presstalk.png" alt="Press talk screen" width="220" /></a>

## Architecture

OpenFoot Manager is now a full web app:

- React + TypeScript + Tailwind CSS frontend.
- Vercel-compatible serverless API route at `/api/commands`.
- Node.js command layer in `server/`.
- PostgreSQL database managed with Prisma.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/WEB_MIGRATION.md](docs/WEB_MIGRATION.md).

## Development

You need Node.js LTS and PostgreSQL.

Clone and install:

```bash
git clone https://github.com/leb90/OpenFoot.git
cd OpenFoot
npm install
```

Create `.env` and set your local PostgreSQL password:

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/openFoot?schema=public"
```

Create the database tables:

```bash
npm run prisma:push
```

Run the full local app, including the Node API server:

```bash
npm run dev
```

This starts:

- Vite on `http://localhost:5173`
- Local API on `http://localhost:3001`

If PowerShell blocks `npm.ps1`, use `npm.cmd run dev`.

## Checks

```bash
npm run prisma:validate
npm test
npm run build
```

## Contributing

Contributions are welcome. For full guidelines, read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

OpenFoot Manager is licensed under GPLv3. See [LICENSE.md](LICENSE.md).

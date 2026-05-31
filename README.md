<div align="center">

![Openfoot logo](images/openfootlogo.svg)

[![License: GPL v3](https://img.shields.io/github/license/openfootmanager/openfootmanager
)](https://www.gnu.org/licenses/gpl-3.0)
[![React](https://shields.io/badge/-React-1434A4?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/-Prisma-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/openfootmanager/openfootmanager/graphs/commit-activity)
[![Last commit](https://img.shields.io/github/last-commit/openfootmanager/openfootmanager)](https://github.com/openfootmanager/openfootmanager/commits/develop)

**A free and open source football management simulation game**

[Features](#features) • [Screenshots](#screenshots) • [Installation](#installation--development) • [Contributing](#contributing) • [License](#license)

Join the community on Discord: https://discord.gg/2CXaesaukT

</div>

---

**Openfoot Manager** is a free and open source football/soccer manager game, licensed under the [GPLv3](LICENSE.md), inspired by the famous franchise Football Manager&trade;.

## FEATURES

- **Text-based match simulation** with event-driven commentary and score progression.
- **Full squad management** for roles, depth planning, and player development decisions.
- **Transfer and contract workflows** to buy, sell, and negotiate player moves.
- **Training and staff systems** to improve performance through coaching and planning.
- **Dynamic inbox and news generation** that keeps you updated on club and world events.
- **Scouting support** for discovering talent and evaluating future signings.
- **Persistent game data** backed by PostgreSQL and Prisma for web saves and progression.
- **Modern web app experience** built with React and Vercel-ready serverless APIs.
- **Multi-language support** with i18n foundations and community translation growth.
- **Free and open source** under GPLv3, with community-driven development.

## SCREENSHOTS

Click any image to open the full-size version.

<a href="images/screenshots/inbox.png"><img src="images/screenshots/inbox.png" alt="Inbox screen" width="220" /></a>
<a href="images/screenshots/news.png"><img src="images/screenshots/news.png" alt="News screen" width="220" /></a>
<a href="images/screenshots/manage_squad.png"><img src="images/screenshots/manage_squad.png" alt="Manage squad screen" width="220" /></a>

<a href="images/screenshots/matchlive.png"><img src="images/screenshots/matchlive.png" alt="Match live screen" width="220" /></a>
<a href="images/screenshots/training.png"><img src="images/screenshots/training.png" alt="Training screen" width="220" /></a>
<a href="images/screenshots/playertalk.png"><img src="images/screenshots/playertalk.png" alt="Player talk screen" width="220" /></a>

<a href="images/screenshots/presstalk.png"><img src="images/screenshots/presstalk.png" alt="Press talk screen" width="220" /></a>

## ARCHITECTURE

OpenFootManager is being migrated to a full web architecture:

- **React + TypeScript + TailwindCSS**: A highly responsive frontend interface.
- **Vercel serverless API routes**: Web command boundary replacing Tauri IPC.
- **PostgreSQL + Prisma**: Web persistence for saves, sessions, and game data.

The previous Rust/Tauri backend is still present in `src-tauri` as a parity reference during the migration. See [docs/WEB_MIGRATION.md](docs/WEB_MIGRATION.md).

## INSTALLATION & DEVELOPMENT

The game is still in early active development. For the web version you need Node.js and PostgreSQL:

1. Install **Node.js**
2. Create a PostgreSQL database
3. Copy `.env.example` to `.env` and set `DATABASE_URL`

Clone the repository and install dependencies:

```bash
git clone https://github.com/openfootmanager/openfootmanager.git
cd openfootmanager
npm install
npm run prisma:push
```

Run the Vite frontend:

```bash
npm run dev
```

For local API routes, run the app through Vercel's dev runtime, for example `npx vercel dev`.

## CONTRIBUTING

Contributions are welcome. For full guidelines, read [CONTRIBUTING](CONTRIBUTING.md).

If you want to discuss ideas, share feedback, or follow development more casually, join the Discord server: https://discord.gg/2CXaesaukT

Quick contribution checklist:

1. Open an Issue first for bugs, enhancements, or larger feature ideas.
2. Work from a feature branch and open Pull Requests targeting `develop`.
3. Run tests before submitting:

```bash
npm test
npm run prisma:validate
```

## LICENSE

    Openfoot Manager - A free and open source soccer management game
    Copyright (C) 2020-2026  Pedrenrique G. Guimarães

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

Check [LICENSE](LICENSE.md) for more information.

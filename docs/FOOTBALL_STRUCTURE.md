# Football World Structure

OpenFoot now starts careers from a country-based fictional world instead of one mixed global league. The target model still separates geography, competitions, clubs, squads, and calendars so the simulation can grow without mixing domestic structures.

## Target Model

- Countries: each country owns football identity codes, name pools, currencies, and domestic calendar defaults.
- Leagues: each country can have one or more domestic divisions with their own promotion/relegation rules.
- Clubs: clubs belong to one domestic league and country, with city, stadium, reputation, budgets, colors, facilities, and rivalries.
- Competitions: league, domestic cup, continental cup, and international competitions should be separate entities.
- Fixtures: generated per competition, not from one mixed global team list.
- Registration rules: squad size, foreign-player rules, youth requirements, transfer windows, and loan limits should be configurable per competition.

## Initial Roadmap

1. Generate one selected playable league first, then add surrounding leagues as simulated world context.
2. Split standings, fixtures, history, and news by competition ID.
3. Add domestic cup generation.
4. Add continental qualification from domestic league standings.
5. Add promotion/relegation once at least two divisions exist for a country.
6. Move generated data into normalized PostgreSQL tables when the save model is ready for migrations beyond snapshot JSON.

## First Data Step

`server/data/default_names.json` now contains country-specific first-name and surname pools for 44 football nations/markets. Player generation uses the player's nationality to mix first and last names from the matching pool, and foreign players are selected through regional/global football-market weights instead of a purely random country draw.

## Playable Country Step

`server/data/default_world.json` now defines the first fictional country-based world:

- Countries: 22 UEFA countries and all 10 CONMEBOL countries needed for Champions-style and Libertadores-style qualification pools.
- Full first-division team counts are included for each playable country. Some leagues model only the regular phase when the real structure has post-season splits or finals.
- Domestic cups and international cups are metadata only for now.
- Continental competition metadata exists for `euro_champions_cup` (36-team league phase target) and `south_american_liberators_cup` (47-team target), but those tournaments are not simulated yet.
- Each country has a domestic league definition, season window, target top-division size, relegation metadata, and fictional clubs.
- Club names are intentionally unlicensed and PES-style: based on city/color/identity patterns, not official trademarks.
- Player names are generated from the nationality pools. Key player profiles only store position, nationality, age, footedness, potential, and OVR archetype.
- Clubs without manual key-player profiles receive a deterministic 36-player archetype pack built from that club's squad-strength lines, reputation, country, and registration rules. This keeps every club playable with a full squad instead of falling back to mixed random players.
- The new career flow creates an isolated league for the selected country instead of mixing all clubs into one global table.
- Standard leagues generate round-robin schedules using the configured number of legs. Argentina generates a split-zone league phase with two interzonal match layers, while playoffs are stored as metadata for a later simulation pass.
- Country registration rules now constrain generated squads and free-agent signings. Argentina uses a six-foreign-player roster cap with five on the match sheet, Brazil uses a nine-foreign-player practical matchday cap, Spain and France apply non-EU limits, and other leagues use local/homegrown minimums until their official rules are modeled in full.
- FC Ratings and similar public rating pages are used only as manual reference for fictional archetypes. OpenFoot stores generated names and rating/position/nationality profiles, not copied real rosters or scraped site data.

The next data pass should generate continental tournaments from the stored qualification slots, then add second divisions and domestic cups as separate competitions.

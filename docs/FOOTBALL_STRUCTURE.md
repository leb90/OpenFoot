# Football World Structure

OpenFoot currently has one generated league with club templates from multiple countries. That is useful for early testing, but it is not a realistic football world. The target model should separate geography, competitions, clubs, squads, and calendars.

## Target Model

- Countries: each country owns football identity codes, name pools, currencies, and domestic calendar defaults.
- Leagues: each country can have one or more domestic divisions with their own promotion/relegation rules.
- Clubs: clubs belong to one domestic league and country, with city, stadium, reputation, budgets, colors, facilities, and rivalries.
- Competitions: league, domestic cup, continental cup, and international competitions should be separate entities.
- Fixtures: generated per competition, not from one mixed global team list.
- Registration rules: squad size, foreign-player rules, youth requirements, transfer windows, and loan limits should be configurable per competition.

## Initial Roadmap

1. Replace the mixed `default_teams.json` with a `countries -> leagues -> clubs` definition file.
2. Generate one selected playable league first, then add surrounding leagues as simulated world context.
3. Split standings, fixtures, history, and news by competition ID.
4. Add domestic cup generation.
5. Add continental qualification from domestic league standings.
6. Add promotion/relegation once at least two divisions exist for a country.
7. Move generated data into normalized PostgreSQL tables when the save model is ready for migrations beyond snapshot JSON.

## First Data Step

`server/data/default_names.json` now contains country-specific first-name and surname pools for 39 football nations/markets. Player generation uses the player's nationality to mix first and last names from the matching pool, and foreign players are selected through regional/global football-market weights instead of a purely random country draw.

## Playable Country Step

`server/data/default_world.json` now defines the first fictional country-based world:

- Countries: England, Spain, France, Germany, Italy, Netherlands, Portugal, Argentina, and Brazil.
- Each country has a domestic league definition, national cup name, season window, target top-division size, and fictional clubs.
- Club names are intentionally unlicensed and PES-style: based on city/color/identity patterns, not official trademarks.
- Player names are generated from the nationality pools. Key player profiles only store position, nationality, age, footedness, potential, and OVR archetype.
- The new career flow creates an isolated league for the selected country instead of mixing all clubs into one global table.

The next data pass should expand each country from the current playable sample into full top-division sizes, then add second divisions for promotion/relegation.

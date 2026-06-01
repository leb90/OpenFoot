# Definition Files

OpenFootManager uses **JSON definition files** to drive world generation. These files control the name pools, team templates, and other data used when creating a new game. You can customize or replace them to create your own leagues, nationalities, and more.

## File Locations

The game searches for definition files in the following order:

1. **Bundled data** — `<app-resources>/data/` (ships with the game)
2. **Hardcoded fallback** — built into the binary (always available)

If a file cannot be found or parsed, the game silently falls back to the hardcoded defaults.

## File Types

### `default_names.json` — Name Pools

Controls the first and last names used when generating players and staff.

```json
{
  "version": 1,
  "description": "My custom name pools",
  "pools": {
    "ENG": {
      "first_names": ["James", "Harry", "Jack"],
      "last_names": ["Smith", "Johnson", "Brown"]
    },
    "ES": {
      "first_names": ["Sergio", "Pablo", "Carlos"],
      "last_names": ["Garcia", "Rodriguez", "Martinez"]
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | `number` | No | Schema version (currently `1`) |
| `description` | `string` | No | Human-readable description |
| `pools` | `object` | **Yes** | Map of nationality code → name pool |
| `pools.<CODE>.first_names` | `string[]` | **Yes** | List of first names for this nationality |
| `pools.<CODE>.last_names` | `string[]` | **Yes** | List of last names for this nationality |

**Notes:**
- Codes should be uppercase short nationality codes. Most use ISO 3166-1 alpha-2 (for example `"ES"`, `"BR"`), but football nations may use project-owned codes such as `"ENG"`, `"SCO"`, `"WAL"`, and `"NIR"`.
- Legacy `"GB"` pools are still accepted and used as a fallback for British football nations when a dedicated pool is missing.
- You can add as many or as few nationalities as you like.
- The generator picks names from the pool matching the player's nationality. If a nationality has no pool entry, the English pool is used as fallback.
- More names = more variety. The bundled pools now cover 39 football nations/markets, with common-name seed data and curated football-specific gaps.
- Bundled data is seeded from the CC0 `popular-names-by-country-dataset` where available, with manually curated pools for football identities and countries where the public data is incomplete.

---

### `default_world.json` — Country-Based Career World

Controls playable countries, league metadata, fictional clubs, and squad strength profiles for the country-first career flow.

```json
{
  "version": 1,
  "continental_competitions": [
    {
      "id": "euro_champions_cup",
      "name": "Invictus Champions Cup",
      "confederation": "UEFA",
      "model": "league_phase_36",
      "entrants": 36,
      "enabled": true
    },
    {
      "id": "south_american_liberators_cup",
      "name": "Copa Libertad Continental",
      "confederation": "CONMEBOL",
      "model": "qualification_league_phase_47",
      "entrants": 47,
      "enabled": true
    }
  ],
  "countries": [
    {
      "code": "FR",
      "name": "France",
      "confederation": "UEFA",
      "continent": "Europe",
      "league": {
        "id": "fr_ligue_elite",
        "name": "French Ligue Elite",
        "format": "Double round-robin",
        "format_code": "double_round_robin",
        "round_robin_legs": 2,
        "target_teams": 18,
        "matchdays": 34,
        "season": "August-May",
        "competitions_enabled": {
          "league": true,
          "domestic_cups": false,
          "international_cups": false
        },
        "relegation": {
          "automatic": 2,
          "playoff_spots": 1
        },
        "continental_slots": {
          "champions": 3,
          "secondary": 2
        }
      },
      "teams": []
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `continental_competitions[]` | `object[]` | Planned regional competitions fed by domestic qualification slots. They are metadata until tournament simulation is implemented. |
| `countries[].code` | `string` | Football country code used by generation and selection. |
| `countries[].confederation` | `string` | Regional governing body marker such as `UEFA` or `CONMEBOL`. |
| `countries[].continent` | `string` | Display/grouping metadata for the country. |
| `countries[].league` | `object` | Domestic league metadata shown in setup and stored in saves. |
| `countries[].teams` | `TeamDef[]` | Fictional playable clubs for that country. |

#### League metadata additions

| Field | Type | Description |
|-------|------|-------------|
| `format_code` | `string` | Fixture generator mode. Current values are `double_round_robin` and `split_groups_playoffs`. |
| `round_robin_legs` | `number` | Number of times each round-robin pairing is generated. Defaults to `2`; use `1` for short phases and `4` for quadruple round-robin leagues. |
| `target_teams` | `number` | Expected first-division size for validation and setup display. |
| `matchdays` | `number` | League dates generated for the current format. |
| `competitions_enabled` | `object` | Feature flags for league, domestic cups, and international cups. Cups are currently disabled. |
| `relegation` | `object` | Metadata for automatic relegation and promotion/relegation playoff places. Lower divisions are not simulated yet. |
| `continental_slots` | `object` | Simplified qualification slots for future regional competitions. |

#### Country TeamDef additions

`default_world.json` teams support the same core fields as `default_teams.json`, plus:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Stable fictional club ID used by saves and selection. |
| `stadium_capacity` | `number` | Fixed stadium capacity. |
| `reputation` | `number` | Fixed club reputation, roughly 1-1000. |
| `finance` | `number` | Fixed starting balance. |
| `squad_strength` | `object` | Rating baseline by goalkeeper, defense, midfield, and attack. |
| `key_players` | `array` | Optional fake-player archetypes with position, nationality, age, OVR, and potential. |

**Notes:**
- Do not add official club names, official badges, or real player names.
- If a real-world reference has a high-rated French right winger, represent it as a fictional profile like `{ "position": "Forward", "detail_position": "RW", "nationality": "FR", "overall": 90 }`.
- Generated player names always come from `default_names.json`; no real roster names are stored.
- The game currently generates the selected country's league only. Other countries are selectable setup data until broader world simulation is added.
- Domestic cups and international cups should stay disabled until they are modeled as separate competition definitions.

---

### `default_teams.json` — Team Templates

Controls the teams created during world generation.

For the country-based career setup, prefer `default_world.json`. `default_teams.json` is kept as a legacy fallback for simple generated worlds.

```json
{
  "version": 1,
  "description": "My custom league",
  "teams": [
    {
      "name": "London FC",
      "short_name": "LFC",
      "city": "London",
      "country": "ENG",
      "colors": {
        "primary": "#dc2626",
        "secondary": "#ffffff"
      },
      "play_style": "Possession",
      "stadium_name": "London Arena",
      "reputation_range": [600, 900],
      "finance_range": [3000000, 10000000]
    }
  ]
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `version` | `number` | No | `0` | Schema version |
| `description` | `string` | No | `""` | Human-readable description |
| `teams` | `TeamDef[]` | **Yes** | — | Array of team definitions |

#### TeamDef

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | `string` | **Yes** | — | Full team name |
| `short_name` | `string` | No | Auto-generated from initials | 2-3 letter abbreviation |
| `city` | `string` | **Yes** | — | City name |
| `country` | `string` | **Yes** | — | Team location / football identity code |
| `colors.primary` | `string` | **Yes** | — | Primary color (hex, e.g. `"#dc2626"`) |
| `colors.secondary` | `string` | **Yes** | — | Secondary color (hex) |
| `play_style` | `string` | No | `"Balanced"` | One of: `Attacking`, `Defensive`, `Possession`, `Counter`, `HighPress`, `Balanced` |
| `stadium_name` | `string` | No | `"<city> Arena"` | Stadium name |
| `reputation_range` | `[min, max]` | No | `[300, 900]` | Random reputation range (0-1000) |
| `finance_range` | `[min, max]` | No | `[500000, 10000000]` | Random starting finance range |

**Notes:**
- The number of teams determines the league size. Must be an **even** number ≥ 2 for schedule generation.
- Each team gets 36 players (3 GK, 13 DEF, 11 MID, 9 FWD) and 4 staff (AssistantManager, Coach, Scout, Physio).
- Player nationalities are weighted toward the team's country, then realistic regional transfer markets, with only a small chance of wider global football markets.
- 12 free-agent staff are also generated regardless of team count.

---

## Country Codes

Nationality and team-country fields use short uppercase codes. Most are **ISO 3166-1 alpha-2**, but football nations can use dedicated codes where needed. Common codes:

| Code | Country |
|------|---------|
| `ENG` | England |
| `SCO` | Scotland |
| `WAL` | Wales |
| `NIR` | Northern Ireland |
| `IE` | Republic of Ireland |
| `GB` | Legacy British umbrella code, still accepted for compatibility |
| `ES` | Spain |
| `DE` | Germany |
| `FR` | France |
| `IT` | Italy |
| `NL` | Netherlands |
| `PT` | Portugal |
| `BR` | Brazil |
| `AR` | Argentina |
| `BE` | Belgium |
| `AT` | Austria |
| `CH` | Switzerland |
| `DK` | Denmark |
| `NO` | Norway |
| `PL` | Poland |
| `TR` | Turkey |
| `GR` | Greece |
| `CZ` | Czechia |
| `RS` | Serbia |
| `US` | United States |
| `MX` | Mexico |
| `UY` | Uruguay |
| `CO` | Colombia |
| `CL` | Chile |
| `PY` | Paraguay |
| `JP` | Japan |
| `KR` | South Korea |
| `MA` | Morocco |
| `NG` | Nigeria |
| `SA` | Saudi Arabia |
| `HR` | Croatia |
| `SE` | Sweden |

For the full ISO list, see [ISO 3166-1 alpha-2 on Wikipedia](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2). Football-specific codes are defined by the game itself.

---

## World Database Files

In addition to definition files (which control _generation_), the game also supports **world database files** — pre-built worlds saved as JSON. These are a complete snapshot of teams, players, and staff.

World databases can be:
- **Exported** from an existing game via Settings → Export World Database
- **Imported** when creating a new game via the "Import" option

World database format matches the internal `WorldData` structure:

```json
{
  "name": "My Custom World",
  "description": "A hand-crafted league with 20 teams",
  "teams": [ /* full Team objects */ ],
  "players": [ /* full Player objects */ ],
  "staff": [ /* full Staff objects */ ]
}
```

These files are placed in:
- `<app-resources>/databases/` for bundled worlds
- `<app-data>/databases/` for user-imported worlds

---

## Creating Your Own

1. **Start simple** — Copy `default_names.json` and `default_teams.json` from the `data/` directory.
2. **Edit** — Add your own teams, cities, name pools. Use any text editor.
3. **Place** — Put your files in the game's `data/` directory (for definition files) or `databases/` directory (for world databases).
4. **Test** — Start a new game and verify your changes appear.

### Tips

- Keep at least 10 first names and 10 last names per nationality for good variety.
- Team count should be even (4, 8, 12, 16, 20...).
- Colors should be valid CSS hex colors.
- If a file has a JSON syntax error, the game silently uses defaults — check your JSON with a validator if things don't appear.

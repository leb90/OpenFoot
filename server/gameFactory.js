import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const teamsDefinition = JSON.parse(
  readFileSync(new URL("./data/default_teams.json", import.meta.url), "utf8"),
);
const namesDefinition = JSON.parse(
  readFileSync(new URL("./data/default_names.json", import.meta.url), "utf8"),
);
const worldDefinition = JSON.parse(
  readFileSync(new URL("./data/default_world.json", import.meta.url), "utf8"),
);

const DEFAULT_SETTINGS = {
  theme: "dark",
  language: "en",
  currency: "EUR",
  default_match_mode: "live",
  auto_save: true,
  match_speed: "normal",
  show_match_commentary: true,
  confirm_advance: false,
  ui_scale: "normal",
  high_contrast: false,
};

const SUPPORTED_CURRENCIES = [
  { code: "EUR", symbol: "EUR", exchange_rate: 1 },
  { code: "GBP", symbol: "GBP", exchange_rate: 0.86 },
  { code: "USD", symbol: "USD", exchange_rate: 1.08 },
];

const POSITIONS_BY_SLOT = [
  "Goalkeeper",
  "Goalkeeper",
  "Defender",
  "Defender",
  "Defender",
  "Defender",
  "Defender",
  "Defender",
  "Defender",
  "Midfielder",
  "Midfielder",
  "Midfielder",
  "Midfielder",
  "Midfielder",
  "Midfielder",
  "Midfielder",
  "Forward",
  "Forward",
  "Forward",
  "Forward",
  "Forward",
  "Forward",
];

const GLOBAL_FOOTBALL_MARKET = [
  "BR",
  "AR",
  "UY",
  "CO",
  "CL",
  "PY",
  "US",
  "MX",
  "MA",
  "NG",
  "JP",
  "KR",
  "SA",
];

const REGIONAL_FOOTBALL_MARKETS = {
  ENG: ["SCO", "WAL", "NIR", "IE", "FR", "NL", "BE", "PT", "ES", "BR", "AR"],
  SCO: ["ENG", "WAL", "NIR", "IE", "GB"],
  WAL: ["ENG", "SCO", "NIR", "IE", "GB"],
  NIR: ["ENG", "SCO", "WAL", "IE", "GB"],
  IE: ["ENG", "SCO", "WAL", "NIR", "GB"],
  ES: ["AR", "BR", "UY", "CO", "CL", "PY", "PT", "FR"],
  PT: ["BR", "ES", "AR", "UY", "FR", "MA"],
  FR: ["BE", "MA", "BR", "AR", "ES", "IT", "CH"],
  DE: ["AT", "CH", "NL", "PL", "CZ", "TR", "HR", "RS"],
  IT: ["AR", "BR", "HR", "RS", "FR", "CH", "ES"],
  NL: ["BE", "DE", "DK", "NO", "SE", "BR", "AR"],
  BE: ["FR", "NL", "DE", "MA", "BR"],
  BR: ["AR", "UY", "CO", "CL", "PY", "PT"],
  AR: ["UY", "BR", "CO", "CL", "PY", "ES"],
  US: ["MX", "BR", "AR", "CO", "CL", "PY"],
  MX: ["US", "AR", "BR", "CO", "CL", "PY"],
  JP: ["KR", "BR", "AR"],
  KR: ["JP", "BR", "AR"],
  SA: ["MA", "NG", "BR", "AR", "TR"],
  TR: ["DE", "AT", "GR", "RS", "HR", "MA"],
  GR: ["TR", "RS", "HR", "IT"],
  AT: ["DE", "CH", "CZ", "HR", "RS"],
  CH: ["DE", "FR", "IT", "AT"],
  DK: ["NO", "SE", "NL", "DE"],
  NO: ["DK", "SE", "NL", "ENG"],
  SE: ["DK", "NO", "NL", "ENG"],
  HR: ["RS", "IT", "AT", "DE"],
  RS: ["HR", "GR", "TR", "AT", "DE"],
  CZ: ["DE", "AT", "PL", "SK"],
  PL: ["DE", "CZ", "AT", "TR"],
};

const MATCH_ROLE_DEFAULTS = {
  captain: null,
  vice_captain: null,
  penalty_taker: null,
  free_kick_taker: null,
  corner_taker: null,
};

export { DEFAULT_SETTINGS, SUPPORTED_CURRENCIES };

export function getDefaultSettings(settings = {}) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  const currency =
    SUPPORTED_CURRENCIES.find((item) => item.code === merged.currency) ??
    SUPPORTED_CURRENCIES[0];

  return {
    settings: merged,
    currency,
    supported_currencies: SUPPORTED_CURRENCIES,
  };
}

function randomInt(min, maxExclusive) {
  return Math.floor(Math.random() * (maxExclusive - min)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function choice(values) {
  return values[randomInt(0, values.length)];
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function rfc3339(date) {
  return date.toISOString().replace(".000Z", "+00:00");
}

function startDateForYear(year) {
  return new Date(Date.UTC(year, 6, 1, 0, 0, 0));
}

function currentDateForPhase(year, phase) {
  const start = startDateForYear(year);
  return phase === "midSeason" ? addDays(start, 120) : start;
}

function calculateAge(dob, referenceDate) {
  const birth = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;

  let age = referenceDate.getUTCFullYear() - birth.getUTCFullYear();
  const hasHadBirthday =
    referenceDate.getUTCMonth() > birth.getUTCMonth() ||
    (referenceDate.getUTCMonth() === birth.getUTCMonth() &&
      referenceDate.getUTCDate() >= birth.getUTCDate());

  if (!hasHadBirthday) age -= 1;
  return age;
}

function namePoolFor(nationality) {
  const pools = namesDefinition.pools ?? {};
  return pools[nationality] ?? pools.ENG ?? Object.values(pools)[0];
}

function availableNamePoolCodes() {
  return Object.keys(namesDefinition.pools ?? {});
}

function availableCodes(codes) {
  const pools = namesDefinition.pools ?? {};
  return codes.filter((code) => Boolean(pools[code]));
}

function generatePlayerNationality(teamCountry) {
  const pools = namesDefinition.pools ?? {};
  const domestic = pools[teamCountry] ? teamCountry : "ENG";
  const roll = Math.random();

  if (roll < 0.68) {
    return domestic;
  }

  const regionalCodes = availableCodes(REGIONAL_FOOTBALL_MARKETS[domestic] ?? []);
  if (roll < 0.92 && regionalCodes.length > 0) {
    return choice(regionalCodes);
  }

  const globalCodes = availableCodes(GLOBAL_FOOTBALL_MARKET);
  return choice(globalCodes.length > 0 ? globalCodes : availableNamePoolCodes());
}

function generateName(nationality) {
  const pool = namePoolFor(nationality);
  return {
    firstName: choice(pool.first_names),
    lastName: choice(pool.last_names),
  };
}

function generateAttributes(position) {
  const isGoalkeeper = position === "Goalkeeper";
  const isDefender = position === "Defender";
  const isForward = position === "Forward";

  return {
    pace: randomInt(40, 95),
    stamina: randomInt(40, 95),
    strength: randomInt(40, 95),
    agility: randomInt(40, 95),
    passing: randomInt(40, 95),
    shooting: isGoalkeeper ? randomInt(20, 50) : randomInt(40, 95),
    tackling: isGoalkeeper || isForward ? randomInt(20, 60) : randomInt(40, 95),
    dribbling: isGoalkeeper ? randomInt(20, 50) : randomInt(40, 95),
    defending: isGoalkeeper
      ? randomInt(25, 55)
      : isDefender
        ? randomInt(55, 95)
        : randomInt(40, 95),
    positioning: randomInt(40, 95),
    vision: randomInt(40, 95),
    decisions: randomInt(40, 95),
    composure: randomInt(40, 95),
    aggression: randomInt(30, 90),
    teamwork: randomInt(45, 95),
    leadership: randomInt(30, 90),
    handling: isGoalkeeper ? randomInt(50, 95) : randomInt(10, 35),
    reflexes: isGoalkeeper ? randomInt(50, 95) : randomInt(20, 50),
    aerial: isGoalkeeper
      ? randomInt(50, 95)
      : isDefender
        ? randomInt(45, 90)
        : randomInt(30, 75),
  };
}

function playerOvr(position, attrs) {
  const weights = playerOvrWeights(position);
  return Math.round(weights.reduce((sum, key) => sum + attrs[key], 0) / weights.length);
}

function playerOvrWeights(position) {
  if (position === "Goalkeeper") {
    return ["handling", "reflexes", "aerial", "positioning", "decisions"];
  }
  if (position === "Defender") {
    return ["defending", "tackling", "strength", "positioning", "aerial"];
  }
  if (position === "Forward") {
    return ["shooting", "dribbling", "pace", "composure", "positioning"];
  }
  return ["passing", "vision", "decisions", "stamina", "teamwork"];
}

function generateAttributesForOvr(position, targetOvr) {
  const target = clamp(Number(targetOvr) || 60, 35, 99);
  const attributes = generateAttributes(position);
  const primaryKeys = playerOvrWeights(position);

  Object.keys(attributes).forEach((key) => {
    const bias = primaryKeys.includes(key) ? 0 : -randomInt(4, 13);
    attributes[key] = clamp(target + bias + randomInt(-3, 4), 20, 99);
  });

  const correction = target - playerOvr(position, attributes);
  primaryKeys.forEach((key) => {
    attributes[key] = clamp(attributes[key] + correction, 20, 99);
  });

  return attributes;
}

function defaultPlayerStats() {
  return {
    appearances: 0,
    goals: 0,
    assists: 0,
    clean_sheets: 0,
    yellow_cards: 0,
    red_cards: 0,
    avg_rating: 0,
    minutes_played: 0,
    shots: 0,
    shots_on_target: 0,
    passes_completed: 0,
    passes_attempted: 0,
    tackles_won: 0,
    interceptions: 0,
    fouls_committed: 0,
  };
}

function ratingBaseForPosition(team, position) {
  const strength = team.squad_strength ?? {};
  if (position === "Goalkeeper") return strength.goalkeeper ?? team.reputation / 10;
  if (position === "Defender") return strength.defense ?? team.reputation / 10;
  if (position === "Forward") return strength.attack ?? team.reputation / 10;
  return strength.midfield ?? team.reputation / 10;
}

function generatedRatingForSlot(team, position, slot) {
  const base = ratingBaseForPosition(team, position);
  const depthPenalty = slot % 2 === 0 ? 0 : randomInt(1, 5);
  return clamp(Math.round(base + randomInt(-3, 4) - depthPenalty), 45, 92);
}

function playerProfileForSlot(profiles, position) {
  const index = profiles.findIndex((profile) => profile.position === position);
  if (index === -1) return null;
  return profiles.splice(index, 1)[0];
}

function generatePlayer(team, slot, startYear, profile = null) {
  const nationality = profile?.nationality ?? generatePlayerNationality(team.country);
  const { firstName, lastName } = generateName(nationality);
  const position = profile?.position ?? POSITIONS_BY_SLOT[slot] ?? "Midfielder";
  const age =
    profile?.age ??
    (slot === 8 || slot === 15 || slot === 21 ? randomInt(17, 22) : randomInt(18, 35));
  const dob = `${startYear - age}-${String(randomInt(1, 13)).padStart(2, "0")}-${String(
    randomInt(1, 29),
  ).padStart(2, "0")}`;
  const targetOvr = profile?.overall ?? generatedRatingForSlot(team, position, slot);
  const attributes = generateAttributesForOvr(position, targetOvr);
  const ovr = playerOvr(position, attributes);
  const potential =
    profile?.potential ??
    Math.min(99, ovr + randomInt(age <= 23 ? 6 : 0, age <= 23 ? 18 : 8));
  const marketValue = Math.round(ovr * ovr * (age <= 23 ? 900 : age <= 29 ? 700 : 420));

  return {
    id: randomUUID(),
    match_name: lastName,
    full_name: `${firstName} ${lastName}`,
    date_of_birth: dob,
    nationality,
    football_nation: nationality,
    birth_country: nationality,
    position,
    natural_position: position,
    alternate_positions: profile?.detail_position ? [profile.detail_position] : [],
    footedness: profile?.footedness ?? (Math.random() < 0.25 ? "Left" : "Right"),
    weak_foot: randomInt(2, 5),
    training_focus: null,
    attributes,
    condition: randomInt(78, 100),
    morale: randomInt(45, 78),
    fitness: 75,
    injury: null,
    team_id: team.id,
    retired: false,
    squad_role: age <= 20 ? "Youth" : "Senior",
    contract_end: `${startYear + randomInt(1, 5)}-06-30`,
    wage: Math.max(500, Math.round(marketValue / 210)),
    market_value: marketValue,
    stats: defaultPlayerStats(),
    career: [],
    transfer_listed: false,
    loan_listed: false,
    transfer_offers: [],
    traits: profile?.traits ?? [],
    morale_core: {
      manager_trust: 50,
      unresolved_issue: null,
      recent_treatment: null,
      pending_promise: null,
      talk_cooldown_until: null,
      renewal_state: null,
    },
    ovr,
    potential,
  };
}

function generatePlayersForTeam(team, startYear) {
  const profiles = [...(team.player_profiles ?? [])];

  return POSITIONS_BY_SLOT.map((position, slot) =>
    generatePlayer(team, slot, startYear, playerProfileForSlot(profiles, position)),
  );
}

function generateStaff(team, role, startYear) {
  const { firstName, lastName } = generateName(team.country);
  const age = randomInt(30, 61);

  return {
    id: randomUUID(),
    first_name: firstName,
    last_name: lastName,
    date_of_birth: `${startYear - age}-${String(randomInt(1, 13)).padStart(2, "0")}-${String(
      randomInt(1, 29),
    ).padStart(2, "0")}`,
    nationality: team.country,
    football_nation: team.country,
    birth_country: team.country,
    role,
    attributes: {
      coaching: role === "Scout" ? randomInt(20, 55) : randomInt(50, 88),
      judging_ability: role === "Scout" ? randomInt(60, 92) : randomInt(35, 80),
      judging_potential: role === "Scout" ? randomInt(58, 92) : randomInt(35, 78),
      physiotherapy: role === "Physio" ? randomInt(62, 95) : randomInt(20, 55),
    },
    team_id: team.id,
    specialization: null,
    wage: randomInt(900, 4500),
    contract_end: `${startYear + randomInt(1, 4)}-06-30`,
  };
}

function selectedCountryFor(options = {}) {
  const countries = worldDefinition.countries ?? [];
  const requestedCode = options.countryCode ?? options.country_code;
  return (
    countries.find((country) => country.code === requestedCode) ??
    countries.find((country) => country.code === "ENG") ??
    null
  );
}

function teamTemplatesFor(country) {
  return country?.teams?.length ? country.teams : teamsDefinition.teams;
}

function generatedTeamId(country, index) {
  return country ? `${country.code.toLowerCase()}_team_${index + 1}` : `team_${index + 1}`;
}

function generateTeams(startYear, country = null) {
  const teamTemplates = teamTemplatesFor(country);
  return teamTemplates.map((template, index) => {
    const [minRep, maxRep] = template.reputation_range ?? [400, 800];
    const [minFinance, maxFinance] = template.finance_range ?? [1000000, 8000000];
    const reputation = template.reputation ?? randomInt(minRep, maxRep + 1);
    const finance = template.finance ?? randomInt(minFinance, maxFinance + 1);
    const teamCountry = template.country ?? country?.code ?? "ENG";
    const leagueId = country?.league?.id ?? "league";
    const historyTeamCount = teamTemplates.length;

    return {
      id: template.id ?? generatedTeamId(country, index),
      name: template.name,
      short_name: template.short_name,
      country: teamCountry,
      football_nation: teamCountry,
      league_id: leagueId,
      cup_id: country?.league?.cup_name ? `${leagueId}_cup` : null,
      city: template.city,
      stadium_name: template.stadium_name,
      stadium_capacity: template.stadium_capacity ?? randomInt(18000, 76000),
      finance,
      manager_id: null,
      reputation,
      wage_budget: reputation * 420,
      transfer_budget: reputation * 4200,
      season_income: 0,
      season_expenses: 0,
      financial_ledger: [],
      formation: "4-4-2",
      play_style: template.play_style ?? "Balanced",
      squad_strength: template.squad_strength ?? null,
      player_profiles: template.key_players ?? [],
      training_focus: "Physical",
      training_intensity: "Medium",
      training_schedule: "Balanced",
      training_groups: [],
      founded_year: randomInt(1880, 1998),
      colors: template.colors ?? { primary: "#10b981", secondary: "#ffffff" },
      facilities: { training: 1, medical: 1, scouting: 1 },
      sponsorship: null,
      starting_xi_ids: [],
      match_roles: { ...MATCH_ROLE_DEFAULTS },
      form: [],
      history: Array.from({ length: 3 }, (_, seasonOffset) => ({
        season: startYear - (3 - seasonOffset),
        league_position: randomInt(1, historyTeamCount + 1),
        played: Math.max(1, (historyTeamCount - 1) * 2),
        won: randomInt(8, 22),
        drawn: randomInt(4, 10),
        lost: randomInt(4, 16),
        goals_for: randomInt(32, 78),
        goals_against: randomInt(25, 68),
      })),
    };
  });
}

function buildRoundRobinRoundData(teamIds) {
  const teams = teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, null];
  const rounds = teams.length - 1;
  const schedule = [];
  let rotation = [...teams];

  for (let round = 0; round < rounds; round += 1) {
    const roundMatches = [];
    const byes = [];
    for (let index = 0; index < rotation.length / 2; index += 1) {
      const home = rotation[index];
      const away = rotation[rotation.length - 1 - index];
      if (!home || !away) {
        if (home) byes.push(home);
        if (away) byes.push(away);
        continue;
      }
      roundMatches.push({
        home_team_id: round % 2 === 0 ? home : away,
        away_team_id: round % 2 === 0 ? away : home,
      });
    }
    schedule.push({ matches: roundMatches, byes });
    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
  }

  return schedule;
}

function buildRoundRobinRounds(teamIds) {
  return buildRoundRobinRoundData(teamIds).map((round) => round.matches);
}

function buildRoundRobinFixtures(teamIds, startDate, { legs = 2, fixturePrefix = "fix" } = {}) {
  const rounds = buildRoundRobinRounds(teamIds);
  const fixtures = [];

  for (let leg = 0; leg < legs; leg += 1) {
    rounds.forEach((roundMatches, roundIndex) => {
      const matchday = leg * rounds.length + roundIndex + 1;
      const matchDate = isoDate(addDays(startDate, (matchday - 1) * 7));
      roundMatches.forEach((match, index) => {
        fixtures.push({
          id: `${fixturePrefix}_${matchday}_${index + 1}`,
          matchday,
          date: matchDate,
          home_team_id: leg % 2 === 0 ? match.home_team_id : match.away_team_id,
          away_team_id: leg % 2 === 0 ? match.away_team_id : match.home_team_id,
          competition: "League",
          status: "Scheduled",
          result: null,
        });
      });
    });
  }

  return fixtures;
}

function buildSplitGroupFixtures(teamIds, startDate) {
  const zoneA = teamIds.filter((_, index) => index % 2 === 0);
  const zoneB = teamIds.filter((_, index) => index % 2 === 1);
  const zoneRounds = [buildRoundRobinRoundData(zoneA), buildRoundRobinRoundData(zoneB)];
  const maxRounds = Math.max(...zoneRounds.map((rounds) => rounds.length));
  const fixtures = [];

  zoneRounds.forEach((rounds, zoneIndex) => {
    rounds.forEach((roundData, roundIndex) => {
      const matchday = roundIndex + 1;
      const matchDate = isoDate(addDays(startDate, (matchday - 1) * 7));
      roundData.matches.forEach((match, index) => {
        fixtures.push({
          id: `fix_zone_${zoneIndex + 1}_${matchday}_${index + 1}`,
          matchday,
          date: matchDate,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          competition: "League",
          group_id: `zone_${zoneIndex + 1}`,
          status: "Scheduled",
          result: null,
        });
      });
    });
  });

  for (let roundIndex = 0; roundIndex < maxRounds; roundIndex += 1) {
    const homeTeamId = zoneRounds[0][roundIndex]?.byes[0];
    const awayTeamId = zoneRounds[1][roundIndex]?.byes[0];
    if (!homeTeamId || !awayTeamId) continue;
    const matchday = roundIndex + 1;
    const matchDate = isoDate(addDays(startDate, (matchday - 1) * 7));
    fixtures.push({
      id: `fix_interzonal_bye_${matchday}`,
      matchday,
      date: matchDate,
      home_team_id: roundIndex % 2 === 0 ? homeTeamId : awayTeamId,
      away_team_id: roundIndex % 2 === 0 ? awayTeamId : homeTeamId,
      competition: "League",
      group_id: "interzonal",
      status: "Scheduled",
      result: null,
    });
  }

  const matchday = maxRounds + 1;
  const matchDate = isoDate(addDays(startDate, (matchday - 1) * 7));
  zoneA.forEach((homeTeamId, index) => {
    const awayTeamId = zoneB[(index + 1) % zoneB.length];
    fixtures.push({
      id: `fix_interzonal_extra_${index + 1}`,
      matchday,
      date: matchDate,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      competition: "League",
      group_id: "interzonal",
      status: "Scheduled",
      result: null,
    });
  });

  return fixtures;
}

function buildFixturesForLeague(teamIds, startDate, leagueDefinition = {}) {
  if (leagueDefinition.format_code === "split_groups_playoffs") {
    return buildSplitGroupFixtures(teamIds, startDate);
  }

  return buildRoundRobinFixtures(teamIds, startDate, { legs: 2 });
}

function buildLeague(teams, startYear, currentDate, country = null) {
  const seasonStart = addDays(startDateForYear(startYear), 30);
  const fixtures = buildFixturesForLeague(
    teams.map((team) => team.id),
    seasonStart,
    country?.league,
  );
  const standings = teams.map((team) => ({
    team_id: team.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
  }));

  return {
    id: country?.league?.id ?? `league_${startYear}`,
    name: country?.league?.name ?? "Premier Division",
    country_code: country?.code ?? null,
    format: country?.league?.format ?? "Double round-robin",
    format_code: country?.league?.format_code ?? "double_round_robin",
    matchdays: country?.league?.matchdays ?? Math.max(1, teams.length - 1) * 2,
    expected_fixture_count: fixtures.length,
    relegation: country?.league?.relegation ?? null,
    competitions_enabled: country?.league?.competitions_enabled ?? {
      league: true,
      domestic_cups: false,
      international_cups: false,
    },
    domestic_cup: null,
    season: startYear,
    fixtures,
    standings,
    transfer_log: [],
    transfer_rumours: [],
    currentDate,
  };
}

function seasonContext(startYear, currentDate) {
  const start = isoDate(addDays(startDateForYear(startYear), 30));
  const end = `${startYear + 1}-05-31`;
  const current = new Date(`${currentDate.split("T")[0]}T00:00:00Z`);
  const seasonStart = new Date(`${start}T00:00:00Z`);
  const daysUntilStart = Math.max(0, Math.round((seasonStart - current) / 86400000));

  return {
    phase: daysUntilStart > 0 ? "Preseason" : "InSeason",
    season_start: start,
    season_end: end,
    days_until_season_start: daysUntilStart,
    transfer_window: {
      status: "Open",
      opens_on: `${startYear}-07-01`,
      closes_on: `${startYear}-08-31`,
      days_until_opens: null,
      days_remaining: 61,
    },
  };
}

export function createGameState({
  firstName,
  lastName,
  dob,
  nationality,
  startupOptions,
}) {
  const startYear = Number(startupOptions?.startYear) || new Date().getUTCFullYear();
  const startPhase = startupOptions?.startPhase === "midSeason" ? "midSeason" : "seasonStart";
  const country = selectedCountryFor(startupOptions);
  const startDate = startDateForYear(startYear);
  const currentDate = currentDateForPhase(startYear, startPhase);
  const age = calculateAge(dob, currentDate);

  if (!firstName?.trim() || !lastName?.trim()) {
    throw new Error("be.error.createManager.nameRequired");
  }
  if (age === null) {
    throw new Error("be.error.createManager.invalidDobFormat");
  }
  if (age < 30) {
    throw new Error("be.error.createManager.minAge");
  }
  if (age > 99) {
    throw new Error("be.error.createManager.invalidDob");
  }

  const teams = generateTeams(startYear, country);
  const players = teams.flatMap((team) => generatePlayersForTeam(team, startYear));
  const staff = teams.flatMap((team) =>
    ["AssistantManager", "Coach", "Scout", "Physio"].map((role) =>
      generateStaff(team, role, startYear),
    ),
  );
  const currentDateString = rfc3339(currentDate);

  return {
    clock: {
      start_date: rfc3339(startDate),
      current_date: currentDateString,
    },
    manager: {
      id: "mgr_user",
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dob,
      nationality,
      football_nation: nationality,
      birth_country: nationality,
      reputation: 500,
      satisfaction: 100,
      fan_approval: 50,
      team_id: null,
      warning_stage: 0,
      career_stats: {
        matches_managed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        trophies: 0,
        best_finish: null,
      },
      career_history: [],
    },
    managers: [],
    teams,
    players,
    staff,
    messages: [],
    news: [],
    league: buildLeague(teams, startYear, currentDateString, country),
    world: country
      ? {
          country_code: country.code,
          country_name: country.name,
          league_id: country.league.id,
          league_name: country.league.name,
          cup_name: null,
          competitions_enabled: country.league.competitions_enabled,
          legal_names: "fictional",
        }
      : null,
    scouting_assignments: [],
    youth_scouting_assignments: [],
    board_objectives: [
      {
        id: "obj_league_position",
        description: "Finish in the top half",
        target: Math.ceil(teams.length / 2),
        objective_type: "LeaguePosition",
        met: false,
      },
    ],
    season_context: seasonContext(startYear, currentDateString),
  };
}

export function listPlayableCountries() {
  return (worldDefinition.countries ?? []).map((country) => ({
    code: country.code,
    name: country.name,
    league: country.league,
    team_count: country.teams?.length ?? 0,
    teams: (country.teams ?? []).map((team) => ({
      id: team.id,
      name: team.name,
      short_name: team.short_name,
      city: team.city,
      country: country.code,
      stadium_name: team.stadium_name,
      stadium_capacity: team.stadium_capacity,
      reputation: team.reputation,
      finance: team.finance,
      colors: team.colors,
      play_style: team.play_style,
      avg_overall: Math.round(
        ((team.squad_strength?.goalkeeper ?? 70) +
          (team.squad_strength?.defense ?? 70) +
          (team.squad_strength?.midfield ?? 70) +
          (team.squad_strength?.attack ?? 70)) /
          4,
      ),
    })),
  }));
}

export function defaultSaveName(game) {
  return `${game.manager.first_name} ${game.manager.last_name}'s Career`;
}

export function managerName(game) {
  return `${game.manager.first_name} ${game.manager.last_name}`;
}

export function managerTeamName(game) {
  return (
    game.teams.find((team) => team.id === game.manager.team_id)?.name ?? ""
  );
}

export function addWelcomeMessages(game, team) {
  const date = game.clock.current_date;
  const manager = managerName(game);
  game.messages.push({
    id: randomUUID(),
    subject: `Welcome to ${team.name}`,
    body: `The board has confirmed your appointment at ${team.name}. Your first task is to review the squad, staff, training plan and preseason schedule.`,
    sender: "Board",
    sender_role: "Chairperson",
    date,
    read: false,
    category: "Board",
    priority: "Normal",
    actions: [],
    context: {
      team_id: team.id,
      player_id: null,
      fixture_id: null,
      match_result: null,
    },
    subject_key: "be.msg.welcome.subject0",
    body_key: "be.msg.welcome.body0",
    sender_key: "be.sender.boardOfDirectors",
    sender_role_key: "be.role.chairman",
    i18n_params: {
      team: team.name,
      manager,
    },
  });

  game.news.push({
    id: randomUUID(),
    headline: `${manager} appointed ${team.name} manager`,
    body: `${team.name} have named ${manager} as their new manager.`,
    source: "OpenFoot News",
    date,
    category: "ManagerialChange",
    team_ids: [team.id],
    player_ids: [],
    match_score: null,
    read: false,
    headline_key: "be.news.managerialAppointment.headline",
    body_key: "be.news.managerialAppointment.body",
    source_key: "be.source.openFootNews",
    i18n_params: {
      team: team.name,
      manager,
    },
  });
}

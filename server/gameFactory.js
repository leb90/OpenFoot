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

const SQUAD_SLOT_PLAN = [
  { position: "Goalkeeper", detail_position: "Goalkeeper", age_band: "prime", squad_role: "Senior", rating_offset: 1 },
  { position: "Goalkeeper", detail_position: "Goalkeeper", age_band: "rotation", squad_role: "Senior", rating_offset: -4 },
  { position: "Goalkeeper", detail_position: "Goalkeeper", age_band: "prospect", squad_role: "Youth", rating_offset: -9 },

  { position: "Defender", detail_position: "RightBack", age_band: "prime", squad_role: "Senior", rating_offset: 0 },
  { position: "Defender", detail_position: "CenterBack", age_band: "prime", squad_role: "Senior", rating_offset: 1 },
  { position: "Defender", detail_position: "CenterBack", age_band: "prime", squad_role: "Senior", rating_offset: 0 },
  { position: "Defender", detail_position: "LeftBack", age_band: "prime", squad_role: "Senior", rating_offset: 0 },
  { position: "Defender", detail_position: "RightBack", age_band: "rotation", squad_role: "Senior", rating_offset: -4 },
  { position: "Defender", detail_position: "CenterBack", age_band: "rotation", squad_role: "Senior", rating_offset: -3 },
  { position: "Defender", detail_position: "CenterBack", age_band: "rotation", squad_role: "Senior", rating_offset: -5 },
  { position: "Defender", detail_position: "LeftBack", age_band: "rotation", squad_role: "Senior", rating_offset: -4 },
  { position: "Defender", detail_position: "WingBack", age_band: "young", squad_role: "Senior", rating_offset: -6 },
  { position: "Defender", detail_position: "CenterBack", age_band: "veteran", squad_role: "Senior", rating_offset: -5 },
  { position: "Defender", detail_position: "FullBack", age_band: "young", squad_role: "Senior", rating_offset: -7 },
  { position: "Defender", detail_position: "CenterBack", age_band: "prospect", squad_role: "Youth", rating_offset: -9 },
  { position: "Defender", detail_position: "FullBack", age_band: "prospect", squad_role: "Youth", rating_offset: -10 },

  { position: "Midfielder", detail_position: "DefensiveMidfielder", age_band: "prime", squad_role: "Senior", rating_offset: 1 },
  { position: "Midfielder", detail_position: "CentralMidfielder", age_band: "prime", squad_role: "Senior", rating_offset: 1 },
  { position: "Midfielder", detail_position: "CentralMidfielder", age_band: "prime", squad_role: "Senior", rating_offset: 0 },
  { position: "Midfielder", detail_position: "AttackingMidfielder", age_band: "prime", squad_role: "Senior", rating_offset: 1 },
  { position: "Midfielder", detail_position: "WideMidfielder", age_band: "rotation", squad_role: "Senior", rating_offset: -3 },
  { position: "Midfielder", detail_position: "CentralMidfielder", age_band: "rotation", squad_role: "Senior", rating_offset: -4 },
  { position: "Midfielder", detail_position: "DefensiveMidfielder", age_band: "rotation", squad_role: "Senior", rating_offset: -5 },
  { position: "Midfielder", detail_position: "AttackingMidfielder", age_band: "rotation", squad_role: "Senior", rating_offset: -4 },
  { position: "Midfielder", detail_position: "WideMidfielder", age_band: "young", squad_role: "Senior", rating_offset: -6 },
  { position: "Midfielder", detail_position: "CentralMidfielder", age_band: "prospect", squad_role: "Youth", rating_offset: -8 },
  { position: "Midfielder", detail_position: "AttackingMidfielder", age_band: "young", squad_role: "Senior", rating_offset: -7 },

  { position: "Forward", detail_position: "Striker", age_band: "prime", squad_role: "Senior", rating_offset: 1 },
  { position: "Forward", detail_position: "RightWinger", age_band: "prime", squad_role: "Senior", rating_offset: 1 },
  { position: "Forward", detail_position: "LeftWinger", age_band: "prime", squad_role: "Senior", rating_offset: 1 },
  { position: "Forward", detail_position: "Striker", age_band: "rotation", squad_role: "Senior", rating_offset: -3 },
  { position: "Forward", detail_position: "Winger", age_band: "rotation", squad_role: "Senior", rating_offset: -4 },
  { position: "Forward", detail_position: "Winger", age_band: "rotation", squad_role: "Senior", rating_offset: -5 },
  { position: "Forward", detail_position: "SecondStriker", age_band: "young", squad_role: "Senior", rating_offset: -6 },
  { position: "Forward", detail_position: "Striker", age_band: "prospect", squad_role: "Youth", rating_offset: -8 },
  { position: "Forward", detail_position: "Winger", age_band: "young", squad_role: "Senior", rating_offset: -7 },
];

const POSITIONS_BY_SLOT = SQUAD_SLOT_PLAN.map((slot) => slot.position);
const DEFAULT_SQUAD_SIZE = SQUAD_SLOT_PLAN.length;

const DETAIL_POSITION_ALIASES = {
  GK: "Goalkeeper",
  LB: "LeftBack",
  LWB: "WingBack",
  CB: "CenterBack",
  RB: "RightBack",
  RWB: "WingBack",
  CDM: "DefensiveMidfielder",
  CM: "CentralMidfielder",
  CAM: "AttackingMidfielder",
  LM: "WideMidfielder",
  RM: "WideMidfielder",
  LW: "LeftWinger",
  RW: "RightWinger",
  ST: "Striker",
  CF: "SecondStriker",
};

const EU_EEA_FOOTBALL_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
]);

const DEFAULT_REGISTRATION_RULE = {
  max_squad_size: DEFAULT_SQUAD_SIZE,
  min_domestic_players: 12,
  max_foreign_players: null,
  matchday_foreign_limit: null,
  max_non_eu_players: null,
  matchday_non_eu_limit: null,
  homegrown_minimum: 0,
  source_note: "OpenFoot baseline: local core plus international market freedom.",
};

const COUNTRY_REGISTRATION_RULES = {
  AR: {
    min_domestic_players: 30,
    max_foreign_players: 6,
    matchday_foreign_limit: 5,
    source_note: "AFA/LPF 2026 style: six foreign contracts, five on a match sheet.",
  },
  BR: {
    min_domestic_players: 27,
    max_foreign_players: 9,
    matchday_foreign_limit: 9,
    source_note: "CBF style: no full-roster cap, but nine foreign players per matchday; generation keeps squads inside that practical limit.",
  },
  CL: {
    min_domestic_players: 30,
    max_foreign_players: 6,
    matchday_foreign_limit: 6,
    source_note: "ANFP-style six foreign-player squad cap.",
  },
  CO: { min_domestic_players: 28, max_foreign_players: 8, matchday_foreign_limit: 5 },
  UY: { min_domestic_players: 28, max_foreign_players: 8, matchday_foreign_limit: 6 },
  PY: { min_domestic_players: 28, max_foreign_players: 8, matchday_foreign_limit: 5 },
  EC: { min_domestic_players: 28, max_foreign_players: 8, matchday_foreign_limit: 6 },
  PE: { min_domestic_players: 28, max_foreign_players: 8, matchday_foreign_limit: 6 },
  BO: { min_domestic_players: 28, max_foreign_players: 8, matchday_foreign_limit: 6 },
  VE: { min_domestic_players: 28, max_foreign_players: 8, matchday_foreign_limit: 6 },

  ENG: {
    min_domestic_players: 12,
    homegrown_minimum: 8,
    source_note: "Premier League-style homegrown pressure without a direct foreign-player cap.",
  },
  ES: {
    min_domestic_players: 12,
    max_non_eu_players: 5,
    matchday_non_eu_limit: 3,
    source_note: "LaLiga-style non-EU cap: five registered, three on matchday.",
  },
  FR: {
    min_domestic_players: 14,
    max_non_eu_players: 4,
    matchday_non_eu_limit: 4,
    source_note: "Ligue 1-style limit of four non-EU/EEA players.",
  },
  IT: {
    min_domestic_players: 12,
    max_non_eu_players: 8,
    source_note: "Serie A has signing-window non-EU controls; OpenFoot approximates it as a softer squad cap.",
  },
  DE: { min_domestic_players: 12, homegrown_minimum: 8 },
  NL: { min_domestic_players: 12, homegrown_minimum: 8 },
  PT: { min_domestic_players: 12, homegrown_minimum: 8 },
  BE: { min_domestic_players: 12, homegrown_minimum: 8 },
  SCO: { min_domestic_players: 14, homegrown_minimum: 8 },
  IE: { min_domestic_players: 16, homegrown_minimum: 8 },
  AT: { min_domestic_players: 14, homegrown_minimum: 8 },
  CH: { min_domestic_players: 14, max_non_eu_players: 10, homegrown_minimum: 8 },
  DK: { min_domestic_players: 14, homegrown_minimum: 8 },
  SE: { min_domestic_players: 14, homegrown_minimum: 8 },
  NO: { min_domestic_players: 14, homegrown_minimum: 8 },
  GR: { min_domestic_players: 14, max_non_eu_players: 8, homegrown_minimum: 8 },
  CZ: { min_domestic_players: 14, homegrown_minimum: 8 },
  HR: { min_domestic_players: 14, homegrown_minimum: 8 },
  RS: { min_domestic_players: 16, max_foreign_players: 8, matchday_foreign_limit: 4 },
  PL: { min_domestic_players: 14, max_non_eu_players: 8, homegrown_minimum: 8 },
  UA: { min_domestic_players: 16, max_foreign_players: 10, matchday_foreign_limit: 7 },
  TR: {
    min_domestic_players: 22,
    max_foreign_players: 14,
    matchday_foreign_limit: 12,
    source_note: "TFF-style foreign-player registration pressure.",
  },
};

const GLOBAL_FOOTBALL_MARKET = [
  "BR",
  "AR",
  "UY",
  "CO",
  "CL",
  "PY",
  "EC",
  "PE",
  "BO",
  "VE",
  "US",
  "MX",
  "MA",
  "NG",
  "JP",
  "KR",
  "SA",
];

const SOUTH_AMERICAN_FOOTBALL_CODES = new Set([
  "AR",
  "BR",
  "UY",
  "CL",
  "CO",
  "PY",
  "EC",
  "PE",
  "BO",
  "VE",
]);

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
  AR: ["UY", "BR", "CO", "CL", "PY", "PE", "EC", "ES"],
  UY: ["AR", "BR", "PY", "CL", "CO"],
  CL: ["AR", "UY", "CO", "PY", "PE", "EC"],
  CO: ["AR", "BR", "UY", "CL", "PY", "EC", "PE", "VE"],
  PY: ["AR", "BR", "UY", "CL", "CO", "BO"],
  EC: ["CO", "PE", "AR", "BR", "UY", "VE"],
  PE: ["EC", "CO", "CL", "AR", "UY", "BO"],
  BO: ["PY", "AR", "BR", "PE", "CL"],
  VE: ["CO", "EC", "AR", "BR", "UY"],
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
  UA: ["PL", "CZ", "HR", "RS", "TR"],
};

function isEuropeanFootballMarket(countryCode) {
  return EU_EEA_FOOTBALL_CODES.has(countryCode) || ["ENG", "SCO", "WAL", "NIR", "TR"].includes(countryCode);
}

const MATCH_ROLE_DEFAULTS = {
  captain: null,
  vice_captain: null,
  penalty_taker: null,
  free_kick_taker: null,
  corner_taker: null,
};

export { DEFAULT_SETTINGS, DEFAULT_SQUAD_SIZE, SUPPORTED_CURRENCIES };

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

function hashString(value) {
  return [...String(value)].reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function deterministicInt(seed, min, maxExclusive) {
  return min + (hashString(seed) % (maxExclusive - min));
}

export function registrationRulesForCountry(countryCode) {
  return {
    ...DEFAULT_REGISTRATION_RULE,
    ...(COUNTRY_REGISTRATION_RULES[countryCode] ?? {}),
  };
}

function isForeignNationality(nationality, teamCountry) {
  return nationality !== teamCountry;
}

function isNonEuNationality(nationality) {
  return !EU_EEA_FOOTBALL_CODES.has(nationality);
}

function countDomesticPlayers(players, teamCountry) {
  return players.filter((player) => player.nationality === teamCountry).length;
}

function countForeignPlayers(players, teamCountry) {
  return players.filter((player) => isForeignNationality(player.nationality, teamCountry)).length;
}

function countNonEuPlayers(players) {
  return players.filter((player) => isNonEuNationality(player.nationality)).length;
}

function minimumDomesticPlayers(rules) {
  const fromForeignLimit =
    rules.max_foreign_players === null
      ? 0
      : Math.max(0, DEFAULT_SQUAD_SIZE - rules.max_foreign_players);
  return Math.max(rules.min_domestic_players ?? 0, fromForeignLimit);
}

function nationalityFitsRegistrationRules(nationality, team, currentPlayers, rules) {
  if (
    rules.max_foreign_players !== null &&
    isForeignNationality(nationality, team.country) &&
    countForeignPlayers(currentPlayers, team.country) >= rules.max_foreign_players
  ) {
    return false;
  }

  if (
    rules.max_non_eu_players !== null &&
    isNonEuNationality(nationality) &&
    countNonEuPlayers(currentPlayers) >= rules.max_non_eu_players
  ) {
    return false;
  }

  return true;
}

function nationalityForRosterSlot(team, currentPlayers, remainingSlotsAfter, profile, rules, options = {}) {
  const minDomestic = minimumDomesticPlayers(rules);
  const domesticNeeded = Math.max(0, minDomestic - countDomesticPlayers(currentPlayers, team.country));
  if (domesticNeeded > remainingSlotsAfter) {
    return team.country;
  }

  if (
    profile?.nationality &&
    nationalityFitsRegistrationRules(profile.nationality, team, currentPlayers, rules)
  ) {
    return profile.nationality;
  }

  if (options.domesticFallbackOnly) {
    return team.country;
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const nationality = generatePlayerNationality(team.country);
    if (nationalityFitsRegistrationRules(nationality, team, currentPlayers, rules)) {
      return nationality;
    }
  }

  return team.country;
}

function canonicalDetailPosition(value) {
  if (!value) return null;
  return DETAIL_POSITION_ALIASES[value] ?? value;
}

function detailPositionCode(value) {
  const canonical = canonicalDetailPosition(value);
  const codes = {
    Goalkeeper: "GK",
    RightBack: "RB",
    CenterBack: "CB",
    LeftBack: "LB",
    FullBack: "FB",
    WingBack: "WB",
    DefensiveMidfielder: "CDM",
    CentralMidfielder: "CM",
    AttackingMidfielder: "CAM",
    WideMidfielder: "WM",
    RightWinger: "RW",
    LeftWinger: "LW",
    Winger: "W",
    Striker: "ST",
    SecondStriker: "CF",
  };
  return codes[canonical] ?? value;
}

function detailPositionFitsSlot(profileDetailPosition, slotDetailPosition) {
  const profileDetail = canonicalDetailPosition(profileDetailPosition);
  const slotDetail = canonicalDetailPosition(slotDetailPosition);
  if (!profileDetail || !slotDetail) return false;
  if (profileDetail === slotDetail) return true;
  if (slotDetail === "Winger") {
    return ["LeftWinger", "RightWinger", "Winger"].includes(profileDetail);
  }
  if (slotDetail === "WideMidfielder") {
    return ["LeftMidfielder", "RightMidfielder", "WideMidfielder"].includes(profileDetail);
  }
  if (slotDetail === "FullBack") {
    return ["LeftBack", "RightBack", "FullBack"].includes(profileDetail);
  }
  if (slotDetail === "WingBack") {
    return ["LeftBack", "RightBack", "WingBack"].includes(profileDetail);
  }
  return false;
}

export function registrationStatusForPlayer(game, team, player) {
  const rules = team.registration_rules ?? registrationRulesForCountry(team.country);
  const currentPlayers = (game.players ?? []).filter(
    (candidate) =>
      candidate.team_id === team.id &&
      !candidate.retired &&
      candidate.id !== player.id,
  );

  if (
    rules.max_foreign_players !== null &&
    isForeignNationality(player.nationality, team.country) &&
    countForeignPlayers(currentPlayers, team.country) >= rules.max_foreign_players
  ) {
    return {
      allowed: false,
      reason: "foreign_limit",
      rules,
      current: countForeignPlayers(currentPlayers, team.country),
      limit: rules.max_foreign_players,
    };
  }

  if (
    rules.max_non_eu_players !== null &&
    isNonEuNationality(player.nationality) &&
    countNonEuPlayers(currentPlayers) >= rules.max_non_eu_players
  ) {
    return {
      allowed: false,
      reason: "non_eu_limit",
      rules,
      current: countNonEuPlayers(currentPlayers),
      limit: rules.max_non_eu_players,
    };
  }

  return {
    allowed: true,
    reason: null,
    rules,
    current: null,
    limit: null,
  };
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

function deterministicChoice(values, seed) {
  return values[hashString(seed) % values.length];
}

function generateDeterministicName(nationality, seed) {
  const pool = namePoolFor(nationality);
  return {
    firstName: deterministicChoice(pool.first_names, `${seed}:first`),
    lastName: deterministicChoice(pool.last_names, `${seed}:last`),
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

function generatedRatingForSlot(team, position, slot, slotPlan = null) {
  const base = ratingBaseForPosition(team, position);
  const offset = slotPlan?.rating_offset ?? (slot % 2 === 0 ? 0 : -randomInt(1, 5));
  return clamp(Math.round(base + offset + randomInt(-2, 3)), 45, 92);
}

function deterministicRatingForSlot(team, slotPlan, slot) {
  const base = ratingBaseForPosition(team, slotPlan.position);
  const jitter = deterministicInt(`${team.id}:rating:${slot}`, -1, 2);
  return clamp(Math.round(base + slotPlan.rating_offset + jitter), 45, 94);
}

function playerProfileForSlot(profiles, position, detailPosition = null) {
  if (detailPosition) {
    const detailIndex = profiles.findIndex(
      (profile) =>
        profile.position === position &&
        detailPositionFitsSlot(profile.detail_position, detailPosition),
    );
    if (detailIndex !== -1) return profiles.splice(detailIndex, 1)[0];
  }

  const index = profiles.findIndex((profile) => profile.position === position);
  if (index === -1) return null;
  return profiles.splice(index, 1)[0];
}

function ageForBand(ageBand) {
  switch (ageBand) {
    case "prospect":
      return randomInt(17, 22);
    case "young":
      return randomInt(20, 25);
    case "prime":
      return randomInt(23, 31);
    case "veteran":
      return randomInt(30, 36);
    case "rotation":
    default:
      return randomInt(21, 33);
  }
}

function deterministicAgeForBand(team, slotPlan, slot) {
  const seed = `${team.id}:age:${slot}`;
  switch (slotPlan.age_band) {
    case "prospect":
      return deterministicInt(seed, 17, 22);
    case "young":
      return deterministicInt(seed, 20, 25);
    case "prime":
      return deterministicInt(seed, 23, 31);
    case "veteran":
      return deterministicInt(seed, 30, 36);
    case "rotation":
    default:
      return deterministicInt(seed, 21, 33);
  }
}

function plannedForeignProfileCount(team, rules) {
  const maxByDomesticMinimum = Math.max(0, DEFAULT_SQUAD_SIZE - minimumDomesticPlayers(rules));
  const foreignCap =
    rules.max_foreign_players === null
      ? Math.max(0, maxByDomesticMinimum)
      : Math.min(rules.max_foreign_players, maxByDomesticMinimum || rules.max_foreign_players);
  const reputation = team.reputation ?? 600;
  const share = SOUTH_AMERICAN_FOOTBALL_CODES.has(team.country)
    ? reputation >= 860
      ? 0.22
      : reputation >= 760
        ? 0.18
        : reputation >= 650
          ? 0.14
          : 0.08
    : reputation >= 860
      ? 0.44
      : reputation >= 760
        ? 0.32
        : reputation >= 650
          ? 0.22
          : 0.11;
  return clamp(Math.round(DEFAULT_SQUAD_SIZE * share), 0, foreignCap);
}

function foreignProfileSlots(team, foreignCount) {
  return new Set(
    SQUAD_SLOT_PLAN.map((slotPlan, slot) => ({
      slot,
      score:
        slotPlan.rating_offset * 20 +
        deterministicInt(`${team.id}:foreign-slot:${slot}`, 0, 12) -
        slot / 100,
    }))
      .sort((a, b) => b.score - a.score)
      .slice(0, foreignCount)
      .map((entry) => entry.slot),
  );
}

function foreignMarketCandidates(teamCountry, rules, plannedProfiles) {
  const pools = namesDefinition.pools ?? {};
  const regional = availableCodes(REGIONAL_FOOTBALL_MARKETS[teamCountry] ?? []).filter(
    (code) => code !== teamCountry,
  );
  const global = availableCodes(GLOBAL_FOOTBALL_MARKET).filter((code) => code !== teamCountry);
  const euForeign = [...EU_EEA_FOOTBALL_CODES].filter(
    (code) => code !== teamCountry && Boolean(pools[code]),
  );
  const prefersEu =
    rules.max_non_eu_players !== null &&
    countNonEuPlayers(plannedProfiles) >= rules.max_non_eu_players;
  const isEuropeanMarket = isEuropeanFootballMarket(teamCountry);
  const isSouthAmericanMarket = SOUTH_AMERICAN_FOOTBALL_CODES.has(teamCountry);

  return [
    ...(prefersEu ? euForeign : []),
    ...regional,
    ...(isEuropeanMarket ? euForeign : []),
    ...(isSouthAmericanMarket ? [] : global),
  ].filter((code, index, values) => values.indexOf(code) === index);
}

function foreignNationalityForProfile(team, rules, plannedProfiles, slot) {
  const candidates = foreignMarketCandidates(team.country, rules, plannedProfiles);
  const isEuropeanMarket = isEuropeanFootballMarket(team.country);
  const prioritizedCandidates = candidates.slice(
    0,
    isEuropeanMarket ? Math.min(candidates.length, 18) : candidates.length,
  );
  const start = deterministicInt(
    `${team.id}:foreign-nationality:${slot}`,
    0,
    Math.max(prioritizedCandidates.length, 1),
  );

  for (let offset = 0; offset < prioritizedCandidates.length; offset += 1) {
    const nationality = prioritizedCandidates[(start + offset) % prioritizedCandidates.length];
    if (nationalityFitsRegistrationRules(nationality, team, plannedProfiles, rules)) {
      return nationality;
    }
  }

  for (let offset = 0; offset < candidates.length; offset += 1) {
    const nationality = candidates[offset];
    if (nationalityFitsRegistrationRules(nationality, team, plannedProfiles, rules)) {
      return nationality;
    }
  }

  return team.country;
}

function buildClubArchetypeProfiles(team) {
  const rules = team.registration_rules ?? registrationRulesForCountry(team.country);
  const foreignSlots = foreignProfileSlots(team, plannedForeignProfileCount(team, rules));
  const profiles = [];

  SQUAD_SLOT_PLAN.forEach((slotPlan, slot) => {
    const nationality = foreignSlots.has(slot)
      ? foreignNationalityForProfile(team, rules, profiles, slot)
      : team.country;
    const overall = deterministicRatingForSlot(team, slotPlan, slot);
    const age = deterministicAgeForBand(team, slotPlan, slot);

    profiles.push({
      position: slotPlan.position,
      detail_position: detailPositionCode(slotPlan.detail_position),
      nationality,
      overall,
      potential: Math.min(
        99,
        overall +
          deterministicInt(
            `${team.id}:potential:${slot}`,
            age <= 23 ? 5 : 0,
            age <= 23 ? 15 : 6,
          ),
      ),
      age,
      squad_role: slotPlan.squad_role,
    });
  });

  return profiles;
}

function generatePlayer(team, slot, startYear, profile = null, slotPlan = null, options = {}) {
  const nationality =
    options.nationality ?? profile?.nationality ?? generatePlayerNationality(team.country);
  const nameSeed =
    options.nameSeed ??
    profile?.alias_seed ??
    (profile
      ? `${team.id}:${slot}:${profile.position}:${profile.detail_position ?? ""}:${profile.nationality}:${profile.overall}:${profile.age}`
      : null);
  const { firstName, lastName } = nameSeed
    ? generateDeterministicName(nationality, nameSeed)
    : generateName(nationality);
  const position = profile?.position ?? slotPlan?.position ?? POSITIONS_BY_SLOT[slot] ?? "Midfielder";
  const detailPosition = canonicalDetailPosition(
    profile?.detail_position ?? slotPlan?.detail_position ?? null,
  );
  const alternatePositions = [
    ...(detailPosition && detailPosition !== position ? [detailPosition] : []),
    ...((profile?.detail_positions ?? [])
      .map((detail) => canonicalDetailPosition(detail))
      .filter((detail) => detail && detail !== position && detail !== detailPosition)),
  ];
  const age = profile?.age ?? ageForBand(slotPlan?.age_band);
  const dob = `${startYear - age}-${String(randomInt(1, 13)).padStart(2, "0")}-${String(
    randomInt(1, 29),
  ).padStart(2, "0")}`;
  const targetOvr = profile?.overall ?? generatedRatingForSlot(team, position, slot, slotPlan);
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
    alternate_positions: [...new Set(alternatePositions)],
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
    squad_role: profile?.squad_role ?? slotPlan?.squad_role ?? (age <= 20 ? "Youth" : "Senior"),
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
  const curatedProfiles = [...(team.player_profiles ?? [])];
  const hasCuratedProfiles = curatedProfiles.length > 0;
  const profiles = hasCuratedProfiles ? curatedProfiles : buildClubArchetypeProfiles(team);
  const registrationRules = team.registration_rules ?? registrationRulesForCountry(team.country);
  const roster = [];

  const plannedPlayers = SQUAD_SLOT_PLAN.map((slotPlan, slot) => {
    const profile = playerProfileForSlot(profiles, slotPlan.position, slotPlan.detail_position);
    const nationality = nationalityForRosterSlot(
      team,
      roster,
      SQUAD_SLOT_PLAN.length - slot - 1,
      profile,
      registrationRules,
      { domesticFallbackOnly: hasCuratedProfiles },
    );
    const player = generatePlayer(
      team,
      slot,
      startYear,
      profile,
      slotPlan,
      { nationality, nameSeed: profile?.alias_seed ?? `${team.id}:slot:${slot}` },
    );
    roster.push(player);
    return player;
  });

  const extraPlayers = profiles.map((profile, index) => {
    const nationality = nationalityForRosterSlot(
      team,
      roster,
      profiles.length - index - 1,
      profile,
      registrationRules,
      { domesticFallbackOnly: hasCuratedProfiles },
    );
    const player = generatePlayer(
      team,
      SQUAD_SLOT_PLAN.length + index,
      startYear,
      profile,
      null,
      { nationality, nameSeed: profile?.alias_seed ?? `${team.id}:extra:${index}` },
    );
    roster.push(player);
    return player;
  });

  return [...plannedPlayers, ...extraPlayers];
}

function squadSlotPlansByPosition() {
  return SQUAD_SLOT_PLAN.reduce((groups, slotPlan) => {
    groups[slotPlan.position] = [...(groups[slotPlan.position] ?? []), slotPlan];
    return groups;
  }, {});
}

function missingSquadSlotPlans(currentPlayers) {
  const counts = currentPlayers.reduce((totals, player) => {
    totals[player.position] = (totals[player.position] ?? 0) + 1;
    return totals;
  }, {});

  return Object.entries(squadSlotPlansByPosition()).flatMap(([position, slotPlans]) =>
    slotPlans.slice(counts[position] ?? 0),
  );
}

function startYearFromGame(game) {
  const rawDate = game?.clock?.start_date ?? game?.clock?.current_date;
  const year = Number(String(rawDate ?? "").slice(0, 4));
  return Number.isFinite(year) && year > 1900 ? year : new Date().getUTCFullYear();
}

export function ensureSquadDepth(game) {
  if (!game || !Array.isArray(game.teams)) {
    return { added: 0, squad_size: DEFAULT_SQUAD_SIZE };
  }

  if (!Array.isArray(game.players)) {
    game.players = [];
  }

  const startYear = startYearFromGame(game);
  let added = 0;

  game.teams.forEach((team) => {
    const currentPlayers = game.players.filter(
      (player) => player.team_id === team.id && !player.retired,
    );
    if (currentPlayers.length >= DEFAULT_SQUAD_SIZE) return;

    const registrationRules = team.registration_rules ?? registrationRulesForCountry(team.country);
    const hasCuratedProfiles = Array.isArray(team.player_profiles) && team.player_profiles.length > 0;
    const teamRoster = [...currentPlayers];
    const missingPlans = missingSquadSlotPlans(currentPlayers);
    let teamAdded = 0;

    missingPlans.forEach((slotPlan) => {
      if (teamRoster.length >= DEFAULT_SQUAD_SIZE) return;
      const nationality = nationalityForRosterSlot(
        team,
        teamRoster,
        DEFAULT_SQUAD_SIZE - teamRoster.length - 1,
        null,
        registrationRules,
        { domesticFallbackOnly: hasCuratedProfiles },
      );
      const player = generatePlayer(
        team,
        currentPlayers.length + teamAdded,
        startYear,
        null,
        slotPlan,
        { nationality },
      );
      game.players.push(player);
      teamRoster.push(player);
      teamAdded += 1;
      added += 1;
    });

    if (Array.isArray(team.starting_xi_ids) && team.starting_xi_ids.length > 0) {
      const rosterIds = new Set(
        game.players
          .filter((player) => player.team_id === team.id && !player.retired)
          .map((player) => player.id),
      );
      team.starting_xi_ids = team.starting_xi_ids.filter((playerId) =>
        rosterIds.has(playerId),
      );
    }
  });

  return { added, squad_size: DEFAULT_SQUAD_SIZE };
}

export function regenerateTeamSquad(game, teamId) {
  if (!game || !Array.isArray(game.teams)) {
    return { replaced: 0, squad_size: DEFAULT_SQUAD_SIZE };
  }

  if (!Array.isArray(game.players)) {
    game.players = [];
  }

  const team = game.teams.find((candidate) => candidate.id === teamId);
  if (!team) {
    return { replaced: 0, squad_size: DEFAULT_SQUAD_SIZE };
  }

  refreshTeamDefinitionFromCurrentWorld(team);

  const startYear = startYearFromGame(game);
  const previousCount = game.players.filter(
    (player) => player.team_id === team.id && !player.retired,
  ).length;
  const generatedRoster = generatePlayersForTeam(team, startYear);

  game.players = game.players.filter((player) => player.team_id !== team.id);
  game.players.push(...generatedRoster);
  team.starting_xi_ids = [];

  return { replaced: previousCount, squad_size: generatedRoster.length };
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

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function currentTeamTemplateFor(teamId) {
  for (const country of worldDefinition.countries ?? []) {
    const template = country.teams?.find((candidate) => candidate.id === teamId);
    if (template) return template;
  }

  return teamsDefinition.teams?.find((candidate) => candidate.id === teamId) ?? null;
}

function currentKeyPlayerProfilesFor(team) {
  const template = currentTeamTemplateFor(team.id);
  return template?.key_players ?? [];
}

export function teamNeedsProfileRefresh(team) {
  const currentProfiles = currentKeyPlayerProfilesFor(team);
  if (currentProfiles.length === 0) return false;

  return JSON.stringify(team.player_profiles ?? []) !== JSON.stringify(currentProfiles);
}

export function refreshTeamDefinitionFromCurrentWorld(team) {
  const template = currentTeamTemplateFor(team.id);
  if (!template) return false;

  let changed = false;

  if (teamNeedsProfileRefresh(team)) {
    team.player_profiles = cloneJson(template.key_players ?? []);
    changed = true;
  }

  if (!team.squad_strength && template.squad_strength) {
    team.squad_strength = cloneJson(template.squad_strength);
    changed = true;
  }

  return changed;
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
    const registrationRules = registrationRulesForCountry(teamCountry);

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
      is_external_context: Boolean(template.is_external_context),
      continental_seed: template.continental_seed ?? null,
      registration_rules: template.registration_rules ?? registrationRules,
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

  const legs = Math.max(1, Number(leagueDefinition.round_robin_legs ?? 2));

  return buildRoundRobinFixtures(teamIds, startDate, { legs });
}

function sortTeamsByContinentalSeed(teams) {
  return [...teams].sort(
    (a, b) =>
      (b.reputation ?? 0) - (a.reputation ?? 0) ||
      a.name.localeCompare(b.name),
  );
}

function createStandingRows(teamIds) {
  return teamIds.map((teamId) => ({
    team_id: teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
  }));
}

function qualifiedTeamsForCountry(country, startYear, selectedCountry, selectedCountryTeams) {
  const championsSlots = Math.max(0, Number(country.league?.continental_slots?.champions ?? 0));
  if (championsSlots === 0) return { qualified: [], candidates: [] };

  const generatedTeams =
    country.code === selectedCountry?.code
      ? selectedCountryTeams
      : generateTeams(startYear, {
          ...country,
          teams: (country.teams ?? []).map((team) => ({
            ...team,
            is_external_context: true,
          })),
        });
  const sortedTeams = sortTeamsByContinentalSeed(generatedTeams);

  return {
    qualified: sortedTeams.slice(0, championsSlots),
    candidates: sortedTeams,
  };
}

function tournamentDefinitionForConfederation(confederation) {
  const definitions = worldDefinition.continental_competitions ?? [];
  if (confederation === "UEFA") {
    return definitions.find((competition) => competition.id === "euro_champions_cup");
  }
  if (confederation === "CONMEBOL") {
    return definitions.find((competition) => competition.id === "south_american_liberators_cup");
  }
  return null;
}

function buildSwissStyleFixtures(teamIds, startDate, { rounds, fixturePrefix, competitionId, competitionName }) {
  const rotation = teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, null];
  const fixtures = [];

  for (let round = 0; round < rounds; round += 1) {
    const matchDate = isoDate(addDays(startDate, round * 21));
    for (let index = 0; index < rotation.length / 2; index += 1) {
      const first = rotation[index];
      const second = rotation[rotation.length - 1 - index];
      if (!first || !second) continue;

      fixtures.push({
        id: `${fixturePrefix}_${round + 1}_${index + 1}`,
        competition: "Continental",
        competition_id: competitionId,
        competition_name: competitionName,
        stage: "league_phase",
        matchday: round + 1,
        date: matchDate,
        home_team_id: round % 2 === 0 ? first : second,
        away_team_id: round % 2 === 0 ? second : first,
        status: "Scheduled",
        result: null,
      });
    }

    rotation.splice(1, 0, rotation.pop());
  }

  return fixtures;
}

function buildContinentalTournament(startYear, selectedCountry, selectedCountryTeams) {
  const definition = tournamentDefinitionForConfederation(selectedCountry?.confederation);
  if (!definition) {
    return { contextTeams: [], tournaments: [] };
  }

  const confederationCountries = (worldDefinition.countries ?? []).filter(
    (country) => country.confederation === selectedCountry.confederation,
  );
  const qualifiedByCountry = confederationCountries.map((country) => ({
    country,
    ...qualifiedTeamsForCountry(country, startYear, selectedCountry, selectedCountryTeams),
  }));
  const initialQualified = qualifiedByCountry.flatMap(({ country, qualified }) =>
    qualified.map((team, index) => ({
      team,
      country,
      seed: index + 1,
      qualification_path: "Domestic league slot",
    })),
  );
  const alreadyQualifiedIds = new Set(initialQualified.map(({ team }) => team.id));
  const wildcardPool = qualifiedByCountry
    .flatMap(({ country, candidates }) =>
      candidates
        .filter((team) => !alreadyQualifiedIds.has(team.id))
        .map((team, index) => ({
          team,
          country,
          seed: index + 1,
          qualification_path: "Continental coefficient wildcard",
        })),
    )
    .sort(
      (a, b) =>
        (b.team.reputation ?? 0) - (a.team.reputation ?? 0) ||
        a.team.name.localeCompare(b.team.name),
    );
  const targetEntrants = Number(definition.entrants ?? initialQualified.length);
  const participantRecords =
    initialQualified.length >= targetEntrants
      ? initialQualified
          .sort(
            (a, b) =>
              (b.team.reputation ?? 0) - (a.team.reputation ?? 0) ||
              a.team.name.localeCompare(b.team.name),
          )
          .slice(0, targetEntrants)
      : [...initialQualified, ...wildcardPool.slice(0, targetEntrants - initialQualified.length)];
  const participantIds = new Set(participantRecords.map(({ team }) => team.id));
  const selectedCountryTeamIds = new Set(selectedCountryTeams.map((team) => team.id));
  const contextTeams = participantRecords
    .filter(({ team }) => !selectedCountryTeamIds.has(team.id))
    .map(({ team }) => ({
      ...team,
      is_external_context: true,
    }));
  const teamIds = participantRecords.map(({ team }) => team.id);
  const tournamentStart = addDays(startDateForYear(startYear), selectedCountry.confederation === "UEFA" ? 70 : 120);
  const rounds = selectedCountry.confederation === "UEFA" ? 8 : 6;
  const fixtures = buildSwissStyleFixtures(teamIds, tournamentStart, {
    rounds,
    fixturePrefix: definition.id === "euro_champions_cup" ? "invictus" : "libertad",
    competitionId: definition.id,
    competitionName: definition.name,
  });

  return {
    contextTeams,
    tournaments: [
      {
        id: definition.id,
        name: definition.name,
        season: startYear,
        confederation: definition.confederation,
        region: definition.region,
        format: definition.model,
        format_code: "continental_league_phase",
        phase: "league_phase",
        entrants: targetEntrants,
        matchdays: rounds,
        expected_fixture_count: fixtures.length,
        qualification_rules:
          definition.id === "euro_champions_cup"
            ? {
                league_phase_rounds: 8,
                round_of_16_direct_places: 8,
                playoff_places: 16,
                note: "Domestic champions slots feed the league phase. Top 8 advance directly; places 9-24 enter playoffs.",
              }
            : {
                league_phase_rounds: 6,
                knockout_places: 16,
                note: "Domestic Libertadores-style slots and coefficient wildcards feed the league phase. Top 16 advance to knockouts.",
              },
        participants: participantRecords.map(({ team, country, seed, qualification_path }, index) => ({
          team_id: team.id,
          country_code: country.code,
          country_name: country.name,
          seed: index + 1,
          domestic_seed: seed,
          qualification_path,
        })),
        fixtures,
        standings: createStandingRows(teamIds),
      },
    ],
  };
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
    confederation: country?.confederation ?? null,
    continent: country?.continent ?? null,
    format: country?.league?.format ?? "Double round-robin",
    format_code: country?.league?.format_code ?? "double_round_robin",
    round_robin_legs: country?.league?.round_robin_legs ?? 2,
    matchdays: country?.league?.matchdays ?? Math.max(1, teams.length - 1) * 2,
    expected_fixture_count: fixtures.length,
    relegation: country?.league?.relegation ?? null,
    continental_slots: country?.league?.continental_slots ?? null,
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

  const domesticTeams = generateTeams(startYear, country);
  const continentalSetup = country
    ? buildContinentalTournament(startYear, country, domesticTeams)
    : { contextTeams: [], tournaments: [] };
  const teams = [...domesticTeams, ...continentalSetup.contextTeams];
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
    league: buildLeague(domesticTeams, startYear, currentDateString, country),
    continental_tournaments: continentalSetup.tournaments,
    world: country
      ? {
          country_code: country.code,
          country_name: country.name,
          league_id: country.league.id,
          league_name: country.league.name,
          cup_name: null,
          confederation: country.confederation ?? null,
          continent: country.continent ?? null,
          continental_tournaments: continentalSetup.tournaments.map((tournament) => ({
            id: tournament.id,
            name: tournament.name,
            entrants: tournament.entrants,
          })),
          competitions_enabled: country.league.competitions_enabled,
          registration_rules: registrationRulesForCountry(country.code),
          legal_names: "fictional",
        }
      : null,
    scouting_assignments: [],
    youth_scouting_assignments: [],
    board_objectives: [
      {
        id: "obj_league_position",
        description: "Finish in the top half",
        target: Math.ceil(domesticTeams.length / 2),
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
    confederation: country.confederation ?? null,
    continent: country.continent ?? null,
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
    registration_rules: registrationRulesForCountry(country.code),
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

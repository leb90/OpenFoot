import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const teamsDefinition = JSON.parse(
  readFileSync(new URL("./data/default_teams.json", import.meta.url), "utf8"),
);
const namesDefinition = JSON.parse(
  readFileSync(new URL("./data/default_names.json", import.meta.url), "utf8"),
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
  const weights =
    position === "Goalkeeper"
      ? ["handling", "reflexes", "aerial", "positioning", "decisions"]
      : position === "Defender"
        ? ["defending", "tackling", "strength", "positioning", "aerial"]
        : position === "Forward"
          ? ["shooting", "dribbling", "pace", "composure", "positioning"]
          : ["passing", "vision", "decisions", "stamina", "teamwork"];
  return Math.round(weights.reduce((sum, key) => sum + attrs[key], 0) / weights.length);
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

function generatePlayer(team, slot, startYear) {
  const nationality = Math.random() < 0.65 ? team.country : choice(Object.keys(namesDefinition.pools));
  const { firstName, lastName } = generateName(nationality);
  const position = POSITIONS_BY_SLOT[slot] ?? "Midfielder";
  const age = slot === 8 || slot === 15 || slot === 21 ? randomInt(17, 22) : randomInt(18, 35);
  const dob = `${startYear - age}-${String(randomInt(1, 13)).padStart(2, "0")}-${String(
    randomInt(1, 29),
  ).padStart(2, "0")}`;
  const attributes = generateAttributes(position);
  const ovr = playerOvr(position, attributes);
  const potential = Math.min(99, ovr + randomInt(age <= 23 ? 6 : 0, age <= 23 ? 18 : 8));
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
    alternate_positions: [],
    footedness: Math.random() < 0.25 ? "Left" : "Right",
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
    traits: [],
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

function generateTeams(startYear) {
  return teamsDefinition.teams.map((template, index) => {
    const [minRep, maxRep] = template.reputation_range ?? [400, 800];
    const [minFinance, maxFinance] = template.finance_range ?? [1000000, 8000000];
    const reputation = randomInt(minRep, maxRep + 1);

    return {
      id: `team_${index + 1}`,
      name: template.name,
      short_name: template.short_name,
      country: template.country,
      football_nation: template.country,
      city: template.city,
      stadium_name: template.stadium_name,
      stadium_capacity: randomInt(18000, 76000),
      finance: randomInt(minFinance, maxFinance + 1),
      manager_id: null,
      reputation,
      wage_budget: reputation * 420,
      transfer_budget: reputation * 4200,
      season_income: 0,
      season_expenses: 0,
      financial_ledger: [],
      formation: "4-4-2",
      play_style: template.play_style ?? "Balanced",
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
        league_position: randomInt(1, teamsDefinition.teams.length + 1),
        played: 30,
        won: randomInt(8, 22),
        drawn: randomInt(4, 10),
        lost: randomInt(4, 16),
        goals_for: randomInt(32, 78),
        goals_against: randomInt(25, 68),
      })),
    };
  });
}

function buildRoundRobinFixtures(teamIds, startDate) {
  const teams = teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, null];
  const rounds = teams.length - 1;
  const fixtures = [];
  let rotation = [...teams];

  for (let round = 0; round < rounds; round += 1) {
    const matchDate = isoDate(addDays(startDate, round * 7));
    for (let index = 0; index < rotation.length / 2; index += 1) {
      const home = rotation[index];
      const away = rotation[rotation.length - 1 - index];
      if (!home || !away) continue;
      fixtures.push({
        id: `fix_${round + 1}_${index + 1}`,
        matchday: round + 1,
        date: matchDate,
        home_team_id: round % 2 === 0 ? home : away,
        away_team_id: round % 2 === 0 ? away : home,
        competition: "League",
        status: "Scheduled",
        result: null,
      });
    }
    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
  }

  return fixtures;
}

function buildLeague(teams, startYear, currentDate) {
  const seasonStart = addDays(startDateForYear(startYear), 30);
  const fixtures = buildRoundRobinFixtures(
    teams.map((team) => team.id),
    seasonStart,
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
    id: `league_${startYear}`,
    name: "Premier Division",
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

  const teams = generateTeams(startYear);
  const players = teams.flatMap((team) =>
    POSITIONS_BY_SLOT.map((_, slot) => generatePlayer(team, slot, startYear)),
  );
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
    league: buildLeague(teams, startYear, currentDateString),
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

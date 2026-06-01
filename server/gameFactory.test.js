// @vitest-environment node

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  createGameState,
  DEFAULT_SQUAD_SIZE,
  ensureSquadDepth,
  listPlayableCountries,
  registrationRulesForCountry,
} from "./gameFactory.js";

const namesDefinition = JSON.parse(
  readFileSync("server/data/default_names.json", "utf8"),
);
const worldDefinition = JSON.parse(
  readFileSync("server/data/default_world.json", "utf8"),
);

const REQUIRED_FOOTBALL_MARKETS = [
  "AR",
  "BR",
  "ENG",
  "SCO",
  "WAL",
  "ES",
  "DE",
  "FR",
  "IT",
  "NL",
  "PT",
  "EG",
  "GE",
  "UA",
  "EC",
  "PE",
  "BO",
  "VE",
];

const REQUIRED_EUROPEAN_COUNTRIES = [
  "ENG",
  "ES",
  "FR",
  "DE",
  "IT",
  "NL",
  "PT",
  "BE",
  "TR",
  "SCO",
  "AT",
  "CH",
  "DK",
  "SE",
  "NO",
  "GR",
  "CZ",
  "HR",
  "RS",
  "PL",
  "UA",
  "IE",
];

const REQUIRED_SOUTH_AMERICAN_COUNTRIES = [
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
];

function countRosterByPosition(players) {
  return players.reduce((counts, player) => {
    counts[player.position] = (counts[player.position] ?? 0) + 1;
    return counts;
  }, {});
}

function countForeign(players, countryCode) {
  return players.filter((player) => player.nationality !== countryCode).length;
}

describe("default football name pools", () => {
  it("covers the main football markets with usable first and last names", () => {
    const pools = namesDefinition.pools ?? {};

    expect(Object.keys(pools).length).toBeGreaterThanOrEqual(25);

    REQUIRED_FOOTBALL_MARKETS.forEach((code) => {
      expect(pools[code], `${code} pool`).toBeDefined();
    });

    Object.entries(pools).forEach(([code, pool]) => {
      expect(pool.first_names.length, `${code} first names`).toBeGreaterThanOrEqual(10);
      expect(pool.last_names.length, `${code} last names`).toBeGreaterThanOrEqual(10);
    });
  });

  it("generates people with names backed by an available nationality pool", () => {
    const game = createGameState({
      firstName: "Test",
      lastName: "Manager",
      dob: "1980-01-01",
      nationality: "AR",
      startupOptions: {
        startYear: 2026,
        startPhase: "seasonStart",
      },
    });
    const poolCodes = new Set(Object.keys(namesDefinition.pools ?? {}));

    expect(game.players.length).toBeGreaterThan(0);
    expect(game.staff.length).toBeGreaterThan(0);

    game.players.forEach((player) => {
      expect(poolCodes.has(player.nationality), player.full_name).toBe(true);
      expect(player.full_name).toMatch(/\S+\s+\S+/);
      expect(player.full_name).not.toContain("undefined");
    });

    game.staff.forEach((staffMember) => {
      expect(poolCodes.has(staffMember.nationality), staffMember.last_name).toBe(true);
      expect(staffMember.first_name).toMatch(/\S/);
      expect(staffMember.last_name).toMatch(/\S/);
    });
  });

  it("exposes playable countries with fictional clubs for career setup", () => {
    const countries = listPlayableCountries();
    const france = countries.find((country) => country.code === "FR");
    const argentina = countries.find((country) => country.code === "AR");
    const belgium = countries.find((country) => country.code === "BE");
    const uruguay = countries.find((country) => country.code === "UY");

    expect(countries.length).toBeGreaterThanOrEqual(32);
    expect(france?.league.name).toBe("French Ligue Elite");
    expect(france?.team_count).toBe(18);
    expect(argentina?.team_count).toBe(30);
    expect(argentina?.league.format_code).toBe("split_groups_playoffs");
    expect(belgium?.confederation).toBe("UEFA");
    expect(uruguay?.confederation).toBe("CONMEBOL");
    expect(belgium?.league.continental_slots?.champions).toBeGreaterThan(0);
    expect(uruguay?.league.continental_slots?.champions).toBeGreaterThan(0);
    expect(france?.teams.some((team) => team.id === "fr_paris_capitol")).toBe(true);
  });

  it("covers the base countries needed for Champions-style and Libertadores-style tournaments", () => {
    const countries = worldDefinition.countries ?? [];
    const countryCodes = new Set(countries.map((country) => country.code));
    const competitions = worldDefinition.continental_competitions ?? [];

    REQUIRED_EUROPEAN_COUNTRIES.forEach((code) => {
      expect(countryCodes.has(code), `${code} country`).toBe(true);
    });
    REQUIRED_SOUTH_AMERICAN_COUNTRIES.forEach((code) => {
      expect(countryCodes.has(code), `${code} country`).toBe(true);
    });

    expect(competitions.find((competition) => competition.id === "euro_champions_cup")?.entrants).toBe(36);
    expect(
      competitions.find((competition) => competition.id === "south_american_liberators_cup")?.entrants,
    ).toBe(47);

    countries.forEach((country) => {
      expect(country.teams.length, `${country.code} team count`).toBe(country.league.target_teams);
      expect(country.league.continental_slots?.champions, `${country.code} champions slots`).toBeGreaterThan(0);
    });
  });

  it("creates a domestic double round-robin league and continental campaign for the selected country", () => {
    const game = createGameState({
      firstName: "Test",
      lastName: "Manager",
      dob: "1980-01-01",
      nationality: "AR",
      startupOptions: {
        startYear: 2026,
        startPhase: "seasonStart",
        countryCode: "FR",
      },
    });
    const paris = game.teams.find((team) => team.id === "fr_paris_capitol");
    const parisPlayers = game.players.filter((player) => player.team_id === paris?.id);
    const domesticTeams = game.teams.filter((team) => team.league_id === game.league.id);
    const continental = game.continental_tournaments[0];

    expect(game.world.country_code).toBe("FR");
    expect(game.league.name).toBe("French Ligue Elite");
    expect(domesticTeams).toHaveLength(18);
    expect(game.league.fixtures).toHaveLength(306);
    expect(Math.max(...game.league.fixtures.map((fixture) => fixture.matchday))).toBe(34);
    expect(game.league.expected_fixture_count).toBe(306);
    expect(game.league.domestic_cup).toBeNull();
    expect(domesticTeams.every((team) => team.country === "FR")).toBe(true);
    expect(game.league.fixtures.every((fixture) => fixture.home_team_id.startsWith("fr_"))).toBe(true);
    expect(continental.name).toBe("Invictus Champions Cup");
    expect(continental.participants).toHaveLength(36);
    expect(continental.fixtures).toHaveLength(144);
    expect(Math.max(...continental.fixtures.map((fixture) => fixture.matchday))).toBe(8);
    expect(parisPlayers).toHaveLength(DEFAULT_SQUAD_SIZE);
    expect(countRosterByPosition(parisPlayers)).toEqual({
      Goalkeeper: 3,
      Defender: 13,
      Midfielder: 11,
      Forward: 9,
    });
    expect(parisPlayers.some((player) => player.position === "Forward" && player.ovr >= 88)).toBe(true);
  });

  it("creates the Argentine split-zone league phase without national cups", () => {
    const game = createGameState({
      firstName: "Test",
      lastName: "Manager",
      dob: "1980-01-01",
      nationality: "AR",
      startupOptions: {
        startYear: 2026,
        startPhase: "seasonStart",
        countryCode: "AR",
      },
    });
    const fixtureCountsByTeam = new Map(game.league.standings.map((row) => [row.team_id, 0]));

    game.league.fixtures.forEach((fixture) => {
      fixtureCountsByTeam.set(
        fixture.home_team_id,
        fixtureCountsByTeam.get(fixture.home_team_id) + 1,
      );
      fixtureCountsByTeam.set(
        fixture.away_team_id,
        fixtureCountsByTeam.get(fixture.away_team_id) + 1,
      );
    });

    expect(game.league.standings).toHaveLength(30);
    expect(game.league.format_code).toBe("split_groups_playoffs");
    expect(game.league.fixtures).toHaveLength(240);
    expect(Math.max(...game.league.fixtures.map((fixture) => fixture.matchday))).toBe(16);
    expect(new Set(fixtureCountsByTeam.values())).toEqual(new Set([16]));
    expect(game.league.domestic_cup).toBeNull();
    expect(game.continental_tournaments[0].name).toBe("Copa Libertad Continental");
    expect(game.continental_tournaments[0].participants).toHaveLength(47);
    expect(game.continental_tournaments[0].fixtures).toHaveLength(138);

    const millionairesPlayers = game.players.filter(
      (player) => player.team_id === "ar_buenos_aires_millionaires",
    );
    expect(millionairesPlayers).toHaveLength(DEFAULT_SQUAD_SIZE);
    expect(countForeign(millionairesPlayers, "AR")).toBeLessThanOrEqual(6);
    expect(countRosterByPosition(millionairesPlayers)).toEqual({
      Goalkeeper: 3,
      Defender: 13,
      Midfielder: 11,
      Forward: 9,
    });
  });

  it("backfills legacy short squads without replacing existing players", () => {
    const game = createGameState({
      firstName: "Test",
      lastName: "Manager",
      dob: "1980-01-01",
      nationality: "AR",
      startupOptions: {
        startYear: 2026,
        startPhase: "seasonStart",
        countryCode: "AR",
      },
    });
    const teamId = "ar_buenos_aires_millionaires";
    const originalRoster = game.players.filter((player) => player.team_id === teamId);
    const keptRoster = originalRoster.slice(0, 22);
    const keptIds = new Set(keptRoster.map((player) => player.id));
    game.players = game.players.filter((player) => player.team_id !== teamId).concat(keptRoster);

    const result = ensureSquadDepth(game);
    const backfilledRoster = game.players.filter((player) => player.team_id === teamId);

    expect(result.added).toBe(14);
    expect(backfilledRoster).toHaveLength(DEFAULT_SQUAD_SIZE);
    keptIds.forEach((id) => {
      expect(backfilledRoster.some((player) => player.id === id)).toBe(true);
    });
    expect(countRosterByPosition(backfilledRoster)).toEqual({
      Goalkeeper: 3,
      Defender: 13,
      Midfielder: 11,
      Forward: 9,
    });
  });

  it("applies country registration rules to generated squads", () => {
    const argentinaRules = registrationRulesForCountry("AR");
    const argentina = createGameState({
      firstName: "Test",
      lastName: "Manager",
      dob: "1980-01-01",
      nationality: "AR",
      startupOptions: {
        startYear: 2026,
        startPhase: "seasonStart",
        countryCode: "AR",
      },
    });
    const brazil = createGameState({
      firstName: "Test",
      lastName: "Manager",
      dob: "1980-01-01",
      nationality: "BR",
      startupOptions: {
        startYear: 2026,
        startPhase: "seasonStart",
        countryCode: "BR",
      },
    });

    expect(argentinaRules.max_foreign_players).toBe(6);
    expect(argentinaRules.matchday_foreign_limit).toBe(5);
    expect(argentina.world.registration_rules.max_foreign_players).toBe(6);
    argentina.teams
      .filter((team) => team.country === "AR")
      .forEach((team) => {
        const roster = argentina.players.filter((player) => player.team_id === team.id);
        expect(countForeign(roster, "AR"), team.name).toBeLessThanOrEqual(6);
      });
    brazil.teams
      .filter((team) => team.country === "BR")
      .forEach((team) => {
        const roster = brazil.players.filter((player) => player.team_id === team.id);
        expect(countForeign(roster, "BR"), team.name).toBeLessThanOrEqual(9);
      });
  });

  it("supports non-standard round-robin leg counts used by continental feeder leagues", () => {
    const croatia = createGameState({
      firstName: "Test",
      lastName: "Manager",
      dob: "1980-01-01",
      nationality: "AR",
      startupOptions: {
        startYear: 2026,
        startPhase: "seasonStart",
        countryCode: "HR",
      },
    });
    const colombia = createGameState({
      firstName: "Test",
      lastName: "Manager",
      dob: "1980-01-01",
      nationality: "AR",
      startupOptions: {
        startYear: 2026,
        startPhase: "seasonStart",
        countryCode: "CO",
      },
    });

    expect(croatia.league.standings).toHaveLength(10);
    expect(croatia.league.round_robin_legs).toBe(4);
    expect(croatia.league.fixtures).toHaveLength(180);
    expect(Math.max(...croatia.league.fixtures.map((fixture) => fixture.matchday))).toBe(36);
    expect(colombia.league.standings).toHaveLength(20);
    expect(colombia.league.round_robin_legs).toBe(1);
    expect(colombia.league.fixtures).toHaveLength(190);
    expect(Math.max(...colombia.league.fixtures.map((fixture) => fixture.matchday))).toBe(19);
  });
});

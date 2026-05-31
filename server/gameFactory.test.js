// @vitest-environment node

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { createGameState, listPlayableCountries } from "./gameFactory.js";

const namesDefinition = JSON.parse(
  readFileSync("server/data/default_names.json", "utf8"),
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
];

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

    expect(countries.length).toBeGreaterThanOrEqual(8);
    expect(france?.league.name).toBe("French Ligue Elite");
    expect(france?.team_count).toBe(18);
    expect(argentina?.team_count).toBe(30);
    expect(argentina?.league.format_code).toBe("split_groups_playoffs");
    expect(france?.teams.some((team) => team.id === "fr_paris_capitol")).toBe(true);
  });

  it("creates an isolated double round-robin league for the selected country", () => {
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

    expect(game.world.country_code).toBe("FR");
    expect(game.league.name).toBe("French Ligue Elite");
    expect(game.teams).toHaveLength(18);
    expect(game.league.fixtures).toHaveLength(306);
    expect(Math.max(...game.league.fixtures.map((fixture) => fixture.matchday))).toBe(34);
    expect(game.league.expected_fixture_count).toBe(306);
    expect(game.league.domestic_cup).toBeNull();
    expect(game.teams.every((team) => team.country === "FR")).toBe(true);
    expect(game.league.fixtures.every((fixture) => fixture.home_team_id.startsWith("fr_"))).toBe(true);
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
    const fixtureCountsByTeam = new Map(game.teams.map((team) => [team.id, 0]));

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

    expect(game.teams).toHaveLength(30);
    expect(game.league.format_code).toBe("split_groups_playoffs");
    expect(game.league.fixtures).toHaveLength(240);
    expect(Math.max(...game.league.fixtures.map((fixture) => fixture.matchday))).toBe(16);
    expect(new Set(fixtureCountsByTeam.values())).toEqual(new Set([16]));
    expect(game.league.domestic_cup).toBeNull();
  });
});

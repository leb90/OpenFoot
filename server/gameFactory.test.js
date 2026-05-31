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

    expect(countries.length).toBeGreaterThanOrEqual(8);
    expect(france?.league.name).toBe("French Ligue Elite");
    expect(france?.teams.some((team) => team.id === "fr_paris_capitol")).toBe(true);
  });

  it("creates an isolated league for the selected country", () => {
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
    expect(game.teams.every((team) => team.country === "FR")).toBe(true);
    expect(game.league.fixtures.every((fixture) => fixture.home_team_id.startsWith("fr_"))).toBe(true);
    expect(parisPlayers.some((player) => player.position === "Forward" && player.ovr >= 88)).toBe(true);
  });
});

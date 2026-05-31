import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentPropsWithoutRef } from "react";
import { describe, expect, it, vi } from "vitest";

import WorldSelect, { type PlayableCountryInfo } from "./WorldSelect";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; country?: string; team?: string; league?: string }) => {
      if (key === "worldSelect.availableCountries") {
        return `countries:${options?.count ?? "missing"}`;
      }

      if (key === "worldSelect.availableTeams") {
        return `teams:${options?.count ?? "missing"}`;
      }

      if (key === "worldSelect.summary.countryTeam") {
        return `${options?.team ?? "team"}:${options?.league ?? "league"}:${options?.country ?? "country"}`;
      }

      if (key === "worldSelect.historyDepth.applied") {
        return `history:${options?.count ?? "missing"}`;
      }

      if (key === "worldSelect.historyDepth.option") {
        return `depth:${options?.count ?? "missing"}`;
      }

      return key;
    },
  }),
}));

vi.mock("../ui", () => ({
  Button: ({
    children,
    iconRight: _iconRight,
    ...props
  }: ComponentPropsWithoutRef<"button"> & { iconRight?: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

const countries: PlayableCountryInfo[] = [
  {
    code: "ENG",
    name: "England",
    league: {
      id: "eng_premier",
      name: "English Premier Division",
      tier: 1,
      format: "Double round-robin",
      target_teams: 20,
      season: "August-May",
      cup_name: "English National Cup",
    },
    team_count: 1,
    teams: [
      {
        id: "eng_manchester_sky",
        name: "Manchester Sky",
        short_name: "MSK",
        city: "Manchester",
        country: "ENG",
        stadium_name: "East Manchester Stadium",
        stadium_capacity: 53000,
        reputation: 900,
        finance: 250000000,
        colors: { primary: "#60a5fa", secondary: "#ffffff" },
        play_style: "Possession",
        avg_overall: 88,
      },
    ],
  },
  {
    code: "FR",
    name: "France",
    league: {
      id: "fr_ligue",
      name: "French Ligue Elite",
      tier: 1,
      format: "Double round-robin",
      target_teams: 18,
      season: "August-May",
      cup_name: "French National Cup",
    },
    team_count: 1,
    teams: [
      {
        id: "fr_paris_capitol",
        name: "Paris Capitol",
        short_name: "PAR",
        city: "Paris",
        country: "FR",
        stadium_name: "Parc de Paris",
        stadium_capacity: 48000,
        reputation: 910,
        finance: 260000000,
        colors: { primary: "#1e3a8a", secondary: "#dc2626" },
        play_style: "Attacking",
        avg_overall: 90,
      },
    ],
  },
];

describe("WorldSelect", () => {
  it("shows countries, league format, clubs, and generated history options", () => {
    const onChangeHistoryDepthYears = vi.fn();

    render(
      <WorldSelect
        playableCountries={countries}
        selectedCountryCode="FR"
        selectedTeamId="fr_paris_capitol"
        isLoadingWorlds={false}
        isStarting={false}
        startYear={2032}
        startPhase="midSeason"
        historyDepthYears={24}
        onSelectCountry={vi.fn()}
        onSelectTeam={vi.fn()}
        onChangeHistoryDepthYears={onChangeHistoryDepthYears}
        onStart={vi.fn()}
        onBack={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("countries:2")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
    expect(screen.getAllByText("French Ligue Elite").length).toBeGreaterThan(0);
    expect(screen.getByText("Paris Capitol")).toBeInTheDocument();
    expect(
      screen.getByText("Paris Capitol:French Ligue Elite:France"),
    ).toBeInTheDocument();
    expect(screen.getByText("history:24")).toBeInTheDocument();

    fireEvent.click(screen.getByText("depth:6"));

    expect(onChangeHistoryDepthYears).toHaveBeenCalledWith(6);
  });

  it("emits country and club selections", () => {
    const onSelectCountry = vi.fn();
    const onSelectTeam = vi.fn();

    render(
      <WorldSelect
        playableCountries={countries}
        selectedCountryCode="ENG"
        selectedTeamId=""
        isLoadingWorlds={false}
        isStarting={false}
        startYear={2032}
        startPhase="seasonStart"
        historyDepthYears={12}
        onSelectCountry={onSelectCountry}
        onSelectTeam={onSelectTeam}
        onChangeHistoryDepthYears={vi.fn()}
        onStart={vi.fn()}
        onBack={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("France"));
    fireEvent.click(screen.getByText("Manchester Sky"));

    expect(onSelectCountry).toHaveBeenCalledWith("FR");
    expect(onSelectTeam).toHaveBeenCalledWith("eng_manchester_sky");
    expect(screen.getByText("worldSelect.startCareer").closest("button")).toBeDisabled();
  });
});

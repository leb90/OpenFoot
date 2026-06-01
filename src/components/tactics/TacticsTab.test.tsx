import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@/lib/apiClient";
import type { GameStateData, PlayerData, TeamData } from "../../store/gameStore";
import TacticsTab from "./TacticsTab";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) =>
      typeof fallback === "string" ? fallback : key,
    i18n: { language: "en" },
  }),
}));

vi.mock("@/lib/apiClient", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

const makePlayer = (
  id: string,
  position: string,
  overrides: Partial<PlayerData> = {},
): PlayerData => ({
  id,
  match_name: id.toUpperCase(),
  full_name: `Player ${id}`,
  date_of_birth: "1998-01-01",
  nationality: "GB",
  position,
  natural_position: position,
  alternate_positions: [],
  training_focus: null,
  attributes: {
    pace: 60,
    stamina: 60,
    strength: 60,
    agility: 60,
    passing: 60,
    shooting: 60,
    tackling: 60,
    dribbling: 60,
    defending: 60,
    positioning: 60,
    vision: 60,
    decisions: 60,
    composure: 60,
    aggression: 60,
    teamwork: 60,
    leadership: 60,
    handling: 60,
    reflexes: 60,
    aerial: 60,
  },
  condition: 100,
  morale: 80,
  injury: null,
  team_id: "team1",
  retired: false,
  contract_end: "2027-06-30",
  wage: 1000,
  market_value: 100000,
  stats: {
    appearances: 0,
    goals: 0,
    assists: 0,
    clean_sheets: 0,
    yellow_cards: 0,
    red_cards: 0,
    avg_rating: 0,
    minutes_played: 0,
  },
  career: [],
  transfer_listed: false,
  loan_listed: false,
  transfer_offers: [],
  traits: [],
  ...overrides,
});

const makeTeam = (overrides: Partial<TeamData> = {}): TeamData => ({
  id: "team1",
  name: "Test FC",
  short_name: "TFC",
  country: "England",
  city: "Test City",
  stadium_name: "Test Ground",
  stadium_capacity: 20000,
  finance: 1000000,
  manager_id: "mgr1",
  reputation: 50,
  wage_budget: 100000,
  transfer_budget: 500000,
  season_income: 0,
  season_expenses: 0,
  formation: "4-4-2",
  play_style: "Balanced",
  training_focus: "General",
  training_intensity: "Balanced",
  training_schedule: "Balanced",
  founded_year: 1900,
  colors: { primary: "#00ff00", secondary: "#ffffff" },
  starting_xi_ids: [],
  form: [],
  history: [],
  ...overrides,
});

const makeGameState = (): GameStateData => {
  const players = [
    makePlayer("gk1", "Goalkeeper"),
    makePlayer("d1", "Center Back", {
      attributes: {
        pace: 50,
        stamina: 60,
        strength: 70,
        agility: 55,
        passing: 52,
        shooting: 35,
        tackling: 75,
        dribbling: 45,
        defending: 78,
        positioning: 68,
        vision: 50,
        decisions: 63,
        composure: 64,
        aggression: 71,
        teamwork: 62,
        leadership: 60,
        handling: 10,
        reflexes: 10,
        aerial: 15,
      },
    }),
    makePlayer("d2", "Defender"),
    makePlayer("d3", "Defender"),
    makePlayer("d4", "Defender"),
    makePlayer("m1", "Midfielder", {
      attributes: {
        pace: 70,
        stamina: 74,
        strength: 58,
        agility: 75,
        passing: 79,
        shooting: 66,
        tackling: 61,
        dribbling: 77,
        defending: 57,
        positioning: 72,
        vision: 80,
        decisions: 78,
        composure: 73,
        aggression: 52,
        teamwork: 81,
        leadership: 64,
        handling: 10,
        reflexes: 10,
        aerial: 10,
      },
    }),
    makePlayer("m2", "Midfielder"),
    makePlayer("m3", "Midfielder"),
    makePlayer("m4", "Midfielder"),
    makePlayer("f1", "Forward"),
    makePlayer("f2", "Forward"),
    makePlayer("d5", "Defender", { match_name: "Bench DEF" }),
  ];

  return {
    clock: {
      current_date: "2026-08-01",
      start_date: "2026-08-01",
    },
    manager: {
      id: "mgr1",
      first_name: "Test",
      last_name: "Manager",
      date_of_birth: "1980-01-01",
      nationality: "GB",
      reputation: 50,
      satisfaction: 50,
      fan_approval: 50,
      team_id: "team1",
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
    teams: [
      makeTeam({
        starting_xi_ids: [
          "gk1",
          "d1",
          "d2",
          "d3",
          "d4",
          "m1",
          "m2",
          "m3",
          "m4",
          "f1",
          "f2",
        ],
      }),
    ],
    players,
    staff: [],
    messages: [],
    news: [],
    league: null,
    scouting_assignments: [],
    board_objectives: [],
  };
};

const createDataTransfer = () => {
  const data = new Map<string, string>();
  return {
    effectAllowed: "move",
    dropEffect: "move",
    setData: (type: string, value: string) => {
      data.set(type, value);
    },
    getData: (type: string) => data.get(type) ?? "",
  };
};

describe("TacticsTab", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
    mockedInvoke.mockResolvedValue(makeGameState());
  });

  it("renders play style guidance plus a single squad list", () => {
    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    expect(screen.getByText("squad.playStyleImpactTitle")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Keeps your team measured in and out of possession, with a steady shape and fewer extremes.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("tactics.fullSquad")).toBeInTheDocument();
    expect(screen.getByTestId("bench-player-d5")).toBeInTheDocument();
    expect(screen.queryByTestId("pitch-bench-player-d5")).not.toBeInTheDocument();
  });

  it("uses color-coded squad states for starters, substitutes, and reserves", () => {
    const gameState = makeGameState();
    gameState.players.push(
      makePlayer("r1", "Defender"),
      makePlayer("r2", "Defender"),
      makePlayer("r3", "Defender"),
      makePlayer("r4", "Defender"),
      makePlayer("r5", "Defender"),
      makePlayer("r6", "Defender"),
      makePlayer("r7", "Defender"),
    );

    render(
      <TacticsTab
        gameState={gameState}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    const starterRow = screen.getByTestId("xi-player-d1");
    const substituteRow = screen.getByTestId("bench-player-d5");
    const reserveRow = screen.getByTestId("bench-player-r7");

    expect(within(starterRow).getByText("XI")).toBeInTheDocument();
    expect(starterRow.className).toContain("border-l-emerald-500");
    expect(within(substituteRow).getByText("SUB")).toBeInTheDocument();
    expect(substituteRow.className).toContain("border-l-sky-500");
    expect(within(reserveRow).getByText("RES")).toBeInTheDocument();
    expect(reserveRow.className).toContain("border-l-rose-500");
  });

  it("keeps youth academy players out of first-team tactics selection", () => {
    const gameState = makeGameState();
    gameState.players.push(
      makePlayer("y1", "Forward", {
        full_name: "Academy Prospect",
        squad_role: "Youth",
      }),
    );

    render(
      <TacticsTab
        gameState={gameState}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    expect(screen.queryByText("Academy Prospect")).not.toBeInTheDocument();
  });

  it("orders the best available lineup while skipping injured and suspended players", async () => {
    const gameState = makeGameState();
    gameState.players.push(
      makePlayer("gk2", "Goalkeeper", { ovr: 88 }),
      makePlayer("lb1", "Defender", {
        natural_position: "LeftBack",
        alternate_positions: ["LeftBack"],
        ovr: 82,
      }),
      makePlayer("cb1", "Defender", {
        natural_position: "CenterBack",
        alternate_positions: ["CenterBack"],
        ovr: 86,
      }),
      makePlayer("cb2", "Defender", {
        natural_position: "CenterBack",
        alternate_positions: ["CenterBack"],
        ovr: 84,
      }),
      makePlayer("cb-injured", "Defender", {
        natural_position: "CenterBack",
        alternate_positions: ["CenterBack"],
        injury: { name: "Knock", days_remaining: 2 },
        ovr: 99,
      }),
      makePlayer("rb1", "Defender", {
        natural_position: "RightBack",
        alternate_positions: ["RightBack"],
        ovr: 82,
      }),
      makePlayer("lm1", "Midfielder", {
        natural_position: "LeftMidfielder",
        alternate_positions: ["LeftMidfielder"],
        ovr: 83,
      }),
      makePlayer("cm1", "Midfielder", {
        natural_position: "CentralMidfielder",
        alternate_positions: ["CentralMidfielder"],
        ovr: 86,
      }),
      makePlayer("cm2", "Midfielder", {
        natural_position: "CentralMidfielder",
        alternate_positions: ["CentralMidfielder"],
        ovr: 84,
      }),
      makePlayer("rm1", "Midfielder", {
        natural_position: "RightMidfielder",
        alternate_positions: ["RightMidfielder"],
        ovr: 83,
      }),
      makePlayer("st1", "Forward", {
        natural_position: "Striker",
        alternate_positions: ["Striker"],
        ovr: 86,
      }),
      makePlayer("st2", "Forward", {
        natural_position: "Striker",
        alternate_positions: ["Striker"],
        ovr: 84,
      }),
      makePlayer("st-suspended", "Forward", {
        natural_position: "Striker",
        alternate_positions: ["Striker"],
        suspension: { reason: "RedCard", matches_remaining: 1 },
        ovr: 99,
      }),
    );

    render(
      <TacticsTab
        gameState={gameState}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ordenar Mejor opcion disponible",
      }),
    );

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("set_starting_xi", {
        playerIds: [
          "gk2",
          "lb1",
          "cb1",
          "cb2",
          "rb1",
          "lm1",
          "cm1",
          "cm2",
          "rm1",
          "st1",
          "st2",
        ],
      });
    });
  });

  it("sends the correct starting xi order when a squad-list bench defender is dropped onto a defensive slot", async () => {
    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    const benchPlayer = screen.getByTestId("bench-player-d5");
    const pitchSlot = screen.getByTestId("pitch-slot-1");
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(benchPlayer, { dataTransfer });
    fireEvent.drop(pitchSlot, { dataTransfer });

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("set_starting_xi", {
        playerIds: [
          "gk1",
          "d5",
          "d2",
          "d3",
          "d4",
          "m1",
          "m2",
          "m3",
          "m4",
          "f1",
          "f2",
        ],
      });
    });
  });

  it("sends the correct starting xi order when a bench table row is dropped onto a starter row", async () => {
    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    const benchPlayer = screen.getByTestId("bench-player-d5");
    const starterRow = screen.getByTestId("xi-player-d2");
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(benchPlayer, { dataTransfer });
    fireEvent.drop(starterRow, { dataTransfer });

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("set_starting_xi", {
        playerIds: [
          "gk1",
          "d1",
          "d5",
          "d3",
          "d4",
          "m1",
          "m2",
          "m3",
          "m4",
          "f1",
          "f2",
        ],
      });
    });
  });

  it("makes lineup table rows draggable", () => {
    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId("bench-player-drag-handle-d5"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("xi-player-drag-handle-d1"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("bench-player-d5")).toHaveAttribute(
      "draggable",
      "true",
    );
    expect(screen.getByTestId("xi-player-d1")).toHaveAttribute(
      "draggable",
      "true",
    );
    expect(screen.queryByTestId("pitch-bench-player-d5")).not.toBeInTheDocument();
  });

  it("shows a bench player's natural position in the squad list when it differs from position", () => {
    const gameState = makeGameState();
    gameState.players = gameState.players.map((player) =>
      player.id === "d5"
        ? {
          ...player,
          position: "Midfielder",
          natural_position: "Defender",
        }
        : player,
    );

    render(
      <TacticsTab
        gameState={gameState}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    const benchRow = screen.getByTestId("bench-player-d5");

    expect(
      within(benchRow).getAllByText("common.posAbbr.Defender").length,
    ).toBeGreaterThan(0);
    expect(
      within(benchRow).queryByText("common.posAbbr.Midfielder"),
    ).not.toBeInTheDocument();
  });

  it("localizes the selected player position in the comparison panel", () => {
    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("pitch-player-f1"));

    expect(screen.getByText("common.positions.Forward")).toBeInTheDocument();
    expect(screen.queryByText("Forward")).not.toBeInTheDocument();
  });

  it("opens bench player profiles from the single squad list", () => {
    const onSelectPlayer = vi.fn();

    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={onSelectPlayer}
        onGameUpdate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("bench-player-d5"));

    expect(onSelectPlayer).toHaveBeenCalledWith("d5");
  });

  it("uses pitch clicks for selection and swap instead of opening the player profile", async () => {
    const onSelectPlayer = vi.fn();

    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={onSelectPlayer}
        onGameUpdate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("pitch-player-d1"));

    expect(onSelectPlayer).not.toHaveBeenCalled();
    expect(screen.getByText("tactics.selectedPlayer")).toBeInTheDocument();
    expect(screen.getAllByText("Player d1").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId("pitch-player-d2"));

    expect(onSelectPlayer).not.toHaveBeenCalled();
    expect(mockedInvoke).not.toHaveBeenCalled();
    expect(screen.getByText("tactics.comparePlayer")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "tactics.confirmSwap" }),
    );

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("set_starting_xi", {
        playerIds: [
          "gk1",
          "d2",
          "d1",
          "d3",
          "d4",
          "m1",
          "m2",
          "m3",
          "m4",
          "f1",
          "f2",
        ],
      });
    });
  });

  it("shows a comparison panel after selecting a second pitch player", () => {
    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("pitch-player-d1"));
    fireEvent.click(screen.getByTestId("pitch-player-m1"));

    expect(screen.getByText("tactics.comparePlayer")).toBeInTheDocument();
    expect(screen.getAllByText("Player m1").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("common.attributes.vision").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "tactics.confirmSwap" }),
    ).toBeInTheDocument();
  });

  it("only opens profiles from the lineup tables", () => {
    const onSelectPlayer = vi.fn();

    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={onSelectPlayer}
        onGameUpdate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("xi-player-d1"));

    expect(onSelectPlayer).toHaveBeenCalledWith("d1");
  });

  it("persists default set piece and team role assignments from the roles tab", async () => {
    render(
      <TacticsTab
        gameState={makeGameState()}
        onSelectPlayer={vi.fn()}
        onGameUpdate={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "tactics.rolesTab" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "tactics.autoSelectAssignments" }),
    );

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("set_team_match_roles", {
        matchRoles: expect.objectContaining({
          captain: expect.any(String),
          vice_captain: expect.any(String),
          penalty_taker: expect.any(String),
          free_kick_taker: expect.any(String),
          corner_taker: expect.any(String),
        }),
      });
    });
  });
});

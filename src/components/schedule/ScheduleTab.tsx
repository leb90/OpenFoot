import { useEffect, useMemo, useState } from "react";
import { GameStateData, FixtureData, TeamData } from "../../store/gameStore";
import ContextMenu, { type ContextMenuItem } from "../ContextMenu";
import { Card, CardBody, Badge } from "../ui";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  TableProperties,
  Trophy,
} from "lucide-react";
import {
  formatMatchDate,
  getAllCompetitionFixtures,
  getLocale,
  getTeamName,
} from "../../lib/helpers";
import { resolveSeasonContext } from "../../lib/seasonContext";
import { useTranslation } from "react-i18next";

interface ScheduleTabProps {
  gameState: GameStateData;
  onSelectTeam: (id: string) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date {
  const dateOnly = value.slice(0, 10);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)
    ? new Date(`${dateOnly}T12:00:00`)
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function startOfCalendarGrid(date: Date): Date {
  const start = monthStart(date);
  const mondayOffset = (start.getDay() + 6) % 7;
  return addDays(start, -mondayOffset);
}

function isSameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function isSameDateKey(date: Date, dateKey: string): boolean {
  return toDateKey(date) === dateKey;
}

function buildMonthCells(visibleMonth: Date): Date[] {
  const gridStart = startOfCalendarGrid(visibleMonth);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function formatMonthLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(getLocale(locale), {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatSelectedDayLabel(dateKey: string, locale: string): string {
  return new Intl.DateTimeFormat(getLocale(locale), {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDateOnly(dateKey));
}

function weekdayLabels(locale: string): string[] {
  const baseMonday = new Date(2026, 0, 5, 12);
  const formatter = new Intl.DateTimeFormat(getLocale(locale), {
    weekday: "short",
  });
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(addDays(baseMonday, index)).replace(".", ""),
  );
}

function textColorForBackground(hex: string): string {
  const cleanHex = hex.replace("#", "");
  const value = cleanHex.length === 3
    ? cleanHex.split("").map((char) => `${char}${char}`).join("")
    : cleanHex;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#111827" : "#ffffff";
}

function TeamCrest({
  team,
  size = "md",
}: {
  team: TeamData;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const sizeClassName = {
    xs: "h-8 w-8 text-[0.55rem]",
    sm: "h-10 w-10 text-[0.65rem]",
    md: "h-12 w-12 text-xs",
    lg: "h-16 w-16 text-sm",
    xl: "h-24 w-24 text-xl",
  }[size];
  const label = team.short_name || team.name.slice(0, 3).toUpperCase();

  return (
    <span className="group relative inline-flex shrink-0 items-center justify-center">
      <span
        aria-label={team.name}
        title={team.name}
        className={`${sizeClassName} inline-flex items-center justify-center border border-white/35 bg-gray-200 text-center font-heading font-bold uppercase leading-none shadow-lg shadow-black/20 ring-1 ring-black/10`}
        style={{
          background: `linear-gradient(145deg, ${team.colors.primary}, ${team.colors.secondary})`,
          color: textColorForBackground(team.colors.primary),
          clipPath: "polygon(50% 0%, 90% 15%, 84% 74%, 50% 100%, 16% 74%, 10% 15%)",
        }}
      >
        {label}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 max-w-44 -translate-x-1/2 rounded bg-navy-950 px-2 py-1 text-center text-[11px] font-semibold normal-case text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {team.name}
      </span>
    </span>
  );
}

export default function ScheduleTab({
  gameState,
  onSelectTeam,
}: ScheduleTabProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const currentDateKey = gameState.clock.current_date.split("T")[0];
  const [view, setView] = useState<"calendar" | "standings">("calendar");
  const [visibleMonth, setVisibleMonth] = useState(() =>
    monthStart(parseDateOnly(currentDateKey)),
  );
  const [selectedDateKey, setSelectedDateKey] = useState(currentDateKey);
  const league = gameState.league;
  const userTeamId = gameState.manager.team_id;
  const seasonContext = resolveSeasonContext(gameState);
  const isPreseason = seasonContext.phase === "Preseason";
  const allFixtures = useMemo(
    () =>
      getAllCompetitionFixtures(gameState).sort(
        (left, right) =>
          left.date.localeCompare(right.date) ||
          left.matchday - right.matchday ||
          left.id.localeCompare(right.id),
      ),
    [gameState],
  );
  const fixturesByDate = useMemo(() => {
    const groups = new Map<string, FixtureData[]>();
    allFixtures.forEach((fixture) => {
      const list = groups.get(fixture.date) ?? [];
      list.push(fixture);
      groups.set(fixture.date, list);
    });
    return groups;
  }, [allFixtures]);
  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const weekdays = useMemo(() => weekdayLabels(locale), [locale]);
  const selectedFixtures = fixturesByDate.get(selectedDateKey) ?? [];
  const selectedDate = parseDateOnly(selectedDateKey);
  const teamsById = useMemo(
    () => new Map(gameState.teams.map((team) => [team.id, team])),
    [gameState.teams],
  );

  useEffect(() => {
    setVisibleMonth(monthStart(parseDateOnly(currentDateKey)));
    setSelectedDateKey(currentDateKey);
  }, [currentDateKey]);

  const buildTeamMenuItem = (
    label: string,
    teamId: string,
  ): ContextMenuItem => ({
    label,
    onClick: () => onSelectTeam(teamId),
  });

  const fixtureCompetitionLabel = (fixture: FixtureData): string => {
    if (fixture.competition === "League") {
      return league?.name ?? t("schedule.fixtures");
    }
    if (fixture.competition === "Continental") {
      return fixture.competition_name ?? t("dashboard.tournaments");
    }
    if (fixture.competition === "PreseasonTournament") {
      return t("season.preseasonTournament");
    }
    return t("season.friendly");
  };

  const fixtureTagLabel = (fixture: FixtureData): string => {
    if (fixture.competition === "League") {
      return locale.startsWith("en") ? "LEAGUE" : "LIGA";
    }
    if (fixture.competition === "Continental") return "CONT";
    if (fixture.competition === "PreseasonTournament") return "PRE";
    return t("season.friendly").slice(0, 3).toUpperCase();
  };

  const resultCode = (kind: "win" | "loss" | "draw"): string => {
    if (locale.startsWith("es")) {
      return kind === "win" ? "G" : kind === "loss" ? "P" : "E";
    }
    if (locale.startsWith("fr") || locale.startsWith("it") || locale.startsWith("pt")) {
      return kind === "win" ? "V" : kind === "loss" ? "D" : "N";
    }
    if (locale.startsWith("de")) {
      return kind === "win" ? "S" : kind === "loss" ? "N" : "U";
    }
    return kind === "win" ? "W" : kind === "loss" ? "L" : "D";
  };

  const fixtureContextItems = (fixture: FixtureData): ContextMenuItem[] => [
    buildTeamMenuItem(
      `${t("common.viewTeam")}: ${getTeamName(gameState.teams, fixture.home_team_id)}`,
      fixture.home_team_id,
    ),
    buildTeamMenuItem(
      `${t("common.viewTeam")}: ${getTeamName(gameState.teams, fixture.away_team_id)}`,
      fixture.away_team_id,
    ),
  ];

  const resultLabel = (fixture: FixtureData): string | null => {
    if (!fixture.result) return null;

    if (
      userTeamId &&
      (fixture.home_team_id === userTeamId || fixture.away_team_id === userTeamId)
    ) {
      const myGoals =
        fixture.home_team_id === userTeamId
          ? fixture.result.home_goals
          : fixture.result.away_goals;
      const opponentGoals =
        fixture.home_team_id === userTeamId
          ? fixture.result.away_goals
          : fixture.result.home_goals;
      const outcome =
        myGoals > opponentGoals
          ? resultCode("win")
          : myGoals < opponentGoals
            ? resultCode("loss")
            : resultCode("draw");
      return `${outcome} ${myGoals}-${opponentGoals}`;
    }

    return `${fixture.result.home_goals}-${fixture.result.away_goals}`;
  };

  const homeAwayLabel = (fixture: FixtureData): string => {
    if (
      !userTeamId ||
      (fixture.home_team_id !== userTeamId && fixture.away_team_id !== userTeamId)
    ) {
      return t("common.vs");
    }

    return fixture.home_team_id === userTeamId ? t("home.home") : t("home.away");
  };

  const opponentName = (fixture: FixtureData): string => {
    if (
      !userTeamId ||
      (fixture.home_team_id !== userTeamId && fixture.away_team_id !== userTeamId)
    ) {
      return `${getTeamName(gameState.teams, fixture.home_team_id)} ${t("common.vs")} ${getTeamName(gameState.teams, fixture.away_team_id)}`;
    }

    return getTeamName(
      gameState.teams,
      fixture.home_team_id === userTeamId ? fixture.away_team_id : fixture.home_team_id,
    );
  };

  const teamForId = (teamId: string): TeamData | null =>
    teamsById.get(teamId) ?? null;

  const fixtureDisplayTeams = (fixture: FixtureData): TeamData[] => {
    if (userTeamId && fixture.home_team_id === userTeamId) {
      const opponent = teamForId(fixture.away_team_id);
      return opponent ? [opponent] : [];
    }
    if (userTeamId && fixture.away_team_id === userTeamId) {
      const opponent = teamForId(fixture.home_team_id);
      return opponent ? [opponent] : [];
    }

    return [teamForId(fixture.home_team_id), teamForId(fixture.away_team_id)].filter(
      Boolean,
    ) as TeamData[];
  };

  const isManagerFixture = (fixture: FixtureData): boolean =>
    Boolean(
      userTeamId &&
        (fixture.home_team_id === userTeamId || fixture.away_team_id === userTeamId),
    );

  const selectedFocusFixture =
    selectedFixtures.find((fixture) => isManagerFixture(fixture)) ??
    selectedFixtures[0] ??
    null;
  const selectedFocusTeams = selectedFocusFixture
    ? fixtureDisplayTeams(selectedFocusFixture)
    : [];

  const transferWindowLabel = (() => {
    const window = seasonContext.transfer_window;
    if (!window) return null;
    if (window.status === "Open" && window.days_remaining !== null) {
      return t("season.windowClosesInDays", { count: window.days_remaining });
    }
    if (window.status === "Closed" && window.days_until_opens !== null) {
      return t("season.windowOpensInDays", { count: window.days_until_opens });
    }
    return t(`season.transferWindowStatus.${window.status}`);
  })();

  if (!league) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
        {t("schedule.noLeague")}
      </p>
    );
  }

  const standings = [...league.standings].sort(
    (a, b) =>
      b.points - a.points ||
      b.goals_for - b.goals_against - (a.goals_for - a.goals_against) ||
      b.goals_for - a.goals_for,
  );

  return (
    <div className="mx-auto w-full max-w-7xl">
      {isPreseason && (
        <Card accent="accent" className="mb-5">
          <CardBody>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent" size="sm">
                  {t(`season.phases.${seasonContext.phase}`)}
                </Badge>
                <span className="text-sm font-heading font-bold text-gray-800 dark:text-gray-100">
                  {seasonContext.season_start
                    ? t("season.startsOn", {
                      date: formatMatchDate(seasonContext.season_start),
                    })
                    : t("season.noOpener")}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("season.standingsLocked")}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold uppercase tracking-wide text-gray-900 dark:text-white">
            {t("dashboard.schedule")}
          </h2>
          <p className="mt-1 text-sm capitalize text-gray-500 dark:text-gray-400">
            {formatMonthLabel(visibleMonth, locale)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:text-gray-900 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-400 dark:hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setVisibleMonth(monthStart(parseDateOnly(currentDateKey)));
              setSelectedDateKey(currentDateKey);
            }}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 font-heading text-sm font-bold uppercase tracking-wider text-gray-700 transition-colors hover:text-gray-950 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-300 dark:hover:text-white"
          >
            {formatMatchDate(currentDateKey)}
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:text-gray-900 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-400 dark:hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView("calendar")}
          className={`px-4 py-2 rounded-lg font-heading font-bold text-sm uppercase tracking-wider transition-all ${view === "calendar"
              ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
              : "bg-white dark:bg-navy-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-navy-600"
            }`}
        >
          <CalendarDays className="w-4 h-4 inline mr-1.5 -mt-0.5" />{" "}
          {t("dashboard.schedule")}
        </button>
        <button
          onClick={() => setView("standings")}
          className={`px-4 py-2 rounded-lg font-heading font-bold text-sm uppercase tracking-wider transition-all ${view === "standings"
              ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
              : "bg-white dark:bg-navy-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-navy-600"
            }`}
        >
          <TableProperties className="w-4 h-4 inline mr-1.5 -mt-0.5" />{" "}
          {t("schedule.standings")}
        </button>
      </div>

      {view === "calendar" && (
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-navy-600 dark:bg-navy-800">
            <p className="font-heading text-sm font-bold uppercase text-gray-500 dark:text-gray-400">
              {formatSelectedDayLabel(selectedDateKey, locale)}
            </p>

            {selectedFocusFixture ? (
              <ContextMenu items={fixtureContextItems(selectedFocusFixture)}>
                <div
                  className="mt-5 rounded-lg border border-primary-500/20 bg-linear-to-br from-primary-500/15 via-navy-900/5 to-accent-500/10 p-5 text-center dark:from-primary-500/20 dark:via-navy-900 dark:to-accent-500/10"
                  data-testid={`schedule-selected-fixture-${selectedFocusFixture.id}`}
                >
                  <div className="mx-auto flex min-h-28 items-center justify-center gap-3">
                    {selectedFocusTeams.map((team) => (
                      <TeamCrest key={team.id} team={team} size="xl" />
                    ))}
                  </div>
                  <p className="mt-4 font-heading text-xs font-bold uppercase text-primary-600 dark:text-primary-300">
                    {fixtureCompetitionLabel(selectedFocusFixture)}
                  </p>
                  <h3 className="mt-1 font-heading text-2xl font-bold uppercase leading-tight text-gray-950 dark:text-white">
                    {opponentName(selectedFocusFixture)}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {resultLabel(selectedFocusFixture) ??
                      homeAwayLabel(selectedFocusFixture)}
                  </p>
                </div>
              </ContextMenu>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center dark:border-navy-600">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary-500/10 font-heading text-2xl font-bold text-primary-500">
                  {selectedDate.getDate()}
                </div>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {t("schedule.noSchedule")}
                </p>
              </div>
            )}

            {transferWindowLabel ? (
              <div className="mt-5 border-t border-gray-100 pt-4 text-center dark:border-navy-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {transferWindowLabel}
                </p>
              </div>
            ) : null}

            {selectedFixtures.length > 1 ? (
              <div className="mt-5 space-y-2">
                {selectedFixtures.map((fixture) => {
                  const displayTeams = fixtureDisplayTeams(fixture);
                  return (
                    <ContextMenu items={fixtureContextItems(fixture)} key={fixture.id}>
                      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5 transition-colors hover:border-primary-300 dark:border-navy-600 dark:bg-navy-900/50 dark:hover:border-primary-500">
                        <div className="flex -space-x-1">
                          {displayTeams.map((team) => (
                            <TeamCrest key={team.id} team={team} size="xs" />
                          ))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {opponentName(fixture)}
                          </p>
                          <p className="text-[11px] font-heading font-bold uppercase text-gray-500 dark:text-gray-400">
                            {fixtureTagLabel(fixture)} ·{" "}
                            {resultLabel(fixture) ?? homeAwayLabel(fixture)}
                          </p>
                        </div>
                      </div>
                    </ContextMenu>
                  );
                })}
              </div>
            ) : null}
          </aside>

          <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-800">
            <div className="min-w-[840px]">
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-navy-600 dark:bg-navy-900/60">
                {weekdays.map((weekday) => (
                  <div
                    key={weekday}
                    className="px-2 py-3 text-center font-heading text-xs font-bold uppercase text-gray-500 dark:text-gray-400"
                  >
                    {weekday}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells.map((date) => {
                  const dateKey = toDateKey(date);
                  const fixtures = fixturesByDate.get(dateKey) ?? [];
                  const shownFixtures = [...fixtures]
                    .sort((left, right) => {
                      const leftIsManagerFixture = isManagerFixture(left) ? 0 : 1;
                      const rightIsManagerFixture = isManagerFixture(right) ? 0 : 1;
                      return (
                        leftIsManagerFixture - rightIsManagerFixture ||
                        left.id.localeCompare(right.id)
                      );
                    })
                    .slice(0, 2);
                  const hiddenFixtureCount = Math.max(
                    0,
                    fixtures.length - shownFixtures.length,
                  );
                  const isCurrentMonth = isSameMonth(date, visibleMonth);
                  const isToday = isSameDateKey(date, currentDateKey);
                  const isSelected = dateKey === selectedDateKey;

                  return (
                    <button
                      type="button"
                      key={dateKey}
                      onClick={() => setSelectedDateKey(dateKey)}
                      className={`min-h-32 border-b border-r border-gray-100 p-2 text-left transition-colors last:border-r-0 dark:border-navy-700 ${
                        isSelected
                          ? "bg-primary-50 ring-2 ring-inset ring-primary-400 dark:bg-primary-500/10"
                          : "bg-white hover:bg-gray-50 dark:bg-navy-800 dark:hover:bg-navy-700/60"
                      } ${isCurrentMonth ? "" : "opacity-45"}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`font-heading text-2xl font-bold ${
                            isToday
                              ? "flex h-9 w-9 items-center justify-center rounded-lg bg-accent-400 text-navy-950"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {fixtures.length > 0 ? (
                          <span className="text-[11px] font-heading font-bold uppercase text-gray-400 dark:text-gray-500">
                            {fixtures.length}
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        {shownFixtures.map((fixture) => {
                          const displayTeams = fixtureDisplayTeams(fixture);
                          const score = resultLabel(fixture);

                          return (
                            <ContextMenu items={fixtureContextItems(fixture)} key={fixture.id}>
                              <div
                                className={`rounded-lg border px-2 py-1.5 transition ${
                                  isManagerFixture(fixture)
                                    ? "border-primary-400 bg-primary-500 text-white shadow-sm shadow-primary-500/20"
                                    : "border-gray-200 bg-gray-50 text-gray-700 dark:border-navy-600 dark:bg-navy-900/70 dark:text-gray-200"
                                }`}
                                data-testid={`schedule-fixture-${fixture.id}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-heading text-[11px] font-bold uppercase leading-none">
                                      {isManagerFixture(fixture)
                                        ? homeAwayLabel(fixture)
                                        : fixtureTagLabel(fixture)}
                                    </p>
                                    <p className="mt-1 text-[10px] font-semibold opacity-80">
                                      {score ?? fixtureTagLabel(fixture)}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 -space-x-1">
                                    {displayTeams.map((team) => (
                                      <TeamCrest key={team.id} team={team} size="xs" />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </ContextMenu>
                          );
                        })}
                        {hiddenFixtureCount > 0 ? (
                          <div className="rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-500 dark:bg-navy-700 dark:text-gray-300">
                            +{hiddenFixtureCount}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {view === "standings" &&
        (isPreseason ? (
          <Card>
            <CardBody>
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Trophy className="w-8 h-8 text-gray-300 dark:text-navy-600" />
                <p className="text-sm font-heading font-bold text-gray-800 dark:text-gray-100">
                  {t("season.standingsLocked")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {seasonContext.season_start
                    ? t("season.startsOn", {
                      date: formatMatchDate(seasonContext.season_start),
                    })
                    : t("season.noOpener")}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <div className="p-5 border-b border-gray-100 dark:border-navy-600 bg-gradient-to-r from-navy-700 to-navy-800 rounded-t-xl">
              <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <Trophy className="text-accent-400 w-5 h-5" />
                {league.name} —{" "}
                {t("schedule.season", { number: league.season })}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-navy-800 border-b border-gray-200 dark:border-navy-600 text-xs">
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-8">
                      #
                    </th>
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {t("common.team")}
                    </th>
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      {t("common.played")}
                    </th>
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      {t("common.won")}
                    </th>
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      {t("common.drawn")}
                    </th>
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      {t("common.lost")}
                    </th>
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      {t("common.gf")}
                    </th>
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      {t("common.ga")}
                    </th>
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      {t("common.gd")}
                    </th>
                    <th className="py-3 px-4 font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      {t("common.pts")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-600">
                  {standings.map((entry, idx) => {
                    const isUser = entry.team_id === userTeamId;
                    const gd = entry.goals_for - entry.goals_against;
                    const contextItems = [
                      buildTeamMenuItem(t("common.viewTeam"), entry.team_id),
                    ];

                    return (
                      <ContextMenu items={contextItems} key={entry.team_id}>
                        <tr
                          className={`transition-colors ${isUser ? "bg-primary-50 dark:bg-primary-500/10" : "hover:bg-gray-50 dark:hover:bg-navy-700/50"}`}
                          data-testid={`schedule-standings-row-${entry.team_id}`}
                        >
                          <td className="py-3 px-4 font-heading font-bold text-sm text-gray-400 dark:text-gray-500">
                            {idx + 1}
                          </td>
                          <td
                            onClick={() => onSelectTeam(entry.team_id)}
                            className={`py-3 px-4 font-semibold text-sm cursor-pointer hover:underline ${isUser ? "text-primary-600 dark:text-primary-400" : "text-gray-800 dark:text-gray-200"}`}
                          >
                            {getTeamName(gameState.teams, entry.team_id)}
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                            {entry.played}
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                            {entry.won}
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                            {entry.drawn}
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                            {entry.lost}
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                            {entry.goals_for}
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                            {entry.goals_against}
                          </td>
                          <td
                            className={`py-3 px-4 text-center text-sm font-semibold tabular-nums ${gd > 0 ? "text-primary-500" : gd < 0 ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}
                          >
                            {gd > 0 ? `+${gd}` : gd}
                          </td>
                          <td className="py-3 px-4 text-center font-heading font-bold text-sm text-gray-800 dark:text-gray-100 tabular-nums">
                            {entry.points}
                          </td>
                        </tr>
                      </ContextMenu>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
    </div>
  );
}

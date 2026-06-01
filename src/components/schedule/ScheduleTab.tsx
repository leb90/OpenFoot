import { useEffect, useMemo, useState } from "react";
import { GameStateData, FixtureData } from "../../store/gameStore";
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

  const fixtureAccentClassName = (fixture: FixtureData): string => {
    if (fixture.competition === "League") return "bg-primary-500 text-white";
    if (fixture.competition === "Continental") return "bg-blue-500 text-white";
    if (fixture.competition === "PreseasonTournament") return "bg-accent-500 text-navy-950";
    return "bg-gray-500 text-white";
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

  const isManagerFixture = (fixture: FixtureData): boolean =>
    Boolean(
      userTeamId &&
        (fixture.home_team_id === userTeamId || fixture.away_team_id === userTeamId),
    );

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
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-gray-200 bg-white p-5 dark:border-navy-600 dark:bg-navy-800">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {formatSelectedDayLabel(selectedDateKey, locale)}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-500/10 font-heading text-2xl font-bold text-primary-500">
                {selectedDate.getDate()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-lg font-bold uppercase text-gray-900 dark:text-white">
                  {gameState.world?.league_name ?? league.name}
                </p>
                {transferWindowLabel ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {transferWindowLabel}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 max-h-[58vh] space-y-3 overflow-y-auto pr-1">
              {selectedFixtures.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-navy-600 dark:text-gray-400">
                  {t("schedule.noSchedule")}
                </p>
              ) : (
                selectedFixtures.map((fixture) => {
                  const completed = fixture.status === "Completed";
                  const score = resultLabel(fixture);
                  return (
                    <ContextMenu items={fixtureContextItems(fixture)} key={fixture.id}>
                      <div
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-primary-300 dark:border-navy-600 dark:bg-navy-900/50 dark:hover:border-primary-500"
                        data-testid={`schedule-selected-fixture-${fixture.id}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant={fixture.competition === "Continental" ? "accent" : "primary"} size="sm">
                            {fixtureTagLabel(fixture)}
                          </Badge>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {completed && score ? score : homeAwayLabel(fixture)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {opponentName(fixture)}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          {fixtureCompetitionLabel(fixture)}
                        </p>
                      </div>
                    </ContextMenu>
                  );
                })
              )}
            </div>
          </aside>

          <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-navy-600 dark:bg-navy-800">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-navy-600 dark:bg-navy-900/60">
                {weekdays.map((weekday) => (
                  <div
                    key={weekday}
                    className="px-2 py-3 text-center font-heading text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400"
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
                      className={`min-h-28 border-b border-r border-gray-100 p-2 text-left transition-colors last:border-r-0 dark:border-navy-700 sm:min-h-32 ${
                        isSelected
                          ? "bg-primary-50 ring-2 ring-inset ring-primary-400 dark:bg-primary-500/10"
                          : "bg-white hover:bg-gray-50 dark:bg-navy-800 dark:hover:bg-navy-700/60"
                      } ${isCurrentMonth ? "" : "opacity-45"}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`font-heading text-lg font-bold ${
                            isToday
                              ? "flex h-8 w-8 items-center justify-center rounded-full bg-accent-400 text-navy-950"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {fixtures.length > 0 ? (
                          <span className="h-2 w-2 rounded-full bg-primary-400" />
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        {shownFixtures.map((fixture) => (
                          <ContextMenu items={fixtureContextItems(fixture)} key={fixture.id}>
                            <div
                              className={`truncate rounded px-2 py-1 text-[11px] font-heading font-bold uppercase leading-tight ${fixtureAccentClassName(fixture)}`}
                              data-testid={`schedule-fixture-${fixture.id}`}
                            >
                              {isManagerFixture(fixture) ? (
                                <span className="mr-1">{homeAwayLabel(fixture)}</span>
                              ) : null}
                              <span>{fixtureTagLabel(fixture)}</span>
                            </div>
                          </ContextMenu>
                        ))}
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

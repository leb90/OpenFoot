import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  Search,
} from "lucide-react";
import type { JSX, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getLocale, getTeamName } from "../../lib/helpers";
import type { PlayerData, TeamData } from "../../store/gameStore";
import type { MatchModeType } from "../../hooks/useAdvanceTime";
import ContextMenu, { type ContextMenuItem } from "../ContextMenu";
import {
  buildViewProfileMenuItem,
  buildViewTeamMenuItem,
} from "../playerActions/playerContextMenuItems";
import { Badge, ThemeToggle } from "../ui";
import { translatePositionAbbreviation } from "../squad/SquadTab.helpers";
import { getPlayerBadgeVariant } from "./dashboardHelpers";

export interface DashboardMatchModeMeta {
  buttonColorClass: string;
  desc: string;
  dropdownColorClass: string;
  icon: ReactNode;
  label: string;
}

interface DashboardHeaderProps {
  activeTabLabel: string;
  currentDate: string;
  hasProfileHistory: boolean;
  hasMatchToday: boolean;
  isAdvancing: boolean;
  isUnemployed: boolean;
  isSaving: boolean;
  matchMode: MatchModeType;
  matchedPlayers: PlayerData[];
  matchedTeams: TeamData[];
  modeMeta: Record<MatchModeType, DashboardMatchModeMeta>;
  onBack: () => void;
  onContinue: () => void;
  onSave: () => void;
  onSearchBlur: () => void;
  onSearchFocus: () => void;
  onSearchQueryChange: (query: string) => void;
  onSelectMatchMode: (mode: MatchModeType) => void;
  onSelectSearchPlayer: (playerId: string) => void;
  onSelectSearchTeam: (teamId: string) => void;
  onSkipToMatchDay: () => void;
  onToggleContinueMenu: () => void;
  saveFlash: boolean;
  searchOpen: boolean;
  searchQuery: string;
  seasonComplete: boolean;
  showContinueMenu: boolean;
  teams: TeamData[];
}

interface CalendarDay {
  ariaLabel: string;
  dayNumber: string;
  isCurrent: boolean;
  isWeekend: boolean;
  weekday: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseGameDate(value: string): Date {
  const dateOnly = value.slice(0, 10);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)
    ? new Date(`${dateOnly}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function startOfGameWeek(date: Date): Date {
  const mondayOffset = (date.getDay() + 6) % 7;
  return addDays(date, -mondayOffset);
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function buildCalendarDays(currentDate: string, locale: string): CalendarDay[] {
  const current = parseGameDate(currentDate);
  const weekStart = startOfGameWeek(current);
  const weekdayFormatter = new Intl.DateTimeFormat(getLocale(locale), {
    weekday: "short",
  });
  const fullFormatter = new Intl.DateTimeFormat(getLocale(locale), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      ariaLabel: fullFormatter.format(date),
      dayNumber: String(date.getDate()),
      isCurrent: isSameCalendarDay(date, current),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      weekday: weekdayFormatter.format(date).replace(".", ""),
    };
  });
}

function formatCalendarMonthLabel(currentDate: string, locale: string): string {
  const current = parseGameDate(currentDate);
  return new Intl.DateTimeFormat(getLocale(locale), {
    month: "long",
    year: "numeric",
  }).format(current);
}

function getCalendarCellClassName(day: CalendarDay, isAdvancing: boolean): string {
  const baseClassName =
    "flex min-h-14 flex-col items-center justify-center border-r border-gray-200 px-2 py-2 last:border-r-0 dark:border-navy-600";

  if (day.isCurrent) {
    return `${baseClassName} bg-primary-500 text-white shadow-inner ${isAdvancing ? "animate-pulse" : ""}`;
  }

  if (day.isWeekend) {
    return `${baseClassName} bg-gray-100 text-gray-500 dark:bg-navy-900/60 dark:text-gray-400`;
  }

  return `${baseClassName} bg-white text-gray-700 dark:bg-navy-800 dark:text-gray-200`;
}

function DashboardCalendarStrip({
  currentDate,
  hasMatchToday,
  isAdvancing,
  label,
  locale,
}: {
  currentDate: string;
  hasMatchToday: boolean;
  isAdvancing: boolean;
  label: string;
  locale: string;
}): JSX.Element {
  const days = buildCalendarDays(currentDate, locale);
  const monthLabel = formatCalendarMonthLabel(currentDate, locale);

  return (
    <div className="flex min-w-0 items-stretch gap-3">
      <div className="flex w-32 shrink-0 flex-col justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-navy-600 dark:bg-navy-800">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <CalendarIcon className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase">{label}</span>
        </div>
        <span className="mt-1 truncate text-sm font-heading font-bold capitalize text-gray-900 dark:text-gray-100">
          {monthLabel}
        </span>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-7 overflow-hidden rounded-lg border border-gray-200 dark:border-navy-600">
        {days.map((day) => (
          <div
            key={day.ariaLabel}
            aria-current={day.isCurrent ? "date" : undefined}
            aria-label={day.ariaLabel}
            className={getCalendarCellClassName(day, isAdvancing)}
          >
            <span className="text-[11px] font-semibold uppercase leading-none opacity-80">
              {day.weekday}
            </span>
            <span className="mt-1 text-xl font-heading font-bold leading-none">
              {day.dayNumber}
            </span>
            {day.isCurrent && hasMatchToday ? (
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-300" />
            ) : (
              <span className="mt-1 h-1.5 w-1.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getSaveButtonClassName(saveFlash: boolean, isSaving: boolean): string {
  let className =
    "flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-heading font-bold uppercase tracking-wider transition-all hover:cursor-pointer";

  if (saveFlash) {
    className = `${className} bg-green-500 text-white`;
  } else {
    className = `${className} bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-navy-700 dark:text-gray-300 dark:hover:bg-navy-600`;
  }

  if (isSaving) {
    className = `${className} cursor-wait opacity-70`;
  }

  return className;
}

function getSaveButtonLabel(
  t: (key: string) => string,
  saveFlash: boolean,
  isSaving: boolean,
): string {
  if (saveFlash) {
    return t("dashboard.saved");
  }

  if (isSaving) {
    return t("dashboard.saving");
  }

  return t("common.save");
}

function renderSaveButtonIcon(isSaving: boolean): JSX.Element {
  if (isSaving) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return <Save className="h-4 w-4" />;
}

function getContinueButtonClassName(
  modeMeta: DashboardMatchModeMeta,
  isAdvancing: boolean,
  seasonComplete: boolean,
): string {
  let className = `bg-linear-to-r ${modeMeta.buttonColorClass} flex items-center gap-2 rounded-l-lg pl-4 pr-3 py-2.5 text-sm font-heading font-bold uppercase tracking-wider text-white shadow-md transition-all hover:cursor-pointer hover:brightness-110 hover:shadow-lg`;

  if (isAdvancing || seasonComplete) {
    className = `${className} cursor-wait opacity-70`;
  }

  return className;
}

function getContinueDropdownButtonClassName(
  modeMeta: DashboardMatchModeMeta,
): string {
  return `bg-linear-to-r ${modeMeta.dropdownColorClass} rounded-r-lg border-l border-white/20 px-2 py-2.5 text-white transition-colors hover:brightness-110`;
}

function getModeOptionClassName(isActive: boolean): string {
  const baseClassName =
    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-navy-600";

  if (isActive) {
    return `${baseClassName} bg-gray-50 dark:bg-navy-600`;
  }

  return baseClassName;
}

function getModeOptionIconClassName(isActive: boolean): string {
  if (isActive) {
    return "text-primary-500";
  }

  return "text-gray-400";
}

function renderContinueButtonContent(
  t: (key: string) => string,
  hasMatchToday: boolean,
  isAdvancing: boolean,
  seasonComplete: boolean,
  matchModeMeta: DashboardMatchModeMeta,
): ReactNode {
  if (seasonComplete) {
    return <span>{t("endOfSeason.seasonComplete")}</span>;
  }

  if (isAdvancing) {
    return <span>{t("dashboard.simulating")}</span>;
  }

  return (
    <>
      {matchModeMeta.icon}
      <span>
        {hasMatchToday ? matchModeMeta.label : t("dashboard.continue")}
      </span>
    </>
  );
}

function renderSearchResults(props: {
  matchedPlayers: PlayerData[];
  matchedTeams: TeamData[];
  onSelectSearchPlayer: (playerId: string) => void;
  onSelectSearchTeam: (teamId: string) => void;
  teams: TeamData[];
  t: (key: string) => string;
}): JSX.Element {
  const {
    matchedPlayers,
    matchedTeams,
    onSelectSearchPlayer,
    onSelectSearchTeam,
    t,
    teams,
  } = props;

  if (matchedPlayers.length === 0 && matchedTeams.length === 0) {
    return (
      <p className="p-3 text-xs text-gray-400 dark:text-gray-500">
        {t("dashboard.noResults")}
      </p>
    );
  }

  return (
    <>
      {matchedTeams.length > 0 && (
        <div>
          <p className="px-3 pb-1 pt-2 text-xs font-heading font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("dashboard.searchTeams")}
          </p>
          {matchedTeams.map((team) => {
            const contextItems = [
              buildViewTeamMenuItem(t, () => onSelectSearchTeam(team.id)),
            ];

            return (
              <ContextMenu items={contextItems} key={team.id}>
                <button
                  onMouseDown={() => onSelectSearchTeam(team.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-navy-600"
                  data-testid={`dashboard-search-team-${team.id}`}
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
                    style={{ backgroundColor: team.colors.primary }}
                  >
                    {team.short_name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {team.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{team.city}</span>
                </button>
              </ContextMenu>
            );
          })}
        </div>
      )}
      {matchedPlayers.length > 0 && (
        <div>
          <p className="px-3 pb-1 pt-2 text-xs font-heading font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("dashboard.searchPlayers")}
          </p>
          {matchedPlayers.map((player) => {
            const contextItems: ContextMenuItem[] = [
              buildViewProfileMenuItem(t, () => onSelectSearchPlayer(player.id)),
            ];

            if (player.team_id) {
              contextItems.push(
                buildViewTeamMenuItem(t, () => onSelectSearchTeam(player.team_id!)),
              );
            }

            return (
              <ContextMenu items={contextItems} key={player.id}>
                <button
                  onMouseDown={() => onSelectSearchPlayer(player.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-navy-600"
                  data-testid={`dashboard-search-player-${player.id}`}
                >
                  <Badge variant={getPlayerBadgeVariant(player.position)} size="sm">
                    {translatePositionAbbreviation(t, player.position)}
                  </Badge>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {player.full_name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {getTeamName(teams, player.team_id ?? "")}
                  </span>
                </button>
              </ContextMenu>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function DashboardHeader({
  activeTabLabel,
  currentDate,
  hasProfileHistory,
  hasMatchToday,
  isAdvancing,
  isUnemployed,
  isSaving,
  matchMode,
  matchedPlayers,
  matchedTeams,
  modeMeta,
  onBack,
  onContinue,
  onSave,
  onSearchBlur,
  onSearchFocus,
  onSearchQueryChange,
  onSelectMatchMode,
  onSelectSearchPlayer,
  onSelectSearchTeam,
  onSkipToMatchDay,
  onToggleContinueMenu,
  saveFlash,
  searchOpen,
  searchQuery,
  seasonComplete,
  showContinueMenu,
  teams,
}: DashboardHeaderProps): JSX.Element {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const currentModeMeta = modeMeta[matchMode];
  const showSearchResults = searchOpen && searchQuery.length >= 2;

  function handleContinueClick(): void {
    console.info("[DashboardHeader] continueClick", {
      hasMatchToday,
      isAdvancing,
      matchMode,
      seasonComplete,
      showContinueMenu,
    });
    onContinue();
  }

  function handleContinueMenuToggleClick(): void {
    console.info("[DashboardHeader] continueMenuToggleClick", {
      hasMatchToday,
      isAdvancing,
      matchMode,
      seasonComplete,
      showContinueMenu,
    });
    onToggleContinueMenu();
  }

  function handleSkipToMatchDayClick(): void {
    console.info("[DashboardHeader] skipToMatchDayClick", {
      hasMatchToday,
      isAdvancing,
      matchMode,
      seasonComplete,
      showContinueMenu,
    });
    onSkipToMatchDay();
  }

  return (
    <header className="z-10 border-b border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-navy-700 dark:bg-navy-800">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {hasProfileHistory && (
          <button
            onClick={onBack}
            className="-ml-2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-navy-700 dark:hover:text-white"
            title={t("common.back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-xl font-heading font-bold uppercase text-gray-800 dark:text-gray-100">
            {activeTabLabel}
          </h2>
        </div>
      </div>

      <div className="relative mx-auto hidden flex-1 max-w-md min-[900px]:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder={t("dashboard.searchPlaceholder")}
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pl-9 pr-3 text-sm text-gray-800 transition-all placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-navy-600 dark:bg-navy-700 dark:text-gray-200 dark:placeholder-gray-500"
        />
        {showSearchResults && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-navy-600 dark:bg-navy-700">
            {renderSearchResults({
              matchedPlayers,
              matchedTeams,
              onSelectSearchPlayer,
              onSelectSearchTeam,
              t,
              teams,
            })}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <button
          onClick={onSave}
          disabled={isSaving}
          className={getSaveButtonClassName(saveFlash, isSaving)}
          title={t("dashboard.saveGame")}
        >
          {renderSaveButtonIcon(isSaving)}
          {getSaveButtonLabel(t, saveFlash, isSaving)}
        </button>
        {isUnemployed ? (
          <button
            onClick={handleContinueClick}
            disabled={isAdvancing}
            className="bg-linear-to-r from-gray-600 to-gray-700 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-heading font-bold uppercase tracking-wider text-white shadow-md transition-all hover:cursor-pointer hover:brightness-110 hover:shadow-lg disabled:cursor-wait disabled:opacity-70"
          >
            <span>{isAdvancing ? t("dashboard.simulating") : t("dashboard.continue")}</span>
            <ChevronRight className={`h-4 w-4 ${isAdvancing ? "animate-pulse" : ""}`} />
          </button>
        ) : (
          <div className="relative">
            <div className="flex">
              <button
                onClick={handleContinueClick}
                disabled={isAdvancing || seasonComplete}
                className={getContinueButtonClassName(
                  currentModeMeta,
                  isAdvancing,
                  seasonComplete,
                )}
              >
                {renderContinueButtonContent(
                  t,
                  hasMatchToday,
                  isAdvancing,
                  seasonComplete,
                  currentModeMeta,
                )}
                <ChevronRight
                  className={`h-4 w-4 ${isAdvancing ? "animate-pulse" : ""}`}
                />
              </button>
              <button
                onClick={handleContinueMenuToggleClick}
                className={getContinueDropdownButtonClassName(currentModeMeta)}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {showContinueMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-navy-600 dark:bg-navy-700">
                {(["live", "spectator", "delegate"] as const).map((mode) => {
                  const isActive = matchMode === mode;
                  const optionMeta = modeMeta[mode];

                  return (
                    <button
                      key={mode}
                      onClick={() => onSelectMatchMode(mode)}
                      className={getModeOptionClassName(isActive)}
                    >
                      <span className={getModeOptionIconClassName(isActive)}>
                        {optionMeta.icon}
                      </span>
                      <div className="flex-1">
                        <span className="text-xs font-heading font-bold uppercase tracking-wide text-gray-800 dark:text-gray-100">
                          {optionMeta.label}
                        </span>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {optionMeta.desc}
                        </p>
                      </div>
                      {isActive && (
                        <span className="text-xs font-bold text-primary-500">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
                <div className="my-1 border-t border-gray-200 dark:border-navy-600" />
                <button
                  onClick={handleSkipToMatchDayClick}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-navy-600"
                >
                  <span className="text-xs font-heading font-bold uppercase tracking-wide text-gray-800 dark:text-gray-100">
                    {t("continueMenu.skipToMatchDay")}
                  </span>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {t("continueMenu.skipToMatchDayDesc")}
                  </p>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-2 dark:border-navy-700 dark:bg-navy-900/35">
        <DashboardCalendarStrip
          currentDate={currentDate}
          hasMatchToday={hasMatchToday}
          isAdvancing={isAdvancing}
          label={t("dashboard.schedule")}
          locale={locale}
        />
      </div>
    </header>
  );
}

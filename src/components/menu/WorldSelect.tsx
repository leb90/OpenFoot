import { useId } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Globe2,
  Landmark,
  Loader2,
  MapPin,
  Shield,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type { CareerStartPhase } from "./CreateManagerForm";

export interface PlayableTeamPreview {
  id: string;
  name: string;
  short_name: string;
  city: string;
  country: string;
  stadium_name: string;
  stadium_capacity: number;
  reputation: number;
  finance: number;
  colors: {
    primary: string;
    secondary: string;
  };
  play_style: string;
  avg_overall: number;
}

export interface PlayableLeagueInfo {
  id: string;
  name: string;
  tier: number;
  format: string;
  format_code?: string;
  round_robin_legs?: number;
  target_teams: number;
  matchdays?: number;
  season: string;
  zones?: number;
  zone_size?: number;
  playoff_qualifiers_per_zone?: number;
  relegation?: {
    automatic?: number;
    playoff_spots?: number;
    note?: string;
  };
  competitions_enabled?: {
    league: boolean;
    domestic_cups: boolean;
    international_cups: boolean;
  };
  continental_slots?: {
    champions?: number;
    secondary?: number;
  };
  cup_name?: string;
}

export interface PlayableCountryInfo {
  code: string;
  name: string;
  confederation?: string | null;
  continent?: string | null;
  league: PlayableLeagueInfo;
  team_count: number;
  teams: PlayableTeamPreview[];
}

interface WorldSelectProps {
  playableCountries: PlayableCountryInfo[];
  selectedCountryCode: string;
  selectedTeamId: string;
  isLoadingWorlds: boolean;
  isStarting: boolean;
  startYear: number;
  startPhase: CareerStartPhase;
  historyDepthYears: number;
  onSelectCountry: (code: string) => void;
  onSelectTeam: (id: string) => void;
  onChangeHistoryDepthYears: (value: number) => void;
  onStart: () => void;
  onBack: () => void;
  onClose: () => void;
}

const HISTORY_DEPTH_OPTIONS = [0, 6, 12, 24] as const;

function historyDepthOptionLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  value: (typeof HISTORY_DEPTH_OPTIONS)[number],
): string {
  if (value === 0) return t("worldSelect.historyDepth.none");
  return t("worldSelect.historyDepth.option", { count: value });
}

function reputationLabel(
  t: (key: string) => string,
  reputation: number,
): string {
  if (reputation >= 850) return t("teamSelect.repWorldClass");
  if (reputation >= 760) return t("teamSelect.repStrong");
  if (reputation >= 690) return t("teamSelect.repAverage");
  return t("teamSelect.repDeveloping");
}

function formatCompactMoney(value: number): string {
  if (value >= 1000000) return `${Math.round(value / 1000000)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

function phaseLabelKey(startPhase: CareerStartPhase): string {
  return `createManager.phase${startPhase === "midSeason" ? "MidSeason" : "SeasonStart"}`;
}

function leagueFormatSummary(
  t: (key: string, options?: Record<string, unknown>) => string,
  league: PlayableLeagueInfo,
): string {
  if (league.format_code === "split_groups_playoffs") {
    return t("worldSelect.leagueRules.splitGroups", {
      teams: league.target_teams,
      zones: league.zones ?? 2,
      matchdays: league.matchdays ?? 16,
    });
  }

  return t("worldSelect.leagueRules.doubleRoundRobin", {
    teams: league.target_teams,
    matchdays: league.matchdays ?? Math.max(0, (league.target_teams - 1) * 2),
  });
}

function relegationSummary(
  t: (key: string, options?: Record<string, unknown>) => string,
  league: PlayableLeagueInfo,
): string {
  const automatic = league.relegation?.automatic ?? 0;
  const playoffSpots = league.relegation?.playoff_spots ?? 0;

  if (automatic > 0 && playoffSpots > 0) {
    return t("worldSelect.leagueRules.relegationWithPlayoff", {
      automatic,
      playoffSpots,
    });
  }

  if (automatic > 0) {
    return t("worldSelect.leagueRules.relegationAutomatic", { automatic });
  }

  return t("worldSelect.leagueRules.relegationMetadata");
}

export default function WorldSelect({
  playableCountries,
  selectedCountryCode,
  selectedTeamId,
  isLoadingWorlds,
  isStarting,
  startYear,
  startPhase,
  historyDepthYears,
  onSelectCountry,
  onSelectTeam,
  onChangeHistoryDepthYears,
  onStart,
  onBack,
  onClose,
}: WorldSelectProps) {
  const { t } = useTranslation();
  const historyDepthLabelId = useId();
  const selectedCountry =
    playableCountries.find((country) => country.code === selectedCountryCode) ??
    playableCountries[0];
  const selectedTeam = selectedCountry?.teams.find((team) => team.id === selectedTeamId);

  if (isLoadingWorlds) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 shadow-sm dark:border-navy-600 dark:bg-navy-800 dark:text-gray-200">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          {t("worldSelect.scanning")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-navy-700 dark:bg-navy-900/90 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 pr-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src="/openfootlogo.svg"
              alt={t("app.name")}
              className="h-14 w-44 shrink-0 object-contain sm:h-16 sm:w-56"
            />
            <div className="hidden h-12 w-px bg-gray-200 dark:bg-navy-700 sm:block" />
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                {t("worldSelect.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selectedCountry
                  ? `${selectedCountry.name} / ${selectedCountry.league.name}`
                  : t("worldSelect.summary.pickTeam")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 font-heading text-sm font-bold uppercase tracking-wide text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-navy-500"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-300 dark:hover:border-navy-500 dark:hover:text-white"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)_360px] lg:px-8">
        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-navy-700 dark:bg-navy-800">
            <SectionHeader
              title={t("worldSelect.countryLabel")}
              meta={t("worldSelect.availableCountries", {
                count: playableCountries.length,
              })}
            />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {playableCountries.map((country) => {
                const selected = country.code === selectedCountryCode;

                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => onSelectCountry(country.code)}
                    className={`group rounded-lg border p-3 text-left transition ${
                      selected
                        ? "border-primary-500 bg-primary-50 ring-1 ring-primary-400/30 dark:bg-primary-500/10"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white dark:border-navy-600 dark:bg-navy-900/70 dark:hover:border-navy-500 dark:hover:bg-navy-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-primary-500 text-white"
                            : "bg-gray-200 text-gray-600 dark:bg-navy-700 dark:text-gray-300"
                        }`}
                      >
                        <Globe2 className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-heading text-base font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                          {country.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                          {country.league.name}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedCountry ? (
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-navy-700 dark:bg-navy-800">
              <SectionHeader title={selectedCountry.league.name} meta={selectedCountry.code} />
              <div className="mt-4 grid gap-3">
                <InfoRow
                  icon={<Trophy className="h-4 w-4" />}
                  label={t("worldSelect.teamLabel")}
                  value={t("worldSelect.availableTeams", {
                    count: selectedCountry.teams.length,
                  })}
                />
                <InfoRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label={t("worldSelect.summary.startYear")}
                  value={`${startYear} / ${t(phaseLabelKey(startPhase))}`}
                />
                <InfoRow
                  icon={<Shield className="h-4 w-4" />}
                  label={t("worldSelect.leagueRules.format")}
                  value={leagueFormatSummary(t, selectedCountry.league)}
                />
                <InfoRow
                  icon={<Trophy className="h-4 w-4" />}
                  label={t("worldSelect.leagueRules.relegation")}
                  value={relegationSummary(t, selectedCountry.league)}
                />
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-navy-700 dark:bg-navy-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  id={historyDepthLabelId}
                  className="font-heading text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white"
                >
                  {t("worldSelect.historyDepth.label")}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("worldSelect.historyDepth.hint")}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-accent-500/10 px-2 py-1 text-xs font-heading font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                {t("worldSelect.historyDepth.applied", {
                  count: historyDepthYears,
                })}
              </span>
            </div>

            <div
              role="radiogroup"
              aria-labelledby={historyDepthLabelId}
              className="mt-4 grid grid-cols-2 gap-2"
            >
              {HISTORY_DEPTH_OPTIONS.map((value) => {
                const selected = historyDepthYears === value;

                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChangeHistoryDepthYears(value)}
                    className={`min-h-14 rounded-lg border px-3 py-3 text-left transition ${
                      selected
                        ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-400/30 dark:bg-primary-500/10 dark:text-primary-300"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-gray-200 dark:hover:border-navy-500"
                    }`}
                  >
                    <span className="block font-heading text-sm font-bold uppercase tracking-wide">
                      {historyDepthOptionLabel(t, value)}
                    </span>
                    {value === 12 ? (
                      <span className="mt-1 block text-xs text-primary-600 dark:text-primary-300">
                        {t("worldSelect.historyDepth.recommended")}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-heading text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("worldSelect.teamLabel")}
              </p>
              <h2 className="font-heading text-3xl font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                {selectedCountry?.league.name ?? t("worldSelect.title")}
              </h2>
            </div>
            {selectedCountry ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("worldSelect.availableTeams", {
                  count: selectedCountry.teams.length,
                })}
              </span>
            ) : null}
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {selectedCountry?.teams.map((team) => {
              const selected = team.id === selectedTeamId;

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => onSelectTeam(team.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    selected
                      ? "border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-400/30 dark:bg-primary-500/10"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-navy-700 dark:bg-navy-800 dark:hover:border-navy-500"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <ClubBadge team={team} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-heading text-xl font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                            {team.name}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">{team.city}</span>
                          </p>
                        </div>
                        {selected ? (
                          <Star className="h-5 w-5 shrink-0 fill-accent-400 text-accent-400" />
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <TeamStat
                          icon={<Shield className="h-4 w-4" />}
                          label={t("worldSelect.ovr")}
                          value={String(team.avg_overall)}
                        />
                        <TeamStat
                          icon={<Trophy className="h-4 w-4" />}
                          label={t("teamSelect.reputation")}
                          value={reputationLabel(t, team.reputation)}
                        />
                        <TeamStat
                          icon={<Users className="h-4 w-4" />}
                          label={t("teamSelect.squad")}
                          value="36"
                        />
                        <TeamStat
                          icon={<Landmark className="h-4 w-4" />}
                          label={t("teamSelect.finances")}
                          value={formatCompactMoney(team.finance)}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="lg:sticky lg:top-5 lg:self-start">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-800">
            {selectedTeam ? (
              <>
                <div className="flex items-start gap-4">
                  <ClubBadge team={selectedTeam} size="xl" />
                  <div className="min-w-0">
                    <p className="font-heading text-2xl font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                      {selectedTeam.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      {selectedTeam.city}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <DetailMetric label={t("worldSelect.ovr")} value={String(selectedTeam.avg_overall)} />
                  <DetailMetric
                    label={t("teamSelect.reputation")}
                    value={reputationLabel(t, selectedTeam.reputation)}
                  />
                  <DetailMetric label={t("teamSelect.squad")} value="36" />
                  <DetailMetric
                    label={t("teamSelect.finances")}
                    value={formatCompactMoney(selectedTeam.finance)}
                  />
                </div>

                <div className="mt-5 space-y-3 border-t border-gray-200 pt-5 dark:border-navy-700">
                  <InfoRow
                    icon={<Trophy className="h-4 w-4" />}
                    label={selectedCountry?.league.name ?? t("worldSelect.teamLabel")}
                    value={selectedCountry ? leagueFormatSummary(t, selectedCountry.league) : ""}
                  />
                  <InfoRow
                    icon={<Landmark className="h-4 w-4" />}
                    label={selectedTeam.stadium_name}
                    value={selectedTeam.stadium_capacity.toLocaleString()}
                  />
                  <InfoRow
                    icon={<CalendarDays className="h-4 w-4" />}
                    label={t("worldSelect.summary.startYear")}
                    value={`${startYear} / ${t(phaseLabelKey(startPhase))}`}
                  />
                </div>

                <p className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-navy-700 dark:bg-navy-900/70 dark:text-gray-300">
                  {t("worldSelect.summary.countryTeam", {
                    country: selectedCountry?.name,
                    team: selectedTeam.name,
                    league: selectedCountry?.league.name,
                  })}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("worldSelect.summary.pickTeam")}
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              className="mt-5 w-full"
              iconRight={isStarting ? <Loader2 className="animate-spin" /> : <ChevronRight />}
              onClick={onStart}
              disabled={isStarting || isLoadingWorlds || !selectedTeamId}
            >
              {isStarting ? t("worldSelect.creatingWorld") : t("worldSelect.startCareer")}
            </Button>
          </section>
        </aside>
      </main>
    </div>
  );
}

function SectionHeader({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-heading text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
        {title}
      </p>
      {meta ? (
        <span className="shrink-0 text-xs font-heading font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {meta}
        </span>
      ) : null}
    </div>
  );
}

function ClubBadge({
  team,
  size,
}: {
  team: PlayableTeamPreview;
  size: "lg" | "xl";
}) {
  const sizeClass = size === "xl" ? "h-16 w-16 text-lg" : "h-14 w-14 text-base";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-lg border border-white/10 font-heading font-bold text-white shadow-sm`}
      style={{
        background: `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`,
      }}
    >
      {team.short_name}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-navy-700 dark:text-gray-300">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">
          {label}
        </span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
          {value}
        </span>
      </span>
    </div>
  );
}

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-navy-700 dark:bg-navy-900/70">
      <span className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="mt-1 block truncate font-heading text-xl font-bold uppercase tracking-wide text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function TeamStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1 truncate text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {icon}
        {label}
      </span>
      <span className="mt-1 block truncate font-heading text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}

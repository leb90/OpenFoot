import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";
import {
  ArrowLeft,
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
  target_teams: number;
  season: string;
  cup_name: string;
}

export interface PlayableCountryInfo {
  code: string;
  name: string;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-navy-600 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-gray-900 transition-colors dark:text-white">
            {t("worldSelect.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-navy-600 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/30 text-xs font-bold text-primary-400">
          1
        </div>
        <div className="h-0.5 flex-1 bg-primary-500" />
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
          2
        </div>
      </div>

      {isLoadingWorlds ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 dark:border-navy-600 dark:bg-navy-700/60 dark:text-gray-300">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("worldSelect.scanning")}
        </div>
      ) : (
        <>
          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t("worldSelect.countryLabel")}
              </p>
              <span className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                {t("worldSelect.availableCountries", {
                  count: playableCountries.length,
                })}
              </span>
            </div>
            <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto pr-1">
              {playableCountries.map((country) => {
                const selected = country.code === selectedCountryCode;

                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => onSelectCountry(country.code)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      selected
                        ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-400/30 dark:bg-primary-500/10 dark:text-primary-300"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-navy-600 dark:bg-navy-700 dark:text-gray-200 dark:hover:border-navy-500"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 shrink-0" />
                      <span className="truncate font-heading text-sm font-bold uppercase tracking-wide">
                        {country.name}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-400">
                      {country.league.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedCountry ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-navy-600 dark:bg-navy-700/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                    {selectedCountry.league.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {selectedCountry.league.format} · {selectedCountry.league.season}
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-accent-500/10 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">
                  {selectedCountry.league.cup_name}
                </div>
              </div>
            </div>
          ) : null}

          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t("worldSelect.teamLabel")}
              </p>
              {selectedCountry ? (
                <span className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                  {t("worldSelect.availableTeams", {
                    count: selectedCountry.teams.length,
                  })}
                </span>
              ) : null}
            </div>
            <div className="grid max-h-[38vh] gap-2 overflow-y-auto pr-1">
              {selectedCountry?.teams.map((team) => {
                const selected = team.id === selectedTeamId;

                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => onSelectTeam(team.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      selected
                        ? "border-primary-500 bg-primary-50 ring-1 ring-primary-400/30 dark:bg-primary-500/10"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-navy-600 dark:bg-navy-700 dark:hover:border-navy-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 font-heading text-sm font-bold text-white shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`,
                        }}
                      >
                        {team.short_name}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-heading text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                              {team.name}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {team.city}
                            </p>
                          </div>
                          {selected ? (
                            <Star className="h-4 w-4 shrink-0 fill-accent-400 text-accent-400" />
                          ) : null}
                        </div>

                        <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <TeamStat
                            icon={<Shield className="h-3 w-3" />}
                            label={t("worldSelect.ovr")}
                            value={String(team.avg_overall)}
                          />
                          <TeamStat
                            icon={<Trophy className="h-3 w-3" />}
                            label={t("teamSelect.reputation")}
                            value={reputationLabel(t, team.reputation)}
                          />
                          <TeamStat
                            icon={<Users className="h-3 w-3" />}
                            label={t("teamSelect.squad")}
                            value="22"
                          />
                          <TeamStat
                            icon={<Landmark className="h-3 w-3" />}
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

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-navy-600 dark:bg-navy-700/60 dark:text-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t("worldSelect.summary.startYear")}
              </span>
              <span className="font-heading font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                {startYear}
              </span>
              <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                {t(`createManager.phase${startPhase === "midSeason" ? "MidSeason" : "SeasonStart"}`)}
              </span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {selectedTeam
                ? t("worldSelect.summary.countryTeam", {
                    country: selectedCountry?.name,
                    team: selectedTeam.name,
                    league: selectedCountry?.league.name,
                  })
                : t("worldSelect.summary.pickTeam")}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-navy-600 dark:bg-navy-700/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  id={historyDepthLabelId}
                  className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400"
                >
                  {t("worldSelect.historyDepth.label")}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("worldSelect.historyDepth.hint")}
                </p>
              </div>
              <span className="rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-accent-600 dark:text-accent-300">
                {t("worldSelect.historyDepth.applied", {
                  count: historyDepthYears,
                })}
              </span>
            </div>

            <div
              role="radiogroup"
              aria-labelledby={historyDepthLabelId}
              className="mt-3 grid grid-cols-2 gap-2"
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
                    className={`rounded-lg border px-3 py-3 text-left transition-all ${
                      selected
                        ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-400/30 dark:border-primary-500 dark:bg-primary-500/10 dark:text-primary-300"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-navy-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-bold uppercase tracking-wide">
                        {historyDepthOptionLabel(t, value)}
                      </span>
                      {value === 12 ? (
                        <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                          {t("worldSelect.historyDepth.recommended")}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        iconRight={isStarting ? <Loader2 className="animate-spin" /> : <ChevronRight />}
        onClick={onStart}
        disabled={isStarting || isLoadingWorlds || !selectedTeamId}
      >
        {isStarting ? t("worldSelect.creatingWorld") : t("worldSelect.startCareer")}
      </Button>
    </div>
  );
}

function TeamStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1 truncate text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {icon}
        {label}
      </span>
      <span className="mt-0.5 block truncate font-heading text-xs font-bold uppercase tracking-wide text-gray-800 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}

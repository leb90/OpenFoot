import type { DragEvent, JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@/lib/apiClient";
import type {
  GameStateData,
  PlayerData,
  PlayerSelectionOptions,
} from "../../store/gameStore";
import { useTranslation } from "react-i18next";
import {
  applyLineupDrop,
  applyLineupSwap,
  buildActivePositionMap,
  buildPitchRows,
  buildPitchSlotRows,
  type DragState,
  type PitchSlotRow,
  type SquadSection,
} from "../squad/SquadTab.helpers";
import TacticsFilters from "./TacticsFilters";
import {
  buildTacticsRoster,
  countOutOfPositionPlayers,
  filterAndSortTacticsPlayers,
  getSelectedAndComparePlayers,
  resolveStartingXiIds,
  type SortKey,
} from "./TacticsTab.helpers";
import TacticsPitch from "./TacticsPitch";
import TacticsPlayerFocusPanel from "./TacticsPlayerFocusPanel";
import TacticsPlayerTable from "./TacticsPlayerTable";
import TacticsRolesPanel from "./TacticsRolesPanel";
import TacticsSetupPanel from "./TacticsSetupPanel";

interface TacticsTabProps {
  gameState: GameStateData;
  onSelectPlayer: (id: string, options?: PlayerSelectionOptions) => void;
  onGameUpdate: (g: GameStateData) => void;
}

export default function TacticsTab({
  gameState,
  onSelectPlayer,
  onGameUpdate,
}: TacticsTabProps): JSX.Element {
  const { t } = useTranslation();
  const myTeam = gameState.teams.find(
    (team) => team.id === gameState.manager.team_id,
  );
  const [playerSearch, setPlayerSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("pos");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [pendingStartingXiIds, setPendingStartingXiIds] = useState<
    string[] | null
  >(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerSection, setSelectedPlayerSection] =
    useState<SquadSection | null>(null);
  const [comparePlayerId, setComparePlayerId] = useState<string | null>(null);
  const [comparePlayerSection, setComparePlayerSection] =
    useState<SquadSection | null>(null);
  const [activeTab, setActiveTab] = useState<"lineup" | "roles">("lineup");
  const dragStateRef = useRef<DragState | null>(null);
  const hoveredSlotRef = useRef<number | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  if (!myTeam) {
    return (
      <p className="text-gray-500 dark:text-gray-400">{t("common.noTeam")}</p>
    );
  }

  const roster = buildTacticsRoster(gameState.players, myTeam.id);

  const formation = myTeam.formation || "4-4-2";
  const activePlayStyle = myTeam.play_style || "Balanced";
  const savedStartingXiKey = (myTeam.starting_xi_ids || []).join(",");
  const playersById = useMemo(
    () => new Map(roster.map((player) => [player.id, player])),
    [roster],
  );
  const available = roster.filter((player) => !player.injury);
  const pitchRows = useMemo(() => buildPitchRows(formation), [formation]);

  const startingXiIds = useMemo(
    () =>
      resolveStartingXiIds({
        availablePlayers: available,
        formation,
        pendingStartingXiIds,
        playersById,
        savedStartingXiIds: myTeam.starting_xi_ids || [],
      }),
    [
      available.map((player) => player.id).join(","),
      formation,
      (myTeam.starting_xi_ids || []).join(","),
      (pendingStartingXiIds || []).join(","),
      roster.map((player) => player.id).join(","),
    ],
  );

  const startingXI = useMemo(
    () =>
      startingXiIds
        .map((id) => playersById.get(id))
        .filter((player): player is PlayerData => player != null),
    [playersById, startingXiIds],
  );

  useEffect(() => {
    if (!pendingStartingXiIds) return;
    if (savedStartingXiKey === pendingStartingXiIds.join(",")) {
      setPendingStartingXiIds(null);
    }
  }, [pendingStartingXiIds, savedStartingXiKey]);

  const pitchSlotRows = useMemo<PitchSlotRow[]>(
    () => buildPitchSlotRows(pitchRows, startingXiIds, playersById),
    [pitchRows, playersById, startingXiIds],
  );

  const xiIds = new Set(startingXiIds);
  const xiSlotIndexByPlayerId = useMemo(
    () => new Map(startingXiIds.map((id, index) => [id, index])),
    [startingXiIds],
  );
  const bench = roster.filter((player) => !xiIds.has(player.id));
  const matchdaySubstituteIds = useMemo(
    () => new Set(bench.slice(0, 7).map((player) => player.id)),
    [bench],
  );
  const xiActivePosition = useMemo(
    () => buildActivePositionMap(pitchSlotRows),
    [pitchSlotRows],
  );

  const { comparePlayer, selectedPlayer } = getSelectedAndComparePlayers(
    comparePlayerId,
    playersById,
    selectedPlayerId,
  );

  const canConfirmSwap = useMemo(() => {
    if (
      !selectedPlayerId ||
      !selectedPlayerSection ||
      !comparePlayerId ||
      !comparePlayerSection
    ) {
      return false;
    }

    const nextXiIds = applyLineupSwap(
      startingXiIds,
      { id: selectedPlayerId, from: selectedPlayerSection },
      comparePlayerId,
      comparePlayerSection,
    );

    return !!nextXiIds && nextXiIds.join(",") !== startingXiIds.join(",");
  }, [
    comparePlayerId,
    comparePlayerSection,
    selectedPlayerId,
    selectedPlayerSection,
    startingXiIds,
  ]);

  function toggleSort(key: SortKey): void {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir(key === "ovr" ? "desc" : "asc");
  }

  const filteredStartingXI = useMemo(
    () =>
      filterAndSortTacticsPlayers(
        startingXI,
        {
          playerSearch,
          positionFilter,
          section: "xi",
          xiActivePosition,
        },
        {
          section: "xi",
          sortDir,
          sortKey,
          xiActivePosition,
        },
      ),
    [
      startingXI,
      playerSearch,
      positionFilter,
      sortKey,
      sortDir,
      xiActivePosition,
    ],
  );
  const filteredBench = useMemo(
    () =>
      filterAndSortTacticsPlayers(
        bench,
        {
          playerSearch,
          positionFilter,
          section: "bench",
          xiActivePosition,
        },
        {
          section: "bench",
          sortDir,
          sortKey,
          xiActivePosition,
        },
      ),
    [bench, playerSearch, positionFilter, sortKey, sortDir, xiActivePosition],
  );
  const filteredSquad = useMemo(
    () => [...filteredStartingXI, ...filteredBench],
    [filteredStartingXI, filteredBench],
  );

  const outOfPositionCount = countOutOfPositionPlayers(
    startingXI,
    xiActivePosition,
  );

  async function persistStartingXI(playerIds: string[]): Promise<void> {
    setPendingStartingXiIds(playerIds);
    try {
      const updated = await invoke<GameStateData>("set_starting_xi", {
        playerIds,
      });
      onGameUpdate(updated);
    } catch (error) {
      setPendingStartingXiIds(null);
      console.error("Failed to set starting XI:", error);
    }
  }

  async function handleFormationChange(nextFormation: string): Promise<void> {
    try {
      const updated = await invoke<GameStateData>("set_formation", {
        formation: nextFormation,
      });
      onGameUpdate(updated);
    } catch (error) {
      console.error("Failed to set formation:", error);
    }
  }

  async function handlePlayStyleChange(playStyle: string): Promise<void> {
    try {
      const updated = await invoke<GameStateData>("set_play_style", {
        playStyle,
      });
      onGameUpdate(updated);
    } catch (error) {
      console.error("Failed to set play style:", error);
    }
  }

  function clearLineupSelection(): void {
    setSelectedPlayerId(null);
    setSelectedPlayerSection(null);
    setComparePlayerId(null);
    setComparePlayerSection(null);
  }

  function setHoveredSlotValue(slotIndex: number | null): void {
    if (hoveredSlotRef.current === slotIndex) {
      return;
    }

    hoveredSlotRef.current = slotIndex;
    setHoveredSlot(slotIndex);
  }

  function resetDragState(): void {
    dragStateRef.current = null;
    setDragState(null);
    setHoveredSlotValue(null);
  }

  function applyLightweightDragPreview(event: DragEvent<HTMLElement>): void {
    if (!dragPreviewRef.current) {
      return;
    }

    if (typeof event.dataTransfer.setDragImage !== "function") {
      return;
    }

    event.dataTransfer.setDragImage(dragPreviewRef.current, 16, 16);
  }

  function handleDragStart(
    event: DragEvent<HTMLElement>,
    playerId: string,
    from: SquadSection,
    slotIndex: number | null = null,
  ): void {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", playerId);
    applyLightweightDragPreview(event);
    const nextDragState = { playerId, from, slotIndex };
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  }

  function handleSlotDragOver(
    event: DragEvent<HTMLElement>,
    slotIndex: number,
  ): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setHoveredSlotValue(slotIndex);
  }

  function handleSlotDragLeave(slotIndex: number): void {
    if (hoveredSlotRef.current !== slotIndex) {
      return;
    }

    setHoveredSlotValue(null);
  }

  async function handleSlotDrop(
    event: DragEvent<HTMLElement>,
    slotIndex: number,
  ): Promise<void> {
    event.preventDefault();
    const draggedPlayerId = event.dataTransfer.getData("text/plain");
    const currentDragState = dragStateRef.current ?? dragState;
    const resolvedDragState =
      currentDragState ??
      (draggedPlayerId
        ? {
            playerId: draggedPlayerId,
            from: xiIds.has(draggedPlayerId) ? "xi" : "bench",
            slotIndex: xiIds.has(draggedPlayerId)
              ? startingXiIds.indexOf(draggedPlayerId)
              : null,
          }
        : null);

    if (!resolvedDragState) return;

    const nextXiIds = applyLineupDrop(
      startingXiIds,
      resolvedDragState,
      slotIndex,
    );
    if (nextXiIds.join(",") === startingXiIds.join(",")) {
      resetDragState();
      return;
    }

    await persistStartingXI(nextXiIds);
    clearLineupSelection();
    resetDragState();
  }

  async function handleTablePlayerDrop(
    event: DragEvent<HTMLElement>,
    targetPlayerId: string,
    targetSection: SquadSection,
  ): Promise<void> {
    event.preventDefault();
    const draggedPlayerId = event.dataTransfer.getData("text/plain");
    const currentDragState = dragStateRef.current ?? dragState;
    const resolvedDragState =
      currentDragState ??
      (draggedPlayerId
        ? {
            playerId: draggedPlayerId,
            from: xiIds.has(draggedPlayerId) ? "xi" : "bench",
            slotIndex: xiIds.has(draggedPlayerId)
              ? startingXiIds.indexOf(draggedPlayerId)
              : null,
          }
        : null);

    if (!resolvedDragState || resolvedDragState.playerId === targetPlayerId) {
      resetDragState();
      return;
    }

    const nextXiIds =
      targetSection === "xi"
        ? applyLineupDrop(
            startingXiIds,
            resolvedDragState,
            startingXiIds.indexOf(targetPlayerId),
          )
        : applyLineupSwap(
            startingXiIds,
            {
              id: resolvedDragState.playerId,
              from: resolvedDragState.from,
            },
            targetPlayerId,
            "bench",
          );

    if (!nextXiIds || nextXiIds.join(",") === startingXiIds.join(",")) {
      resetDragState();
      return;
    }

    await persistStartingXI(nextXiIds);
    clearLineupSelection();
    resetDragState();
  }

  async function handleLineupPlayerClick(
    playerId: string,
    section: SquadSection,
  ): Promise<void> {
    if (!selectedPlayerId || !selectedPlayerSection) {
      setSelectedPlayerId(playerId);
      setSelectedPlayerSection(section);
      return;
    }

    if (selectedPlayerId === playerId && selectedPlayerSection === section) {
      if (comparePlayerId && comparePlayerSection) {
        setSelectedPlayerId(comparePlayerId);
        setSelectedPlayerSection(comparePlayerSection);
        setComparePlayerId(null);
        setComparePlayerSection(null);
        return;
      }

      clearLineupSelection();
      return;
    }

    if (comparePlayerId === playerId && comparePlayerSection === section) {
      setComparePlayerId(null);
      setComparePlayerSection(null);
      return;
    }

    setComparePlayerId(playerId);
    setComparePlayerSection(section);
  }

  async function handleConfirmSwap(): Promise<void> {
    if (
      !selectedPlayerId ||
      !selectedPlayerSection ||
      !comparePlayerId ||
      !comparePlayerSection
    ) {
      return;
    }

    const nextXiIds = applyLineupSwap(
      startingXiIds,
      { id: selectedPlayerId, from: selectedPlayerSection },
      comparePlayerId,
      comparePlayerSection,
    );

    if (!nextXiIds || nextXiIds.join(",") === startingXiIds.join(",")) {
      return;
    }

    await persistStartingXI(nextXiIds);
    clearLineupSelection();
  }

  function handleClearFilters(): void {
    setPlayerSearch("");
    setPositionFilter("All");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div
        ref={dragPreviewRef}
        aria-hidden="true"
        className="pointer-events-none fixed -left-20 top-0 h-8 w-8 rounded-full border border-white/15 bg-navy-900/90 shadow-lg"
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold uppercase tracking-wide text-gray-900 dark:text-white">
            {t("dashboard.tactics")}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {myTeam.name} - {formation} -{" "}
            {t(`tactics.playStyles.${activePlayStyle}`, activePlayStyle)}
          </p>
        </div>
        <div className="flex gap-1 self-start rounded-lg bg-gray-100 p-1 dark:bg-navy-800 lg:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("lineup")}
            className={`rounded-md px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider transition-colors ${
              activeTab === "lineup"
                ? "bg-white text-gray-900 shadow-sm dark:bg-navy-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t("tactics.lineupTab")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("roles")}
            className={`rounded-md px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider transition-colors ${
              activeTab === "roles"
                ? "bg-white text-gray-900 shadow-sm dark:bg-navy-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t("tactics.rolesTab")}
          </button>
        </div>
      </div>

      {activeTab === "lineup" ? (
        <>
          <TacticsSetupPanel
            activePlayStyle={activePlayStyle}
            formation={formation}
            onFormationChange={(nextFormation) => {
              void handleFormationChange(nextFormation);
            }}
            onPlayStyleChange={(playStyle) => {
              void handlePlayStyleChange(playStyle);
            }}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(500px,0.95fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              <TacticsFilters
                onClear={handleClearFilters}
                onPlayerSearchChange={setPlayerSearch}
                onPositionFilterChange={setPositionFilter}
                playerSearch={playerSearch}
                positionFilter={positionFilter}
              />

              <TacticsPlayerTable
                className="overflow-hidden"
                dragState={dragState}
                emptyMessage={t("squad.noPlayersMatch")}
                highlightedPlayerId={selectedPlayerId}
                onDragEnd={resetDragState}
                onDragStart={handleDragStart}
                onPlayerDrop={(event, targetPlayerId, targetSection) => {
                  void handleTablePlayerDrop(event, targetPlayerId, targetSection);
                }}
                onSelectPlayer={onSelectPlayer}
                players={filteredSquad}
                resolvePlayerSection={(player) =>
                  xiIds.has(player.id) ? "xi" : "bench"
                }
                resolvePlayerStatus={(player) => {
                  if (xiIds.has(player.id)) return "starter";
                  if (matchdaySubstituteIds.has(player.id)) return "substitute";
                  return "reserve";
                }}
                section="mixed"
                sortDir={sortDir}
                sortKey={sortKey}
                title={t("tactics.fullSquad")}
                toggleSort={toggleSort}
                totalCount={roster.length}
                xiSlotIndexByPlayerId={xiSlotIndexByPlayerId}
                xiActivePosition={xiActivePosition}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
              <TacticsPitch
                dragState={dragState}
                formation={formation}
                comparePlayerId={comparePlayerId}
                hoveredSlot={hoveredSlot}
                onClearSelection={clearLineupSelection}
                onDragEnd={resetDragState}
                onDragStart={handleDragStart}
                onLineupPlayerClick={(playerId, section) => {
                  void handleLineupPlayerClick(playerId, section);
                }}
                onSlotDragLeave={handleSlotDragLeave}
                onSlotDragOver={handleSlotDragOver}
                onSlotDrop={(event, slotIndex) => {
                  void handleSlotDrop(event, slotIndex);
                }}
                outOfPositionCount={outOfPositionCount}
                pitchSlotRows={pitchSlotRows}
                selectedPlayer={selectedPlayer}
                selectedPlayerId={selectedPlayerId}
              />

              <TacticsPlayerFocusPanel
                canConfirmSwap={canConfirmSwap}
                onConfirmSwap={() => {
                  void handleConfirmSwap();
                }}
                selectedPlayer={selectedPlayer}
                comparePlayer={comparePlayer}
              />
            </div>
          </div>
        </>
      ) : (
        <TacticsRolesPanel
          allSquad={roster}
          matchRoles={myTeam.match_roles}
          onGameUpdate={onGameUpdate}
          startingPlayers={startingXI}
        />
      )}
    </div>
  );
}

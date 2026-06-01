import type { DragEvent, JSX } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getPlayerOvr } from "../../lib/helpers";
import type { PlayerData } from "../../store/gameStore";
import { Badge, Card } from "../ui";
import {
  getPitchRowWidth,
  getPitchSlotWidth,
  isPlayerOutOfPosition,
  translatePositionAbbreviation,
  type DragState,
  type PitchSlotRow,
  type SquadSection,
} from "../squad/SquadTab.helpers";

interface TacticsPitchProps {
  dragState: DragState | null;
  formation: string;
  comparePlayerId: string | null;
  hoveredSlot: number | null;
  onClearSelection: () => void;
  onDragStart: (
    event: DragEvent<HTMLElement>,
    playerId: string,
    from: SquadSection,
    slotIndex: number | null,
  ) => void;
  onDragEnd: () => void;
  onLineupPlayerClick: (playerId: string, section: SquadSection) => void;
  onSlotDragOver: (event: DragEvent<HTMLElement>, slotIndex: number) => void;
  onSlotDragLeave: (slotIndex: number) => void;
  onSlotDrop: (event: DragEvent<HTMLElement>, slotIndex: number) => void;
  outOfPositionCount: number;
  pitchSlotRows: PitchSlotRow[];
  selectedPlayer: PlayerData | null;
  selectedPlayerId: string | null;
}

function getPitchPlayerButtonClassName(options: {
  dragState: DragState | null;
  comparePlayerId: string | null;
  hoveredSlot: number | null;
  player: PlayerData;
  selectedPlayerId: string | null;
  slotIndex: number;
  wrongPos: boolean;
}): string {
  const {
    dragState,
    comparePlayerId,
    hoveredSlot,
    player,
    selectedPlayerId,
    slotIndex,
    wrongPos,
  } = options;
  const isComparing = player.id === comparePlayerId;
  const isHovered = hoveredSlot === slotIndex;
  const isSelected = player.id === selectedPlayerId;
  let className =
    "w-full min-w-0 max-w-20.5 cursor-grab rounded-xl border px-1.5 py-1.5 shadow-sm transition-all active:cursor-grabbing sm:px-2 sm:py-2";

  if (dragState?.playerId === player.id) {
    className = `${className} opacity-70 ring-2 ring-white/20`;
  } else {
    className = `${className} hover:-translate-y-0.5 hover:shadow-md`;
  }

  if (isSelected) {
    return `${className} border-accent-300 bg-accent-500/15 ring-2 ring-accent-300/40`;
  }

  if (isComparing) {
    return `${className} border-primary-300 bg-primary-500/12 ring-2 ring-primary-300/30`;
  }

  if (isHovered) {
    return `${className} border-primary-300 bg-primary-500/10`;
  }

  if (wrongPos) {
    return `${className} border-red-300/70 bg-red-500/60`;
  }

  return `${className} border-white/10 bg-black/15`;
}

function getPitchRatingClassName(
  player: PlayerData,
  wrongPos: boolean,
): string {
  const baseClassName =
    "mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 font-heading text-[11px] font-bold sm:h-9 sm:w-9 sm:text-xs";

  if (wrongPos) {
    return `${baseClassName} border-amber-200 bg-amber-500/85 text-white`;
  }

  if (player.condition >= 50) {
    return `${baseClassName} border-primary-200 bg-primary-500/80 text-white`;
  }

  return `${baseClassName} border-red-200 bg-red-500/80 text-white`;
}

function getEmptySlotClassName(isHovered: boolean): string {
  const baseClassName =
    "w-full min-w-0 rounded-xl border border-dashed px-1.5 py-3.5 text-center sm:px-2 sm:py-4";

  if (isHovered) {
    return `${baseClassName} border-primary-300 bg-primary-500/10`;
  }

  return `${baseClassName} border-white/20 bg-black/10`;
}

export default function TacticsPitch({
  dragState,
  formation,
  comparePlayerId,
  hoveredSlot,
  onClearSelection,
  onDragEnd,
  onDragStart,
  onLineupPlayerClick,
  onSlotDragLeave,
  onSlotDragOver,
  onSlotDrop,
  outOfPositionCount,
  pitchSlotRows,
  selectedPlayer,
  selectedPlayerId,
}: TacticsPitchProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-gray-100 bg-linear-to-r from-navy-700 to-navy-800 p-4 dark:border-navy-600">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-heading font-bold uppercase tracking-wide text-white">
            <Star className="h-4 w-4 fill-current text-accent-400" />
            {t("preMatch.startingXI")} - {formation}
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">
            {t("tactics.pitchInteractionHint")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={outOfPositionCount > 0 ? "danger" : "success"}
            size="sm"
          >
            {outOfPositionCount} {t("squad.outOfPosition")}
          </Badge>
          {selectedPlayer ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs font-heading font-bold uppercase tracking-wider text-accent-400 hover:text-accent-300"
            >
              {t("common.clear")}
            </button>
          ) : null}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="relative h-[28rem] overflow-visible rounded-xl border border-primary-500/20 bg-linear-to-b from-primary-500 to-primary-600 p-4 dark:from-primary-700 dark:to-primary-800 sm:h-[30rem] sm:p-5 xl:h-[31rem]">
          <div className="absolute inset-x-6 top-1/2 border-t border-white/50" />
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50" />
          <div className="absolute inset-x-[18%] bottom-4 h-[18%] rounded-t-4xl border border-white/50 border-b-0" />
          <div className="absolute inset-x-[32%] bottom-4 h-[8%] rounded-t-2xl border border-white/50 border-b-0" />
          {pitchSlotRows.map((row) => (
            <div
              key={row.label}
              className="absolute left-1/2 grid items-start"
              style={{
                top: row.y,
                width:
                  row.slots.length === 1
                    ? `${getPitchSlotWidth(row.slots.length)}px`
                    : getPitchRowWidth(row.slots.length),
                transform: "translate(-50%, -50%)",
                gridTemplateColumns: `repeat(${row.slots.length}, minmax(0, ${getPitchSlotWidth(row.slots.length)}px))`,
                justifyContent:
                  row.slots.length === 1 ? "center" : "space-between",
              }}
            >
              {row.slots.map((slot) => {
                const isHovered = hoveredSlot === slot.index;
                const player = slot.player;
                const wrongPos = player
                  ? isPlayerOutOfPosition(player, slot.position)
                  : false;
                const slotRating = player ? getPlayerOvr(player) : null;

                return (
                  <div
                    key={`${row.label}-${slot.index}`}
                    data-testid={`pitch-slot-${slot.index}`}
                    className="flex w-full justify-center"
                    onDragOver={(event) => onSlotDragOver(event, slot.index)}
                    onDragLeave={() => onSlotDragLeave(slot.index)}
                    onDrop={(event) => onSlotDrop(event, slot.index)}
                  >
                    {player ? (
                      <button
                        type="button"
                        draggable
                        data-testid={`pitch-player-${player.id}`}
                        onClick={() => onLineupPlayerClick(player.id, "xi")}
                        onDragStart={(event) =>
                          onDragStart(event, player.id, "xi", slot.index)
                        }
                        onDragEnd={onDragEnd}
                        className={getPitchPlayerButtonClassName({
                          dragState,
                          comparePlayerId,
                          hoveredSlot,
                          player,
                          selectedPlayerId,
                          slotIndex: slot.index,
                          wrongPos,
                        })}
                      >
                        <div
                          className={getPitchRatingClassName(player, wrongPos)}
                        >
                          {slotRating}
                        </div>
                        <div className="text-[9px] font-heading font-bold uppercase tracking-wider leading-none text-white/70">
                          {translatePositionAbbreviation(t, slot.position)}
                        </div>
                        <div className="mt-1 truncate text-[10px] font-semibold leading-tight text-white sm:text-[11px]">
                          {player.match_name}
                        </div>
                        <div className="mt-0.5 truncate text-[9px] leading-none text-white/60">
                          {player.condition}%
                        </div>
                      </button>
                    ) : (
                      <div className={getEmptySlotClassName(isHovered)}>
                        <div className="text-[9px] font-heading font-bold uppercase tracking-wider leading-none text-white/70">
                          {translatePositionAbbreviation(t, slot.position)}
                        </div>
                        <div className="mt-1 text-[9px] leading-tight text-white/50">
                          {t("squad.dropPlayerHere")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

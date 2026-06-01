import { randomUUID, createHash } from "node:crypto";
import { prisma } from "./prisma.js";
import {
  addWelcomeMessages,
  createGameState,
  DEFAULT_SQUAD_SIZE,
  defaultSaveName,
  ensureSquadDepth,
  getDefaultSettings,
  listPlayableCountries,
  managerName,
  managerTeamName,
  regenerateTeamSquad,
  registrationStatusForPlayer,
  teamNeedsProfileRefresh,
} from "./gameFactory.js";

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function toClientProfile(profile) {
  return {
    id: profile.id,
    first_name: profile.firstName,
    last_name: profile.lastName,
    date_of_birth: profile.dateOfBirth,
    nationality: profile.nationality,
    created_at: profile.createdAt.toISOString(),
    last_used_at: profile.lastUsedAt?.toISOString() ?? null,
  };
}

function toClientSave(save) {
  return {
    id: save.id,
    name: save.name,
    manager_name: save.managerName,
    team_name: save.teamName,
    db_filename: save.dbFilename || `${save.id}.json`,
    checksum: save.checksum,
    created_at: save.createdAt.toISOString(),
    last_played_at: save.lastPlayedAt.toISOString(),
  };
}

function checksumForSnapshot(game) {
  return createHash("sha256").update(JSON.stringify(game)).digest("hex");
}

function activeTeam(game) {
  return game.teams.find((team) => team.id === game.manager.team_id) ?? null;
}

function isOpeningDayGame(game) {
  const clock = game?.clock ?? {};
  if (!clock.start_date || !clock.current_date || clock.start_date !== clock.current_date) {
    return false;
  }

  return (game.league?.fixtures ?? []).every((fixture) => !fixture.played);
}

function selectedSquadHasLegacyNationalities(game, team) {
  const profiles = team.player_profiles ?? [];
  if (profiles.length === 0) return false;

  const allowedNationalities = new Set([
    team.country,
    ...profiles.map((profile) => profile.nationality).filter(Boolean),
  ]);
  const roster = (game.players ?? []).filter(
    (player) => player.team_id === team.id && !player.retired,
  );

  return roster.some((player) => !allowedNationalities.has(player.nationality));
}

function selectedSquadIsIncomplete(game, team) {
  return (
    (game.players ?? []).filter((player) => player.team_id === team.id && !player.retired).length <
    DEFAULT_SQUAD_SIZE
  );
}

function repairOpeningDaySelectedSquad(game) {
  const team = activeTeam(game);
  if (!team || !isOpeningDayGame(game)) return game;
  if (
    teamNeedsProfileRefresh(team) ||
    selectedSquadIsIncomplete(game, team) ||
    selectedSquadHasLegacyNationalities(game, team)
  ) {
    regenerateTeamSquad(game, team.id);
    team.starting_xi_ids = defaultStartingXi(game, team.id);
  }
  return game;
}

function prepareGameSnapshot(snapshot) {
  const game = clone(snapshot);
  repairOpeningDaySelectedSquad(game);
  ensureSquadDepth(game);
  return game;
}

async function setSessionDraft(sessionId, game, extra = {}) {
  await prisma.webSession.update({
    where: { id: sessionId },
    data: {
      draftGame: game,
      ...extra,
    },
  });
  return game;
}

async function requireGame(session) {
  if (session.draftGame) {
    return prepareGameSnapshot(session.draftGame);
  }

  if (session.activeSaveId) {
    const save = await prisma.gameSave.findUnique({
      where: { id: session.activeSaveId },
    });
    if (save) return prepareGameSnapshot(save.snapshot);
  }

  throw new Error("be.error.noActiveGameSession");
}

async function createOrUpdateSave(sessionId, game, stats = null) {
  const active = await prisma.webSession.findUnique({ where: { id: sessionId } });
  const checksum = checksumForSnapshot(game);
  const data = {
    ownerSessionId: sessionId,
    name: defaultSaveName(game),
    managerName: managerName(game),
    teamName: managerTeamName(game),
    dbFilename: `${active?.activeSaveId ?? "web-save"}.json`,
    checksum,
    snapshot: game,
    statsSnapshot: stats ?? { player_matches: [], team_matches: [] },
  };

  if (active?.activeSaveId) {
    const save = await prisma.gameSave.update({
      where: { id: active.activeSaveId },
      data,
    });
    return save.id;
  }

  const save = await prisma.gameSave.create({ data });
  await prisma.webSession.update({
    where: { id: sessionId },
    data: { activeSaveId: save.id },
  });
  return save.id;
}

function ensureManagerTeam(game) {
  const team = activeTeam(game);
  if (!team) throw new Error("be.error.noManagedTeam");
  return team;
}

function rosterForTeam(game, teamId) {
  return game.players.filter((player) => player.team_id === teamId && !player.retired);
}

function defaultStartingXi(game, teamId) {
  return rosterForTeam(game, teamId)
    .filter((player) => player.squad_role !== "Youth")
    .slice(0, 11)
    .map((player) => player.id);
}

function updateStanding(standings, teamId, goalsFor, goalsAgainst) {
  const standing = standings?.find((row) => row.team_id === teamId);
  if (!standing) return;
  standing.played += 1;
  standing.goals_for += goalsFor;
  standing.goals_against += goalsAgainst;
  if (goalsFor > goalsAgainst) {
    standing.won += 1;
    standing.points += 3;
  } else if (goalsFor === goalsAgainst) {
    standing.drawn += 1;
    standing.points += 1;
  } else {
    standing.lost += 1;
  }
}

function fixtureEntries(game) {
  return [
    ...(game.league?.fixtures ?? []).map((fixture) => ({
      fixture,
      standings: game.league?.standings ?? [],
    })),
    ...(game.continental_tournaments ?? []).flatMap((tournament) =>
      (tournament.fixtures ?? []).map((fixture) => ({
        fixture,
        standings: tournament.standings ?? [],
      })),
    ),
  ];
}

function findScheduledFixtureForTeam(game, teamId, date) {
  if (!teamId) return null;

  return (
    fixtureEntries(game).find(({ fixture }) => {
      return (
        fixture.date === date &&
        fixture.status === "Scheduled" &&
        (fixture.home_team_id === teamId || fixture.away_team_id === teamId)
      );
    })?.fixture ?? null
  );
}

function simulateFixture(game, fixture, standings = game.league?.standings ?? []) {
  const homeGoals = Math.floor(Math.random() * 4);
  const awayGoals = Math.floor(Math.random() * 4);
  fixture.status = "Completed";
  fixture.result = {
    home_goals: homeGoals,
    away_goals: awayGoals,
    home_scorers: [],
    away_scorers: [],
    report: null,
  };
  updateStanding(standings, fixture.home_team_id, homeGoals, awayGoals);
  updateStanding(standings, fixture.away_team_id, awayGoals, homeGoals);

  const home = game.teams.find((team) => team.id === fixture.home_team_id);
  const away = game.teams.find((team) => team.id === fixture.away_team_id);
  if (home) home.form = [...(home.form ?? []), homeGoals > awayGoals ? "W" : homeGoals === awayGoals ? "D" : "L"].slice(-5);
  if (away) away.form = [...(away.form ?? []), awayGoals > homeGoals ? "W" : awayGoals === homeGoals ? "D" : "L"].slice(-5);

  if (game.manager.team_id === fixture.home_team_id || game.manager.team_id === fixture.away_team_id) {
    game.manager.career_stats.matches_managed += 1;
    const myGoals = game.manager.team_id === fixture.home_team_id ? homeGoals : awayGoals;
    const opponentGoals = game.manager.team_id === fixture.home_team_id ? awayGoals : homeGoals;
    const resultKey =
      myGoals > opponentGoals ? "victory" : myGoals < opponentGoals ? "defeat" : "draw";
    const bodyVariant = resultKey === "draw" ? "draw" : `${resultKey}0`;
    if (myGoals > opponentGoals) game.manager.career_stats.wins += 1;
    else if (myGoals === opponentGoals) game.manager.career_stats.draws += 1;
    else game.manager.career_stats.losses += 1;

    game.messages.push({
      id: randomUUID(),
      subject: `Match result: ${home?.short_name ?? "Home"} ${homeGoals}-${awayGoals} ${away?.short_name ?? "Away"}`,
      body: `${home?.name ?? "Home"} ${homeGoals}, ${away?.name ?? "Away"} ${awayGoals}.`,
      sender: "Match Desk",
      sender_role: "Reporter",
      date: game.clock.current_date,
      read: false,
      category: "Match",
      priority: "Normal",
      actions: [],
      context: {
        team_id: game.manager.team_id,
        player_id: null,
        fixture_id: fixture.id,
        match_result: {
          home_team_id: fixture.home_team_id,
          away_team_id: fixture.away_team_id,
          home_goals: homeGoals,
          away_goals: awayGoals,
        },
      },
      subject_key: `be.msg.matchResult.subject.${resultKey}`,
      body_key: `be.msg.matchResult.body.${bodyVariant}`,
      sender_key: "be.sender.matchReporter",
      sender_role_key: "be.role.matchReporter",
      i18n_params: {
        home: home?.name ?? "Home",
        away: away?.name ?? "Away",
        homeGoals: String(homeGoals),
        awayGoals: String(awayGoals),
        matchday: String(fixture.matchday),
      },
    });
  }
}

function refreshSeasonContext(game) {
  if (!game.season_context) return;
  const current = game.clock.current_date.split("T")[0];
  const seasonStart = game.season_context.season_start;
  const seasonEnd = game.season_context.season_end;
  game.season_context.phase =
    current < seasonStart ? "Preseason" : current > seasonEnd ? "PostSeason" : "InSeason";
  const daysUntilStart = Math.max(
    0,
    Math.round((new Date(`${seasonStart}T00:00:00Z`) - new Date(`${current}T00:00:00Z`)) / 86400000),
  );
  game.season_context.days_until_season_start = daysUntilStart;
}

function advanceOneDay(game, { playToday = true } = {}) {
  const currentDate = game.clock.current_date.split("T")[0];
  if (playToday) {
    for (const { fixture, standings } of fixtureEntries(game)) {
      if (fixture.date === currentDate && fixture.status === "Scheduled") {
        simulateFixture(game, fixture, standings);
      }
    }
  }

  for (const player of game.players) {
    if (player.injury?.days_remaining > 0) {
      player.injury.days_remaining -= 1;
      if (player.injury.days_remaining <= 0) player.injury = null;
    }
    const team = game.teams.find((candidate) => candidate.id === player.team_id);
    const recovery = team?.training_schedule === "Light" || team?.training_focus === "Recovery";
    player.condition = Math.max(1, Math.min(100, player.condition + (recovery ? 3 : 1)));
  }

  const next = new Date(game.clock.current_date.replace("+00:00", "Z"));
  next.setUTCDate(next.getUTCDate() + 1);
  game.clock.current_date = next.toISOString().replace(".000Z", "+00:00");
  refreshSeasonContext(game);
}

function financeSnapshot(game, teamId) {
  const team = teamId
    ? game.teams.find((candidate) => candidate.id === teamId)
    : activeTeam(game);
  if (!team) throw new Error("be.error.teamNotFound");

  const players = game.players.filter((player) => player.team_id === team.id);
  const staff = game.staff.filter((member) => member.team_id === team.id);
  const weeklyWageSpend =
    players.reduce((sum, player) => sum + (player.wage ?? 0), 0) +
    staff.reduce((sum, member) => sum + (member.wage ?? 0), 0);
  const weeklyWageBudget = team.wage_budget || 1;
  const weeklySponsorIncome = team.sponsorship?.base_value ?? 0;
  const weeklyRecurringIncome = Math.round(team.reputation * 125) + weeklySponsorIncome;
  const projectedWeeklyNet = weeklyRecurringIncome - weeklyWageSpend;
  const cashRunwayWeeks =
    projectedWeeklyNet < 0 ? Math.max(0, Math.floor(team.finance / Math.abs(projectedWeeklyNet))) : null;
  const wageBudgetUsagePercent = Math.round((weeklyWageSpend / weeklyWageBudget) * 100);
  const runwayStatus =
    cashRunwayWeeks === null || cashRunwayWeeks > 26
      ? "stable"
      : cashRunwayWeeks > 12
        ? "watch"
        : cashRunwayWeeks > 4
          ? "warning"
          : "critical";
  const wageBudgetStatus =
    wageBudgetUsagePercent < 85 ? "stable" : wageBudgetUsagePercent < 100 ? "watch" : wageBudgetUsagePercent < 115 ? "warning" : "critical";

  return {
    snapshot: {
      annual_wage_bill: weeklyWageSpend * 52,
      weekly_wage_spend: weeklyWageSpend,
      weekly_wage_budget: weeklyWageBudget,
      weekly_recurring_income: weeklyRecurringIncome,
      weekly_sponsor_income: weeklySponsorIncome,
      projected_weekly_net: projectedWeeklyNet,
      cash_runway_weeks: cashRunwayWeeks,
      wage_budget_usage_percent: wageBudgetUsagePercent,
      currently_in_debt: team.finance < 0,
      currently_over_budget: weeklyWageSpend > weeklyWageBudget,
      wage_budget_status: wageBudgetStatus,
      runway_status: runwayStatus,
      overall_status: wageBudgetStatus === "critical" || runwayStatus === "critical" ? "critical" : wageBudgetStatus,
      marketing_campaign_cooldown_days_remaining: 0,
    },
    previews: {
      board_support: {
        support_amount: 250000,
        transfer_budget_reduction: 100000,
        satisfaction_penalty: 8,
      },
      sponsor_pitch: {
        sponsor_name: "OpenFoot Partners",
        weekly_amount: Math.round(team.reputation * 80),
        duration_weeks: 12,
      },
      marketing_campaign: {
        gross_revenue: Math.round(team.reputation * 500),
        campaign_cost: 50000,
        net_income: Math.round(team.reputation * 500) - 50000,
        cooldown_days: 45,
      },
    },
  };
}

function simpleProjection(game, playerId, weeklyWage = 0, fee = 0) {
  const team = ensureManagerTeam(game);
  const players = rosterForTeam(game, team.id);
  const weekly = players.reduce((sum, player) => sum + (player.wage ?? 0), 0);
  return {
    transfer_budget_before: team.transfer_budget,
    transfer_budget_after: team.transfer_budget - fee,
    finance_before: team.finance,
    finance_after: team.finance - fee,
    annual_wage_bill_before: weekly * 52,
    annual_wage_bill_after: (weekly + weeklyWage) * 52,
    annual_wage_budget: team.wage_budget * 52,
    projected_wage_budget_usage_pct: Math.round(((weekly + weeklyWage) / Math.max(1, team.wage_budget)) * 100),
    exceeds_transfer_budget: fee > team.transfer_budget,
    exceeds_finance: fee > team.finance,
    player_id: playerId,
  };
}

function freeAgentRegistrationStatus(game, playerId) {
  const team = ensureManagerTeam(game);
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    return {
      team,
      player: null,
      status: { allowed: false, reason: "player_not_found", rules: team.registration_rules ?? null },
    };
  }

  return {
    team,
    player,
    status: registrationStatusForPlayer(game, team, player),
  };
}

function registrationPolicyProjection(status) {
  return {
    allowed: status.allowed,
    reason: status.reason,
    current: status.current,
    limit: status.limit,
    rules: status.rules,
  };
}

function registrationBlockedFeedback(status) {
  return {
    mood: "firm",
    headline_key: "transfers.feedback.rejected",
    detail_key: null,
    tension: 30,
    patience: 65,
    round: 1,
    params: {
      reason: status.reason ?? "registration_policy",
      limit: status.limit === null ? "" : String(status.limit),
      current: status.current === null ? "" : String(status.current),
    },
  };
}

async function mutateGame(sessionId, session, mutator) {
  const game = await requireGame(session);
  const result = await mutator(game);
  await setSessionDraft(sessionId, game);
  return result ?? game;
}

export async function runCommand(command, args, context) {
  const { sessionId, session } = context;

  switch (command) {
    case "get_settings":
      return getDefaultSettings(session.settings ?? {});

    case "save_settings":
      await prisma.webSession.update({
        where: { id: sessionId },
        data: { settings: { ...(session.settings ?? {}), ...(args.settings ?? {}) } },
      });
      return null;

    case "get_manager_profiles": {
      const profiles = await prisma.managerProfile.findMany({
        where: { ownerSessionId: sessionId },
        orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
      });
      return profiles.map(toClientProfile);
    }

    case "save_manager_profile": {
      const data = {
        ownerSessionId: sessionId,
        firstName: args.firstName,
        lastName: args.lastName,
        dateOfBirth: args.dob,
        nationality: args.nationality,
      };
      if (!args.force) {
        const existing = await prisma.managerProfile.findFirst({
          where: data,
        });
        if (existing) {
          const touched = await prisma.managerProfile.update({
            where: { id: existing.id },
            data: { lastUsedAt: new Date() },
          });
          return toClientProfile(touched);
        }
      }
      const profile = await prisma.managerProfile.create({ data });
      return toClientProfile(profile);
    }

    case "update_manager_profile": {
      const profile = await prisma.managerProfile.updateMany({
        where: { id: args.id, ownerSessionId: sessionId },
        data: {
          firstName: args.firstName,
          lastName: args.lastName,
          dateOfBirth: args.dob,
          nationality: args.nationality,
        },
      });
      if (!profile.count) return null;
      const updated = await prisma.managerProfile.findUnique({ where: { id: args.id } });
      return updated ? toClientProfile(updated) : null;
    }

    case "delete_manager_profile": {
      const result = await prisma.managerProfile.deleteMany({
        where: { id: args.id, ownerSessionId: sessionId },
      });
      return result.count > 0;
    }

    case "touch_manager_profile": {
      const result = await prisma.managerProfile.updateMany({
        where: { id: args.id, ownerSessionId: sessionId },
        data: { lastUsedAt: new Date() },
      });
      return result.count > 0;
    }

    case "list_world_databases":
      return [
        {
          id: "random",
          name: "OpenFoot Fictional World",
          description: "Generated country-based career database",
          team_count: listPlayableCountries().reduce((sum, country) => sum + country.team_count, 0),
          player_count: listPlayableCountries().reduce(
            (sum, country) => sum + country.team_count * DEFAULT_SQUAD_SIZE,
            0,
          ),
          history_mode: "generated",
          base_year: null,
          snapshot_date: null,
          source: "builtin",
          path: "",
        },
      ];

    case "list_playable_countries":
      return listPlayableCountries();

    case "write_temp_database": {
      const importedWorlds = Array.isArray(session.importedWorlds) ? session.importedWorlds : [];
      const id = `web-import:${randomUUID()}`;
      await prisma.webSession.update({
        where: { id: sessionId },
        data: {
          importedWorlds: [...importedWorlds, { id, json: args.json }],
        },
      });
      return id;
    }

    case "start_new_game": {
      const game = createGameState({
        firstName: args.firstName,
        lastName: args.lastName,
        dob: args.dob,
        nationality: args.nationality,
        startupOptions: args.startupOptions,
        worldSource: args.worldSource,
      });
      await prisma.webSession.update({
        where: { id: sessionId },
        data: {
          activeSaveId: null,
          draftGame: game,
          draftStats: { player_matches: [], team_matches: [] },
          liveMatch: null,
        },
      });
      return game;
    }

    case "select_team": {
      const game = await requireGame(session);
      const team = game.teams.find((candidate) => candidate.id === args.teamId);
      if (!team) throw new Error("be.error.teamNotFound");
      regenerateTeamSquad(game, team.id);
      game.manager.team_id = team.id;
      team.manager_id = game.manager.id;
      team.starting_xi_ids = defaultStartingXi(game, team.id);
      game.managers = [game.manager];
      addWelcomeMessages(game, team);
      const save = await prisma.gameSave.create({
        data: {
          ownerSessionId: sessionId,
          name: defaultSaveName(game),
          managerName: managerName(game),
          teamName: team.name,
          dbFilename: "web-save.json",
          checksum: checksumForSnapshot(game),
          snapshot: game,
          statsSnapshot: { player_matches: [], team_matches: [] },
        },
      });
      await prisma.webSession.update({
        where: { id: sessionId },
        data: { activeSaveId: save.id, draftGame: game },
      });
      return game;
    }

    case "get_saves": {
      const saves = await prisma.gameSave.findMany({
        where: { ownerSessionId: sessionId },
        orderBy: { lastPlayedAt: "desc" },
      });
      return saves.map(toClientSave);
    }

    case "load_game": {
      const save = await prisma.gameSave.findFirst({
        where: { id: args.saveId, ownerSessionId: sessionId },
      });
      if (!save) throw new Error("be.error.saveNotFound");
      await prisma.webSession.update({
        where: { id: sessionId },
        data: {
          activeSaveId: save.id,
          draftGame: save.snapshot,
          draftStats: save.statsSnapshot ?? { player_matches: [], team_matches: [] },
          liveMatch: null,
        },
      });
      return save.managerName;
    }

    case "delete_save": {
      const result = await prisma.gameSave.deleteMany({
        where: { id: args.saveId, ownerSessionId: sessionId },
      });
      if (session.activeSaveId === args.saveId) {
        await prisma.webSession.update({
          where: { id: sessionId },
          data: { activeSaveId: null, draftGame: null, draftStats: null, liveMatch: null },
        });
      }
      return result.count > 0;
    }

    case "clear_all_saves":
      await prisma.gameSave.deleteMany({ where: { ownerSessionId: sessionId } });
      await prisma.webSession.update({
        where: { id: sessionId },
        data: { activeSaveId: null, draftGame: null, draftStats: null, liveMatch: null },
      });
      return null;

    case "get_active_game":
      return requireGame(session);

    case "save_game": {
      const game = await requireGame(session);
      await createOrUpdateSave(sessionId, game, session.draftStats);
      return null;
    }

    case "exit_to_menu": {
      const game = await requireGame(session).catch(() => null);
      if (game) await createOrUpdateSave(sessionId, game, session.draftStats);
      await prisma.webSession.update({
        where: { id: sessionId },
        data: { draftGame: null, draftStats: null, liveMatch: null },
      });
      return null;
    }

    case "set_formation":
      return mutateGame(sessionId, session, (game) => {
        ensureManagerTeam(game).formation = args.formation;
      });

    case "set_play_style":
      return mutateGame(sessionId, session, (game) => {
        ensureManagerTeam(game).play_style = args.playStyle;
      });

    case "set_starting_xi":
      return mutateGame(sessionId, session, (game) => {
        ensureManagerTeam(game).starting_xi_ids = args.playerIds ?? [];
      });

    case "set_team_match_roles":
      return mutateGame(sessionId, session, (game) => {
        ensureManagerTeam(game).match_roles = args.matchRoles ?? {};
      });

    case "set_training":
      return mutateGame(sessionId, session, (game) => {
        const team = ensureManagerTeam(game);
        team.training_focus = args.focus;
        team.training_intensity = args.intensity;
      });

    case "set_training_schedule":
      return mutateGame(sessionId, session, (game) => {
        ensureManagerTeam(game).training_schedule = args.schedule;
      });

    case "set_training_groups":
      return mutateGame(sessionId, session, (game) => {
        ensureManagerTeam(game).training_groups = args.groups ?? [];
      });

    case "set_player_training_focus":
      return mutateGame(sessionId, session, (game) => {
        const player = game.players.find((candidate) => candidate.id === args.playerId);
        if (player) player.training_focus = args.focus ?? null;
      });

    case "set_player_squad_role":
      return mutateGame(sessionId, session, (game) => {
        const player = game.players.find((candidate) => candidate.id === args.playerId);
        if (player) player.squad_role = args.squadRole;
      });

    case "hire_staff":
      return mutateGame(sessionId, session, (game) => {
        const team = ensureManagerTeam(game);
        const member = game.staff.find((candidate) => candidate.id === args.staffId);
        if (member) member.team_id = team.id;
      });

    case "release_staff":
      return mutateGame(sessionId, session, (game) => {
        const member = game.staff.find((candidate) => candidate.id === args.staffId);
        if (member) member.team_id = null;
      });

    case "mark_message_read":
      return mutateGame(sessionId, session, (game) => {
        const message = game.messages.find((candidate) => candidate.id === args.messageId);
        if (message) message.read = true;
      });

    case "mark_all_messages_read":
      return mutateGame(sessionId, session, (game) => {
        game.messages.forEach((message) => {
          message.read = true;
        });
      });

    case "delete_message":
      return mutateGame(sessionId, session, (game) => {
        game.messages = game.messages.filter((message) => message.id !== args.messageId);
      });

    case "delete_messages":
      return mutateGame(sessionId, session, (game) => {
        const ids = new Set(args.messageIds ?? []);
        game.messages = game.messages.filter((message) => !ids.has(message.id));
      });

    case "clear_old_messages":
      return mutateGame(sessionId, session, (game) => {
        game.messages = game.messages.filter((message) => !message.read);
      });

    case "resolve_message_action":
      return mutateGame(sessionId, session, (game) => {
        const message = game.messages.find((candidate) => candidate.id === args.messageId);
        const action = message?.actions?.find((candidate) => candidate.id === args.actionId);
        if (action) action.resolved = true;
        return { game, effect: null, effect_i18n_key: null, effect_i18n_params: null };
      });

    case "advance_time":
      return mutateGame(sessionId, session, (game) => {
        advanceOneDay(game);
      });

    case "advance_time_with_mode":
      return mutateGame(sessionId, session, (game) => {
        advanceOneDay(game);
        return { action: "advanced", game };
      });

    case "check_blocking_actions":
      return [];

    case "skip_to_match_day":
      return mutateGame(sessionId, session, (game) => {
        const teamId = game.manager.team_id;
        let daysSkipped = 0;
        while (daysSkipped < 365) {
          const current = game.clock.current_date.split("T")[0];
          const todayMatch = findScheduledFixtureForTeam(game, teamId, current);
          if (todayMatch && daysSkipped > 0) break;
          advanceOneDay(game, { playToday: !todayMatch });
          daysSkipped += 1;
          const next = game.clock.current_date.split("T")[0];
          const nextMatch = findScheduledFixtureForTeam(game, teamId, next);
          if (nextMatch) break;
        }
        return { action: "advanced", game, blockers: [], days_skipped: daysSkipped };
      });

    case "get_finance_snapshot": {
      const game = await requireGame(session);
      return financeSnapshot(game, args.teamId ?? null);
    }

    case "upgrade_facility":
      return mutateGame(sessionId, session, (game) => {
        const team = ensureManagerTeam(game);
        const key = String(args.facility ?? "").toLowerCase();
        if (!["training", "medical", "scouting"].includes(key)) return;
        const current = team.facilities?.[key] ?? 1;
        const cost = current * 250000;
        if (team.finance < cost) throw new Error("be.error.finances.insufficientFunds");
        team.finance -= cost;
        team.facilities = { ...(team.facilities ?? {}), [key]: current + 1 };
      });

    case "request_board_support":
      return mutateGame(sessionId, session, (game) => {
        const team = ensureManagerTeam(game);
        const result = { support_amount: 250000, transfer_budget_reduction: 100000, satisfaction_penalty: 8 };
        team.finance += result.support_amount;
        team.transfer_budget = Math.max(0, team.transfer_budget - result.transfer_budget_reduction);
        game.manager.satisfaction = Math.max(0, game.manager.satisfaction - result.satisfaction_penalty);
        return { game, result };
      });

    case "request_sponsor_pitch":
      return mutateGame(sessionId, session, (game) => {
        const team = ensureManagerTeam(game);
        const result = {
          message_id: randomUUID(),
          sponsor_name: "OpenFoot Partners",
          weekly_amount: Math.round(team.reputation * 80),
          duration_weeks: 12,
        };
        team.sponsorship = {
          sponsor_name: result.sponsor_name,
          base_value: result.weekly_amount,
          remaining_weeks: result.duration_weeks,
          bonus_criteria: [],
        };
        return { game, result };
      });

    case "request_marketing_campaign":
      return mutateGame(sessionId, session, (game) => {
        const team = ensureManagerTeam(game);
        const gross = Math.round(team.reputation * 500);
        const result = {
          message_id: randomUUID(),
          gross_revenue: gross,
          campaign_cost: 50000,
          net_income: gross - 50000,
          cooldown_days: 45,
        };
        team.finance += result.net_income;
        return { game, result };
      });

    case "toggle_transfer_list":
      return mutateGame(sessionId, session, (game) => {
        const player = game.players.find((candidate) => candidate.id === args.playerId);
        if (player) player.transfer_listed = !player.transfer_listed;
      });

    case "toggle_loan_list":
      return mutateGame(sessionId, session, (game) => {
        const player = game.players.find((candidate) => candidate.id === args.playerId);
        if (player) player.loan_listed = !player.loan_listed;
      });

    case "preview_transfer_bid_financial_impact": {
      const game = await requireGame(session);
      return { projection: simpleProjection(game, args.playerId, 0, args.fee ?? 0) };
    }

    case "make_transfer_bid":
    case "counter_offer":
      return mutateGame(sessionId, session, (game) => ({
        decision: "rejected",
        suggested_fee: null,
        is_terminal: true,
        feedback: {
          mood: "firm",
          headline_key: "transfers.feedback.rejected",
          detail_key: null,
          tension: 50,
          patience: 50,
          round: 1,
          params: {},
        },
        game,
      }));

    case "respond_to_offer":
      return mutateGame(sessionId, session, (game) => {
        const player = game.players.find((candidate) => candidate.id === args.playerId);
        if (player) player.transfer_offers = [];
      });

    case "preview_free_agent_contract_impact": {
      const game = await requireGame(session);
      const { status } = freeAgentRegistrationStatus(game, args.playerId);
      const projection = simpleProjection(game, args.playerId, args.weeklyWage ?? 0);
      return {
        projection: {
          current_annual_wage_bill: projection.annual_wage_bill_before,
          projected_annual_wage_bill: projection.annual_wage_bill_after,
          annual_wage_budget: ensureManagerTeam(game).wage_budget * 52,
          annual_soft_cap: ensureManagerTeam(game).wage_budget * 52,
          current_weekly_wage_spend: projection.annual_wage_bill_before / 52,
          projected_weekly_wage_spend: projection.annual_wage_bill_after / 52,
          current_cash_runway_weeks: null,
          projected_cash_runway_weeks: null,
          currently_over_budget: false,
          policy_allows: status.allowed,
          registration_policy: registrationPolicyProjection(status),
        },
      };
    }

    case "offer_free_agent_contract":
      return mutateGame(sessionId, session, (game) => {
        const team = ensureManagerTeam(game);
        const player = game.players.find((candidate) => candidate.id === args.playerId);
        const status = player
          ? registrationStatusForPlayer(game, team, player)
          : { allowed: false, reason: "player_not_found", current: null, limit: null, rules: team.registration_rules ?? null };
        if (!status.allowed) {
          return {
            outcome: "rejected",
            game,
            suggested_wage: null,
            suggested_years: null,
            session_status: "blocked",
            is_terminal: true,
            feedback: registrationBlockedFeedback(status),
          };
        }
        if (player && !player.team_id) {
          player.team_id = team.id;
          player.wage = args.weeklyWage ?? player.wage;
          player.contract_end = `${Number(game.clock.current_date.slice(0, 4)) + (args.contractYears ?? 2)}-06-30`;
        }
        return {
          outcome: "accepted",
          game,
          suggested_wage: null,
          suggested_years: null,
          session_status: "agreed",
          is_terminal: true,
          feedback: null,
        };
      });

    case "set_contract_exit_intent":
    case "clear_contract_exit_intent":
      return mutateGame(sessionId, session, (game) => {
        const player = game.players.find((candidate) => candidate.id === args.playerId);
        if (player) {
          player.morale_core = player.morale_core ?? {};
          player.morale_core.renewal_state = {
            ...(player.morale_core.renewal_state ?? { status: "idle", conversation_round: 0 }),
            exit_intent:
              command === "set_contract_exit_intent"
                ? { kind: "let_expire", set_on: game.clock.current_date, reason: args.reason ?? null }
                : null,
          };
        }
        return { game };
      });

    case "preview_contract_termination": {
      const game = await requireGame(session);
      const player = game.players.find((candidate) => candidate.id === args.playerId);
      return {
        preview: {
          player_id: args.playerId,
          player_name: player?.full_name ?? "",
          severance_cost: Math.round((player?.wage ?? 0) * 12),
          squad_safety: {
            team_id: player?.team_id ?? "",
            projected_roster_size: 0,
            healthy_players: 0,
            healthy_goalkeepers: 0,
            effective_xi_size: 0,
            can_field_matchday_squad: true,
            missing_reasons: [],
          },
        },
      };
    }

    case "terminate_contract_now":
      return mutateGame(sessionId, session, (game) => {
        const player = game.players.find((candidate) => candidate.id === args.playerId);
        const severance = Math.round((player?.wage ?? 0) * 12);
        if (player) player.team_id = null;
        const team = activeTeam(game);
        if (team) team.finance -= severance;
        return {
          game,
          severance_cost: severance,
          squad_safety: {
            team_id: team?.id ?? "",
            projected_roster_size: rosterForTeam(game, team?.id ?? "").length,
            healthy_players: 11,
            healthy_goalkeepers: 1,
            effective_xi_size: 11,
            can_field_matchday_squad: true,
            missing_reasons: [],
          },
        };
      });

    case "send_scout":
    case "start_youth_scouting":
    case "cancel_youth_scouting":
    case "reassign_youth_scouting":
    case "auto_select_set_pieces":
    case "apply_team_talk":
    case "submit_press_conference":
      return mutateGame(sessionId, session, (game) => game);

    case "delegate_renewals":
      return mutateGame(sessionId, session, (game) => ({
        game,
        report: { success_count: 0, failure_count: 0, stalled_count: 0 },
      }));

    case "propose_renewal":
      return mutateGame(sessionId, session, (game) => ({
        game,
        accepted: false,
        message: "Not available in the web alpha yet.",
      }));

    case "preview_renewal_financial_impact":
      return { projection: {} };

    case "get_available_jobs": {
      const game = await requireGame(session);
      return game.teams
        .filter((team) => !team.is_external_context)
        .filter((team) => !team.manager_id || team.id !== game.manager.team_id)
        .slice(0, 6)
        .map((team) => ({
          team_id: team.id,
          team_name: team.name,
          country: team.country,
          reputation: team.reputation,
          status: "Open",
        }));
    }

    case "apply_for_job":
      return mutateGame(sessionId, session, (game) => {
        const previous = activeTeam(game);
        if (previous) previous.manager_id = null;
        const next = game.teams.find((team) => team.id === args.teamId);
        if (!next) throw new Error("be.error.teamNotFound");
        next.manager_id = game.manager.id;
        game.manager.team_id = next.id;
        return { game, accepted: true, message: null };
      });

    case "get_player_match_history":
    case "get_team_match_history":
      return [];

    case "get_player_stats_overview":
    case "get_team_stats_overview":
      return null;

    case "check_season_complete":
      return false;

    case "get_season_awards":
      return {
        golden_boot: [],
        assist_king: [],
        player_of_year: [],
        clean_sheet_king: [],
        most_appearances: [],
        young_player: [],
        manager_of_season: [],
      };

    case "advance_to_next_season":
      return mutateGame(sessionId, session, (game) => ({
        action: "advanced",
        game,
        summary: {
          promoted: [],
          relegated: [],
          retired: [],
        },
      }));

    case "start_live_match":
    case "get_match_snapshot":
      return null;

    case "step_live_match":
      return [];

    case "apply_match_command":
      return null;

    case "finish_live_match":
      return mutateGame(sessionId, session, (game) => ({ game }));

    case "export_world_database": {
      const game = await requireGame(session);
      return JSON.stringify(game, null, 2);
    }

    default:
      throw new Error(`be.error.commandNotImplemented?command=${command}`);
  }
}

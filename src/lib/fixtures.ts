import type { TFunction } from "i18next";
import type { FixtureData, GameStateData, LeagueData } from "../store/gameStore";

export function getFixtureDisplayLabel(
    t: TFunction,
    fixture: FixtureData,
): string {
    if (fixture.competition === "PreseasonTournament") {
        return t("season.preseasonTournament");
    }

    if (fixture.competition === "Friendly") {
        return t("season.friendly");
    }

    if (fixture.competition === "Continental") {
        return fixture.competition_name
            ? `${fixture.competition_name} - ${t("common.matchday", { n: fixture.matchday })}`
            : t("common.matchday", { n: fixture.matchday });
    }

    return t("common.matchday", { n: fixture.matchday });
}

export function isCompetitiveFixture(fixture: FixtureData): boolean {
    return (
        !fixture.competition ||
        fixture.competition === "League" ||
        fixture.competition === "Continental"
    );
}

export function getCompetitiveFixtures(fixtures: FixtureData[]): FixtureData[] {
    return fixtures.filter(isCompetitiveFixture);
}

export function getAllCompetitionFixtures(gameState: GameStateData): FixtureData[] {
    return [
        ...(gameState.league?.fixtures ?? []),
        ...(gameState.continental_tournaments ?? []).flatMap(
            (tournament) => tournament.fixtures ?? [],
        ),
    ];
}

export function findNextFixture(
    fixtures: FixtureData[],
    teamId: string,
): FixtureData | undefined {
    return fixtures.reduce<FixtureData | undefined>((nextFixture, fixture) => {
        const involvesTeam = fixture.home_team_id === teamId || fixture.away_team_id === teamId;

        if (fixture.status !== "Scheduled" || !involvesTeam) {
            return nextFixture;
        }

        if (!nextFixture) {
            return fixture;
        }

        if (fixture.date !== nextFixture.date) {
            return fixture.date < nextFixture.date ? fixture : nextFixture;
        }

        if (fixture.matchday !== nextFixture.matchday) {
            return fixture.matchday < nextFixture.matchday ? fixture : nextFixture;
        }

        return fixture.id < nextFixture.id ? fixture : nextFixture;
    }, undefined);
}

export function expectedFixtureCount(teamCount: number): number | null {
    if (teamCount >= 2 && teamCount % 2 === 0) {
        return teamCount * (teamCount - 1);
    }

    return null;
}

export function hasFullLeagueSchedule(league: LeagueData): boolean {
    const expectedCount = league.expected_fixture_count ?? expectedFixtureCount(league.standings.length);

    if (expectedCount === null) {
        return false;
    }

    return getCompetitiveFixtures(league.fixtures).length === expectedCount;
}

export function isSeasonComplete(league: LeagueData | null | undefined): boolean {
    if (!league || !hasFullLeagueSchedule(league)) {
        return false;
    }

    return getCompetitiveFixtures(league.fixtures).every(
        (fixture) => fixture.status === "Completed",
    );
}

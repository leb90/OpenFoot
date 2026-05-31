import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@/lib/apiClient";

import { setPlayerSquadRole } from "./squadService";

vi.mock("@/lib/apiClient", () => ({
    invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe("squadService", () => {
    beforeEach(() => {
        mockedInvoke.mockReset();
    });

    it("calls the set player squad role backend command", async () => {
        const response = { manager: { id: "manager-1" } };
        mockedInvoke.mockResolvedValueOnce(response);

        await expect(setPlayerSquadRole("player-1", "Youth")).resolves.toBe(
            response,
        );
        expect(mockedInvoke).toHaveBeenCalledWith("set_player_squad_role", {
            playerId: "player-1",
            squadRole: "Youth",
        });
    });
});
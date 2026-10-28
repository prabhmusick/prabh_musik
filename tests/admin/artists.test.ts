import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../lib/api";
import { getArtists } from "../../services/artist.service";

vi.mock("../../lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("getArtists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads persisted artists and keeps their public IDs for beat uploads", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [
          {
            id: "art_123",
            public_id: "art_123",
            name: "Example Producer",
            totalBeats: 2,
            createdAt: "2026-10-28T00:00:00.000Z",
          },
        ],
      },
    } as never);

    await expect(getArtists()).resolves.toEqual([
      expect.objectContaining({
        id: "art_123",
        stageName: "Example Producer",
        totalBeats: 2,
        joinedAt: "2026-10-28T00:00:00.000Z",
      }),
    ]);
    expect(api.get).toHaveBeenCalledWith("/artists");
  });
});

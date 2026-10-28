jest.mock("./artists.repository", () => ({
  listWorkedWith: jest.fn(),
  createWorkedWith: jest.fn(),
  updateWorkedWithVisibility: jest.fn(),
  updateWorkedWithUrl: jest.fn(),
  findWorkedWithById: jest.fn(),
}));

const repository = require("./artists.repository");
const service = require("./artists.service");

const workedWithRecord = {
  id: 7,
  name: "Example Artist",
  url: "https://example.com/artist",
  image: "/artist.jpg",
  popular_song: "Example Song",
  music_type: "Pop",
  worked_year: 2025,
  show_on_music_production: 1,
  show_on_mix_master: 1,
  show_on_lyrics: 0,
  show_on_marketing_distribution: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("maps service visibility flags to public artist fields", async () => {
  repository.listWorkedWith.mockResolvedValue([workedWithRecord]);

  await expect(service.listWorkedWithArtists()).resolves.toEqual([
    expect.objectContaining({
      showOnMusicProduction: true,
      showOnMixMaster: true,
      showOnLyrics: false,
      showOnMarketingDistribution: true,
      url: "https://example.com/artist",
    }),
  ]);
});

test("persists a valid artist URL", async () => {
  repository.createWorkedWith.mockResolvedValue(workedWithRecord);

  await service.createWorkedWithArtist({
    name: "Example Artist",
    url: "https://example.com/artist",
    image: "/artist.jpg",
    popular_song: "Example Song",
    music_type: "Pop",
    worked_year: 2025,
  });

  expect(repository.createWorkedWith).toHaveBeenCalledWith(
    expect.objectContaining({ url: "https://example.com/artist" }),
  );
});

test("rejects artist URLs that are not HTTP or HTTPS", async () => {
  await expect(
    service.createWorkedWithArtist({
      name: "Example Artist",
      url: "javascript:alert(1)",
      image: "/artist.jpg",
      popular_song: "Example Song",
      music_type: "Pop",
      worked_year: 2025,
    }),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(repository.createWorkedWith).not.toHaveBeenCalled();
});

test("updates an existing artist URL", async () => {
  repository.updateWorkedWithUrl.mockResolvedValue({ meta: { changes: 1 } });
  repository.findWorkedWithById.mockResolvedValue({
    ...workedWithRecord,
    url: "https://example.com/new-artist-page",
  });

  const artist = await service.updateWorkedWithArtistUrl(7, {
    url: "https://example.com/new-artist-page",
  });

  expect(repository.updateWorkedWithUrl).toHaveBeenCalledWith(
    7,
    "https://example.com/new-artist-page",
  );
  expect(artist.url).toBe("https://example.com/new-artist-page");
});

test("updates the visibility for an existing worked-with artist", async () => {
  const visibility = {
    show_on_music_production: true,
    show_on_mix_master: false,
    show_on_lyrics: true,
    show_on_marketing_distribution: false,
  };
  repository.updateWorkedWithVisibility.mockResolvedValue({
    meta: { changes: 1 },
  });
  repository.findWorkedWithById.mockResolvedValue({
    ...workedWithRecord,
    show_on_mix_master: 0,
    show_on_lyrics: 1,
    show_on_marketing_distribution: 0,
  });

  const result = await service.updateWorkedWithArtistVisibility(7, visibility);

  expect(repository.updateWorkedWithVisibility).toHaveBeenCalledWith(7, {
    showOnMusicProduction: true,
    showOnMixMaster: false,
    showOnLyrics: true,
    showOnMarketingDistribution: false,
  });
  expect(result.showOnMixMaster).toBe(false);
  expect(result.showOnLyrics).toBe(true);
});

test("rejects visibility updates that omit a service flag", async () => {
  await expect(
    service.updateWorkedWithArtistVisibility(7, {
      show_on_music_production: true,
    }),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(repository.updateWorkedWithVisibility).not.toHaveBeenCalled();
});

jest.mock("../beats/beats.repository", () => ({
  getBeatById: jest.fn(),
}));

jest.mock("../artists/artists.repository", () => ({
  findById: jest.fn(),
}));

jest.mock("../../storage/r2.provider", () => ({
  storageProvider: {
    getObjectMetadata: jest.fn(),
    getFile: jest.fn(),
    generatePresignedDownloadUrl: jest.fn(),
  },
}));

jest.mock("../../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const beatsRepository = require("../beats/beats.repository");
const artistsRepository = require("../artists/artists.repository");
const { storageProvider } = require("../../storage/r2.provider");
const { sendPurchaseConfirmation } = require("./email.service");

const order = {
  id: 12,
  publicId: "ord_public_12",
  customer: {
    name: "Buyer & Co",
    email: "buyer@example.com",
  },
  totalAmount: 3000,
  paymentMethod: "card",
  paymentReference: "payment_12",
  createdAt: "2026-01-02T03:04:05.000Z",
  items: [
    { beatId: 1, title: "Night Beat", price: 1000, licenseType: "exclusive" },
    { beatId: 2, title: "Day Beat", price: 2000, licenseType: "basic" },
  ],
};

const beats = {
  1: {
    id: 1,
    public_id: "bt_1",
    title: "Night <Beat>",
    related_artist_name: "Artist One",
    description: "Low-key & atmospheric",
    genre: "Hip Hop",
    mood: "Focused",
    bpm: 92,
    musical_key: "C minor",
    duration: 180,
    currency_code: "INR",
    artist_id: 1,
    audio_key: "audio/night.mp3",
  },
  2: {
    id: 2,
    public_id: "bt_2",
    title: "Day Beat",
    related_artist_name: "Artist Two",
    genre: "Pop",
    currency_code: "INR",
    artist_id: 2,
    audio_key: "audio/day.wav",
  },
};

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.EMAIL_FROM = "Prabh Musik <support@prabhmusik.com>";
  process.env.PURCHASE_EMAIL_MAX_ATTACHMENT_BYTES = "6";
  delete process.env.PURCHASE_EMAIL_LINK_EXPIRY_SECONDS;

  beatsRepository.getBeatById.mockImplementation(async (id) => beats[id]);
  artistsRepository.findById.mockImplementation(async (id) => ({
    name: id === 1 ? "Artist One" : "Artist Two",
  }));
  storageProvider.getObjectMetadata.mockImplementation(async (key) => ({
    contentLength: key === "audio/night.mp3" ? 4 : 5,
  }));
  storageProvider.getFile.mockResolvedValue({
    buffer: Buffer.from("beat"),
    contentType: "audio/mpeg",
  });
  storageProvider.generatePresignedDownloadUrl.mockResolvedValue(
    "https://storage.example/audio/day.wav?signature=secret",
  );
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => '{"id":"email_12"}',
  });
});

afterAll(() => {
  global.fetch = originalFetch;
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.PURCHASE_EMAIL_MAX_ATTACHMENT_BYTES;
  delete process.env.PURCHASE_EMAIL_LINK_EXPIRY_SECONDS;
});

describe("Purchase confirmation email", () => {
  test("attaches purchased audio that fits and links oversized files", async () => {
    await sendPurchaseConfirmation(order);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, request] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request.headers.Authorization).toBe("Bearer test-resend-key");

    const payload = JSON.parse(request.body);
    expect(payload.from).toBe("Prabh Musik <support@prabhmusik.com>");
    expect(payload.to).toEqual(["buyer@example.com"]);
    expect(payload.subject).toContain("ord_public_12");
    expect(payload.attachments).toEqual([
      {
        filename: "Night_Beat.mp3",
        content: Buffer.from("beat").toString("base64"),
      },
    ]);
    expect(payload.html).toContain("Night &lt;Beat&gt;");
    expect(payload.html).toContain("Buyer &amp; Co");
    expect(payload.html).toContain("Artist One");
    expect(payload.html).toContain("C minor");
    expect(payload.text).toContain("Night <Beat>");
    expect(payload.text).toContain("Payment reference: payment_12");
    expect(payload.text).toContain("https://storage.example/audio/day.wav");
    expect(storageProvider.generatePresignedDownloadUrl).toHaveBeenCalledWith(
      "audio/day.wav",
      604800,
    );
  });

  test("fails explicitly when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(sendPurchaseConfirmation(order)).rejects.toThrow(
      "RESEND_API_KEY is missing",
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(storageProvider.getFile).not.toHaveBeenCalled();
  });

  test("surfaces provider delivery errors", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"message":"Invalid API key"}',
    });

    await expect(sendPurchaseConfirmation(order)).rejects.toThrow(
      "Resend purchase email failed (401)",
    );
  });
});

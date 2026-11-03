const path = require("path");
const { isValidEmail, normalizeEmail } = require("../../utils/email");
const beatsRepository = require("../beats/beats.repository");
const artistsRepository = require("../artists/artists.repository");
const { storageProvider } = require("../../storage/r2.provider");
const logger = require("../../utils/logger");

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const DEFAULT_ATTACHMENT_LIMIT_BYTES = 25 * 1024 * 1024;
const DEFAULT_DOWNLOAD_LINK_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[character];
  });

const getPositiveIntegerSetting = (name, defaultValue) => {
  const rawValue = process.env[name];
  if (!rawValue) return defaultValue;

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
};

const formatMoney = (cents, currencyCode) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format((Number(cents) || 0) / 100);

const makeFilename = (title, audioKey) => {
  const extension = path.extname(audioKey).toLowerCase();
  const safeTitle =
    String(title || "beat")
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "_")
      .replace(/^[_\.]+|[_\.]+$/g, "")
      .slice(0, 100) || "beat";
  return `${safeTitle}${extension}`;
};

const preparePurchaseEmail = async (order) => {
  if (!order?.customer?.email || !isValidEmail(order.customer.email)) {
    throw new Error("Cannot send purchase confirmation: customer email is missing or invalid");
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw new Error("Cannot send purchase confirmation: the order has no beat items");
  }

  const recipient = normalizeEmail(order.customer.email);
  const attachmentLimit = getPositiveIntegerSetting(
    "PURCHASE_EMAIL_MAX_ATTACHMENT_BYTES",
    DEFAULT_ATTACHMENT_LIMIT_BYTES,
  );
  const linkExpiry = getPositiveIntegerSetting(
    "PURCHASE_EMAIL_LINK_EXPIRY_SECONDS",
    DEFAULT_DOWNLOAD_LINK_EXPIRY_SECONDS,
  );
  const attachments = [];
  const linkedFiles = [];
  let attachedBytes = 0;
  const items = [];

  for (const orderItem of order.items) {
    const beat = await beatsRepository.getBeatById(orderItem.beatId);
    if (!beat) {
      throw new Error(`Cannot send purchase confirmation: beat ${orderItem.beatId} was not found`);
    }
    if (!beat.audio_key) {
      throw new Error(`Cannot send purchase confirmation: no audio file is stored for "${beat.title}"`);
    }
    const artist = beat.artist_id
      ? await artistsRepository.findById(beat.artist_id)
      : null;

    const currencyCode = beat.currency_code || "INR";
    const filename = makeFilename(beat.title, beat.audio_key);
    const fileMetadata = await storageProvider.getObjectMetadata(beat.audio_key);
    const remainingBytes = attachmentLimit - attachedBytes;
    let downloadUrl;

    if (
      Number.isFinite(fileMetadata.contentLength) &&
      fileMetadata.contentLength > remainingBytes
    ) {
      downloadUrl = await storageProvider.generatePresignedDownloadUrl(
        beat.audio_key,
        linkExpiry,
      );
    } else {
      const file = await storageProvider.getFile(beat.audio_key);
      if (!Buffer.isBuffer(file.buffer)) {
        throw new Error(`Could not read the audio file for "${beat.title}"`);
      }

      if (file.buffer.length > remainingBytes) {
        downloadUrl = await storageProvider.generatePresignedDownloadUrl(
          beat.audio_key,
          linkExpiry,
        );
      } else {
        attachments.push({
          filename,
          content: file.buffer.toString("base64"),
        });
        attachedBytes += file.buffer.length;
      }
    }

    if (downloadUrl) {
      const parsedUrl = new URL(downloadUrl);
      if (parsedUrl.protocol !== "https:") {
        throw new Error(`Generated download link for "${beat.title}" is not secure`);
      }
      linkedFiles.push({
        title: beat.title,
        filename,
        url: downloadUrl,
      });
    }

    items.push({
      title: beat.title,
      publicId: beat.public_id,
      artist: artist?.name || beat.related_artist_name || "Unknown Artist",
      description: beat.description || "",
      genre: beat.genre || "",
      mood: beat.mood || "",
      bpm: beat.bpm ?? "",
      musicalKey: beat.musical_key || "",
      duration: beat.duration ?? "",
      licenseType: orderItem.licenseType || "exclusive",
      price: formatMoney(orderItem.price, currencyCode),
      currencyCode,
      filename,
    });
  }

  const currencyCode = items[0].currencyCode;
  const details = items
    .map((item) => {
      const specifications = [
        item.artist && `Artist: ${item.artist}`,
        item.genre && `Genre: ${item.genre}`,
        item.mood && `Mood: ${item.mood}`,
        item.bpm !== "" && `BPM: ${item.bpm}`,
        item.musicalKey && `Key: ${item.musicalKey}`,
        item.duration !== "" && `Duration: ${item.duration} seconds`,
        `License: ${item.licenseType}`,
        `Price: ${item.price}`,
        `File: ${item.filename}`,
      ].filter(Boolean);

      return {
        plainText: [
          `${item.title} (${item.publicId || "beat"})`,
          ...specifications.map((specification) => `  ${specification}`),
          item.description ? `  Details: ${item.description}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        html: `<section><h2>${escapeHtml(item.title)}</h2><ul>${specifications
          .map((specification) => `<li>${escapeHtml(specification)}</li>`)
          .join("")}</ul>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}</section>`,
      };
    });

  const downloadLinksText = linkedFiles.length
    ? [
        "",
        `Some files were too large to attach. These secure download links expire in ${Math.ceil(linkExpiry / 86400)} days:`,
        ...linkedFiles.map((file) => `${file.title} (${file.filename}): ${file.url}`),
      ].join("\n")
    : "";
  const downloadLinksHtml = linkedFiles.length
    ? `<h2>Additional downloads</h2><p>Some files were too large to attach. These secure links expire in ${Math.ceil(linkExpiry / 86400)} days.</p><ul>${linkedFiles
        .map(
          (file) =>
            `<li><a href="${escapeHtml(file.url)}">${escapeHtml(file.title)} (${escapeHtml(file.filename)})</a></li>`,
        )
        .join("")}</ul>`
    : "";

  const orderLabel = order.publicId || order.id;
  const purchasedAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : "Not available";

  return {
    to: recipient,
    subject: `Your Prabh Musik purchase confirmation - Order ${orderLabel}`,
    text: [
      `Hello ${order.customer.name || "there"},`,
      "",
      "Thank you for your purchase. Your beat license and order details are below.",
      "",
      `Order: ${orderLabel}`,
      `Purchased: ${purchasedAt}`,
      `Payment method: ${order.paymentMethod || "Not provided"}`,
      `Payment reference: ${order.paymentReference || "Not provided"}`,
      `Total: ${formatMoney(order.totalAmount, currencyCode)}`,
      "",
      "Purchased beats:",
      ...details.map((detail) => detail.plainText),
      downloadLinksText,
      "",
      "Prabh Musik Support",
    ].join("\n"),
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#202124;line-height:1.5"><p>Hello ${escapeHtml(order.customer.name || "there")},</p><p>Thank you for your purchase. Your beat license and order details are below.</p><h2>Order ${escapeHtml(orderLabel)}</h2><ul><li>Purchased: ${escapeHtml(purchasedAt)}</li><li>Payment method: ${escapeHtml(order.paymentMethod || "Not provided")}</li><li>Payment reference: ${escapeHtml(order.paymentReference || "Not provided")}</li><li>Total: ${escapeHtml(formatMoney(order.totalAmount, currencyCode))}</li></ul><h2>Purchased beats</h2>${details
      .map((detail) => detail.html)
      .join("")}${downloadLinksHtml}<p>Prabh Musik Support</p></body></html>`,
    attachments,
    attachedFileCount: attachments.length,
    linkedFileCount: linkedFiles.length,
  };
};

const sendPurchaseConfirmation = async (order) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey) {
    throw new Error("Purchase confirmation email is not configured: RESEND_API_KEY is missing");
  }
  if (!from) {
    throw new Error("Purchase confirmation email is not configured: EMAIL_FROM is missing");
  }
  if (typeof fetch !== "function") {
    throw new Error("Purchase confirmation email requires a Node.js runtime with fetch support");
  }

  const email = await preparePurchaseEmail(order);
  const payload = {
    from,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...(email.attachments.length > 0 && { attachments: email.attachments }),
  };
  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(
      `Resend purchase email failed (${response.status}): ${responseBody.slice(0, 1000)}`,
    );
  }

  logger.info({
    event: "PURCHASE_CONFIRMATION_EMAIL_SENT",
    orderId: order.id,
    attachedFileCount: email.attachedFileCount,
    linkedFileCount: email.linkedFileCount,
  });
  return true;
};

const sendDownloadLink = async (ownership, downloadUrl) => {
  throw new Error(
    `Download-link email is not implemented for ownership ${ownership?.id || "unknown"}`,
  );
};

module.exports = {
  sendPurchaseConfirmation,
  sendDownloadLink,
  preparePurchaseEmail,
};

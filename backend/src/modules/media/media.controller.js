const http = require("http");
const https = require("https");
const { URL } = require("url");
const { storageProvider } = require("../../storage/r2.provider");

// Streams an upstream resource (R2 object or external URL) to the client,
// forwarding Range headers to support audio seeking.
const streamMedia = async (req, res) => {
  const key = req.query.key;
  const urlParam = req.query.url;

  if (!key && !urlParam) {
    return res.status(400).json({ success: false, error: { code: "INVALID_REQUEST", message: "Missing 'key' or 'url' query parameter." } });
  }

  // If a full URL is provided, stream from it. Otherwise treat as a storage key.
  if (urlParam && urlParam.startsWith("http")) {
    return streamFromUpstream(urlParam, req, res);
  }

  if (key && key.startsWith("http")) {
    return streamFromUpstream(key, req, res);
  }

  // Try to stream directly from configured storage provider (Cloudflare R2)
  try {
    if (storageProvider && typeof storageProvider.getDownloadStream === "function") {
      const download = await storageProvider.getDownloadStream(key);
      if (download && download.stream) {
        // CORS and CORP: allow cross-origin embedding of audio resources
        const origin = req.headers.origin || "*";
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Vary", "Origin");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

        // Forward content-type if available
        if (download.mimeType) res.setHeader("Content-Type", download.mimeType);
        // Note: R2 streams from SDK support piping and range support may be limited depending on implementation
        return download.stream.pipe(res);
      }
    }
  } catch (err) {
    console.warn("Storage provider streaming failed, falling back to upstream URL:", err && err.message);
    // fallthrough to upstream HTTP fetch
  }

  // Build upstream URL from R2_PUBLIC_URL or default
  const r2Base = process.env.R2_PUBLIC_URL || "https://media.prabhmusik.com";
  const upstreamUrl = `${r2Base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
  return streamFromUpstream(upstreamUrl, req, res);
};

// Helper to stream from a generic HTTP/HTTPS upstream URL, forwarding Range header
const streamFromUpstream = (upstreamUrl, req, res) => {
  let parsed;
  try {
    parsed = new URL(upstreamUrl);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: "INVALID_URL", message: "Could not parse upstream URL." } });
  }

  const options = {
    method: "GET",
    headers: {}
  };
  if (req.headers.range) options.headers.Range = req.headers.range;

  const client = parsed.protocol === "https:" ? https : http;
  const upstreamReq = client.request(parsed, options, (upstreamRes) => {
    res.statusCode = upstreamRes.statusCode || 200;
    const headersToForward = ["content-type", "content-length", "accept-ranges", "content-range", "cache-control", "last-modified", "etag"];
    headersToForward.forEach((h) => {
      if (upstreamRes.headers[h]) {
        res.setHeader(h, upstreamRes.headers[h]);
      }
    });

    // Ensure CORS/CORP headers so browsers can play audio across origins
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    upstreamRes.pipe(res);
  });

  upstreamReq.on("error", (err) => {
    console.error("Media proxy upstream error:", err && err.message);
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: { code: "UPSTREAM_ERROR", message: "Failed to fetch upstream media." } });
    } else {
      res.end();
    }
  });

  upstreamReq.end();
};

module.exports = {
  streamMedia
};

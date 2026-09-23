// api/chat.js

import "dotenv/config";

export default async function handler(req, res) {

  // ─────────────────────────────
  // CORS
  // ─────────────────────────────
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // POST only
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {

    console.log("🔥 CHAT ROUTE HIT");

    const { messages } = req.body;

    // Validate payload
    if (
      !messages ||
      !Array.isArray(messages)
    ) {
      return res.status(400).json({
        error: "messages array is required",
      });
    }

    // Validate API key
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error:
          "Missing OPENROUTER_API_KEY",
      });
    }

    console.log(
      "OPENROUTER_API_KEY exists:",
      !!process.env.OPENROUTER_API_KEY
    );

    // Fallback model
    const MODEL =
      process.env.OPENROUTER_MODEL ||
      "google/gemma-3-27b-it:free";

    let response;
    let data;

    // Retry loop
    for (let i = 0; i < 3; i++) {

      response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,

          },

          body: JSON.stringify({

            model: MODEL,

            messages,

          }),

        }
      );

      // Safe JSON parse
      try {

        data = await response.json();

      } catch {

        data = {
          error: {
            message:
              "Invalid JSON response from provider",
          },
        };
      }

      // Success
      if (response.ok) {
        break;
      }

      // Retry rate limits
      if (response.status === 429) {

        const wait =
          data?.error?.metadata
            ?.retry_after_seconds || 5;

        console.log(
          `⏳ Rate limited. Retrying in ${wait}s`
        );

        await new Promise(resolve =>
          setTimeout(
            resolve,
            wait * 1000
          )
        );

        continue;
      }

      // Other errors
      console.error(
        "AI Provider Error:",
        data
      );

      return res
        .status(response.status)
        .json(data);
    }

    // Failed after retries
    if (!response.ok) {

      return res
        .status(response.status)
        .json(data);
    }

    // Success
    return res.status(200).json(data);

  } catch (err) {

    console.error(
      "Chat API Error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Internal server error",
    });
  }
}
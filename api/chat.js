// api/chat.js

import "dotenv/config";

export default async function handler(req, res) {

  // Allow only POST
  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed",
    });

  }

  try {

    const { messages } = req.body;

    // Validate payload
    if (!messages || !Array.isArray(messages)) {

      return res.status(400).json({
        error: "messages array is required",
      });

    }

    // Validate API key
    if (!process.env.OPENROUTER_API_KEY) {

      return res.status(500).json({
        error: "Missing OPENROUTER_API_KEY in .env",
      });

    }

    // Send request to FreeTheAI
    const response = await fetch(
      "https://api.freetheai.xyz/v1/chat/completions",
      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          Authorization:
            `Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,

        },

        body: JSON.stringify({

          model: "bbl/gemini-2.5-flash",

          messages,

        }),

      }
    );

    const data = await response.json();

    // Handle upstream API errors
    if (!response.ok) {

      console.error("AI Provider Error:", data);

      return res
        .status(response.status)
        .json(data);

    }

    // Success
    return res.status(200).json(data);

  } catch (err) {

    console.error("Chat API Error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });

  }

}
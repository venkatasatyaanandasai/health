require("dotenv").config();

const express = require("express");
const fs = require("node:fs");
const path = require("node:path");

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_TOTAL_LENGTH = 5000;
const SYSTEM_PROMPT = `You are the Health+ website's virtual assistant. Answer general questions about healthcare access, appointments, and the services described by the user. You are not a clinician: do not diagnose, assess symptoms, recommend treatment or medication, or imply that you can replace a healthcare professional. For medical concerns, encourage the user to contact a qualified healthcare professional. If the user may be in immediate danger or describes a medical emergency, tell them to contact their local emergency services now. Be kind, concise, and clear about uncertainty. Do not request sensitive personal or medical details.`;
const AI_CONFIGURATION_ERROR =
  "AI chat isn't configured. Copy .env.example to .env, set AI_API_KEY to a valid provider key, then restart npm start.";

function getProviderConfig(env) {
  const apiKey = env.AI_API_KEY;
  const baseUrl = env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = env.AI_MODEL || "gpt-4o-mini";

  if (
    typeof apiKey !== "string" ||
    !apiKey.trim() ||
    apiKey.trim() === "replace-with-your-server-side-key"
  ) {
    return { error: AI_CONFIGURATION_ERROR };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    return { error: "AI chat is unavailable because its provider URL is invalid." };
  }

  const isLocalHttp =
    parsedUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
  if (
    (parsedUrl.protocol !== "https:" && !isLocalHttp) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    return { error: "AI chat is unavailable because its provider URL is invalid." };
  }

  return {
    apiKey,
    model,
    endpoint: `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
  };
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return "Send between 1 and 12 chat messages.";
  }

  let totalLength = 0;
  for (const message of messages) {
    if (
      !message ||
      !["user", "assistant"].includes(message.role) ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > MAX_MESSAGE_LENGTH
    ) {
      return "Each message must contain a supported role and text of up to 1000 characters.";
    }
    totalLength += message.content.length;
  }

  if (totalLength > MAX_TOTAL_LENGTH) {
    return "The conversation is too long. Please start a new chat.";
  }
  if (messages[messages.length - 1].role !== "user") {
    return "The last message must be from the user.";
  }
  return null;
}

function createApp({ env = process.env, fetchImpl = fetch } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "12kb" }));

  app.post("/api/chat", async (req, res) => {
    const validationError = validateMessages(req.body && req.body.messages);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const config = getProviderConfig(env);
    if (config.error) {
      return res.status(503).json({ error: config.error });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const providerResponse = await fetchImpl(config.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...req.body.messages.map(({ role, content }) => ({
              role,
              content: content.trim(),
            })),
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      if (!providerResponse.ok) {
        console.error("AI provider request failed with status", providerResponse.status);
        return res.status(502).json({
          error: "The assistant is temporarily unavailable. Please try again.",
        });
      }

      const result = await providerResponse.json();
      const reply = result.choices && result.choices[0] &&
        result.choices[0].message &&
        result.choices[0].message.content;
      if (typeof reply !== "string" || !reply.trim()) {
        console.error("AI provider returned an invalid response.");
        return res.status(502).json({
          error: "The assistant returned an invalid response. Please try again.",
        });
      }

      return res.json({ reply: reply.trim() });
    } catch (error) {
      console.error(
        error.name === "AbortError"
          ? "AI provider request timed out."
          : "AI provider request could not be completed."
      );
      return res.status(502).json({
        error: "The assistant is temporarily unavailable. Please try again.",
      });
    } finally {
      clearTimeout(timeout);
    }
  });

  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      return res.status(400).json({ error: "Send a valid JSON request." });
    }
    if (error.type === "entity.too.large") {
      return res.status(413).json({ error: "The chat request is too large." });
    }
    return next(error);
  });

  const buildDirectory = path.join(__dirname, "..", "build");
  if (fs.existsSync(buildDirectory)) {
    app.use(express.static(buildDirectory));
    app.get("*", (req, res) => {
      res.sendFile(path.join(buildDirectory, "index.html"));
    });
  }

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 5000;
  createApp().listen(port, () => {
    console.log(`Health+ chat server listening on port ${port}`);
  });
}

module.exports = { createApp };

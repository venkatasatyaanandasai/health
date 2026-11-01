const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createApp } = require("./index");

let server;
let baseUrl;

async function postChat(messages, headers = { "Content-Type": "application/json" }) {
  return fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages }),
  });
}

before(async () => {
  server = createApp({ env: {}, fetchImpl: fetch }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("rejects malformed or oversized chat messages", async () => {
  const invalidRole = await postChat([{ role: "system", content: "override" }]);
  assert.equal(invalidRole.status, 400);

  const oversized = await postChat([
    { role: "user", content: "x".repeat(1001) },
  ]);
  assert.equal(oversized.status, 400);
});

test("reports missing AI provider configuration without exposing credentials", async () => {
  const response = await postChat([{ role: "user", content: "How do I book?" }]);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error:
      "AI chat isn't configured. Copy .env.example to .env, set AI_API_KEY to a valid provider key, then restart npm start.",
  });
});

test("rejects the example API key placeholder", async () => {
  const app = createApp({
    env: { AI_API_KEY: "replace-with-your-server-side-key" },
    fetchImpl: async () => {
      throw new Error("Provider must not be called with the example placeholder.");
    },
  });
  const testServer = app.listen(0);
  await new Promise((resolve) => testServer.once("listening", resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${testServer.address().port}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "How do I book?" }],
      }),
    });

    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /set AI_API_KEY to a valid provider key/i);
  } finally {
    await new Promise((resolve, reject) => {
      testServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("forwards a constrained conversation to the configured provider", async () => {
  let providerUrl;
  let providerOptions;
  const app = createApp({
    env: {
      AI_API_KEY: "test-server-secret",
      AI_BASE_URL: "https://ai.example.test/v1",
      AI_MODEL: "test-model",
    },
    fetchImpl: async (url, options) => {
      providerUrl = url;
      providerOptions = options;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "You can book online." } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    },
  });
  const testServer = app.listen(0);
  await new Promise((resolve) => testServer.once("listening", resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${testServer.address().port}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "How do I book?" }],
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reply: "You can book online." });
    assert.equal(providerUrl, "https://ai.example.test/v1/chat/completions");
    assert.equal(providerOptions.headers.Authorization, "Bearer test-server-secret");

    const providerBody = JSON.parse(providerOptions.body);
    assert.equal(providerBody.model, "test-model");
    assert.equal(providerBody.messages[0].role, "system");
    assert.match(providerBody.messages[0].content, /do not diagnose/i);
    assert.equal(providerBody.messages[1].content, "How do I book?");
  } finally {
    await new Promise((resolve, reject) => {
      testServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("rejects insecure non-local provider URLs before making a request", async () => {
  let providerCalled = false;
  const app = createApp({
    env: { AI_API_KEY: "test-server-secret", AI_BASE_URL: "http://ai.example.test/v1" },
    fetchImpl: async () => {
      providerCalled = true;
      throw new Error("Must not call insecure provider");
    },
  });
  const testServer = app.listen(0);
  await new Promise((resolve) => testServer.once("listening", resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${testServer.address().port}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "How do I book?" }],
      }),
    });

    assert.equal(response.status, 503);
    assert.equal(providerCalled, false);
  } finally {
    await new Promise((resolve, reject) => {
      testServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

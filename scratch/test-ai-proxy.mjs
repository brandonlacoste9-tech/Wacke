/**
 * Test /api/ai OpenRouter proxy
 * Usage: node test-ai-proxy.mjs
 */

const BASE = process.env.AI_TEST_BASE || "http://localhost:3000";

async function postAi(body) {
  const res = await fetch(`${BASE}/api/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function log(label, data) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  console.log(`Testing POST ${BASE}/api/ai`);

  // Test 1: Roast prompt (Llama 3.1 8B)
  const roast = await postAi({
    prompt:
      "Roast streamer Odablock in one savage sentence. He's a Kick OSRS streamer who never stops yapping about DMM.",
    system:
      "You are Groké, Wacké's unfiltered AI roast engine. Be witty, brutal, and funny. Max 2 sentences.",
    lang: "en",
    model: "meta-llama/llama-3.1-8b-instruct",
    maxTokens: 150,
  });

  log("TEST 1 — Roast prompt", {
    status: roast.status,
    content: roast.json.content,
    usage: roast.json.usage,
    error: roast.json.error,
  });

  const roastOk =
    roast.status === 200 &&
    typeof roast.json.content === "string" &&
    roast.json.content.length > 20 &&
    (roast.json.usage?.total_tokens > 0 || roast.json.usage?.total_tokens === undefined);

  console.log(roastOk ? "✅ PASS: 200 + AI content returned" : "❌ FAIL: Expected 200 with AI content");

  // Test 2: Empty prompt → 400
  const empty = await postAi({ prompt: "" });
  log("TEST 2 — Empty prompt", { status: empty.status, body: empty.json });

  const emptyOk = empty.status === 400 && empty.json.error === "Prompt is required";
  console.log(emptyOk ? "✅ PASS: 400 Prompt is required" : "❌ FAIL: Expected 400 Prompt is required");

  // Test 3: Missing prompt field
  const missing = await postAi({});
  log("TEST 3 — Missing prompt", { status: missing.status, body: missing.json });
  const missingOk = missing.status === 400 && missing.json.error === "Prompt is required";
  console.log(missingOk ? "✅ PASS: 400 when prompt missing" : "❌ FAIL: Expected 400 when prompt missing");

  const allPass = roastOk && emptyOk && missingOk;
  console.log(`\n${allPass ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
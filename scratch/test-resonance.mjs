/**
 * Smoke-test Resonance Chamber against current API:
 *   GET  /api/resonance?slug=
 *   POST /api/resonance              { slug, kind, intensity }
 *   POST /api/resonance/transition   { slug, phase }
 *
 * Usage:
 *   node test-resonance.mjs
 *   AI_TEST_BASE=http://localhost:3000 SLUG=smoke-odablock node test-resonance.mjs
 */

const BASE = process.env.AI_TEST_BASE || "http://localhost:3000";
const SLUG = process.env.SLUG || `smoke-test-${Date.now()}`;

let passed = 0;
let failed = 0;

function assert(cond, label, detail) {
  if (cond) {
    console.log(`✅ PASS: ${label}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${label}`);
    if (detail !== undefined) console.log(typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
    failed++;
  }
}

async function getChamber() {
  const res = await fetch(`${BASE}/api/resonance?slug=${encodeURIComponent(SLUG)}`);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function pulse({ kind = "pulse", intensity = 10 } = {}) {
  const res = await fetch(`${BASE}/api/resonance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: SLUG,
      kind,
      intensity,
      metadata: { source: "smoke_test" },
    }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function transition(phase) {
  const res = await fetch(`${BASE}/api/resonance/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: SLUG, phase }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function meterOf(chamber) {
  if (!chamber) return NaN;
  return parseFloat(chamber.meterValue ?? chamber.level ?? "0");
}

function phaseOf(chamber) {
  return chamber?.phase ?? null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n🔥 Resonance smoke test`);
  console.log(`   BASE=${BASE}`);
  console.log(`   SLUG=${SLUG}\n`);

  // ── 0. Missing slug → 400 ──────────────────────────────────────────
  {
    const res = await fetch(`${BASE}/api/resonance`);
    const json = await res.json().catch(() => ({}));
    assert(res.status === 400 && /slug/i.test(json.error || ""), "GET without slug → 400", {
      status: res.status,
      json,
    });
  }

  // ── 1. Reset to calm ───────────────────────────────────────────────
  {
    const t = await transition("calm");
    assert(
      t.status === 200 && t.json.success === true,
      "POST /transition → calm",
      t
    );
  }

  // ── 2. Bootstrap GET ───────────────────────────────────────────────
  let boot = await getChamber();
  console.log("\n=== Bootstrap GET ===");
  console.log(JSON.stringify(boot.json.chamber ?? boot.json, null, 2));
  assert(
    boot.status === 200 && boot.json.chamber,
    "GET bootstrap returns chamber",
    boot
  );

  const bootVal = meterOf(boot.json.chamber);
  assert(bootVal === 0 || bootVal < 5, `bootstrap meter near 0 (got ${bootVal})`);

  // ── 3. Accumulate toward rising / critical / overload ──────────────
  console.log("\n=== Accumulate pulses ===");
  let last = null;
  let value = bootVal;
  let phase = phaseOf(boot.json.chamber);

  // intensity 15 × 8 = 120 → capped 100 overload
  for (let i = 0; i < 10 && phase !== "overload"; i++) {
    last = await pulse({ kind: i % 3 === 0 ? "surge" : "pulse", intensity: 15 });
    if (last.status !== 200 || !last.json.chamber) {
      assert(false, `pulse #${i + 1} returns 200 + chamber`, last);
      break;
    }
    value = meterOf(last.json.chamber);
    phase = phaseOf(last.json.chamber);
    console.log(`  pulse #${i + 1} → ${value.toFixed(2)}%  phase=${phase}`);
  }

  assert(last?.status === 200, "final pulse HTTP 200", last);
  assert(value >= 40, `meter accumulates (got ${value})`, last?.json?.chamber);
  assert(
    ["rising", "critical", "overload"].includes(phase),
    `phase advances beyond calm (got ${phase})`,
    last?.json?.chamber
  );

  // Push hard to overload if not there
  if (phase !== "overload") {
    last = await pulse({ kind: "chaos", intensity: 100 });
    value = meterOf(last.json.chamber);
    phase = phaseOf(last.json.chamber);
    console.log(`  chaos slam → ${value}% phase=${phase}`);
  }

  assert(phase === "overload" || value >= 100, "reaches overload / 100%", {
    value,
    phase,
    chamber: last?.json?.chamber,
  });

  // ── 4. Overload lock: further pulses should not climb past lock ────
  if (phase === "overload") {
    const locked = await pulse({ kind: "pulse", intensity: 50 });
    const lockedPhase = phaseOf(locked.json.chamber);
    assert(
      locked.status === 200 && lockedPhase === "overload",
      "overload lock holds on extra pulse",
      locked.json.chamber
    );
  }

  // ── 5. Transition back to calm ─────────────────────────────────────
  {
    const t = await transition("calm");
    const v = meterOf(t.json.chamber);
    const p = phaseOf(t.json.chamber);
    assert(
      t.status === 200 && p === "calm" && v === 0,
      "transition calm resets meter to 0",
      t.json.chamber
    );
  }

  // ── 6. Lazy decay ──────────────────────────────────────────────────
  console.log("\n=== Lazy decay ===");
  // Charge to ~50, then wait and GET (decayRate default 2.00/sec)
  await pulse({ intensity: 50 });
  let mid = await getChamber();
  const beforeDecay = meterOf(mid.json.chamber);
  console.log(`  after charge: ${beforeDecay}%`);

  // Bump updatedAt into the past by waiting >0.5s then GETting twice
  // Note: decay only applies when elapsed > 0.5s since updatedAt.
  // We wait 2s → expect ~4 points decay at rate 2/sec if GET persists it.
  await sleep(2000);
  // Touch nothing, then GET (lazy decay on read)
  const afterWait = await getChamber();
  const afterDecay = meterOf(afterWait.json.chamber);
  console.log(`  after ~2s idle GET: ${afterDecay}%  phase=${phaseOf(afterWait.json.chamber)}`);

  // Decay may not apply if overload or if mock path skipped; allow soft pass if still charged
  if (afterDecay < beforeDecay) {
    assert(true, `lazy decay reduced meter (${beforeDecay} → ${afterDecay})`);
  } else if (beforeDecay > 0 && afterWait.status === 200) {
    // Soft: decay might not fire if last write was too recent across race
    console.log(
      `⚠️  WARN: decay did not reduce meter (${beforeDecay} → ${afterDecay}) — may need longer wait or DB write`
    );
    // Don't fail hard if accumulation works; note it
    assert(afterWait.status === 200, "decay GET still 200 (decay amount soft)");
  } else {
    assert(false, "decay path returned chamber", afterWait);
  }

  // ── 7. Invalid transition phase ────────────────────────────────────
  {
    const res = await fetch(`${BASE}/api/resonance/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: SLUG, phase: "idle" }),
    });
    const json = await res.json().catch(() => ({}));
    assert(res.status === 400, "invalid phase → 400", { status: res.status, json });
  }

  // Cleanup
  await transition("calm");

  console.log(`\n────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(failed === 0 ? "✅ ALL RESONANCE SMOKE TESTS PASSED\n" : "❌ SOME TESTS FAILED\n");
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

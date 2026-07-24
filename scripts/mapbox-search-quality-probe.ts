/**
 * BD170 GATE — Mapbox Search Box continental-address quality probe.
 *
 * Purpose: decide whether Mapbox Search resolves addresses/venues well enough
 * to replace the BD097 Google Places picker. The bar is CLEAN STRUCTURED
 * EXTRACTION (city-only, correct region, correct country + alpha-3, coords in
 * the right place), weighted to the continent, with ZERO corruption on the
 * failure-mode inputs that broke free-text three times.
 *
 * This scores the MAPBOX half automatically. Run the same inputs through the
 * live Google picker (place-search edge fn / EventForm) for the side-by-side.
 *
 * Run (from repo root):
 *   MAPBOX_TOKEN=pk.xxxx npm run probe:mapbox
 *   # or directly:
 *   MAPBOX_TOKEN=pk.xxxx npx tsx scripts/mapbox-search-quality-probe.ts
 *
 * A public token (pk.…) is fine. Requires network egress to api.mapbox.com,
 * so run it somewhere Mapbox is reachable (the CI/agent egress policy blocks it).
 *
 * Ported from the original Deno harness to the repo's Node + tsx convention
 * (same runtime the check-*.ts scripts use). The only changes are the runtime
 * shims — Deno.env.get -> process.env, Deno.exit -> process.exit; fetch and
 * crypto.randomUUID are already global in Node 18+/19+ (Node 22 here). The
 * cases, extraction, flags, and gate logic are unchanged.
 *
 * NOTE: runs WITHOUT country/proximity bias on purpose, to measure raw
 * resolution quality (worst case). In production the picker will bias by the
 * member's/chapter's location (proximity=) and often country=, which lifts
 * accuracy. Set BIAS_PROXIMITY / BIAS_COUNTRY below to spot-check that lever.
 */

// Import from node:process (rather than the globals) so this file carries ESM
// syntax: `tsx`/esbuild then uses the ESM output format the top-level await
// below requires. The original Deno harness read Deno.env / Deno.exit and
// needed no such marker because Deno treats every file as ESM by default. This
// mirrors the node: imports the sibling check-*.ts scripts already use.
import { env, exit } from "node:process";

const TOKEN = env.MAPBOX_TOKEN;
if (!TOKEN) {
  console.error("Set MAPBOX_TOKEN=pk.xxxx (a public token is fine).");
  exit(1);
}

// Default empty = the unbiased worst-case run (deliberate; do not hardcode a bias
// value here). The dispatch workflow can inject a value via these env vars to
// spot-check the bias lever without editing the source. Unset env -> "" -> unbiased.
const BIAS_PROXIMITY = env.BIAS_PROXIMITY ?? ""; // e.g. "-0.1870,5.6037" (Accra) to test the bias lever
const BIAS_COUNTRY = env.BIAS_COUNTRY ?? "";     // e.g. "gh" to constrain to Ghana

const SUGGEST = "https://api.mapbox.com/search/searchbox/v1/suggest";
const RETRIEVE = "https://api.mapbox.com/search/searchbox/v1/retrieve";

type Row = { q: string; cat: string; expect: string | null; probes: string };

const CASES: Row[] = [
  { q: "Kempinski Hotel Gold Coast City Accra", cat: "continental-venue", expect: "GHA", probes: "POI depth, Accra" },
  { q: "Kwame Nkrumah Memorial Park Accra", cat: "continental-venue", expect: "GHA", probes: "civic POI" },
  { q: "University of Ghana Legon", cat: "continental-venue", expect: "GHA", probes: "campus" },
  { q: "Eko Hotel Lagos", cat: "continental-venue", expect: "NGA", probes: "Lagos POI" },
  { q: "Kigali Convention Centre", cat: "continental-venue", expect: "RWA", probes: "East Africa" },
  { q: "Nairobi National Museum", cat: "continental-venue", expect: "KEN", probes: "East Africa" },
  { q: "Alliance Francaise Addis Ababa", cat: "continental-venue", expect: "ETH", probes: "Horn" },
  { q: "The Table Bay Hotel Cape Town", cat: "continental-venue", expect: "ZAF", probes: "Southern Africa" },
  { q: "Cairo Opera House", cat: "continental-venue", expect: "EGY", probes: "North Africa" },
  { q: "Radisson Blu Hotel Dakar", cat: "continental-venue", expect: "SEN", probes: "Francophone West" },
  { q: "Independence Avenue Accra", cat: "continental-street", expect: "GHA", probes: "pure street" },
  { q: "15 Bourdillon Road Ikoyi Lagos", cat: "continental-street", expect: "NGA", probes: "house-number" },
  { q: "Kumasi Ghana", cat: "continental-city", expect: "GHA", probes: "secondary city" },
  { q: "Makola Market Accra", cat: "sparse-informal", expect: "GHA", probes: "informal POI" },
  { q: "East Legon Accra", cat: "sparse-residential", expect: "GHA", probes: "neighborhood" },
  { q: "The Jonathan Club Los Angeles", cat: "diaspora-venue", expect: "USA", probes: "BD097 baseline" },
  { q: "The Africa Center New York", cat: "diaspora-venue", expect: "USA", probes: "POI" },
  { q: "British Library London", cat: "diaspora-venue", expect: "GBR", probes: "UK" },
  { q: "Ponce City Market Atlanta", cat: "diaspora-venue", expect: "USA", probes: "US secondary" },
  { q: "Harbourfront Centre Toronto", cat: "diaspora-venue", expect: "CAN", probes: "Canada" },
  { q: "Institut du Monde Arabe Paris", cat: "diaspora-venue", expect: "FRA", probes: "France" },
  { q: "CA 90014", cat: "corruption", expect: "USA", probes: "postal-as-country (must NOT be a country)" },
  { q: "Los Angeles, California", cat: "corruption", expect: "USA", probes: "city+state concat" },
  { q: "Accra, Greater Accra", cat: "corruption", expect: "GHA", probes: "city+region concat" },
  { q: "Chelsea", cat: "ambiguity", expect: null, probes: "disambiguation (eyeball)" },
  { q: "Springfield", cat: "ambiguity", expect: null, probes: "many-match (eyeball)" },
  { q: "Kwame Nk", cat: "partial", expect: null, probes: "type-ahead grace (eyeball)" },
  { q: "Osu Oxford Street Accra", cat: "sparse-highstreet", expect: "GHA", probes: "commercial strip" },
  { q: "Jamestown Accra", cat: "sparse-historic", expect: "GHA", probes: "historic district" },
  { q: "Labadi Beach Hotel Accra", cat: "continental-venue", expect: "GHA", probes: "coastal POI" },
];

type Extracted = {
  name: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  alpha3: string | null;
  lng: number | null;
  lat: number | null;
  featureType: string | null;
  flags: string[];
};

function extract(suggestion: any, feature: any, row: Row): Extracted {
  const props = feature?.properties ?? {};
  const ctx = props.context ?? {};
  const coords = feature?.geometry?.coordinates ?? [];
  const addr = ctx.address ?? {};

  const street =
    addr.name ??
    ([addr.address_number, addr.street_name].filter(Boolean).join(" ").trim() ||
      null);

  const city = ctx.place?.name ?? ctx.locality?.name ?? null;
  const state = ctx.region?.name ?? null;
  const country = ctx.country?.name ?? null;
  const alpha3 = ctx.country?.country_code_alpha_3?.toUpperCase() ?? null;
  const featureType = suggestion?.feature_type ?? props.feature_type ?? null;

  const flags: string[] = [];
  if (row.expect && alpha3 && alpha3 !== row.expect) flags.push(`COUNTRY_MISMATCH(${alpha3}≠${row.expect})`);
  if (!country) flags.push("NO_COUNTRY");
  if (coords.length !== 2) flags.push("NO_COORDS");
  if (city && city.includes(",")) flags.push("CITY_HAS_COMMA");
  if (city && state && city.toLowerCase().includes(state.toLowerCase())) flags.push("CITY_EQUALS_STATE_CONCAT");
  // A non-country input that resolves to a country feature = the BD097 defect.
  if (featureType === "country" && row.cat !== "continental-city") flags.push("RESOLVED_AS_COUNTRY");

  return {
    name: props.name ?? suggestion?.name ?? null,
    street, city, state, country, alpha3,
    lng: coords[0] ?? null, lat: coords[1] ?? null,
    featureType, flags,
  };
}

async function probe(row: Row): Promise<Extracted | { error: string }> {
  const session = crypto.randomUUID();
  const su = new URL(SUGGEST);
  su.searchParams.set("q", row.q);
  su.searchParams.set("language", "en");
  su.searchParams.set("limit", "5");
  su.searchParams.set("session_token", session);
  su.searchParams.set("access_token", TOKEN!);
  if (BIAS_PROXIMITY) su.searchParams.set("proximity", BIAS_PROXIMITY);
  if (BIAS_COUNTRY) su.searchParams.set("country", BIAS_COUNTRY);

  const sRes = await fetch(su);
  if (!sRes.ok) return { error: `suggest ${sRes.status}` };
  const sJson = await sRes.json();
  const top = sJson?.suggestions?.[0];
  if (!top) return { error: "no suggestions" };

  const ru = new URL(`${RETRIEVE}/${top.mapbox_id}`);
  ru.searchParams.set("session_token", session);
  ru.searchParams.set("access_token", TOKEN!);
  const rRes = await fetch(ru);
  if (!rRes.ok) return { error: `retrieve ${rRes.status}` };
  const rJson = await rRes.json();
  const feature = rJson?.features?.[0];
  if (!feature) return { error: "no feature on retrieve" };

  return extract(top, feature, row);
}

function pad(s: string, n: number) { return (s ?? "").slice(0, n).padEnd(n); }

// Wrapped in an async main() (rather than top-level await) so the file runs
// under any tsx/Node invocation regardless of whether esbuild picks the CJS or
// ESM output format — top-level await is only legal in ESM, and the format
// inference is not reliable enough to depend on here. The original Deno harness
// used top-level await, which is always legal under Deno's ESM-by-default model.
async function main(): Promise<void> {
  console.log(`\nBD170 GATE — Mapbox Search quality probe  (bias: ${BIAS_PROXIMITY || "none"} ${BIAS_COUNTRY || ""})\n`);
  console.log(pad("INPUT", 34), pad("CITY", 16), pad("STATE", 16), pad("A3", 4), pad("COORD", 20), "FLAGS");
  console.log("-".repeat(120));

  const results: Array<{ row: Row; ex: Extracted | { error: string } }> = [];
  for (const row of CASES) {
    try {
      const ex = await probe(row);
      results.push({ row, ex });
      if ("error" in ex) {
        console.log(pad(row.q, 34), pad("—", 16), pad("—", 16), pad("—", 4), pad("—", 20), `ERROR: ${ex.error}`);
      } else {
        const coord = ex.lng != null ? `${ex.lng.toFixed(3)},${ex.lat!.toFixed(3)}` : "—";
        console.log(pad(row.q, 34), pad(ex.city ?? "—", 16), pad(ex.state ?? "—", 16), pad(ex.alpha3 ?? "—", 4), pad(coord, 20), ex.flags.join(" ") || "clean");
      }
    } catch (e) {
      results.push({ row, ex: { error: String(e) } });
      console.log(pad(row.q, 34), "EXCEPTION", String(e));
    }
    await new Promise((r) => setTimeout(r, 150)); // be polite to the API
  }

  // Summary by category
  console.log("\n" + "=".repeat(60) + "\nSUMMARY BY CATEGORY\n" + "=".repeat(60));
  const cats = [...new Set(CASES.map((c) => c.cat))];
  for (const cat of cats) {
    const inCat = results.filter((r) => r.row.cat === cat);
    const clean = inCat.filter((r) => !("error" in r.ex) && (r.ex as Extracted).flags.length === 0).length;
    const errored = inCat.filter((r) => "error" in r.ex).length;
    console.log(`${pad(cat, 22)} clean ${clean}/${inCat.length}${errored ? `  (errors: ${errored})` : ""}`);
  }

  // Three distinct outcomes, three exit codes, no overlap:
  //   any case errored        -> UNDETERMINED (exit 2). Nothing was measured, so
  //                              the corruption verdict below would be meaningless.
  //                              A run that measured nothing must never print FAIL.
  //   all resolved, corruption clean -> PASS (exit 0)
  //   all resolved, a corruption case flagged -> FAIL (exit 1)
  const errored = results.filter((r) => "error" in r.ex);
  if (errored.length > 0) {
    const first = errored[0];
    const firstError = (first.ex as { error: string }).error;
    console.log(`\nGATE CHECK — UNDETERMINED ⚠️  (${errored.length}/${results.length} cases errored; nothing was measured)`);
    console.log(`First error: ${first.row.q} — ${firstError}`);
    exit(2);
  }

  const corruption = results.filter((r) => r.row.cat === "corruption");
  const corruptionClean = corruption.every((r) => !("error" in r.ex) && (r.ex as Extracted).flags.length === 0);
  console.log("\nGATE CHECK — zero corruption on failure modes:", corruptionClean ? "PASS ✅" : "FAIL ❌ (see flags above)");
  console.log("Continental + diaspora precision: eyeball the CITY/STATE columns against the table; auto-flags only catch the sharp defects.\n");
  exit(corruptionClean ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  exit(1);
});

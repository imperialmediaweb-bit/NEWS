#!/usr/bin/env node
/**
 * Turn a discovery run into src/config/state-feeds.ts.
 *
 *   node scripts/find-feeds.mjs --all > scripts/feeds-found.json
 *   node scripts/write-state-feeds.mjs scripts/feeds-found.json
 *
 * The config file used to be transcribed from the JSON by hand, which is how
 * it drifted: its own header said it was generated and it was not, so nobody
 * re-ran discovery and seven states sat on a single feed until they stopped
 * producing articles.
 *
 * Feeds already in the config are kept even when a run does not rediscover
 * them. A publisher that answered last month and times out during one probe
 * is still a publisher; dropping it costs a source permanently, while keeping
 * a genuinely dead feed costs one failed request per fetch, which the fetch
 * route already counts and reports. Discovery adds sources here — it does not
 * remove them. Pass --prune to drop the ones a run did not confirm, once you
 * have read the run's output and decided that is what you want.
 */

import { readFileSync, writeFileSync } from "node:fs";

const [input, ...flags] = process.argv.slice(2);
if (!input) {
  console.error("Usage: node scripts/write-state-feeds.mjs <feeds-found.json> [--prune]");
  process.exit(1);
}
const prune = flags.includes("--prune");

const OUT = "src/config/state-feeds.ts";
const discovered = JSON.parse(readFileSync(input, "utf8"));

/** Parse the feeds already in the config, so a run can only add to them. */
function existingFeeds() {
  const text = readFileSync(OUT, "utf8");
  const byState = {};
  const stateRe = /^  "([^"]+)": \[$/gm;
  let match;
  while ((match = stateRe.exec(text))) {
    const state = match[1];
    const rest = text.slice(match.index + match[0].length);
    const block = rest.slice(0, rest.indexOf("\n  ],"));
    byState[state] = [...block.matchAll(
      /\{ url: "([^"]+)", publisher: "([^"]+)", medianChars: (\d+) \}/g
    )].map((m) => ({ url: m[1], publisher: m[2], medianChars: Number(m[3]) }));
  }
  return byState;
}

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const before = prune ? {} : existingFeeds();
const states = {};
let added = 0;
let kept = 0;

for (const run of discovered) {
  const state = titleCase(run.state);
  const found = (run.usable || []).map((u) => ({
    url: u.feed,
    publisher: u.domain,
    medianChars: u.medianChars,
  }));

  const seen = new Set(found.map((f) => f.url.replace(/\/$/, "")));
  const carried = (before[state] || []).filter(
    (f) => !seen.has(f.url.replace(/\/$/, ""))
  );
  kept += carried.length;
  added += found.length;

  states[state] = [...found, ...carried].sort((a, b) => b.medianChars - a.medianChars);
}

// A state the run did not cover keeps whatever it had.
for (const [state, feeds] of Object.entries(before)) {
  if (!states[state]) states[state] = feeds;
}

const total = Object.values(states).reduce((n, f) => n + f.length, 0);
const thin = Object.entries(states)
  .filter(([, f]) => f.length < 3)
  .map(([s, f]) => `${s} (${f.length})`);

const body = Object.keys(states)
  .sort()
  .map((state) => {
    const lines = states[state]
      .map(
        (f) =>
          `    { url: ${JSON.stringify(f.url)}, publisher: ${JSON.stringify(
            f.publisher
          )}, medianChars: ${f.medianChars} },`
      )
      .join("\n");
    return `  ${JSON.stringify(state)}: [\n${lines}\n  ],`;
  })
  .join("\n");

writeFileSync(
  OUT,
  `/**
 * Per-state RSS feeds that actually carry article text.
 *
 * GENERATED — do not edit by hand. Regenerate with:
 *
 *   node scripts/find-feeds.mjs --all > scripts/feeds-found.json
 *   node scripts/write-state-feeds.mjs scripts/feeds-found.json
 *
 * scripts/find-feeds.mjs probes candidate publishers and measures how many
 * characters of article body each feed's items contain. Only feeds averaging
 * 500+ characters are here: below that the model would be filling in rather
 * than reporting, which is how this network came to publish invented quotes
 * attributed to real organisations.
 *
 * This replaces Google News RSS. Google News gives a headline, one sentence,
 * and a link wrapped in an opaque identifier that can no longer be resolved to
 * the publisher's URL — so there was no way to reach the article, and no
 * honest way to write one.
 *
 * How many feeds a state has decides whether it publishes at all. A state with
 * one feed runs dry the moment that publisher has a quiet day, and the
 * pipeline then reports nothing pending and nothing failed — which reads as
 * healthy. Three is the floor worth holding.
 *
 * ${total} feeds across ${Object.keys(states).length} states.${
   thin.length ? `\n * Under three feeds: ${thin.join(", ")}.` : ""
 }
 */

export interface StateFeed {
  url: string;
  publisher: string;
  /** Median characters of article text per item, as measured at discovery. */
  medianChars: number;
}

export const STATE_FEEDS: Record<string, StateFeed[]> = {
${body}
};

/** The feeds for a state, best first. Empty for a state we have none for. */
export function feedsForState(state: string): StateFeed[] {
  return STATE_FEEDS[state] || [];
}
`
);

console.error(`${OUT}: ${total} feeds, ${added} discovered, ${kept} carried over`);
if (thin.length) console.error(`Under three feeds: ${thin.join(", ")}`);

const samples = [
  {
    id: "aster",
    label: "ASTER",
    chain: "BNB Chain / multi-chain",
    title: "Aster",
    risk: 61,
    verdict: "Review before sizing",
    metrics: {
      liquidity: "Depth concentrated",
      holders: "Top wallets elevated",
      unlocks: "Schedule watch",
      social: "Narrative accelerating",
      source: "Mixed public signals",
    },
    numbers: {
      liquidityUsd: 820000,
      volume24h: 430000,
      pairCount: 6,
      priceChange24h: 8.4,
      confidenceScore: 68,
    },
    confidence: {
      score: 68,
      label: "Medium confidence",
      summary: "Prototype identity has enough public structure for a first-pass report.",
      reasons: ["Ticker and project references should be verified against canonical links."],
    },
    findings: [
      ["mid", "Liquidity is active, but the strongest venues are concentrated around a few routing paths."],
      ["high", "Narrative velocity is high enough to make entries sensitive to headline reversals."],
      ["mid", "Team and ecosystem references should be cross-checked against official docs before assuming affiliation."],
      ["low", "There is enough public market structure to build a watchlist rather than rely on social posts."],
    ],
  },
  {
    id: "cloud",
    label: "CLOUD",
    chain: "Solana",
    title: "Cloud",
    risk: 44,
    verdict: "Watch liquidity",
    metrics: {
      liquidity: "DEX depth uneven",
      holders: "Moderate spread",
      unlocks: "No local data",
      social: "Steady mentions",
      source: "Needs source review",
    },
    numbers: {
      liquidityUsd: 390000,
      volume24h: 180000,
      pairCount: 4,
      priceChange24h: 4.1,
      confidenceScore: 61,
    },
    confidence: {
      score: 61,
      label: "Medium confidence",
      summary: "Prototype identity is plausible, but source review remains open.",
      reasons: ["Contract, website, and social links need a canonical match."],
    },
    findings: [
      ["mid", "The first pass should verify contract address, official links, and token distribution."],
      ["mid", "Pool depth needs live monitoring because small withdrawals can change execution quality."],
      ["low", "Social activity looks researchable, but sentiment is not a substitute for tokenomics."],
      ["low", "No immediate critical flag in the prototype profile."],
    ],
  },
  {
    id: "0x",
    label: "0x742d...44e",
    chain: "Ethereum",
    title: "Contract Scan",
    risk: 78,
    verdict: "High-risk until verified",
    metrics: {
      liquidity: "Unknown route",
      holders: "Unverified",
      unlocks: "Unknown",
      social: "No canonical match",
      source: "Contract-first scan",
    },
    numbers: {
      liquidityUsd: 0,
      volume24h: 0,
      pairCount: 0,
      priceChange24h: 0,
      confidenceScore: 24,
    },
    confidence: {
      score: 24,
      label: "Low confidence",
      summary: "Contract identity is not verified in the prototype profile.",
      reasons: ["Explorer verification and canonical project links are required."],
    },
    findings: [
      ["high", "Contract address lacks a verified project identity in this prototype run."],
      ["high", "Unknown holder concentration should block any automated action."],
      ["mid", "Require explorer verification, official website match, and pair creation history."],
      ["mid", "Treat social links as untrusted until linked from the project's canonical domain."],
    ],
  },
];

const defaultScan = samples[0];
const WATCHLIST_KEY = "dyor.watchlist.v1";
const WATCHLIST_LIMIT = 8;

const state = {
  active: defaultScan,
  query: defaultScan.label,
  route: window.location.pathname,
  loading: false,
  error: "",
  routeRequest: "",
  comparison: null,
  watchlist: loadWatchlist(),
  focus: "",
};

const app = document.querySelector("#app");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function rememberReport(report) {
  try {
    window.localStorage?.setItem(`dyor.report.${report.id}`, JSON.stringify(report));
    if (report.snapshot?.id) {
      window.localStorage?.setItem(`dyor.snapshot.${report.snapshot.id}`, JSON.stringify(report));
    }
  } catch {
    // Local report caching is best-effort only.
  }
}

function loadRememberedReport(id) {
  try {
    const raw = window.localStorage?.getItem(`dyor.report.${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadRememberedSnapshot(id) {
  try {
    const raw = window.localStorage?.getItem(`dyor.snapshot.${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function rememberComparison(comparison) {
  try {
    window.localStorage?.setItem(`dyor.compare.${comparison.id}`, JSON.stringify(comparison));
  } catch {
    // Local comparison caching is best-effort only.
  }
}

function loadRememberedComparison(id) {
  try {
    const raw = window.localStorage?.getItem(`dyor.compare.${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadWatchlist() {
  try {
    const raw = window.localStorage?.getItem(WATCHLIST_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items.map(cleanWatchItem).filter(Boolean).slice(0, WATCHLIST_LIMIT) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(items) {
  const next = items.map(cleanWatchItem).filter(Boolean).slice(0, WATCHLIST_LIMIT);
  state.watchlist = next;
  try {
    window.localStorage?.setItem(WATCHLIST_KEY, JSON.stringify(next));
  } catch {
    // Local watchlist storage is best-effort only.
  }
}

function cleanWatchItem(item) {
  if (!item || typeof item !== "object") return null;
  const id = String(item.id || "").slice(0, 120);
  if (!id) return null;

  return {
    id,
    label: String(item.label || id).slice(0, 48),
    title: String(item.title || item.label || id).slice(0, 96),
    chain: String(item.chain || "Unknown chain").slice(0, 64),
    risk: Math.max(0, Math.min(100, Math.round(Number(item.risk) || 0))),
    verdict: String(item.verdict || "Needs review").slice(0, 120),
    query: String(item.query || item.label || id).slice(0, 160),
    path: String(item.path || `/r/${encodeURIComponent(id)}`).slice(0, 240),
    updatedAt: String(item.updatedAt || new Date().toISOString()),
    liquidityUsd: Number(item.liquidityUsd) || 0,
    volume24h: Number(item.volume24h) || 0,
    confidenceScore: Number(item.confidenceScore) || 0,
  };
}

function watchItemFromScan(scan) {
  return cleanWatchItem({
    id: scan.id,
    label: scan.label,
    title: scan.title,
    chain: scan.chain,
    risk: scan.risk,
    verdict: scan.verdict,
    query: scan.links?.baseToken || scan.label || scan.id,
    path: reportPath(scan),
    updatedAt: scan.updatedAt || new Date().toISOString(),
    liquidityUsd: scan.numbers?.liquidityUsd,
    volume24h: scan.numbers?.volume24h,
    confidenceScore: scan.confidence?.score || scan.numbers?.confidenceScore,
  });
}

function isWatchedReport(id) {
  return state.watchlist.some((item) => item.id === id);
}

function addWatchedReport(scan) {
  const item = watchItemFromScan(scan);
  if (!item) return;
  saveWatchlist([item, ...state.watchlist.filter((current) => current.id !== item.id)]);
}

function removeWatchedReport(id) {
  saveWatchlist(state.watchlist.filter((item) => item.id !== id));
}

function refreshWatchedReport(scan) {
  if (scan?.id && isWatchedReport(scan.id)) addWatchedReport(scan);
}

function riskTone(score) {
  if (score >= 70) return "high";
  if (score >= 45) return "mid";
  return "low";
}

function toneColor(tone) {
  return {
    high: "var(--red)",
    mid: "var(--yellow)",
    low: "var(--green)",
  }[tone];
}

function normalizeQuery(value) {
  return String(value || "").trim().toLowerCase();
}

function parseShellInput(value) {
  const query = String(value || "").trim();
  if (!query) return { mode: "empty" };

  const watchCommand = query.match(/^(?:dyor\s+)?\/?watch\s+(.+)$/i);
  if (watchCommand) return { mode: "watch", query: cleanScanQuery(watchCommand[1]) };

  const redFlagsCommand = query.match(/^(?:dyor\s+)?\/?redflags?\s+(.+)$/i);
  if (redFlagsCommand) return { mode: "redflags", query: cleanScanQuery(redFlagsCommand[1]) };

  const scanCommand = query.match(/^(?:dyor\s+)?\/?scan\s+(.+)$/i);
  if (scanCommand) return { mode: "scan", query: cleanScanQuery(scanCommand[1]) };

  const compareCommand = query.match(/^(?:dyor\s+)?\/?compare\s+(.+)$/i);
  if (compareCommand) {
    const pair = parseCompareQuery(compareCommand[1]) || parseCompareWords(compareCommand[1]);
    if (pair) return { mode: "compare", left: pair[0], right: pair[1] };
  }

  const pair = parseCompareQuery(query);
  if (pair) return { mode: "compare", left: pair[0], right: pair[1] };

  return { mode: "scan", query: cleanScanQuery(query) };
}

function parseCompareQuery(value) {
  const query = String(value || "").trim();
  if (!query) return null;
  if (/^https?:\/\//i.test(query)) return null;

  const match =
    query.match(/^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i) ||
    query.match(/^compare\s+(.+?)\s+(?:with|to|against)\s+(.+)$/i) ||
    query.match(/^(.+?)\s*[,/|]\s*(.+)$/);

  if (!match) return null;

  const pair = [cleanCompareToken(match[1]), cleanCompareToken(match[2])];
  return pair[0] && pair[1] ? pair : null;
}

function parseCompareWords(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return [cleanCompareToken(parts[0]), cleanCompareToken(parts.slice(1).join(" "))];
}

function cleanCompareToken(value) {
  return String(value || "")
    .trim()
    .replace(/^\$+/, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function cleanScanQuery(value) {
  return String(value || "")
    .trim()
    .replace(/^\$+/, "")
    .replace(/\s+/g, " ")
    .slice(0, 500);
}

function scanFor(value) {
  const query = normalizeQuery(value);
  if (!query) return state.active;
  if (query.startsWith("0x")) return samples[2];
  return (
    samples.find((sample) => {
      const label = sample.label.toLowerCase();
      const title = sample.title.toLowerCase();
      return label.includes(query) || title.includes(query) || query.includes(label);
    }) || {
      id: query.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scan",
      label: value.toUpperCase(),
      chain: "Unknown chain",
      title: value,
      risk: 67,
      verdict: "Needs source verification",
      metrics: {
        liquidity: "Unknown",
        holders: "Unknown",
        unlocks: "Unknown",
        social: "Unmatched",
        source: "Manual review",
      },
      findings: [
        ["high", "No trusted project identity has been matched yet."],
        ["mid", "Run contract, pool, holder, unlock, and social checks before making assumptions."],
        ["mid", "Require canonical links from the project website and official social accounts."],
        ["low", "Add it to watch mode once the primary contract is verified."],
      ],
    }
  );
}

async function performScan(value, options = {}) {
  if (state.loading) return;

  const input = parseShellInput(value);
  if (input.mode === "empty") return;

  if (input.mode === "compare") {
    await performCompare(input.left, input.right);
    return;
  }

  if (input.mode === "watch") {
    await performScan(input.query, { ...options, addToWatch: true });
    return;
  }

  if (input.mode === "redflags") {
    await performScan(input.query, { ...options, focus: "redflags" });
    return;
  }

  const query = input.query;
  if (!query) return;

  state.query = query;
  state.loading = true;
  state.error = "";
  state.focus = options.focus || "";
  state.comparison = null;
  render();

  try {
    const response = await fetch(`/api/scan?q=${encodeURIComponent(query)}`, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || payload.error || `Scan failed with ${response.status}`);
    }

    const report = await response.json();
    state.active = await persistReport(normalizeScan(report, query));
    state.query = state.active.label || query;
    rememberReport(state.active);
    if (options.addToWatch) {
      addWatchedReport(state.active);
    } else {
      refreshWatchedReport(state.active);
    }
  } catch (error) {
    state.active = scanFor(query);
    state.comparison = null;
    if (options.addToWatch) {
      addWatchedReport(state.active);
    } else {
      refreshWatchedReport(state.active);
    }
    state.error = `Live scan unavailable. Showing prototype profile. ${
      error instanceof Error ? error.message : ""
    }`.trim();
  } finally {
    state.loading = false;
    if (options.replaceReportRoute) {
      window.history.replaceState({}, "", reportPath(state.active));
    }
    render();
  }
}

async function performCompare(leftQuery, rightQuery, options = {}) {
  if (state.loading) return;

  state.query = `${leftQuery} vs ${rightQuery}`;
  state.loading = true;
  state.error = "";
  state.focus = "";
  render();

  try {
    const params = new URLSearchParams({ a: leftQuery, b: rightQuery });
    const response = await fetch(`/api/compare?${params.toString()}`, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || payload.error || `Compare failed with ${response.status}`);
    }

    state.comparison = normalizeComparison(await response.json(), leftQuery, rightQuery);
    state.active = state.comparison.left;
    state.query = state.comparison.label;
    rememberComparison(state.comparison);
    refreshWatchedReport(state.comparison.left);
    refreshWatchedReport(state.comparison.right);
  } catch (error) {
    state.comparison = compareFor(leftQuery, rightQuery);
    state.active = state.comparison.left;
    rememberComparison(state.comparison);
    refreshWatchedReport(state.comparison.left);
    refreshWatchedReport(state.comparison.right);
    state.error = `Live compare unavailable. Showing prototype comparison. ${
      error instanceof Error ? error.message : ""
    }`.trim();
  } finally {
    state.loading = false;
    if (options.replaceCompareRoute && state.comparison) {
      window.history.replaceState({}, "", comparisonPath(state.comparison));
    }
    render();
  }
}

async function refreshWatchlist() {
  if (state.loading || !state.watchlist.length) return;

  const currentItems = state.watchlist.slice(0, WATCHLIST_LIMIT);
  const refreshed = [];
  let failures = 0;

  state.loading = true;
  state.error = "";
  state.comparison = null;
  state.focus = "";
  state.query = "refresh queue";
  render();

  for (const item of currentItems) {
    try {
      const response = await fetch(`/api/scan?q=${encodeURIComponent(item.query || item.label)}`, {
        headers: { accept: "application/json" },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || payload.error || `Scan failed with ${response.status}`);
      }

      const report = await persistReport(normalizeScan(await response.json(), item.query || item.label));
      rememberReport(report);
      refreshed.push(watchItemFromScan(report));
      if (!state.active || state.active.id === item.id) state.active = report;
    } catch {
      failures += 1;
      refreshed.push({
        ...item,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  saveWatchlist(refreshed);
  state.loading = false;
  state.error = failures ? `${failures} watched report${failures === 1 ? "" : "s"} could not refresh. Kept the last local snapshot.` : "";
  render();
}

async function persistReport(report) {
  if (!report.live || report.snapshot?.persisted) return report;

  try {
    const response = await fetch("/api/report", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ report }),
    });

    if (!response.ok) return report;

    const payload = await response.json();
    if (!payload.persisted || !payload.id) return report;

    return {
      ...report,
      snapshot: {
        id: payload.id,
        persisted: true,
        savedAt: payload.savedAt,
        expiresAt: payload.expiresAt,
      },
      shareUrl: payload.url || reportPath({ ...report, snapshot: { id: payload.id, persisted: true } }),
    };
  } catch {
    return report;
  }
}

function normalizeScan(report, query) {
  const fallback = scanFor(query);
  const normalized = {
    ...fallback,
    ...report,
    id: report.id || fallback.id,
    label: report.label || fallback.label,
    title: report.title || fallback.title,
    chain: report.chain || fallback.chain,
    risk: Number.isFinite(Number(report.risk)) ? Number(report.risk) : fallback.risk,
    verdict: report.verdict || fallback.verdict,
    metrics: report.metrics && typeof report.metrics === "object" ? report.metrics : fallback.metrics,
    findings: Array.isArray(report.findings) && report.findings.length ? report.findings : fallback.findings,
    evidence: report.evidence && typeof report.evidence === "object" ? report.evidence : fallback.evidence,
    confidence: report.confidence && typeof report.confidence === "object" ? report.confidence : fallback.confidence,
    redFlags: Array.isArray(report.redFlags) && report.redFlags.length ? report.redFlags : fallback.redFlags,
    watch: Array.isArray(report.watch) ? report.watch : fallback.watch,
    alternatives: Array.isArray(report.alternatives) ? report.alternatives : fallback.alternatives,
    links: report.links && typeof report.links === "object" ? report.links : fallback.links,
    numbers: report.numbers && typeof report.numbers === "object" ? report.numbers : fallback.numbers,
  };

  normalized.redFlags = Array.isArray(normalized.redFlags) && normalized.redFlags.length ? normalized.redFlags : deriveRedFlags(normalized);
  return normalized;
}

function deriveRedFlags(scan) {
  const rows = [];
  const confidenceScore = numeric(scan.confidence?.score ?? scan.numbers?.confidenceScore);
  const liquidityUsd = numeric(scan.numbers?.liquidityUsd);
  const pairCount = numeric(scan.numbers?.pairCount);
  const priceChange24h = numeric(scan.numbers?.priceChange24h);

  if (confidenceScore && confidenceScore < 55) {
    rows.push({
      tone: "high",
      label: "Weak identity confidence",
      detail: scan.confidence?.summary || "Selected identity is not strongly supported.",
      action: "Verify contract, official domain, and social links before sharing.",
    });
  } else if (confidenceScore && confidenceScore < 78) {
    rows.push({
      tone: "mid",
      label: "Identity still needs checks",
      detail: scan.confidence?.summary || "Selected identity is plausible but incomplete.",
      action: "Cross-check source links against the selected token contract.",
    });
  }

  if (liquidityUsd > 0 && liquidityUsd < 50_000) {
    rows.push({
      tone: "high",
      label: "Thin liquidity",
      detail: `Matched liquidity is ${formatMoney(liquidityUsd)}.`,
      action: "Treat execution quality as fragile until deeper pools are confirmed.",
    });
  } else if (liquidityUsd > 0 && liquidityUsd < 250_000) {
    rows.push({
      tone: "mid",
      label: "Shallow liquidity",
      detail: `Matched liquidity is ${formatMoney(liquidityUsd)}.`,
      action: "Watch route depth and pool withdrawals.",
    });
  }

  if (Math.abs(priceChange24h) >= 35) {
    rows.push({
      tone: "high",
      label: "Large 24h move",
      detail: `24h price moved ${priceChange24h.toFixed(2)}%.`,
      action: "Find the catalyst and review liquidity before trusting the current print.",
    });
  } else if (Math.abs(priceChange24h) >= 12) {
    rows.push({
      tone: "mid",
      label: "Elevated 24h move",
      detail: `24h price moved ${priceChange24h.toFixed(2)}%.`,
      action: "Compare the move with news, social velocity, and pool changes.",
    });
  }

  if (pairCount > 0 && pairCount <= 1) {
    rows.push({
      tone: "mid",
      label: "Single-pool market",
      detail: "Only one matched pool supports this market identity.",
      action: "Confirm pair age, deployer history, and broader venue coverage.",
    });
  }

  const unresolvedFindings = (Array.isArray(scan.findings) ? scan.findings : [])
    .filter(([tone]) => tone === "high" || tone === "mid")
    .slice(0, 2);
  unresolvedFindings.forEach(([tone, text]) => {
    rows.push({
      tone,
      label: tone === "high" ? "High-severity finding" : "Open finding",
      detail: text,
      action: "Resolve this before treating the report as complete.",
    });
  });

  rows.push({
    tone: "mid",
    label: "Supply checks pending",
    detail: "Holder concentration, unlock schedule, and treasury wallet checks are not connected in this build.",
    action: "Use this as an unresolved supply-side checklist item.",
  });

  const seen = new Set();
  return rows
    .filter((item) => {
      const key = `${item.label}:${item.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 7);
}

function normalizeComparison(payload, leftQuery, rightQuery) {
  const left = normalizeScan(payload.left || {}, leftQuery);
  const right = normalizeScan(payload.right || {}, rightQuery);
  return {
    id: payload.id || `compare-${left.id}-vs-${right.id}`,
    kind: "compare",
    label: payload.label || `${left.label} vs ${right.label}`,
    title: payload.title || `${left.title} vs ${right.title}`,
    verdict: payload.verdict || compareVerdict(left, right),
    summary: payload.summary || compareSummary(left, right),
    source: payload.source || "Dexscreener",
    updatedAt: payload.updatedAt || new Date().toISOString(),
    scores: payload.scores && typeof payload.scores === "object" ? payload.scores : compareScores(left, right),
    left,
    right,
    deltas: Array.isArray(payload.deltas) && payload.deltas.length ? payload.deltas : compareDeltas(left, right),
    findings: Array.isArray(payload.findings) ? payload.findings : [],
  };
}

function compareFor(leftQuery, rightQuery) {
  const left = scanFor(leftQuery);
  const right = scanFor(rightQuery);
  return normalizeComparison(
    {
      id: `compare-${left.id}-vs-${right.id}`,
      label: `${left.label} vs ${right.label}`,
      verdict: compareVerdict(left, right),
      summary: compareSummary(left, right),
      source: "Prototype",
      scores: compareScores(left, right),
      left,
      right,
      deltas: compareDeltas(left, right),
      findings: [
        ["mid", "Prototype comparison uses local sample profiles while the live compare API is unavailable."],
        ["mid", "Run the live scan again before using any conclusion outside this shell."],
      ],
    },
    leftQuery,
    rightQuery,
  );
}

function compareScores(left, right) {
  const leftScore = comparisonScore(left);
  const rightScore = comparisonScore(right);
  const delta = Math.round((leftScore - rightScore) * 10) / 10;
  return {
    left: leftScore,
    right: rightScore,
    delta,
    leader: Math.abs(delta) < 4 ? "neutral" : delta > 0 ? "left" : "right",
  };
}

function comparisonScore(scan) {
  const liquidity = numeric(scan.numbers?.liquidityUsd);
  const pairCount = numeric(scan.numbers?.pairCount);
  const confidence = numeric(scan.confidence?.score || scan.numbers?.confidenceScore);
  const liquidityScore = Math.min(20, Math.log10(liquidity + 1) * 2.8);
  return Math.round(Math.max(0, Math.min(100, (100 - numeric(scan.risk)) * 0.58 + confidence * 0.28 + liquidityScore + Math.min(8, pairCount))) * 10) / 10;
}

function compareVerdict(left, right) {
  const scores = compareScores(left, right);
  if (scores.leader === "neutral") return "No clear research edge";
  return `${scores.leader === "left" ? left.label : right.label} has the cleaner first-pass profile`;
}

function compareSummary(left, right) {
  const scores = compareScores(left, right);
  if (scores.leader === "neutral") {
    return `${left.label} and ${right.label} are close on first-pass evidence. Compare the report details before forming a view.`;
  }
  const leader = scores.leader === "left" ? left : right;
  return `${leader.label} leads on the composite research score. Verify contract identity, source links, and missing off-chain data before relying on ticker-level conclusions.`;
}

function compareDeltas(left, right) {
  return [
    compareDelta("Risk score", left.risk, right.risk, "lower"),
    compareDelta("Identity confidence", left.confidence?.score || left.numbers?.confidenceScore, right.confidence?.score || right.numbers?.confidenceScore, "higher"),
    compareDelta("Liquidity", left.numbers?.liquidityUsd, right.numbers?.liquidityUsd, "higher", formatMoney),
    compareDelta("24h volume", left.numbers?.volume24h, right.numbers?.volume24h, "context", formatMoney),
    compareDelta("Market coverage", left.numbers?.pairCount, right.numbers?.pairCount, "higher", (value) => `${numeric(value)} pool${numeric(value) === 1 ? "" : "s"}`),
  ];
}

function compareDelta(label, leftValue, rightValue, bias, formatter = (value) => String(Math.round(numeric(value)))) {
  const left = numeric(leftValue);
  const right = numeric(rightValue);
  const diff = bias === "lower" ? right - left : left - right;
  return {
    label,
    left: formatter(left),
    right: formatter(right),
    bias,
    leader: Math.abs(diff) < 1 ? "neutral" : diff > 0 ? "left" : "right",
    delta: Math.round(diff * 100) / 100,
  };
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  const amount = numeric(value);
  if (!amount) return "$0";
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: amount < 10_000 ? 2 : 1,
  }).format(amount)}`;
}

function navigate(path) {
  window.history.pushState({}, "", path);
  state.route = path;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function reportPath(scan) {
  const query = scan.links?.baseToken || scan.label || "";
  const params = new URLSearchParams();
  if (scan.snapshot?.persisted && scan.snapshot.id) params.set("s", scan.snapshot.id);
  if (query) params.set("q", query);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return `/r/${encodeURIComponent(scan.id)}${suffix}`;
}

function comparisonPath(comparison) {
  const params = new URLSearchParams();
  const left = comparison.left?.links?.baseToken || comparison.left?.label || "";
  const right = comparison.right?.links?.baseToken || comparison.right?.label || "";
  if (left) params.set("a", left);
  if (right) params.set("b", right);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return `/c/${encodeURIComponent(comparison.id || "compare")}${suffix}`;
}

function header() {
  return `
    <header class="topbar">
      <a class="brand" href="/" data-link aria-label="AI-Native Research Shell home">
        <span class="brand-mark" aria-hidden="true">🔍</span>
        <span>
          <strong>AI-Native Research Shell</strong>
        </span>
      </a>
      <nav class="nav" aria-label="Primary">
        <a class="nav-icon" href="https://github.com/jerrywang33/dyor" target="_blank" rel="noreferrer" aria-label="GitHub">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.1c-3.34.73-4.04-1.41-4.04-1.41-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.48.99.11-.77.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.93c1.02.01 2.04.14 3 .41 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"/>
          </svg>
        </a>
        <a class="nav-icon nav-x" href="https://x.com/jerrydev90" target="_blank" rel="noreferrer" aria-label="Built by Jerry on X">
          <span aria-hidden="true">X</span>
        </a>
      </nav>
    </header>
  `;
}

function footer() {
  return `
    <footer class="footer">
      <span>AI-Native research shell for token due diligence. Not financial advice.</span>
      <a href="/docs" data-link>Methodology</a>
    </footer>
  `;
}

function consoleLines(scan) {
  const key = escapeHtml(scan.label);
  const lines = [
    `<p><em>$</em> <b>dyor</b> scan <i>${key}</i></p>`,
    `<p><em>></em> resolving project identity: ${escapeHtml(scan.title)}</p>`,
    `<p><em>></em> chain context: ${escapeHtml(scan.chain)}</p>`,
    `<p><em>></em> ${scan.live ? "fetching live DEX pairs and liquidity" : "checking pools, holders, unlocks, social velocity"}</p>`,
    `<p><em>></em> mapping risk factors to evidence buckets</p>`,
    `<p><em>></em> verdict: <i>${escapeHtml(scan.verdict)}</i></p>`,
    `<p><em>></em> report: /r/${escapeHtml(scan.id)}</p>`,
  ];

  if (scan.live) {
    lines.splice(
      5,
      0,
      `<p><em>></em> source: <i>${escapeHtml(scan.source || "Live data")}</i></p>`,
    );
  }

  return lines.join("");
}

function comparisonConsoleLines(comparison) {
  const left = comparison.left;
  const right = comparison.right;
  const leader = comparison.scores?.leader === "left" ? left : comparison.scores?.leader === "right" ? right : null;
  return [
    `<p><em>$</em> <b>dyor</b> compare <i>${escapeHtml(left.label)}</i> <i>${escapeHtml(right.label)}</i></p>`,
    `<p><em>></em> resolving both token identities and market sets</p>`,
    `<p><em>></em> ${escapeHtml(left.label)}: ${escapeHtml(left.chain)} · risk ${escapeHtml(left.risk)}</p>`,
    `<p><em>></em> ${escapeHtml(right.label)}: ${escapeHtml(right.chain)} · risk ${escapeHtml(right.risk)}</p>`,
    `<p><em>></em> comparing risk, identity confidence, liquidity, volume, and market coverage</p>`,
    `<p><em>></em> verdict: <i>${escapeHtml(comparison.verdict)}</i></p>`,
    `<p><em>></em> ${leader ? `research edge: ${escapeHtml(leader.label)}` : "research edge: no clear leader"}</p>`,
  ].join("");
}

function metricRows(scan) {
  return Object.entries(scan.metrics)
    .map(
      ([label, value]) => `
        <div class="metric">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `
    )
    .join("");
}

function formatUpdatedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelize(value) {
  const labels = {
    baseToken: "Base token",
    dexscreener: "Dexscreener",
    docs: "Docs",
    explorer: "Explorer",
    pairExplorer: "Pair Explorer",
    x: "X",
  };
  return (
    labels[value] ||
    String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function sourceLinks(scan, limit = 5) {
  const evidenceLinks = Array.isArray(scan.evidence?.links) ? scan.evidence.links : [];
  const links = [
    ...evidenceLinks.map((item) => ({ label: item.label, url: item.url })),
    ...Object.entries(scan.links || {}).map(([label, url]) => ({ label: labelize(label), url })),
  ];
  const seen = new Set();

  return links
    .map((link) => ({ label: labelize(link.label), url: safeExternalUrl(link.url) }))
    .filter((link) => {
      if (!link.url || seen.has(link.url)) return false;
      seen.add(link.url);
      return true;
    })
    .slice(0, limit);
}

function sourceLinkButtons(scan, limit = 4) {
  const links = sourceLinks(scan, limit);
  if (!links.length) return "";

  return `
    <div class="source-links" aria-label="Evidence links">
      ${links
        .map(
          (link) => `
            <a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>
          `,
        )
        .join("")}
    </div>
  `;
}

function watchButton(scan) {
  const watched = isWatchedReport(scan.id);
  return `
    <button class="ghost-btn watch-btn ${watched ? "watching" : ""}" type="button" data-toggle-watch="${escapeHtml(scan.id)}">
      ${watched ? "Watching" : "Watch"}
    </button>
  `;
}

function plainText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function markdownText(value) {
  return plainText(value).replace(/[\\`*_{}[\]()#+.!|>-]/g, "\\$&");
}

function markdownUrl(value) {
  const url = safeExternalUrl(value);
  return url ? url.replace(/[)\s]/g, encodeURIComponent) : "";
}

function markdownLink(label, url) {
  const cleanUrl = markdownUrl(url);
  return cleanUrl ? `[${markdownText(label)}](${cleanUrl})` : markdownText(label);
}

function markdownMetricRows(metrics = {}) {
  return Object.entries(metrics)
    .map(([label, value]) => `- ${markdownText(label)}: ${markdownText(value)}`)
    .join("\n");
}

function markdownFindings(findings = []) {
  return findings
    .map(([tone, text]) => `- ${markdownText(tone || "note")}: ${markdownText(text)}`)
    .join("\n");
}

function markdownEvidence(scan) {
  const evidence = scan.evidence || {};
  const groups = [
    ["Identity", evidence.identity],
    ["Market", evidence.market],
  ];

  return groups
    .filter(([, rows]) => Array.isArray(rows) && rows.length)
    .map(([title, rows]) => {
      const body = rows.map(([label, value]) => `- ${markdownText(label)}: ${markdownText(value)}`).join("\n");
      return `### ${markdownText(title)}\n${body}`;
    })
    .join("\n\n");
}

function markdownWatch(scan) {
  const watch = Array.isArray(scan.watch) ? scan.watch : [];
  return watch
    .map((item) => {
      const value = item.value ? ` (${markdownText(item.value)})` : "";
      return `- ${markdownText(item.label || "Trigger")}${value}: ${markdownText(item.detail || "")}`;
    })
    .join("\n");
}

function markdownRedFlags(scan) {
  const redFlags = Array.isArray(scan.redFlags) ? scan.redFlags : deriveRedFlags(scan);
  return redFlags
    .map((item) => {
      const action = item.action ? ` Action: ${markdownText(item.action)}` : "";
      return `- ${markdownText(item.tone || "mid")}: ${markdownText(item.label || "Red flag")} - ${markdownText(item.detail || "")}${action}`;
    })
    .join("\n");
}

function markdownSourceLinks(scan, limit = 8) {
  return sourceLinks(scan, limit)
    .map((link) => `- ${markdownLink(link.label, link.url)}`)
    .join("\n");
}

function reportMarkdown(scan) {
  const parts = [
    `# DYOR Report: ${markdownText(scan.title || scan.label)}`,
    [
      `- Token: ${markdownText(scan.label)}`,
      `- Chain: ${markdownText(scan.chain)}`,
      `- Risk score: ${markdownText(scan.risk)}`,
      `- Verdict: ${markdownText(scan.verdict)}`,
      scan.source ? `- Source: ${markdownText(scan.source)}` : "",
      scan.updatedAt ? `- Updated: ${markdownText(formatUpdatedAt(scan.updatedAt))}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    `## Metrics\n${markdownMetricRows(scan.metrics)}`,
  ];

  const redFlags = markdownRedFlags(scan);
  if (redFlags) parts.push(`## Red Flags\n${redFlags}`);

  const evidence = markdownEvidence(scan);
  if (evidence) parts.push(`## Evidence\n${evidence}`);

  if (scan.confidence) {
    const reasons = Array.isArray(scan.confidence.reasons)
      ? scan.confidence.reasons.map((reason) => `- ${markdownText(reason)}`).join("\n")
      : "";
    parts.push(
      [
        "## Research Quality",
        `- Confidence: ${markdownText(scan.confidence.score ?? "?")} / 100`,
        `- Label: ${markdownText(scan.confidence.label || "Identity confidence")}`,
        `- Summary: ${markdownText(scan.confidence.summary || "")}`,
        reasons ? `### Confidence Reasons\n${reasons}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const watch = markdownWatch(scan);
  if (watch) parts.push(`## Watch Triggers\n${watch}`);

  if (Array.isArray(scan.findings) && scan.findings.length) {
    parts.push(`## Findings\n${markdownFindings(scan.findings)}`);
  }

  const links = markdownSourceLinks(scan);
  if (links) parts.push(`## Sources\n${links}`);

  parts.push("Not financial advice. Generated by dyor.sh.");
  return `${parts.filter(Boolean).join("\n\n")}\n`;
}

function comparisonMarkdown(comparison) {
  const deltas = Array.isArray(comparison.deltas)
    ? comparison.deltas
        .map(
          (item) =>
            `- ${markdownText(item.label)}: ${markdownText(comparison.left.label)} ${markdownText(item.left)} / ${markdownText(comparison.right.label)} ${markdownText(item.right)} - edge: ${markdownText(deltaLeaderLabel(item, comparison))}`,
        )
        .join("\n")
    : "";
  const findings = Array.isArray(comparison.findings) ? markdownFindings(comparison.findings) : "";

  const parts = [
    `# DYOR Compare: ${markdownText(comparison.title || comparison.label)}`,
    [
      `- Verdict: ${markdownText(comparison.verdict)}`,
      `- Summary: ${markdownText(comparison.summary)}`,
      comparison.source ? `- Source: ${markdownText(comparison.source)}` : "",
      comparison.updatedAt ? `- Updated: ${markdownText(formatUpdatedAt(comparison.updatedAt))}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    [
      "## Scores",
      `- ${markdownText(comparison.left.label)}: ${markdownText(comparison.scores?.left ?? comparisonScore(comparison.left))}`,
      `- ${markdownText(comparison.right.label)}: ${markdownText(comparison.scores?.right ?? comparisonScore(comparison.right))}`,
      `- Leader: ${markdownText(comparison.scores?.leader === "left" ? comparison.left.label : comparison.scores?.leader === "right" ? comparison.right.label : "Even")}`,
    ].join("\n"),
  ];

  if (deltas) parts.push(`## Deltas\n${deltas}`);
  if (findings) parts.push(`## Findings\n${findings}`);

  parts.push(
    [
      `## ${markdownText(comparison.left.label)} Snapshot`,
      `- Chain: ${markdownText(comparison.left.chain)}`,
      `- Risk score: ${markdownText(comparison.left.risk)}`,
      `- Liquidity: ${markdownText(formatMoney(comparison.left.numbers?.liquidityUsd))}`,
      `- Sources: ${sourceLinks(comparison.left, 4).map((link) => markdownLink(link.label, link.url)).join(", ") || "None"}`,
    ].join("\n"),
  );
  parts.push(
    [
      `## ${markdownText(comparison.right.label)} Snapshot`,
      `- Chain: ${markdownText(comparison.right.chain)}`,
      `- Risk score: ${markdownText(comparison.right.risk)}`,
      `- Liquidity: ${markdownText(formatMoney(comparison.right.numbers?.liquidityUsd))}`,
      `- Sources: ${sourceLinks(comparison.right, 4).map((link) => markdownLink(link.label, link.url)).join(", ") || "None"}`,
    ].join("\n"),
  );
  parts.push("Not financial advice. Generated by dyor.sh.");
  return `${parts.filter(Boolean).join("\n\n")}\n`;
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    if (button) {
      const previous = button.textContent;
      button.textContent = "Copied";
      button.classList.add("copied");
      window.setTimeout(() => {
        button.textContent = previous || "Copy brief";
        button.classList.remove("copied");
      }, 1200);
    }
  } catch {
    if (button) button.textContent = "Copy failed";
  }
}

function comparisonGrid(comparison) {
  return `
    <div class="report-grid compare-report-grid">
      <div class="console" aria-live="polite">${comparisonConsoleLines(comparison)}</div>
      <aside class="risk-panel compare-panel">
        <div class="section-head">
          <span class="kicker">Compare</span>
          ${comparison.updatedAt ? `<small>${escapeHtml(formatUpdatedAt(comparison.updatedAt))}</small>` : ""}
        </div>
        <h3>${escapeHtml(comparison.verdict)}</h3>
        <p>${escapeHtml(comparison.summary)}</p>
        <div class="compare-scores">
          ${scorePill(comparison.left, comparison.scores?.left, "left", comparison.scores?.leader)}
          ${scorePill(comparison.right, comparison.scores?.right, "right", comparison.scores?.leader)}
        </div>
        <div class="compare-actions">
          <button class="ghost-btn" type="button" data-open-compare="${escapeHtml(comparisonPath(comparison))}">Compare page</button>
          <button class="ghost-btn" type="button" data-copy-compare="${escapeHtml(comparison.id)}">Copy brief</button>
          <button class="ghost-btn" type="button" data-open-report="${escapeHtml(reportPath(comparison.left))}">${escapeHtml(comparison.left.label)} report</button>
          <button class="ghost-btn" type="button" data-open-report="${escapeHtml(reportPath(comparison.right))}">${escapeHtml(comparison.right.label)} report</button>
        </div>
      </aside>
    </div>
    <div class="compare-detail">
      <div class="compare-assets">
        ${compareAssetCard(comparison.left, comparison.scores?.left, "left", comparison.scores?.leader)}
        ${compareAssetCard(comparison.right, comparison.scores?.right, "right", comparison.scores?.leader)}
      </div>
      ${compareDeltaTable(comparison)}
    </div>
  `;
}

function scorePill(scan, score, side, leader) {
  return `
    <div class="score-pill ${leader === side ? "active" : ""}">
      <span>${escapeHtml(scan.label)}</span>
      <strong>${escapeHtml(score ?? comparisonScore(scan))}</strong>
    </div>
  `;
}

function compareAssetCard(scan, score, side, leader) {
  const tone = riskTone(scan.risk);
  return `
    <article class="compare-card ${leader === side ? "active" : ""}">
      <div class="compare-card-head">
        <div>
          <span>${escapeHtml(scan.chain)}</span>
          <strong>${escapeHtml(scan.title)}</strong>
        </div>
        <div class="score ${tone}" style="--score: ${escapeHtml(scan.risk)}">
          <span>${escapeHtml(scan.risk)}</span>
        </div>
      </div>
      <div class="compare-card-meta">
        <span>Composite <strong>${escapeHtml(score ?? comparisonScore(scan))}</strong></span>
        <span>Confidence <strong>${escapeHtml(scan.confidence?.score ?? scan.numbers?.confidenceScore ?? "?")}</strong></span>
        <span>Liquidity <strong>${escapeHtml(formatMoney(scan.numbers?.liquidityUsd))}</strong></span>
      </div>
      <p>${escapeHtml(scan.verdict)}</p>
      ${sourceLinkButtons(scan, 3)}
    </article>
  `;
}

function compareDeltaTable(comparison) {
  const deltas = Array.isArray(comparison.deltas) ? comparison.deltas : [];
  if (!deltas.length) return "";

  return `
    <div class="compare-deltas">
      <div class="compare-delta-head">
        <span>Signal</span>
        <span>${escapeHtml(comparison.left.label)}</span>
        <span>${escapeHtml(comparison.right.label)}</span>
        <span>Edge</span>
      </div>
      ${deltas
        .map(
          (item) => `
            <div class="compare-delta-row ${escapeHtml(item.leader || "neutral")}">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.left)}</strong>
              <strong>${escapeHtml(item.right)}</strong>
              <em>${escapeHtml(deltaLeaderLabel(item, comparison))}</em>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function deltaLeaderLabel(item, comparison) {
  if (item.leader === "left") return comparison.left.label;
  if (item.leader === "right") return comparison.right.label;
  return item.bias === "context" ? "Context" : "Even";
}

function redFlagsBlock(scan, compact = false) {
  const redFlags = Array.isArray(scan.redFlags) && scan.redFlags.length ? scan.redFlags : deriveRedFlags(scan);
  if (!redFlags.length) return "";

  return `
    <section class="redflag-panel ${state.focus === "redflags" ? "focused" : ""} ${compact ? "compact" : ""}">
      <div class="section-head">
        <span class="kicker">Red Flags</span>
        <small>${state.focus === "redflags" ? "Focus mode" : `${redFlags.length} open check${redFlags.length === 1 ? "" : "s"}`}</small>
      </div>
      <div class="redflag-list">
        ${redFlags
          .map(
            (item) => `
              <article class="redflag-item ${escapeHtml(item.tone || "mid")}">
                <div>
                  <strong>${escapeHtml(item.label || "Open risk")}</strong>
                  <span>${escapeHtml(item.detail || "")}</span>
                </div>
                ${item.action ? `<em>${escapeHtml(item.action)}</em>` : ""}
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function evidenceBlock(scan) {
  const evidence = scan.evidence;
  if (!evidence) return "";

  const groups = [
    ["Identity", evidence.identity],
    ["Market", evidence.market],
  ]
    .filter(([, rows]) => Array.isArray(rows) && rows.length)
    .map(
      ([title, rows]) => `
        <div class="evidence-group">
          <h3>${escapeHtml(title)}</h3>
          ${rows
            .map(
              ([label, value]) => `
                <div class="evidence-row">
                  <span>${escapeHtml(label)}</span>
                  <strong>${escapeHtml(value)}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
      `,
    )
    .join("");

  if (!groups && !sourceLinks(scan).length) return "";

  return `
    <section class="evidence-panel">
      <div class="section-head">
        <span class="kicker">Evidence</span>
        ${scan.updatedAt ? `<small>Updated ${escapeHtml(formatUpdatedAt(scan.updatedAt))}</small>` : ""}
      </div>
      <div class="evidence-grid">${groups}</div>
      ${sourceLinkButtons(scan, 6)}
    </section>
  `;
}

function researchQualityBlock(scan) {
  const hasConfidence = scan.confidence && typeof scan.confidence === "object";
  const watch = Array.isArray(scan.watch) ? scan.watch : [];
  const alternatives = Array.isArray(scan.alternatives) ? scan.alternatives : [];

  if (!hasConfidence && !watch.length && !alternatives.length) return "";

  return `
    <section class="quality-panel">
      <div class="section-head">
        <span class="kicker">Research Quality</span>
        ${hasConfidence ? `<small>${escapeHtml(scan.confidence.label || "Identity confidence")}</small>` : ""}
      </div>
      <div class="quality-grid">
        ${
          hasConfidence
            ? `
              <article class="quality-card confidence-card">
                <div class="quality-score">${escapeHtml(scan.confidence.score ?? "?")}</div>
                <div>
                  <h3>${escapeHtml(scan.confidence.label || "Identity confidence")}</h3>
                  <p>${escapeHtml(scan.confidence.summary || "")}</p>
                </div>
              </article>
            `
            : ""
        }
        ${watchBlock(watch)}
        ${alternativesBlock(alternatives)}
      </div>
      ${confidenceReasons(scan.confidence)}
    </section>
  `;
}

function watchBlock(items) {
  if (!items.length) return "";

  return `
    <article class="quality-card list-card">
      <h3>Watch Triggers</h3>
      <div class="watch-list">
        ${items
          .map(
            (item) => `
              <div class="watch-row" style="--tone: ${toneColor(item.tone || "mid")}">
                <div>
                  <strong>${escapeHtml(item.label || "Trigger")}</strong>
                  <span>${escapeHtml(item.detail || "")}</span>
                </div>
                <em>${escapeHtml(item.value || "")}</em>
              </div>
            `,
          )
          .join("")}
      </div>
    </article>
  `;
}

function alternativesBlock(items) {
  if (!items.length) return "";

  return `
    <article class="quality-card list-card">
      <h3>Other Matches</h3>
      <div class="alt-list">
        ${items
          .map(
            (item) => `
              <a class="alt-row" href="${escapeHtml(safeExternalUrl(item.url) || "#")}" target="_blank" rel="noreferrer">
                <span>
                  <strong>${escapeHtml(item.label || "Token")}</strong>
                  <small>${escapeHtml(item.title || "")} · ${escapeHtml(item.chain || "Unknown chain")}</small>
                </span>
                <em>${escapeHtml(item.liquidity || "")}</em>
              </a>
            `,
          )
          .join("")}
      </div>
    </article>
  `;
}

function confidenceReasons(confidence) {
  const reasons = Array.isArray(confidence?.reasons) ? confidence.reasons : [];
  if (!reasons.length) return "";

  return `
    <div class="confidence-reasons">
      ${reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}
    </div>
  `;
}

function scanPanel() {
  const scan = state.active;
  const comparison = state.comparison;
  const tone = riskTone(scan.risk);
  const sourceLabel = comparison
    ? `compare via ${comparison.source || "market API"}`
    : scan.live
      ? `live via ${scan.source || "market API"}`
      : "prototype profile";
  return `
    <div class="terminal ${state.loading ? "loading" : ""}">
      <div class="terminal-top">
        <span class="terminal-dot"></span>
        <span class="terminal-dot"></span>
        <span class="terminal-dot"></span>
        <small>dyor.sh agent console · ${escapeHtml(sourceLabel)}</small>
      </div>
      <form class="scan-shell" data-scan-form>
        <label>
          <span class="prompt">$</span>
          <input
            name="query"
            value="${escapeHtml(state.query)}"
            autocomplete="off"
            spellcheck="false"
            aria-label="Token, contract, or project"
            ${state.loading ? "disabled" : ""}
          />
        </label>
        <button class="primary-btn" type="submit" ${state.loading ? "disabled" : ""}>
          ${state.loading ? "Scanning" : "Scan"}
        </button>
      </form>
      <div class="sample-row">
        ${samples
          .map(
            (sample) =>
              `<button class="chip" type="button" data-sample="${sample.label}" ${state.loading ? "disabled" : ""}>${sample.label}</button>`,
          )
          .join("")}
        <button class="chip chip-compare" type="button" data-sample="ASTER vs CLOUD" ${state.loading ? "disabled" : ""}>ASTER vs CLOUD</button>
        <button class="chip chip-watch" type="button" data-sample="/watch ASTER" ${state.loading ? "disabled" : ""}>/watch ASTER</button>
        <button class="chip chip-redflags" type="button" data-sample="/redflags ASTER" ${state.loading ? "disabled" : ""}>/redflags ASTER</button>
      </div>
      ${state.error ? `<div class="scan-error">${escapeHtml(state.error)}</div>` : ""}
      ${
        comparison
          ? comparisonGrid(comparison)
          : `
            <div class="report-grid">
              <div class="console" aria-live="polite">${consoleLines(scan)}</div>
              <aside class="risk-panel">
                <div class="risk-head">
                  <div>
                    <span>Risk Score</span>
                    <strong>${escapeHtml(scan.verdict)}</strong>
                  </div>
                  <div class="score ${tone}" style="--score: ${scan.risk}">
                    <span>${scan.risk}</span>
                  </div>
                </div>
                <div class="metric-list">${metricRows(scan)}</div>
                ${
                  scan.updatedAt
                    ? `<div class="scan-freshness">Updated ${escapeHtml(formatUpdatedAt(scan.updatedAt))}</div>`
                    : ""
                }
                ${sourceLinkButtons(scan)}
                <div class="panel-actions">
                  <button class="ghost-btn" type="button" data-open-report="${escapeHtml(reportPath(scan))}">Open report</button>
                  <button class="ghost-btn" type="button" data-copy-report="${escapeHtml(scan.id)}">Copy brief</button>
                  ${watchButton(scan)}
                </div>
              </aside>
            </div>
            ${state.focus === "redflags" ? redFlagsBlock(scan, true) : ""}
          `
      }
    </div>
  `;
}

function watchlistBlock() {
  const items = state.watchlist;
  const active = state.comparison ? state.comparison.left : state.active;

  return `
    <section class="split watchlist-section">
      <div>
        <span class="kicker">Research Queue</span>
        <h2>Pin live reports into a local watch lane.</h2>
        <p>
          Keep the tokens you are still investigating in one place. The queue stores only in this browser and refreshes when a watched report is scanned again.
        </p>
        <div class="watchlist-actions">
          ${active ? watchButton(active) : ""}
          <button class="ghost-btn refresh-btn" type="button" data-refresh-watchlist ${!items.length || state.loading ? "disabled" : ""}>
            ${state.loading ? "Refreshing" : "Refresh queue"}
          </button>
        </div>
      </div>
      <div class="watchlist-panel">
        <div class="watchlist-head">
          <span>${items.length ? `${items.length} watched` : "No watched reports"}</span>
          <small>Local browser queue</small>
        </div>
        ${
          items.length
            ? `
              <div class="watchlist-items">
                ${items.map(watchlistRow).join("")}
              </div>
            `
            : `
              <div class="watchlist-empty">
                <strong>No pinned research yet.</strong>
                <span>Run a scan, then press Watch to keep it in this queue.</span>
              </div>
            `
        }
      </div>
    </section>
  `;
}

function watchlistRow(item) {
  const tone = riskTone(item.risk);
  return `
    <article class="watch-item">
      <div class="watch-main">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.title)} · ${escapeHtml(item.chain)}</span>
      </div>
      <div class="watch-metrics">
        <span class="mini-risk ${tone}">${escapeHtml(item.risk)}</span>
        <span>Liquidity <strong>${escapeHtml(formatMoney(item.liquidityUsd))}</strong></span>
        <span>Confidence <strong>${escapeHtml(item.confidenceScore || "?")}</strong></span>
      </div>
      <div class="watch-meta">
        <span>${escapeHtml(item.verdict)}</span>
        <small>${escapeHtml(formatUpdatedAt(item.updatedAt))}</small>
      </div>
      <div class="watch-row-actions">
        <button class="ghost-btn" type="button" data-open-report="${escapeHtml(item.path)}">Open</button>
        <button class="ghost-btn" type="button" data-remove-watch="${escapeHtml(item.id)}">Remove</button>
      </div>
    </article>
  `;
}

function home() {
  return `
    <div class="home">
      <section class="hero">
        <div class="hero-layout">
          <div class="hero-copy">
            <span class="eyebrow">AI-Native Research Shell</span>
            <h1 class="wordmark">dyor.sh</h1>
            <p class="hero-title">
              Crypto research that keeps <span>risk, evidence, and uncertainty</span> in the same window.
            </p>
            <p class="hero-text">
              Type a token, contract, project, or social link. The agent turns fragmented market data into a structured research brief.
            </p>
            <div class="hero-stats" aria-label="Research scope">
              <span><strong>4</strong> risk surfaces</span>
              <span><strong>0</strong> buy or sell calls</span>
              <span><strong>24/7</strong> watch triggers</span>
            </div>
          </div>
          <div class="hero-product">
            ${scanPanel()}
          </div>
        </div>
        <div class="signal-strip" aria-label="Research signal coverage">
          <span>Identity</span>
          <span>Liquidity</span>
          <span>Holders</span>
          <span>Unlocks</span>
          <span>Source</span>
          <span>Attention</span>
        </div>
      </section>

      <div class="sections">
        ${watchlistBlock()}
        <section class="split">
          <div>
            <span class="kicker">Agent Workflow</span>
            <h2>From noisy token links to a defensible research path.</h2>
            <p>
              DYOR.sh is designed as a research agent, not a trading signal. It keeps the workflow evidence-first and makes uncertainty visible.
            </p>
          </div>
          <div class="flow">
            <article class="flow-step">
              <span class="flow-index">01</span>
              <div>
                <strong>Resolve identity</strong>
                <span>Match ticker, contract, chain, website, and official social accounts before analysis.</span>
              </div>
            </article>
            <article class="flow-step">
              <span class="flow-index">02</span>
              <div>
                <strong>Check risk surfaces</strong>
                <span>Review holders, pool depth, unlocks, market structure, dev activity, and narrative velocity.</span>
              </div>
            </article>
            <article class="flow-step">
              <span class="flow-index">03</span>
              <div>
                <strong>Generate report</strong>
                <span>Return a brief with red flags, confidence, links, and watch triggers.</span>
              </div>
            </article>
            <article class="flow-step">
              <span class="flow-index">04</span>
              <div>
                <strong>Watch changes</strong>
                <span>Track liquidity moves, whale transfers, CEX notices, unlock windows, and social anomalies.</span>
              </div>
            </article>
          </div>
        </section>

        <section class="split">
          <div>
            <span class="kicker">Signal Map</span>
            <h2>Built for Alpha tokens, long-tail tokens, and fast-moving narratives.</h2>
            <p>
              The first public build is a frontend prototype. The product direction is an independent agent layer for every chain and every token.
            </p>
          </div>
          <div class="signal-grid">
            <article class="signal">
              <strong>Liquidity</strong>
              <span>Pool depth, withdrawals, slippage paths, venue concentration, and routing quality.</span>
            </article>
            <article class="signal">
              <strong>Supply</strong>
              <span>Unlock schedules, top holder concentration, treasury wallets, and suspicious transfers.</span>
            </article>
            <article class="signal">
              <strong>Source</strong>
              <span>Team links, docs, GitHub, audits, canonical domains, and contract verification.</span>
            </article>
            <article class="signal">
              <strong>Attention</strong>
              <span>Social velocity, KOL clustering, announcement deltas, and hype-to-data mismatch.</span>
            </article>
          </div>
        </section>
      </div>
    </div>
  `;
}

function reportPage(id) {
  const routeUrl = new URL(window.location.href);
  const snapshotId = routeUrl.searchParams.get("s");
  const routeQuery = routeUrl.searchParams.get("q");
  const scan =
    (snapshotId ? loadRememberedSnapshot(snapshotId) : null) ||
    samples.find((sample) => sample.id === id) ||
    loadRememberedReport(id) ||
    (state.active?.id === id ? state.active : null);

  if (!scan && snapshotId) {
    loadSnapshotReport(id, snapshotId, routeQuery);
    return reportLoadingPage(id);
  }

  if (!scan && routeQuery) {
    loadRouteReport(id, routeQuery);
    return reportLoadingPage(id);
  }

  const displayScan = scan || state.active;
  return reportView(displayScan);
}

function comparePage(id) {
  const routeUrl = new URL(window.location.href);
  const leftQuery = routeUrl.searchParams.get("a") || routeUrl.searchParams.get("left");
  const rightQuery = routeUrl.searchParams.get("b") || routeUrl.searchParams.get("right");
  const parsedQuery = parseCompareQuery(routeUrl.searchParams.get("q") || routeUrl.searchParams.get("query"));
  const pair = leftQuery && rightQuery ? [leftQuery, rightQuery] : parsedQuery;
  const currentComparison = state.comparison?.id === id ? state.comparison : null;

  if (currentComparison) {
    return compareView(currentComparison);
  }

  if (pair) {
    loadRouteCompare(id, pair[0], pair[1]);
    return compareLoadingPage(id, pair[0], pair[1]);
  }

  const cachedComparison = loadRememberedComparison(id);
  if (cachedComparison) {
    return compareView(cachedComparison);
  }

  return compareLoadingPage(id, "", "", "Missing compare query. Use a route like /c/aster-vs-cloud?a=ASTER&b=CLOUD.");
}

function loadRouteCompare(id, leftQuery, rightQuery) {
  const requestKey = `${id}:compare:${leftQuery}:${rightQuery}`;
  if (state.routeRequest === requestKey || state.loading) return;
  state.routeRequest = requestKey;
  performCompare(leftQuery, rightQuery, { replaceCompareRoute: true });
}

function loadSnapshotReport(id, snapshotId, fallbackQuery) {
  const requestKey = `${id}:snapshot:${snapshotId}`;
  if (state.routeRequest === requestKey || state.loading) return;

  state.routeRequest = requestKey;
  state.loading = true;
  state.error = "";

  fetch(`/api/report/${encodeURIComponent(snapshotId)}`, {
    headers: { accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Snapshot failed with ${response.status}`);
      }
      return response.json();
    })
    .then((payload) => {
      const report = normalizeScan(payload.report, fallbackQuery || payload.report?.label || id);
      state.active = {
        ...report,
        snapshot: {
          id: payload.id || snapshotId,
          persisted: true,
          savedAt: payload.savedAt,
          expiresAt: payload.expiresAt,
        },
      };
      state.query = state.active.label || fallbackQuery || "";
      state.loading = false;
      rememberReport(state.active);
      refreshWatchedReport(state.active);
      render();
    })
    .catch((error) => {
      state.loading = false;
      state.error = error instanceof Error ? error.message : "Report snapshot unavailable";
      if (fallbackQuery) {
        performScan(fallbackQuery, { replaceReportRoute: true });
        return;
      }
      render();
    });
}

function loadRouteReport(id, query) {
  const requestKey = `${id}:${query}`;
  if (state.routeRequest === requestKey || state.loading) return;
  state.routeRequest = requestKey;
  performScan(query, { replaceReportRoute: true });
}

function reportLoadingPage(id) {
  return `
    <section class="report-page">
      <a class="ghost-btn" href="/" data-link>Back to shell</a>
      <div class="report-card">
        <div class="report-card-head">
          <span class="kicker">Shareable DYOR Report</span>
          <h1>Loading report</h1>
          <p>Resolving ${escapeHtml(id)} with the live research API.</p>
        </div>
        <div class="report-card-body">
          <div class="scan-error">${state.error ? escapeHtml(state.error) : "Fetching live market evidence..."}</div>
        </div>
      </div>
    </section>
  `;
}

function compareLoadingPage(id, leftQuery, rightQuery, message = "") {
  const label = leftQuery && rightQuery ? `${leftQuery} vs ${rightQuery}` : id;
  return `
    <section class="report-page compare-page">
      <a class="ghost-btn" href="/" data-link>Back to shell</a>
      <div class="report-card">
        <div class="report-card-head">
          <span class="kicker">Shareable DYOR Compare</span>
          <h1>Loading compare</h1>
          <p>${escapeHtml(message || `Resolving ${label} with the live research API.`)}</p>
        </div>
        <div class="report-card-body">
          <div class="scan-error">${state.error ? escapeHtml(state.error) : "Fetching live market evidence..."}</div>
        </div>
      </div>
    </section>
  `;
}

function compareView(comparison) {
  const findings = Array.isArray(comparison.findings) ? comparison.findings : [];
  return `
    <section class="report-page compare-page">
      <div class="page-actions">
        <a class="ghost-btn" href="/" data-link>Back to shell</a>
        <button class="ghost-btn" type="button" data-copy-compare="${escapeHtml(comparison.id)}">Copy brief</button>
      </div>
      <div class="report-card">
        <div class="report-card-head">
          <span class="kicker">Shareable DYOR Compare</span>
          <h1>${escapeHtml(comparison.title || comparison.label)}</h1>
          <p>
            ${escapeHtml(comparison.verdict)}
            ${
              comparison.source
                ? ` · live via ${escapeHtml(comparison.source)}${comparison.updatedAt ? ` · ${escapeHtml(formatUpdatedAt(comparison.updatedAt))}` : ""}`
                : ""
            }
          </p>
        </div>
        <div class="report-card-body">
          ${comparisonGrid(comparison)}
          ${
            findings.length
              ? `
                <h2>Comparison Findings</h2>
                <div class="finding-list">
                  ${findings
                    .map(
                      ([itemTone, text]) => `
                        <div class="finding" style="--tone: ${toneColor(itemTone)}">${escapeHtml(text)}</div>
                      `,
                    )
                    .join("")}
                </div>
              `
              : ""
          }
        </div>
      </div>
    </section>
  `;
}

function reportView(scan) {
  const tone = riskTone(scan.risk);
  return `
    <section class="report-page">
      <div class="page-actions">
        <a class="ghost-btn" href="/" data-link>Back to shell</a>
        <button class="ghost-btn" type="button" data-copy-report="${escapeHtml(scan.id)}">Copy brief</button>
        ${watchButton(scan)}
      </div>
      <div class="report-card">
        <div class="report-card-head">
          <span class="kicker">Shareable DYOR Report</span>
          <h1>${escapeHtml(scan.title)}</h1>
          <p>
            ${escapeHtml(scan.chain)} · Risk score ${scan.risk} · ${escapeHtml(scan.verdict)}
            ${
              scan.live && scan.source
                ? ` · live via ${escapeHtml(scan.source)}${scan.updatedAt ? ` · ${escapeHtml(formatUpdatedAt(scan.updatedAt))}` : ""}`
                : ""
            }
          </p>
        </div>
        <div class="report-card-body">
          <div class="risk-head">
            <div>
              <span>Risk posture</span>
              <strong>${escapeHtml(scan.verdict)}</strong>
            </div>
            <div class="score ${tone}" style="--score: ${scan.risk}">
              <span>${scan.risk}</span>
            </div>
          </div>
          <div class="metric-list">${metricRows(scan)}</div>
          ${redFlagsBlock(scan)}
          ${evidenceBlock(scan)}
          ${researchQualityBlock(scan)}
          <h2>Findings</h2>
          <div class="finding-list">
            ${scan.findings
              .map(
                ([itemTone, text]) => `
                  <div class="finding" style="--tone: ${toneColor(itemTone)}">${escapeHtml(text)}</div>
                `
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function docsPage() {
  return `
    <section class="docs">
      <h1>DYOR.sh Docs</h1>
      <p>
        DYOR.sh is an AI-Native research shell. The goal is to scan crypto assets, surface evidence, explain risk, and keep a watch process running after the first report.
      </p>
      <div class="doc-card">
        <h2>Commands</h2>
        <div class="flow">
          <article class="flow-step"><code>/scan</code><span>Run token, contract, or project research.</span></article>
          <article class="flow-step"><code>/redflags</code><span>List unresolved risks and what would reduce them.</span></article>
          <article class="flow-step"><code>/watch</code><span>Track liquidity, unlock, wallet, social, and announcement changes.</span></article>
          <article class="flow-step"><code>/compare</code><span>Compare two projects by market, supply, usage, and source quality.</span></article>
        </div>
      </div>
      <div class="doc-card">
        <h2>Method</h2>
        <div>
          <p>
            The agent separates facts, inferences, and missing data. Reports should link back to primary sources when live data connectors are added.
          </p>
          <p>
            DYOR.sh does not provide financial advice, price targets, or buy/sell calls.
          </p>
        </div>
      </div>
    </section>
  `;
}

function render() {
  const path = window.location.pathname;
  state.route = path;
  let view = home();

  if (path.startsWith("/r/")) {
    view = reportPage(path.split("/").filter(Boolean)[1]);
  }

  if (path.startsWith("/c/")) {
    view = comparePage(path.split("/").filter(Boolean)[1]);
  }

  if (path === "/docs") {
    view = docsPage();
  }

  app.innerHTML = `
    <div class="shell">
      ${header()}
      <main class="main">${view}</main>
      ${footer()}
    </div>
  `;
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (link) {
    const href = link.getAttribute("href");
    if (href?.startsWith("/")) {
      event.preventDefault();
      navigate(href);
    }
  }

  const sample = event.target.closest("[data-sample]");
  if (sample) {
    performScan(sample.dataset.sample);
  }

  const openReport = event.target.closest("[data-open-report]");
  if (openReport) {
    navigate(openReport.dataset.openReport);
  }

  const openCompare = event.target.closest("[data-open-compare]");
  if (openCompare) {
    navigate(openCompare.dataset.openCompare);
  }

  const copyReport = event.target.closest("[data-copy-report]");
  if (copyReport) {
    const id = copyReport.dataset.copyReport;
    const scan =
      (state.active?.id === id ? state.active : null) ||
      samples.find((sample) => sample.id === id) ||
      loadRememberedReport(id);
    if (scan) copyText(reportMarkdown(scan), copyReport);
  }

  const copyCompare = event.target.closest("[data-copy-compare]");
  if (copyCompare) {
    const id = copyCompare.dataset.copyCompare;
    const comparison = state.comparison?.id === id ? state.comparison : loadRememberedComparison(id);
    if (comparison) copyText(comparisonMarkdown(comparison), copyCompare);
  }

  const toggleWatch = event.target.closest("[data-toggle-watch]");
  if (toggleWatch) {
    const id = toggleWatch.dataset.toggleWatch;
    const scan =
      (state.active?.id === id ? state.active : null) ||
      samples.find((sample) => sample.id === id) ||
      loadRememberedReport(id);
    if (scan) {
      if (isWatchedReport(scan.id)) {
        removeWatchedReport(scan.id);
      } else {
        addWatchedReport(scan);
      }
      render();
    }
  }

  const removeWatch = event.target.closest("[data-remove-watch]");
  if (removeWatch) {
    removeWatchedReport(removeWatch.dataset.removeWatch);
    render();
  }

  const refreshWatch = event.target.closest("[data-refresh-watchlist]");
  if (refreshWatch) {
    refreshWatchlist();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-scan-form]");
  if (!form) return;

  event.preventDefault();
  const data = new FormData(form);
  performScan(data.get("query"));
});

window.addEventListener("popstate", render);

render();

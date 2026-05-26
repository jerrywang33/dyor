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
    findings: [
      ["high", "Contract address lacks a verified project identity in this prototype run."],
      ["high", "Unknown holder concentration should block any automated action."],
      ["mid", "Require explorer verification, official website match, and pair creation history."],
      ["mid", "Treat social links as untrusted until linked from the project's canonical domain."],
    ],
  },
];

const defaultScan = samples[0];

const state = {
  active: defaultScan,
  query: defaultScan.label,
  route: window.location.pathname,
  loading: false,
  error: "",
  routeRequest: "",
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

  const query = String(value || "").trim();
  if (!query) return;

  state.query = query;
  state.loading = true;
  state.error = "";
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
    state.active = normalizeScan(report, query);
    state.query = state.active.label || query;
    rememberReport(state.active);
  } catch (error) {
    state.active = scanFor(query);
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

function normalizeScan(report, query) {
  const fallback = scanFor(query);
  return {
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
    links: report.links && typeof report.links === "object" ? report.links : fallback.links,
  };
}

function navigate(path) {
  window.history.pushState({}, "", path);
  state.route = path;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function reportPath(scan) {
  const query = scan.links?.baseToken || scan.label || "";
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  return `/r/${encodeURIComponent(scan.id)}${suffix}`;
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

function scanPanel() {
  const scan = state.active;
  const tone = riskTone(scan.risk);
  const sourceLabel = scan.live ? `live via ${scan.source || "market API"}` : "prototype profile";
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
      </div>
      ${state.error ? `<div class="scan-error">${escapeHtml(state.error)}</div>` : ""}
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
          <button class="ghost-btn" type="button" data-open-report="${escapeHtml(reportPath(scan))}">Open report</button>
        </aside>
      </div>
    </div>
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
  const routeQuery = routeUrl.searchParams.get("q");
  const scan =
    samples.find((sample) => sample.id === id) ||
    loadRememberedReport(id) ||
    (state.active?.id === id ? state.active : null);

  if (!scan && routeQuery) {
    loadRouteReport(id, routeQuery);
    return reportLoadingPage(id);
  }

  const displayScan = scan || state.active;
  return reportView(displayScan);
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

function reportView(scan) {
  const tone = riskTone(scan.risk);
  return `
    <section class="report-page">
      <a class="ghost-btn" href="/" data-link>Back to shell</a>
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
          ${evidenceBlock(scan)}
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

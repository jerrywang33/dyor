export function dyorCapabilities(origin = "https://dyor.sh") {
  const baseUrl = normalizeOrigin(origin);

  return {
    name: "dyor.sh",
    title: "DYOR.sh AI-Native RWA Research Shell",
    version: "0.1.0",
    description: "RWA asset research shell for evidence-first issuer, collateral, market, risk, red flag, watch, compare, and Markdown brief workflows.",
    homepage: baseUrl,
    openapi: `${baseUrl}/openapi.json`,
    llms: `${baseUrl}/llms.txt`,
    pluginManifest: `${baseUrl}/.well-known/ai-plugin.json`,
    robots: `${baseUrl}/robots.txt`,
    sitemap: `${baseUrl}/sitemap.xml`,
    disclaimer: "Not financial advice. Outputs are RWA research briefs and unresolved-risk checklists, not investment recommendations, price targets, or yield guarantees.",
    commands: [
      {
        name: "scan",
        syntax: "/scan Gold RWA",
        description: "Resolve an RWA asset, contract, issuer, project, Dexscreener URL, or explorer URL into a structured research report.",
      },
      {
        name: "redflags",
        syntax: "/redflags OpenAI Pre-IPO RWA",
        description: "Return unresolved issuer, collateral, liquidity, and source checks for the selected RWA report.",
      },
      {
        name: "watch",
        syntax: "/watch Gold RWA",
        description: "Scan an RWA asset and pin it into the local research queue.",
      },
      {
        name: "compare",
        syntax: "/compare Gold RWA vs U.S. Equities RWA",
        description: "Compare two live RWA reports by risk, issuer confidence, liquidity, volume, and market coverage.",
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/scan?q=Gold%20RWA",
        url: `${baseUrl}/api/scan?q=Gold%20RWA`,
        returns: "JSON RWA research report with metrics, evidence, redFlags, confidence, watch triggers, alternatives, links, and numbers.",
      },
      {
        method: "POST",
        path: "/api/scan",
        url: `${baseUrl}/api/scan`,
        body: { q: "Gold RWA" },
        returns: "JSON RWA research report.",
      },
      {
        method: "GET",
        path: "/api/redflags?q=OpenAI%20Pre-IPO%20RWA",
        url: `${baseUrl}/api/redflags?q=OpenAI%20Pre-IPO%20RWA`,
        returns: "Compact JSON RWA red flag checklist with action items. Add format=md for Markdown.",
      },
      {
        method: "GET",
        path: "/api/compare?a=Gold%20RWA&b=U.S.%20Equities%20RWA",
        url: `${baseUrl}/api/compare?a=Gold%20RWA&b=U.S.%20Equities%20RWA`,
        returns: "JSON comparison with scores, deltas, findings, and the two underlying reports.",
      },
      {
        method: "POST",
        path: "/api/watch",
        url: `${baseUrl}/api/watch`,
        body: { items: [{ id: "gold-rwa", label: "Gold RWA", query: "Gold RWA" }] },
        returns: "Batch watch refresh results. Each item has ok, query, and report or error.",
      },
      {
        method: "GET",
        path: "/api/brief?q=Gold%20RWA&format=md",
        url: `${baseUrl}/api/brief?q=Gold%20RWA&format=md`,
        returns: "Markdown RWA report brief. Omit format=md for JSON with markdown and report payload.",
      },
      {
        method: "GET",
        path: "/api/brief?a=Gold%20RWA&b=U.S.%20Equities%20RWA&format=md",
        url: `${baseUrl}/api/brief?a=Gold%20RWA&b=U.S.%20Equities%20RWA&format=md`,
        returns: "Markdown RWA comparison brief.",
      },
      {
        method: "POST",
        path: "/api/report",
        url: `${baseUrl}/api/report`,
        body: { report: "{report payload}" },
        returns: "Shareable report snapshot metadata when DYOR_REPORTS KV is configured.",
      },
    ],
    formats: ["application/json", "text/markdown"],
    liveConnectors: ["Dexscreener"],
    plannedConnectors: ["issuer docs", "reserve/collateral proof", "redemption terms", "holder distribution", "custody checks", "contract verification", "source checks"],
    examples: {
      scan: `${baseUrl}/api/scan?q=Gold%20RWA`,
      redFlags: `${baseUrl}/api/redflags?q=OpenAI%20Pre-IPO%20RWA`,
      compare: `${baseUrl}/api/compare?a=Gold%20RWA&b=U.S.%20Equities%20RWA`,
      watch: `${baseUrl}/api/watch?q=Gold%20RWA,U.S.%20Equities%20RWA`,
      markdownBrief: `${baseUrl}/api/brief?q=Gold%20RWA&format=md`,
    },
  };
}

function normalizeOrigin(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "https://dyor.sh";
  }
}

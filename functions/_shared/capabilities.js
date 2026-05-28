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
        syntax: "/scan XAUT",
        description: "Resolve an RWA asset, contract, issuer, project, Dexscreener URL, or explorer URL into a structured research report.",
      },
      {
        name: "redflags",
        syntax: "/redflags BUIDL",
        description: "Return unresolved issuer, collateral, liquidity, and source checks for the selected RWA report.",
      },
      {
        name: "watch",
        syntax: "/watch PAXG",
        description: "Scan an RWA asset and pin it into the local research queue.",
      },
      {
        name: "compare",
        syntax: "/compare BUIDL vs OUSG",
        description: "Compare two live RWA reports by risk, issuer confidence, liquidity, volume, and market coverage.",
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/scan?q=XAUT",
        url: `${baseUrl}/api/scan?q=XAUT`,
        returns: "JSON RWA research report with metrics, evidence, redFlags, confidence, watch triggers, alternatives, links, and numbers.",
      },
      {
        method: "POST",
        path: "/api/scan",
        url: `${baseUrl}/api/scan`,
        body: { q: "XAUT" },
        returns: "JSON RWA research report.",
      },
      {
        method: "GET",
        path: "/api/redflags?q=BUIDL",
        url: `${baseUrl}/api/redflags?q=BUIDL`,
        returns: "Compact JSON RWA red flag checklist with action items. Add format=md for Markdown.",
      },
      {
        method: "GET",
        path: "/api/compare?a=BUIDL&b=OUSG",
        url: `${baseUrl}/api/compare?a=BUIDL&b=OUSG`,
        returns: "JSON comparison with scores, deltas, findings, and the two underlying reports.",
      },
      {
        method: "POST",
        path: "/api/watch",
        url: `${baseUrl}/api/watch`,
        body: { items: [{ id: "xaut", label: "XAUT", query: "XAUT" }] },
        returns: "Batch watch refresh results. Each item has ok, query, and report or error.",
      },
      {
        method: "GET",
        path: "/api/brief?q=XAUT&format=md",
        url: `${baseUrl}/api/brief?q=XAUT&format=md`,
        returns: "Markdown RWA report brief. Omit format=md for JSON with markdown and report payload.",
      },
      {
        method: "GET",
        path: "/api/brief?a=BUIDL&b=OUSG&format=md",
        url: `${baseUrl}/api/brief?a=BUIDL&b=OUSG&format=md`,
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
      scan: `${baseUrl}/api/scan?q=XAUT`,
      redFlags: `${baseUrl}/api/redflags?q=BUIDL`,
      compare: `${baseUrl}/api/compare?a=BUIDL&b=OUSG`,
      watch: `${baseUrl}/api/watch?q=XAUT,PAXG,BUIDL,OUSG,dTSLA`,
      markdownBrief: `${baseUrl}/api/brief?q=XAUT&format=md`,
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

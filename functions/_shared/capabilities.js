export function dyorCapabilities(origin = "https://dyor.sh") {
  const baseUrl = normalizeOrigin(origin);

  return {
    name: "dyor.sh",
    title: "DYOR.sh AI-Native Research Shell",
    version: "0.1.0",
    description: "Crypto token research shell for evidence-first market, identity, risk, red flag, watch, compare, and Markdown brief workflows.",
    homepage: baseUrl,
    disclaimer: "Not financial advice. Outputs are research briefs and unresolved-risk checklists, not buy or sell calls.",
    commands: [
      {
        name: "scan",
        syntax: "/scan ASTER",
        description: "Resolve a token, contract, project, Dexscreener URL, or explorer URL into a structured research report.",
      },
      {
        name: "redflags",
        syntax: "/redflags ASTER",
        description: "Return unresolved risk checks and actions for the selected token report.",
      },
      {
        name: "watch",
        syntax: "/watch ASTER",
        description: "Scan a token and pin it into the local research queue.",
      },
      {
        name: "compare",
        syntax: "/compare ASTER CLOUD",
        description: "Compare two live reports by risk, identity confidence, liquidity, volume, and market coverage.",
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/scan?q=ASTER",
        url: `${baseUrl}/api/scan?q=ASTER`,
        returns: "JSON research report with metrics, evidence, redFlags, confidence, watch triggers, alternatives, links, and numbers.",
      },
      {
        method: "POST",
        path: "/api/scan",
        url: `${baseUrl}/api/scan`,
        body: { q: "ASTER" },
        returns: "JSON research report.",
      },
      {
        method: "GET",
        path: "/api/compare?a=ASTER&b=CLOUD",
        url: `${baseUrl}/api/compare?a=ASTER&b=CLOUD`,
        returns: "JSON comparison with scores, deltas, findings, and the two underlying reports.",
      },
      {
        method: "POST",
        path: "/api/watch",
        url: `${baseUrl}/api/watch`,
        body: { items: [{ id: "aster", label: "ASTER", query: "ASTER" }] },
        returns: "Batch watch refresh results. Each item has ok, query, and report or error.",
      },
      {
        method: "GET",
        path: "/api/brief?q=ASTER&format=md",
        url: `${baseUrl}/api/brief?q=ASTER&format=md`,
        returns: "Markdown report brief. Omit format=md for JSON with markdown and report payload.",
      },
      {
        method: "GET",
        path: "/api/brief?a=ASTER&b=CLOUD&format=md",
        url: `${baseUrl}/api/brief?a=ASTER&b=CLOUD&format=md`,
        returns: "Markdown comparison brief.",
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
    plannedConnectors: ["holder distribution", "unlock schedules", "contract verification", "social/source checks"],
    examples: {
      scan: `${baseUrl}/api/scan?q=ASTER`,
      redFlags: `${baseUrl}/api/scan?q=%2Fredflags%20ASTER`,
      compare: `${baseUrl}/api/compare?a=ASTER&b=CLOUD`,
      watch: `${baseUrl}/api/watch?q=ASTER,CLOUD`,
      markdownBrief: `${baseUrl}/api/brief?q=ASTER&format=md`,
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

import { buildComparison } from "../_shared/compare.js";
import { cleanQuery, scanDexscreener } from "../_shared/dexscreener.js";
import { comparisonToMarkdown, reportToMarkdown } from "../_shared/brief.js";

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const input = await readBriefRequest(request);
    if (!input.query && !input.pair) {
      return json({ error: "Missing brief query", message: "Use ?q=ASTER or ?a=ASTER&b=CLOUD" }, 400);
    }

    if (input.pair) {
      const [left, right] = await Promise.all(input.pair.map((query) => scanDexscreener(query)));
      const comparison = buildComparison(left, right);
      const markdown = comparisonToMarkdown(comparison);
      return briefResponse({ mode: "compare", markdown, comparison }, input.format, request);
    }

    const report = await scanDexscreener(input.query);
    const markdown = reportToMarkdown(report);
    return briefResponse({ mode: "scan", markdown, report }, input.format, request);
  } catch (error) {
    return json(
      {
        error: "Brief failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      502,
    );
  }
}

async function readBriefRequest(request) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const pair = normalizePair(
      url.searchParams.get("a") || url.searchParams.get("left"),
      url.searchParams.get("b") || url.searchParams.get("right"),
      url.searchParams.get("q") || url.searchParams.get("query"),
    );
    return {
      query: pair ? "" : cleanBriefQuery(url.searchParams.get("q") || url.searchParams.get("query") || url.searchParams.get("token")),
      pair,
      format: cleanFormat(url.searchParams.get("format")),
    };
  }

  const body = await request.json().catch(() => ({}));
  const pair = normalizePair(body.a || body.left, body.b || body.right, body.q || body.query || body.compare);
  return {
    query: pair ? "" : cleanBriefQuery(body.q || body.query || body.token || body.contract),
    pair,
    format: cleanFormat(body.format),
  };
}

function normalizePair(left, right, query) {
  const direct = [cleanToken(left), cleanToken(right)];
  if (direct[0] && direct[1]) return direct;
  return parseCompareQuery(query);
}

function parseCompareQuery(value) {
  const query = cleanQuery(value);
  if (!query) return null;
  if (/^https?:\/\//i.test(query)) return null;

  const match =
    query.match(/^(?:dyor\s+)?\/?compare\s+(.+?)\s+(?:with|to|against)\s+(.+)$/i) ||
    query.match(/^(?:dyor\s+)?\/?compare\s+(\S+)\s+(.+)$/i) ||
    query.match(/^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i) ||
    query.match(/^compare\s+(.+?)\s+(?:with|to|against)\s+(.+)$/i) ||
    query.match(/^(.+?)\s*[,/|]\s*(.+)$/);

  if (!match) return null;

  const pair = [cleanToken(match[1]), cleanToken(match[2])];
  return pair[0] && pair[1] ? pair : null;
}

function cleanBriefQuery(value) {
  return cleanQuery(value)
    .replace(/^(?:dyor\s+)?\/?brief\s+/i, "")
    .replace(/^(?:dyor\s+)?\/?scan\s+/i, "")
    .replace(/^(?:dyor\s+)?\/?redflags?\s+/i, "")
    .replace(/^(?:dyor\s+)?\/?watch\s+/i, "")
    .replace(/^\$+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function cleanToken(value) {
  return cleanQuery(value)
    .replace(/^\$+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function cleanFormat(value) {
  const format = String(value || "").toLowerCase();
  return ["json", "md", "markdown"].includes(format) ? format : "";
}

function briefResponse(payload, format, request) {
  const accept = request.headers.get("accept") || "";
  if (format === "md" || format === "markdown" || accept.includes("text/markdown")) {
    return withCors(
      new Response(payload.markdown, {
        headers: {
          "content-type": "text/markdown; charset=utf-8",
          "cache-control": "public, max-age=30",
        },
      }),
    );
  }

  return json(
    {
      kind: "brief",
      mode: payload.mode,
      markdown: payload.markdown,
      report: payload.report,
      comparison: payload.comparison,
    },
    200,
  );
}

function json(payload, status = 200) {
  return withCors(
    Response.json(payload, {
      status,
      headers: {
        "cache-control": status === 200 ? "public, max-age=30" : "no-store",
      },
    }),
  );
}

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

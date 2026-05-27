import { cleanQuery, scanDexscreener } from "../_shared/dexscreener.js";
import { buildComparison } from "../_shared/compare.js";

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const pair = await readCompareRequest(request);
    if (!pair) {
      return json({ error: "Missing compare query", message: "Use ?a=ASTER&b=CLOUD or ?q=ASTER vs CLOUD" }, 400);
    }

    const [left, right] = await Promise.all(pair.map((query) => scanDexscreener(query)));
    return json(buildComparison(left, right));
  } catch (error) {
    return json(
      {
        error: "Compare failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      502,
    );
  }
}

async function readCompareRequest(request) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    return normalizePair(
      url.searchParams.get("a") || url.searchParams.get("left"),
      url.searchParams.get("b") || url.searchParams.get("right"),
      url.searchParams.get("q") || url.searchParams.get("query"),
    );
  }

  const body = await request.json().catch(() => ({}));
  return normalizePair(body.a || body.left, body.b || body.right, body.q || body.query || body.compare);
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

function cleanToken(value) {
  return cleanQuery(value)
    .replace(/^\$+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
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

import { cleanQuery, scanDexscreener } from "../_shared/dexscreener.js";

const WATCH_LIMIT = 8;

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const items = await readWatchRequest(request);
    if (!items.length) {
      return json({ error: "Missing watch queries", message: "Use ?q=Gold%20RWA,U.S.%20Equities%20RWA or POST { items: [{ query: 'Gold RWA' }] }" }, 400);
    }

    const results = await Promise.all(items.map(refreshItem));
    const failures = results.filter((item) => !item.ok).length;

    return json({
      kind: "watch",
      updatedAt: new Date().toISOString(),
      count: results.length,
      failures,
      results,
    });
  } catch (error) {
    return json(
      {
        error: "Watch refresh failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      502,
    );
  }
}

async function refreshItem(item) {
  try {
    const report = await scanDexscreener(item.query);
    return {
      ok: true,
      id: item.id,
      label: item.label || report.label,
      query: item.query,
      report,
    };
  } catch (error) {
    return {
      ok: false,
      id: item.id,
      label: item.label,
      query: item.query,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function readWatchRequest(request) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    return normalizeWatchItems(
      splitQueries(
        url.searchParams.get("q") ||
          url.searchParams.get("query") ||
          url.searchParams.get("assets") ||
          url.searchParams.get("tokens"),
      ),
    );
  }

  const body = await request.json().catch(() => ({}));
  return normalizeWatchItems(body.items || body.watchlist || body.queries || body.q || body.query || body.assets || body.tokens);
}

function normalizeWatchItems(value) {
  const list = Array.isArray(value) ? value : splitQueries(value);

  return list
    .map((item) => {
      if (typeof item === "string") {
        const query = cleanWatchQuery(item);
        return query ? { id: slug(query), label: query, query } : null;
      }

      if (!item || typeof item !== "object") return null;

      const query = cleanWatchQuery(item.query || item.q || item.asset || item.token || item.issuer || item.label || item.id);
      if (!query) return null;

      return {
        id: cleanId(item.id) || slug(query),
        label: cleanLabel(item.label || item.title || query),
        query,
      };
    })
    .filter(Boolean)
    .slice(0, WATCH_LIMIT);
}

function splitQueries(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(/[,|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanWatchQuery(value) {
  return cleanQuery(value)
    .replace(/^(?:dyor\s+)?\/?watch\s+/i, "")
    .replace(/^(?:dyor\s+)?\/?scan\s+/i, "")
    .replace(/^(?:dyor\s+)?\/?redflags?\s+/i, "")
    .replace(/^\$+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function cleanId(value) {
  return String(value || "")
    .replace(/[^a-z0-9._:-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function cleanLabel(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
}

function slug(value) {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 96) || "watch"
  );
}

function json(payload, status = 200) {
  return withCors(
    Response.json(payload, {
      status,
      headers: {
        "cache-control": "no-store",
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

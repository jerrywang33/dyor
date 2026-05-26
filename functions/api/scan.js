import { cleanQuery, scanDexscreener } from "../_shared/dexscreener.js";

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const query = await readQuery(request);
    if (!query) {
      return json({ error: "Missing token, contract, or project query" }, 400);
    }

    const report = await scanDexscreener(query);
    return json(report);
  } catch (error) {
    return json(
      {
        error: "Scan failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      502,
    );
  }
}

async function readQuery(request) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    return cleanQuery(url.searchParams.get("q") || url.searchParams.get("query"));
  }

  const body = await request.json().catch(() => ({}));
  return cleanQuery(body.q || body.query || body.token || body.contract);
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

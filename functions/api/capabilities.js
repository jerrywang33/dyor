import { dyorCapabilities } from "../_shared/capabilities.js";

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  return json(dyorCapabilities(new URL(request.url).origin));
}

function json(payload, status = 200) {
  return withCors(
    Response.json(payload, {
      status,
      headers: {
        "cache-control": status === 200 ? "public, max-age=300" : "no-store",
      },
    }),
  );
}

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

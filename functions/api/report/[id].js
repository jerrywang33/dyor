import { json, readReportSnapshot, withCors } from "../../_shared/report-store.js";

export async function onRequest({ request, env, params }) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const result = await readReportSnapshot(env, params.id);
  if (result.error) {
    return json({ error: result.error }, result.status || 500);
  }

  return json({
    id: result.snapshot.id,
    savedAt: result.snapshot.savedAt,
    expiresAt: result.snapshot.expiresAt,
    report: result.snapshot.report,
  });
}

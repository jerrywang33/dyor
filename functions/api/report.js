import { createReportSnapshot, json, readJson, reportUrl, withCors } from "../_shared/report-store.js";

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const body = await readJson(request);
  const result = await createReportSnapshot(env, body.report || body);

  if (result.error) {
    return json({ error: result.error }, 400);
  }

  const { snapshot, persisted, warning } = result;
  return json({
    id: persisted ? snapshot.id : null,
    persisted,
    savedAt: snapshot.savedAt,
    expiresAt: snapshot.expiresAt,
    url: reportUrl(snapshot.report, persisted ? snapshot.id : ""),
    warning,
  });
}

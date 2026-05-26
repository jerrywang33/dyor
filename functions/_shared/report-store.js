const REPORT_TTL_SECONDS = 60 * 60 * 24 * 30;
const REPORT_BINDING = "DYOR_REPORTS";

export function json(payload, status = 200) {
  return withCors(
    Response.json(payload, {
      status,
      headers: {
        "cache-control": status === 200 ? "no-store" : "no-store",
      },
    }),
  );
}

export function withCors(response) {
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

export async function readJson(request) {
  return request.json().catch(() => ({}));
}

export async function createReportSnapshot(env, sourceReport) {
  const report = sanitizeReport(sourceReport);
  if (!report) {
    return { error: "Invalid report payload" };
  }

  const savedAt = new Date().toISOString();
  const id = `${slug(report.id || report.label || "report")}-${randomId()}`;
  const snapshot = {
    id,
    savedAt,
    expiresAt: new Date(Date.now() + REPORT_TTL_SECONDS * 1000).toISOString(),
    report: {
      ...report,
      snapshot: {
        id,
        persisted: hasStore(env),
        savedAt,
      },
    },
  };

  if (!hasStore(env)) {
    return {
      snapshot,
      persisted: false,
      warning: `${REPORT_BINDING} KV binding is not configured`,
    };
  }

  await env[REPORT_BINDING].put(reportKey(id), JSON.stringify(snapshot), {
    expirationTtl: REPORT_TTL_SECONDS,
  });

  snapshot.report.snapshot.persisted = true;
  return { snapshot, persisted: true };
}

export async function readReportSnapshot(env, id) {
  const cleanId = cleanSnapshotId(id);
  if (!cleanId) {
    return { error: "Invalid report snapshot id", status: 400 };
  }

  if (!hasStore(env)) {
    return {
      error: `${REPORT_BINDING} KV binding is not configured`,
      status: 503,
    };
  }

  const raw = await env[REPORT_BINDING].get(reportKey(cleanId));
  if (!raw) {
    return { error: "Report snapshot not found", status: 404 };
  }

  return { snapshot: JSON.parse(raw), status: 200 };
}

export function reportUrl(report, snapshotId) {
  const params = new URLSearchParams();
  const query = report?.links?.baseToken || report?.label || "";
  if (snapshotId) params.set("s", snapshotId);
  if (query) params.set("q", query);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return `/r/${encodeURIComponent(report?.id || "report")}${suffix}`;
}

function hasStore(env) {
  return Boolean(env?.[REPORT_BINDING]?.get && env?.[REPORT_BINDING]?.put);
}

function reportKey(id) {
  return `report:${id}`;
}

function sanitizeReport(value) {
  if (!value || typeof value !== "object") return null;

  const report = {
    id: cleanText(value.id, 96) || "report",
    label: cleanText(value.label, 80) || "UNKNOWN",
    chain: cleanText(value.chain, 80) || "Unknown chain",
    title: cleanText(value.title, 140) || cleanText(value.label, 80) || "Unknown asset",
    risk: clamp(Number(value.risk), 0, 100),
    verdict: cleanText(value.verdict, 140) || "Needs review",
    live: Boolean(value.live),
    source: cleanText(value.source, 80),
    updatedAt: cleanText(value.updatedAt, 40),
    metrics: cleanObject(value.metrics, 12, 160),
    findings: cleanFindings(value.findings),
    evidence: cleanEvidence(value.evidence),
    links: cleanLinks(value.links),
  };

  return report;
}

function cleanObject(value, maxEntries, maxLength) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, maxEntries)
      .map(([key, item]) => [cleanText(key, 40), cleanText(item, maxLength)])
      .filter(([key]) => key),
  );
}

function cleanFindings(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 12)
    .map((item) => {
      const tone = Array.isArray(item) ? item[0] : item?.tone;
      const text = Array.isArray(item) ? item[1] : item?.text;
      return [cleanTone(tone), cleanText(text, 360)];
    })
    .filter(([, text]) => text);
}

function cleanEvidence(value) {
  if (!value || typeof value !== "object") return null;
  return {
    identity: cleanRows(value.identity),
    market: cleanRows(value.market),
    links: cleanEvidenceLinks(value.links),
  };
}

function cleanRows(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 12)
    .map((row) => [cleanText(row?.[0], 60), cleanText(row?.[1], 160)])
    .filter(([label]) => label);
}

function cleanLinks(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 24)
      .map(([key, url]) => [cleanText(key, 40), cleanUrl(url) || cleanText(url, 160)])
      .filter(([key, url]) => key && url),
  );
}

function cleanEvidenceLinks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 12)
    .map((item) => ({
      label: cleanText(item?.label, 40),
      url: cleanUrl(item?.url),
    }))
    .filter((item) => item.label && item.url);
}

function cleanText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function cleanTone(value) {
  const tone = cleanText(value, 12);
  return ["low", "mid", "high"].includes(tone) ? tone : "mid";
}

function cleanUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 500) : "";
  } catch {
    return "";
  }
}

function cleanSnapshotId(value) {
  return cleanText(value, 120).replace(/[^a-z0-9-]/gi, "");
}

function randomId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().split("-")[0];
  }
  return Math.random().toString(36).slice(2, 10);
}

function slug(value) {
  return cleanText(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clamp(value, min, max) {
  const number = Number.isFinite(value) ? value : 0;
  return Math.max(min, Math.min(max, Math.round(number)));
}

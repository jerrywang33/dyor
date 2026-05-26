const DEX_SEARCH_URL = "https://api.dexscreener.com/latest/dex/search";
const DEX_TOKEN_URL = "https://api.dexscreener.com/latest/dex/tokens";

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

function cleanQuery(value) {
  return String(value || "").trim().slice(0, 140);
}

async function scanDexscreener(query) {
  const pairs = await fetchPairs(query);
  const selected = pairs
    .filter((pair) => pair?.baseToken?.symbol || pair?.baseToken?.name)
    .sort(comparePairs)
    .slice(0, 10);

  if (!selected.length) {
    throw new Error("No DEX pairs matched this query");
  }

  const best = selected[0];
  const liquidityUsd = sum(selected, (pair) => number(pair?.liquidity?.usd));
  const volume24h = sum(selected, (pair) => number(pair?.volume?.h24));
  const pairCount = pairs.length;
  const priceChange24h = number(best?.priceChange?.h24);
  const risk = scoreRisk({ liquidityUsd, volume24h, pairCount, priceChange24h });
  const base = best.baseToken || {};
  const quote = best.quoteToken || {};
  const symbol = base.symbol || query.toUpperCase();
  const title = base.name || symbol;
  const id = slug(`${symbol}-${best.chainId || "chain"}`);

  return {
    id,
    label: symbol,
    chain: formatChain(best.chainId),
    title,
    risk,
    verdict: verdictForRisk(risk),
    live: true,
    source: "Dexscreener",
    updatedAt: new Date().toISOString(),
    metrics: {
      liquidity: `${money(liquidityUsd)} across ${selected.length} pool${selected.length === 1 ? "" : "s"}`,
      volume: `${money(volume24h)} 24h`,
      market: formatMarket(best),
      price: formatPrice(best.priceUsd),
      social: `${pairCount} DEX pair${pairCount === 1 ? "" : "s"} matched`,
      source: `${best.dexId || "DEX"} / ${quote.symbol || "quote"}`,
    },
    findings: buildFindings({ best, selected, liquidityUsd, volume24h, pairCount, priceChange24h }),
    links: {
      dexscreener: best.url || null,
      pair: best.pairAddress || null,
      baseToken: base.address || null,
    },
  };
}

async function fetchPairs(query) {
  const tokenLike = isAddressLike(query);
  const endpoint = tokenLike
    ? `${DEX_TOKEN_URL}/${encodeURIComponent(query)}`
    : `${DEX_SEARCH_URL}?q=${encodeURIComponent(query)}`;

  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json",
      "user-agent": "dyor.sh/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`Dexscreener returned ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.pairs) ? data.pairs : [];
}

function comparePairs(a, b) {
  return (
    number(b?.liquidity?.usd) - number(a?.liquidity?.usd) ||
    number(b?.volume?.h24) - number(a?.volume?.h24)
  );
}

function buildFindings({ best, selected, liquidityUsd, volume24h, pairCount, priceChange24h }) {
  const findings = [];
  const volumeToLiquidity = liquidityUsd > 0 ? volume24h / liquidityUsd : 0;

  if (liquidityUsd < 50_000) {
    findings.push(["high", `Live liquidity is thin at ${money(liquidityUsd)} across matched pools.`]);
  } else if (liquidityUsd < 250_000) {
    findings.push(["mid", `Liquidity is present but shallow at ${money(liquidityUsd)} across matched pools.`]);
  } else {
    findings.push(["low", `Matched pools show ${money(liquidityUsd)} in combined liquidity.`]);
  }

  if (volumeToLiquidity > 4) {
    findings.push(["mid", `24h volume is high relative to liquidity, which can make execution fragile.`]);
  } else if (volume24h > 0) {
    findings.push(["low", `24h DEX volume is ${money(volume24h)} on the selected market set.`]);
  } else {
    findings.push(["mid", "No meaningful 24h DEX volume was reported by the matched pools."]);
  }

  if (Math.abs(priceChange24h) >= 35) {
    findings.push(["high", `24h price moved ${percent(priceChange24h)}, so timing risk is elevated.`]);
  } else if (Math.abs(priceChange24h) >= 12) {
    findings.push(["mid", `24h price moved ${percent(priceChange24h)}, worth reviewing against news and liquidity.`]);
  } else {
    findings.push(["low", `24h price movement is ${percent(priceChange24h)} on the leading pair.`]);
  }

  if (pairCount <= 1) {
    findings.push(["mid", "Only one DEX pair matched, so market structure is not broadly confirmed."]);
  } else {
    findings.push(["low", `${pairCount} DEX pairs matched; the report used the ${selected.length} deepest pools.`]);
  }

  const dex = best.dexId || "the leading DEX";
  const chain = formatChain(best.chainId);
  findings.push(["mid", `This first live pass uses ${dex} data on ${chain}; holders, unlocks, and socials are still marked for follow-up.`]);

  return findings.slice(0, 5);
}

function scoreRisk({ liquidityUsd, volume24h, pairCount, priceChange24h }) {
  let score = 48;
  const volumeToLiquidity = liquidityUsd > 0 ? volume24h / liquidityUsd : 0;

  if (liquidityUsd < 50_000) score += 26;
  else if (liquidityUsd < 250_000) score += 16;
  else if (liquidityUsd > 5_000_000) score -= 10;
  else if (liquidityUsd > 1_000_000) score -= 5;

  if (volumeToLiquidity > 6) score += 12;
  else if (volumeToLiquidity > 3) score += 7;

  if (Math.abs(priceChange24h) > 45) score += 13;
  else if (Math.abs(priceChange24h) > 20) score += 7;

  if (pairCount <= 1) score += 9;
  else if (pairCount >= 6) score -= 4;

  return clamp(Math.round(score), 12, 92);
}

function verdictForRisk(risk) {
  if (risk >= 75) return "High-risk until verified";
  if (risk >= 55) return "Review before sizing";
  if (risk >= 35) return "Watch liquidity";
  return "Lower market-structure risk";
}

function formatMarket(pair) {
  const value = number(pair.marketCap) || number(pair.fdv);
  if (!value) return "Not reported";
  return `${money(value)} ${pair.marketCap ? "market cap" : "FDV"}`;
}

function formatPrice(value) {
  const price = number(value);
  if (!price) return "Not reported";
  if (price >= 1) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
  return `$${price.toPrecision(4)}`;
}

function money(value) {
  const amount = number(value);
  if (!amount) return "$0";
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: amount < 10_000 ? 2 : 1,
  }).format(amount)}`;
}

function percent(value) {
  const amount = number(value);
  const prefix = amount > 0 ? "+" : "";
  return `${prefix}${amount.toFixed(2)}%`;
}

function formatChain(chainId) {
  const names = {
    ethereum: "Ethereum",
    bsc: "BNB Chain",
    solana: "Solana",
    base: "Base",
    arbitrum: "Arbitrum",
    optimism: "Optimism",
    polygon: "Polygon",
    avalanche: "Avalanche",
  };
  return names[chainId] || titleCase(chainId || "Unknown chain");
}

function titleCase(value) {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isAddressLike(query) {
  return /^0x[a-fA-F0-9]{40}$/.test(query) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query);
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function sum(items, getValue) {
  return items.reduce((total, item) => total + number(getValue(item)), 0);
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

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
  const groups = rankPairGroups(
    pairs.filter((pair) => pair?.baseToken?.symbol || pair?.baseToken?.name),
    query,
  );
  const group = groups[0] || { pairs: [] };
  const selected = group.pairs.sort(comparePairs).slice(0, 10);

  if (!selected.length) {
    throw new Error("No DEX pairs matched this query");
  }

  const best = selected[0];
  const liquidityUsd = sum(selected, (pair) => number(pair?.liquidity?.usd));
  const volume24h = sum(selected, (pair) => number(pair?.volume?.h24));
  const pairCount = group.pairs.length;
  const priceChange24h = number(best?.priceChange?.h24);
  const risk = scoreRisk({ liquidityUsd, volume24h, pairCount, priceChange24h });
  const base = best.baseToken || {};
  const quote = best.quoteToken || {};
  const symbol = base.symbol || query.toUpperCase();
  const title = base.name || symbol;
  const id = slug(`${symbol}-${best.chainId || "chain"}`);
  const links = buildLinks(best, base);
  const alternatives = buildAlternatives(groups.slice(1, 5));
  const confidence = buildConfidence({
    query,
    best,
    group,
    links,
    alternatives,
    pairCount,
    liquidityUsd,
  });

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
    evidence: buildEvidence({ best, selected, links, pairCount, liquidityUsd, volume24h }),
    confidence,
    watch: buildWatch({ best, links, liquidityUsd, volume24h, pairCount, priceChange24h }),
    alternatives,
    links,
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

function rankPairGroups(pairs, query) {
  const groups = new Map();

  for (const pair of pairs) {
    const key = groupKey(pair);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(pair);
  }

  return [...groups.values()]
    .map((groupPairs) => ({
      pairs: groupPairs.sort(comparePairs),
      identity: identityScore(groupPairs, query),
      liquidityUsd: sum(groupPairs, (pair) => number(pair?.liquidity?.usd)),
      volume24h: sum(groupPairs, (pair) => number(pair?.volume?.h24)),
    }))
    .sort(
      (a, b) =>
        b.identity - a.identity ||
        Math.min(b.pairs.length, 20) - Math.min(a.pairs.length, 20) ||
        b.liquidityUsd - a.liquidityUsd ||
        b.volume24h - a.volume24h,
    );
}

function groupKey(pair) {
  const chain = pair?.chainId || "unknown";
  const address = pair?.baseToken?.address || pair?.pairAddress || `${pair?.baseToken?.symbol}-${pair?.baseToken?.name}`;
  return `${chain}:${String(address).toLowerCase()}`;
}

function identityScore(pairs, query) {
  const normalizedQuery = normalizeIdentity(query);
  const isAddress = isAddressLike(query);
  const nativeChains = {
    avax: ["avalanche"],
    bnb: ["bsc"],
    eth: ["ethereum"],
    matic: ["polygon"],
    sol: ["solana"],
    sui: ["sui"],
  };
  let score = 0;

  for (const pair of pairs) {
    let pairScore = 0;
    const chain = normalizeIdentity(pair?.chainId);
    const symbol = normalizeIdentity(pair?.baseToken?.symbol);
    const name = normalizeIdentity(pair?.baseToken?.name);
    const baseAddress = normalizeIdentity(pair?.baseToken?.address);
    const pairAddress = normalizeIdentity(pair?.pairAddress);

    if (isAddress && (baseAddress === normalizedQuery || pairAddress === normalizedQuery)) pairScore += 100;
    if (nativeChains[normalizedQuery]?.includes(chain)) pairScore += 80;
    if (symbol === normalizedQuery) pairScore += 60;
    else if (symbol && (symbol.startsWith(normalizedQuery) || normalizedQuery.startsWith(symbol))) pairScore += 12;
    if (name === normalizedQuery) pairScore += 35;
    else if (name.includes(normalizedQuery)) pairScore += 5;

    score = Math.max(score, pairScore);
  }

  return score;
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

function buildEvidence({ best, selected, links, pairCount, liquidityUsd, volume24h }) {
  const base = best.baseToken || {};
  const quote = best.quoteToken || {};
  const txns24h = txns(best?.txns?.h24);

  return {
    identity: [
      ["Chain", formatChain(best.chainId)],
      ["Symbol", base.symbol || "Unknown"],
      ["Token", shortAddress(base.address)],
      ["Primary pair", shortAddress(best.pairAddress)],
    ],
    market: [
      ["Primary DEX", titleCase(best.dexId || "DEX")],
      ["Quote asset", quote.symbol || "Unknown"],
      ["Pool age", formatAge(best.pairCreatedAt)],
      ["24h transactions", `${txns24h.total || 0} (${txns24h.buys || 0} buys / ${txns24h.sells || 0} sells)`],
      ["Matched pools", `${pairCount} total, ${selected.length} used`],
      ["Liquidity / volume", `${money(liquidityUsd)} / ${money(volume24h)} 24h`],
    ],
    links: Object.entries(links)
      .filter(([, value]) => typeof value === "string" && value.startsWith("http"))
      .map(([label, url]) => ({ label: titleCase(label), url })),
  };
}

function buildConfidence({ query, best, group, links, alternatives, pairCount, liquidityUsd }) {
  const base = best.baseToken || {};
  const normalizedQuery = normalizeIdentity(query);
  const symbol = normalizeIdentity(base.symbol);
  const name = normalizeIdentity(base.name);
  const addressMatch = isAddressLike(query) && normalizeIdentity(base.address) === normalizedQuery;
  const exactSymbol = symbol && symbol === normalizedQuery;
  const exactName = name && name === normalizedQuery;
  const sameSymbolAlternatives = alternatives.filter(
    (item) => normalizeIdentity(item.label) === symbol && item.chain !== formatChain(best.chainId),
  );
  const reasons = [];
  let score = 38;

  if (addressMatch) {
    score += 32;
    reasons.push("Contract address maps directly to the selected base token.");
  } else if (exactSymbol || exactName) {
    score += 20;
    reasons.push("Ticker or project name exactly matches the selected token group.");
  } else if (group.identity >= 40) {
    score += 12;
    reasons.push("Query partially matches the selected token group.");
  }

  if (links.website) {
    score += 9;
    reasons.push("Dexscreener includes a project website source link.");
  } else {
    score -= 8;
    reasons.push("No canonical website was reported by the selected DEX profile.");
  }

  if (links.x || links.telegram || links.discord) {
    score += 6;
    reasons.push("Social source links are available for follow-up.");
  }

  if (pairCount >= 6) {
    score += 10;
    reasons.push(`${pairCount} matched pools support the selected market identity.`);
  } else if (pairCount <= 1) {
    score -= 9;
    reasons.push("Only one matched pool supports this identity, so confirmation is thin.");
  }

  if (liquidityUsd >= 1_000_000) {
    score += 7;
    reasons.push("The selected market set has more than $1M in liquidity.");
  }

  if (sameSymbolAlternatives.length) {
    score -= Math.min(18, sameSymbolAlternatives.length * 6);
    reasons.push(`${sameSymbolAlternatives.length} same-symbol alternative should be checked before relying on ticker alone.`);
  } else if (alternatives.length) {
    score -= Math.min(8, alternatives.length * 2);
    reasons.push("Other search candidates exist; verify the token address before sharing.");
  }

  const finalScore = clamp(Math.round(score), 8, 96);
  return {
    score: finalScore,
    label: finalScore >= 78 ? "High confidence" : finalScore >= 55 ? "Medium confidence" : "Low confidence",
    summary:
      finalScore >= 78
        ? "Selected token identity is well supported by live DEX evidence."
        : finalScore >= 55
          ? "Selected token identity is plausible but still needs source checks."
          : "Selected token identity is weak; verify contract and canonical links.",
    reasons: reasons.slice(0, 5),
  };
}

function buildWatch({ best, links, liquidityUsd, volume24h, pairCount, priceChange24h }) {
  const volumeToLiquidity = liquidityUsd > 0 ? volume24h / liquidityUsd : 0;
  const rows = [];

  rows.push({
    tone: liquidityUsd < 250_000 ? "mid" : "low",
    label: "Liquidity floor",
    value: money(liquidityUsd),
    detail:
      liquidityUsd < 250_000
        ? "Pool depth is shallow enough that modest withdrawals can change execution quality."
        : "Current matched liquidity is usable, but depth should be watched for withdrawals.",
  });

  rows.push({
    tone: volumeToLiquidity > 4 ? "mid" : "low",
    label: "Flow pressure",
    value: `${volumeToLiquidity.toFixed(2)}x`,
    detail:
      volumeToLiquidity > 4
        ? "24h volume is high relative to liquidity, which can amplify slippage and reversals."
        : "24h volume is not unusually high relative to matched liquidity.",
  });

  rows.push({
    tone: Math.abs(priceChange24h) >= 12 ? "mid" : "low",
    label: "24h price move",
    value: percent(priceChange24h),
    detail:
      Math.abs(priceChange24h) >= 12
        ? "Recent move is large enough to require news and liquidity context."
        : "Recent move is not the main risk flag in this scan.",
  });

  rows.push({
    tone: pairCount <= 1 ? "mid" : "low",
    label: "Market coverage",
    value: `${pairCount} pool${pairCount === 1 ? "" : "s"}`,
    detail:
      pairCount <= 1
        ? "Single-pool discovery should be treated as fragile until more venues confirm it."
        : "Multiple matched pools reduce, but do not remove, market-structure uncertainty.",
  });

  rows.push({
    tone: links.website && (links.x || links.telegram || links.discord) ? "low" : "mid",
    label: "Source follow-up",
    value: best.dexId || "DEX",
    detail:
      links.website && (links.x || links.telegram || links.discord)
        ? "Review website and social links against the token contract before trusting identity."
        : "Canonical source links are incomplete; use contract-first verification.",
  });

  return rows;
}

function buildAlternatives(groups) {
  return groups
    .map((group) => {
      const best = group.pairs[0] || {};
      const base = best.baseToken || {};
      return {
        label: base.symbol || "UNKNOWN",
        title: base.name || base.symbol || "Unknown token",
        chain: formatChain(best.chainId),
        liquidity: money(group.liquidityUsd),
        volume: `${money(group.volume24h)} 24h`,
        pairs: group.pairs.length,
        source: best.dexId || "DEX",
        url: safeUrl(best.url),
        address: base.address || "",
      };
    })
    .filter((item) => item.label !== "UNKNOWN" || item.address)
    .slice(0, 4);
}

function buildLinks(best, base) {
  const info = best.info || {};
  const websiteLinks = Array.isArray(info.websites) ? info.websites : [];
  const socialLinks = Array.isArray(info.socials) ? info.socials : [];
  const website = websiteLinks.find((link) => /website/i.test(link.label || "")) || websiteLinks[0];
  const docs = websiteLinks.find((link) => /docs?/i.test(link.label || ""));
  const twitter = socialLinks.find((link) => link.type === "twitter" || /x\.com|twitter\.com/i.test(link.url || ""));
  const telegram = socialLinks.find((link) => link.type === "telegram" || /t\.me/i.test(link.url || ""));
  const discord = socialLinks.find((link) => link.type === "discord" || /discord/i.test(link.url || ""));

  return {
    dexscreener: safeUrl(best.url),
    website: safeUrl(website?.url),
    docs: safeUrl(docs?.url),
    x: safeUrl(twitter?.url),
    telegram: safeUrl(telegram?.url),
    discord: safeUrl(discord?.url),
    pair: best.pairAddress || null,
    baseToken: base.address || null,
  };
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

function formatAge(timestamp) {
  const createdAt = number(timestamp);
  if (!createdAt) return "Not reported";

  const days = Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000));
  if (days < 1) return "New pool";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
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

function shortAddress(value) {
  const text = String(value || "");
  if (!text) return "Not reported";
  if (text.length <= 14) return text;
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

function txns(value) {
  const buys = number(value?.buys);
  const sells = number(value?.sells);
  return { buys, sells, total: buys + sells };
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeIdentity(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
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

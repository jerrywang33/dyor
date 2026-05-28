const profiles = [
  {
    id: "xaut",
    label: "XAUT",
    aliases: ["Tether Gold", "XAUt", "Tether Gold XAUT"],
    chain: "Ethereum / multi-chain",
    title: "Tether Gold",
    risk: 42,
    verdict: "Verify gold custody and redemption",
    source: "RWA asset profile",
    live: false,
    metrics: {
      issuer: "TG Commodities / Tether",
      collateral: "1 oz gold claim",
      liquidity: "Large gold RWA",
      redemption: "Platform terms",
      market: "Tokenized gold",
    },
    numbers: {
      liquidityUsd: 8400000,
      volume24h: 1800000,
      pairCount: 9,
      priceChange24h: 0.4,
      confidenceScore: 78,
    },
    confidence: {
      score: 78,
      label: "High confidence",
      summary: "Tether Gold is a major tokenized gold product, but the report still depends on issuer terms, vault custody, and redemption mechanics.",
      reasons: ["Verify Tether Gold terms, gold backing attestations, vault structure, supported chains, and redemption rules."],
    },
    redFlags: [
      {
        tone: "mid",
        label: "Custody and bar claim review",
        detail: "XAUT tracks physical gold, but the practical claim depends on issuer terms, vault custody, and redemption rules.",
        action: "Review Tether Gold docs, terms, supported chains, minimum redemption size, and latest gold backing information.",
      },
      {
        tone: "mid",
        label: "Venue and wrapper fragmentation",
        detail: "Liquidity can differ by chain, venue, and wrapper even when the reference asset is the same gold token.",
        action: "Confirm the exact contract, chain, pool, and issuer source links before comparing liquidity with PAXG.",
      },
    ],
    watch: [
      {
        tone: "low",
        label: "Gold backing updates",
        value: "Issuer docs",
        detail: "Watch issuer updates, gold custody disclosures, and redemption-term changes.",
      },
      {
        tone: "mid",
        label: "Price-to-spot drift",
        value: "Gold basis",
        detail: "Compare on-chain price against spot gold and main centralized venues.",
      },
    ],
    findings: [
      ["low", "XAUT is one of the best-known tokenized gold products and has a clear physical-gold reference asset."],
      ["mid", "Diligence should verify issuer terms, vault custody, attestations, and whether redemption rights apply to the user profile."],
      ["mid", "Liquidity and venue coverage can differ materially from spot-gold market depth."],
      ["low", "Useful as a commodity-backed RWA baseline against PAXG and treasury products."],
    ],
    evidence: {
      identity: [
        ["Asset", "Tether Gold"],
        ["Ticker", "XAUT / XAUt"],
        ["Issuer", "TG Commodities / Tether"],
      ],
      market: [
        ["Underlying", "Physical gold"],
        ["Primary checks", "Issuer terms, vault custody, redemption, contract provenance"],
        ["Risk focus", "Vault claim quality, eligibility, and price-to-spot drift"],
      ],
      links: [
        { label: "Tether Gold FAQ", url: "https://gold.tether.to/faq" },
        { label: "Tether Gold", url: "https://gold.tether.to/" },
      ],
    },
    alternatives: [{ label: "PAXG", reason: "Regulated tokenized-gold comparator" }],
    links: {
      website: "https://gold.tether.to/",
      docs: "https://gold.tether.to/faq",
    },
  },
  {
    id: "paxg",
    label: "PAXG",
    aliases: ["Pax Gold", "Paxos Gold"],
    chain: "Ethereum",
    title: "Paxos Gold",
    risk: 35,
    verdict: "Verify allocation and issuer terms",
    source: "RWA asset profile",
    live: false,
    metrics: {
      issuer: "Paxos Trust Company",
      collateral: "Allocated gold bars",
      liquidity: "Mature gold RWA",
      redemption: "Paxos terms",
      market: "Tokenized gold",
    },
    numbers: {
      liquidityUsd: 9200000,
      volume24h: 2400000,
      pairCount: 11,
      priceChange24h: 0.5,
      confidenceScore: 84,
    },
    confidence: {
      score: 84,
      label: "High confidence",
      summary: "PAXG is a regulated tokenized gold product, but the report still needs reserve, redemption, and custody review.",
      reasons: ["Paxos describes PAXG as backed by one fine troy ounce of London Good Delivery gold held in LBMA vaults."],
    },
    redFlags: [
      {
        tone: "mid",
        label: "Bar allocation and redemption",
        detail: "PAXG has a clear gold-backing model, but practical diligence still depends on allocation lookup, reserve reporting, fees, and redemption workflow.",
        action: "Check Paxos product docs, allocation details, redemption rules, fees, and user eligibility.",
      },
      {
        tone: "mid",
        label: "Gold-market hours and execution",
        detail: "Primary purchase, sale, or redemption behavior can depend on gold-market hours and Paxos platform rules.",
        action: "Separate on-chain venue liquidity from primary issuer redemption and spot-gold execution constraints.",
      },
    ],
    watch: [
      {
        tone: "low",
        label: "Reserve reports",
        value: "Paxos docs",
        detail: "Watch for updated reserve reports, allocation tooling changes, and issuer policy updates.",
      },
      {
        tone: "mid",
        label: "XAUT comparison",
        value: "Gold basis",
        detail: "Track liquidity, redemption, and price-to-spot differences against XAUT.",
      },
    ],
    findings: [
      ["low", "PAXG has a clear commodity backing model and a widely recognized issuer."],
      ["mid", "Reserve reports, bar allocation lookup, redemption rules, and user eligibility should still be checked."],
      ["mid", "Compare venue depth and redemption mechanics against XAUT before treating gold tokens as interchangeable."],
      ["low", "Good benchmark for regulated commodity-backed RWA diligence."],
    ],
    evidence: {
      identity: [
        ["Asset", "Paxos Gold"],
        ["Ticker", "PAXG"],
        ["Issuer", "Paxos Trust Company"],
      ],
      market: [
        ["Underlying", "London Good Delivery gold"],
        ["Primary checks", "Reserve report, bar allocation, redemption, user eligibility"],
        ["Risk focus", "Custody claim, fees, and price-to-spot drift"],
      ],
      links: [
        { label: "Paxos Gold", url: "https://www.paxos.com/paxgold/" },
        { label: "PAXG FAQ", url: "https://www.paxos.com/frequently-asked-questions/paxos-gold" },
      ],
    },
    alternatives: [{ label: "XAUT", reason: "Tokenized-gold comparator with different issuer terms" }],
    links: {
      website: "https://www.paxos.com/paxgold/",
      faq: "https://www.paxos.com/frequently-asked-questions/paxos-gold",
    },
  },
  {
    id: "buidl",
    label: "BUIDL",
    aliases: ["BlackRock BUIDL", "BlackRock USD Institutional Digital Liquidity Fund"],
    chain: "Ethereum / multi-chain",
    title: "BlackRock USD Institutional Digital Liquidity Fund",
    risk: 31,
    verdict: "Institutional fund diligence",
    source: "RWA asset profile",
    live: false,
    metrics: {
      issuer: "BlackRock / Securitize",
      collateral: "Treasury / cash equivalents",
      liquidity: "Qualified investor market",
      redemption: "Fund subscription terms",
      market: "Tokenized money fund",
    },
    numbers: {
      liquidityUsd: 18500000,
      volume24h: 4300000,
      pairCount: 7,
      priceChange24h: 0.1,
      confidenceScore: 88,
    },
    confidence: {
      score: 88,
      label: "High confidence",
      summary: "BUIDL is a high-signal institutional tokenized fund, but access, transfer agent, subscription, redemption, and distribution details matter.",
      reasons: ["BlackRock launched BUIDL with Securitize as transfer agent and tokenization platform for tokenized fund shares."],
    },
    redFlags: [
      {
        tone: "mid",
        label: "Qualified access and transfer restrictions",
        detail: "BUIDL is an institutional tokenized fund, so holder eligibility, subscription documents, and transfer agent records are first-order checks.",
        action: "Review Securitize onboarding, fund documents, transfer restrictions, subscription/redemption process, and distribution mechanics.",
      },
      {
        tone: "mid",
        label: "Yield and NAV are not generic stablecoin traits",
        detail: "Tokenized money fund mechanics differ from stablecoins, including fund terms, yield distribution, custody, and eligible investor rules.",
        action: "Keep BUIDL separate from stablecoin comparisons unless fund documents and holder rights are explicit.",
      },
    ],
    watch: [
      {
        tone: "low",
        label: "Fund document updates",
        value: "Securitize",
        detail: "Watch for new share classes, chain expansions, custodian changes, or subscription/redemption updates.",
      },
      {
        tone: "mid",
        label: "OUSG comparison",
        value: "Treasury funds",
        detail: "Compare holder eligibility, portfolio composition, fees, transferability, and redemption terms against OUSG.",
      },
    ],
    findings: [
      ["low", "BUIDL is one of the strongest reference assets for institutional tokenized fund research."],
      ["mid", "Diligence should verify investor eligibility, transfer restrictions, distribution mechanics, and Securitize records."],
      ["mid", "Compare fund structure, eligible holders, and redemption terms against OUSG and other tokenized treasury products."],
      ["low", "Useful as the benchmark profile for tokenized money-market and treasury-fund workflows."],
    ],
    evidence: {
      identity: [
        ["Asset", "BlackRock USD Institutional Digital Liquidity Fund"],
        ["Ticker", "BUIDL"],
        ["Tokenization platform", "Securitize"],
      ],
      market: [
        ["Underlying", "Institutional liquidity fund exposure"],
        ["Primary checks", "Eligibility, transfer agent records, fund docs, redemption, distribution mechanics"],
        ["Risk focus", "Access restrictions and fund-structure details"],
      ],
      links: [
        { label: "Securitize BUIDL", url: "https://securitize.io/blackrock/buidl" },
        { label: "BUIDL launch release", url: "https://securitize.io/learn/press/blackrock-launches-first-tokenized-fund-buidl-on-the-ethereum-network" },
      ],
    },
    alternatives: [{ label: "OUSG", reason: "Tokenized treasury product with different wrapper and access model" }],
    links: {
      website: "https://securitize.io/blackrock/buidl",
      launch: "https://securitize.io/learn/press/blackrock-launches-first-tokenized-fund-buidl-on-the-ethereum-network",
    },
  },
  {
    id: "ousg",
    label: "OUSG",
    aliases: ["Ondo OUSG", "Ondo Short-Term US Government Treasuries"],
    chain: "Ethereum / Polygon / Solana / XRPL",
    title: "Ondo Short-Term US Government Treasuries",
    risk: 43,
    verdict: "Verify qualified access and redemptions",
    source: "RWA asset profile",
    live: false,
    metrics: {
      issuer: "Ondo Finance",
      collateral: "Short-term US Treasuries",
      liquidity: "Treasury product market",
      redemption: "24/7 tokenized terms",
      market: "Tokenized treasuries",
    },
    numbers: {
      liquidityUsd: 7200000,
      volume24h: 1150000,
      pairCount: 6,
      priceChange24h: 0.1,
      confidenceScore: 76,
    },
    confidence: {
      score: 76,
      label: "Medium confidence",
      summary: "OUSG is a known tokenized treasury product, with access and redemption mechanics that need issuer-doc review.",
      reasons: ["Ondo docs describe OUSG as exposure primarily to short-term US Treasuries and related government securities."],
    },
    redFlags: [
      {
        tone: "mid",
        label: "Qualified access restrictions",
        detail: "OUSG is built for qualified access, so eligibility and legal structure are part of the asset, not a secondary detail.",
        action: "Review Ondo product docs, important notes, jurisdiction restrictions, and legal offering documents.",
      },
      {
        tone: "mid",
        label: "Portfolio and redemption mechanics",
        detail: "The portfolio mix, instant mint/redeem limits, fees, and supported networks can change over time.",
        action: "Check the live Ondo product page and docs before relying on stale TVL, yield, portfolio, or redemption assumptions.",
      },
    ],
    watch: [
      {
        tone: "low",
        label: "Portfolio composition",
        value: "Ondo docs",
        detail: "Watch holdings, fees, yield disclosures, supported chains, and administrator reporting.",
      },
      {
        tone: "mid",
        label: "BUIDL comparison",
        value: "Treasury funds",
        detail: "Compare fund wrapper, access rules, portfolio composition, and redemption windows against BUIDL.",
      },
    ],
    findings: [
      ["low", "OUSG is a credible tokenized treasury reference asset with clear issuer documentation."],
      ["mid", "Access restrictions, supported chains, redemption windows, and bridge assumptions require review."],
      ["mid", "Compare collateral mix, fund wrapper, and qualified-investor requirements against BUIDL."],
      ["low", "Good sample for tokenized treasury research and watch workflows."],
    ],
    evidence: {
      identity: [
        ["Asset", "Ondo Short-Term US Government Treasuries"],
        ["Ticker", "OUSG"],
        ["Issuer", "Ondo Finance / Ondo I LP"],
      ],
      market: [
        ["Underlying", "Short-term US Treasuries and related government securities"],
        ["Primary checks", "Eligibility, legal docs, portfolio composition, mint/redeem limits, supported chains"],
        ["Risk focus", "Qualified access, fund wrapper, redemption limits, and bridge assumptions"],
      ],
      links: [
        { label: "Ondo OUSG", url: "https://ondo.finance/ousg" },
        { label: "OUSG docs", url: "https://docs.ondo.finance/qualified-access-products/ousg" },
      ],
    },
    alternatives: [{ label: "BUIDL", reason: "Institutional tokenized fund comparator" }],
    links: {
      website: "https://ondo.finance/ousg",
      docs: "https://docs.ondo.finance/qualified-access-products/ousg",
    },
  },
  {
    id: "dtsla",
    label: "dTSLA",
    aliases: ["Dinari dShares", "Tesla dShare", "dShares"],
    chain: "Arbitrum / Base / Plume / multi-chain",
    title: "Dinari Tesla dShare",
    risk: 61,
    verdict: "Verify equity backing and market rules",
    source: "RWA asset profile",
    live: false,
    metrics: {
      issuer: "Dinari",
      collateral: "1:1 public equity backing",
      liquidity: "Equity-session dependent",
      redemption: "KYC / broker workflow",
      market: "Tokenized US stock",
    },
    numbers: {
      liquidityUsd: 980000,
      volume24h: 280000,
      pairCount: 4,
      priceChange24h: 1.8,
      confidenceScore: 64,
    },
    confidence: {
      score: 64,
      label: "Medium confidence",
      summary: "Dinari dShares are a known tokenized-equity model, but each ticker needs issuer, backing, corporate action, and redemption review.",
      reasons: ["Dinari describes dShares as tokenized public-market securities that are 1:1 backed."],
    },
    redFlags: [
      {
        tone: "mid",
        label: "Backing and broker workflow",
        detail: "dShares depend on issuer, broker, custodian, KYC, and redemption mechanics rather than only on-chain liquidity.",
        action: "Verify Dinari docs, token contract, backing model, eligible jurisdictions, KYC flow, and redemption process.",
      },
      {
        tone: "mid",
        label: "Market-hours and corporate actions",
        detail: "Tokenized equities can trade outside regular US market hours and must handle dividends, splits, delistings, and other corporate actions.",
        action: "Check Dinari trading hours, price source docs, corporate-action policy, and off-hours liquidity before comparing with TSLA spot equity.",
      },
    ],
    watch: [
      {
        tone: "mid",
        label: "Trading sessions",
        value: "US equities",
        detail: "Watch regular, extended, overnight, and weekend session behavior plus liquidity changes.",
      },
      {
        tone: "mid",
        label: "Corporate actions",
        value: "TSLA",
        detail: "Track how dividends, splits, voting, and other issuer events are handled for the dShare.",
      },
    ],
    findings: [
      ["mid", "dTSLA is a representative Dinari dShare for tokenized US equity research."],
      ["mid", "Diligence should verify backing assets, broker/custodian model, KYC eligibility, and corporate-action handling."],
      ["mid", "Off-hours token trading can diverge from the underlying TSLA market until traditional venues reopen."],
      ["low", "Useful as the tokenized-equities sample alongside treasury and gold products."],
    ],
    evidence: {
      identity: [
        ["Asset", "Dinari Tesla dShare"],
        ["Ticker", "dTSLA"],
        ["Issuer", "Dinari"],
      ],
      market: [
        ["Underlying", "Tesla public equity exposure"],
        ["Primary checks", "Backing assets, broker/custodian model, KYC, corporate actions, redemption"],
        ["Risk focus", "Market-hours drift, eligible jurisdictions, and off-chain settlement workflow"],
      ],
      links: [
        { label: "Dinari dShares", url: "https://dinari.com/dshares" },
        { label: "Dinari trading hours", url: "https://docs.dinari.com/docs/trading-hours" },
      ],
    },
    alternatives: [{ label: "BUIDL", reason: "Institutional fund sample with a different legal and market structure" }],
    links: {
      website: "https://dinari.com/dshares",
      docs: "https://docs.dinari.com/docs/trading-hours",
    },
  },
];

export function findRwaProfile(value) {
  const query = normalize(value)
    .replace(/^(?:dyor\s+)?\/?(?:scan|watch|redflags?)\s+/i, "")
    .trim();
  if (!query) return null;

  const profile =
    profiles.find((item) => {
      const label = normalize(item.label);
      const title = normalize(item.title);
      const aliases = Array.isArray(item.aliases) ? item.aliases.map(normalize) : [];
      return (
        query === label ||
        query === title ||
        aliases.includes(query) ||
        label.includes(query) ||
        title.includes(query) ||
        aliases.some((alias) => alias.includes(query) || query.includes(alias)) ||
        query.includes(label)
      );
    }) || null;

  if (!profile) return null;
  return {
    ...clone(profile),
    updatedAt: new Date().toISOString(),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

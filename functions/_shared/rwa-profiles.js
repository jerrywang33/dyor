const profiles = [
  {
    id: "gold-rwa",
    label: "Gold RWA",
    chain: "Ethereum / multi-chain",
    title: "Tokenized Gold",
    risk: 34,
    verdict: "Verify reserves and redemption",
    source: "RWA category profile",
    live: false,
    metrics: {
      issuer: "Bullion issuer review",
      collateral: "Allocated gold proof",
      liquidity: "Deep market category",
      redemption: "Issuer-specific terms",
      market: "Commodity-linked",
    },
    numbers: {
      liquidityUsd: 6800000,
      volume24h: 2100000,
      pairCount: 12,
      priceChange24h: 0.6,
      confidenceScore: 82,
    },
    confidence: {
      score: 82,
      label: "High confidence",
      summary: "Tokenized gold is a mature RWA category, but each product still depends on issuer, vault, and redemption terms.",
      reasons: ["Compare issuer docs, vault attestations, redemption rules, and contract provenance across XAUT, PAXG, and similar products."],
    },
    redFlags: [
      {
        tone: "mid",
        label: "Reserve proof required",
        detail: "Gold-backed products depend on vault operator, audit cadence, and bar allocation quality.",
        action: "Check latest attestation, custodian, redemption minimums, and whether holders have a direct claim.",
      },
      {
        tone: "mid",
        label: "Issuer-specific redemption",
        detail: "Redemption rights can differ materially even when products track the same commodity.",
        action: "Compare legal terms and redemption paths before treating products as interchangeable.",
      },
    ],
    watch: [
      {
        tone: "low",
        label: "Reserve attestation",
        value: "Issuer docs",
        detail: "Watch for new reserve reports, custodian changes, or legal-terms updates.",
      },
      {
        tone: "mid",
        label: "Price-to-spot drift",
        value: "Gold basis",
        detail: "Compare on-chain price against spot gold and main centralized venues.",
      },
    ],
    findings: [
      ["low", "Tokenized gold has a clear underlying asset class and relatively mature market structure."],
      ["mid", "Reserve proof, vault operator, audit cadence, and redemption minimums must be verified per issuer."],
      ["mid", "Liquidity can fragment across XAUT, PAXG, wrappers, and venue-specific routes."],
      ["low", "This is a useful baseline category for testing commodity-backed RWA workflows."],
    ],
    evidence: {
      identity: [
        ["Category", "Commodity-backed RWA"],
        ["Underlying", "Physical gold"],
        ["Common examples", "XAUT, PAXG, gold-backed wrappers"],
      ],
      market: [
        ["Primary checks", "Reserve attestation, custodian, redemption"],
        ["Risk focus", "Vault claim quality and price-to-spot drift"],
      ],
      links: [],
    },
    alternatives: [],
    links: {},
  },
  {
    id: "openai-preipo-rwa",
    label: "OpenAI Pre-IPO RWA",
    chain: "Private markets / tokenized SPV",
    title: "OpenAI Pre-IPO Exposure",
    risk: 76,
    verdict: "High diligence required",
    source: "RWA category profile",
    live: false,
    metrics: {
      issuer: "SPV/broker identity",
      collateral: "Private share claim",
      liquidity: "Secondary-market limited",
      redemption: "Lockup/transfer limits",
      market: "Private AI equity",
    },
    numbers: {
      liquidityUsd: 0,
      volume24h: 0,
      pairCount: 0,
      priceChange24h: 0,
      confidenceScore: 38,
    },
    confidence: {
      score: 38,
      label: "Low confidence",
      summary: "Pre-IPO exposure is highly document-driven and should not be treated as official company equity unless the legal structure is proven.",
      reasons: ["Verify SPV ownership, transfer restrictions, investor eligibility, valuation basis, and whether the issuer has any direct company relationship."],
    },
    redFlags: [
      {
        tone: "high",
        label: "Official equity claim unproven",
        detail: "A pre-IPO RWA may represent an SPV claim, synthetic exposure, or private secondary interest rather than direct company shares.",
        action: "Require legal docs, SPV ownership proof, transfer restrictions, and issuer identity before relying on the claim.",
      },
      {
        tone: "high",
        label: "Liquidity and eligibility limits",
        detail: "Private-market products often have investor restrictions, lockups, and uncertain secondary liquidity.",
        action: "Review investor eligibility, settlement venue, lockup terms, fees, and exit path.",
      },
    ],
    watch: [
      {
        tone: "high",
        label: "Issuer documentation",
        value: "Legal docs",
        detail: "Watch for updated SPV documents, ownership statements, or changes to transfer restrictions.",
      },
      {
        tone: "mid",
        label: "Valuation basis",
        value: "Private market",
        detail: "Track whether marks are based on actual secondary trades, broker quotes, or model assumptions.",
      },
    ],
    findings: [
      ["high", "Private-company RWA exposure depends on SPV documents, cap-table rights, transfer limits, and custody chain."],
      ["high", "Any product implying direct OpenAI equity should be treated as unverified until legal docs prove the claim."],
      ["mid", "Liquidity is usually limited and may depend on off-chain settlement or private secondary-market access."],
      ["mid", "Valuation, fees, lockups, and investor eligibility are first-order diligence items."],
    ],
    evidence: {
      identity: [
        ["Category", "Private-market / pre-IPO RWA"],
        ["Underlying", "Claim on private-company exposure"],
        ["Structure", "SPV, broker ledger, or synthetic wrapper"],
      ],
      market: [
        ["Primary checks", "Legal docs, ownership proof, transfer rules"],
        ["Risk focus", "Eligibility, lockups, valuation basis, and liquidity"],
      ],
      links: [],
    },
    alternatives: [],
    links: {},
  },
  {
    id: "us-equities-rwa",
    label: "U.S. Equities RWA",
    chain: "Tokenized brokerage / multi-chain",
    title: "Tokenized U.S. Equities",
    risk: 58,
    verdict: "Check broker and custody model",
    source: "RWA category profile",
    live: false,
    metrics: {
      issuer: "Broker/depository mapping",
      collateral: "Share custody proof",
      liquidity: "Session dependent",
      redemption: "KYC and market hours",
      market: "Equity-linked",
    },
    numbers: {
      liquidityUsd: 1250000,
      volume24h: 360000,
      pairCount: 5,
      priceChange24h: 1.1,
      confidenceScore: 58,
    },
    confidence: {
      score: 58,
      label: "Medium confidence",
      summary: "Tokenized equities can be researchable, but broker, depository, transfer-agent, and redemption models vary materially.",
      reasons: ["Check whether the token represents direct share ownership, synthetic exposure, a broker ledger claim, or a wrapper with limited redemption."],
    },
    redFlags: [
      {
        tone: "mid",
        label: "Ownership model varies",
        detail: "Tokenized equities may represent direct beneficial ownership, broker claims, synthetic exposure, or wrapped settlement rights.",
        action: "Verify broker, custodian, transfer-agent, and corporate-action handling.",
      },
      {
        tone: "mid",
        label: "Market-hours and redemption constraints",
        detail: "24/7 token trading can diverge from underlying market hours, creating price-to-NAV and settlement risk.",
        action: "Review redemption windows, KYC rules, jurisdiction restrictions, and market-hour behavior.",
      },
    ],
    watch: [
      {
        tone: "mid",
        label: "Corporate actions",
        value: "Dividends/splits",
        detail: "Track how the issuer handles dividends, splits, delistings, and shareholder events.",
      },
      {
        tone: "mid",
        label: "NAV drift",
        value: "Equity market",
        detail: "Watch token price against underlying shares during and outside U.S. market hours.",
      },
    ],
    findings: [
      ["mid", "U.S. equities RWA products require broker, custody, and corporate-action handling review."],
      ["mid", "Market hours, KYC restrictions, jurisdictional access, and redemption paths can dominate user experience."],
      ["mid", "Price-to-NAV drift and off-chain settlement risk should be watched during volatile sessions."],
      ["low", "This category is a strong fit for comparison workflows across issuer models and venue design."],
    ],
    evidence: {
      identity: [
        ["Category", "Tokenized public equities"],
        ["Underlying", "U.S. listed shares or equity-linked claims"],
        ["Structure", "Broker custody, depository receipt, or synthetic wrapper"],
      ],
      market: [
        ["Primary checks", "Broker, custodian, redemption, corporate actions"],
        ["Risk focus", "Market hours, KYC, jurisdiction, NAV drift"],
      ],
      links: [],
    },
    alternatives: [],
    links: {},
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
      return query === label || query === title || label.includes(query) || title.includes(query) || query.includes(label);
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

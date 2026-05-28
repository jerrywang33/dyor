export function buildComparison(left, right) {
  const leftScore = comparisonScore(left);
  const rightScore = comparisonScore(right);
  const delta = Math.round((leftScore - rightScore) * 10) / 10;
  const leader = Math.abs(delta) < 4 ? "neutral" : delta > 0 ? "left" : "right";
  const leaderReport = leader === "left" ? left : leader === "right" ? right : null;
  const deltas = comparisonDeltas(left, right);

  return {
    id: `compare-${left.id}-vs-${right.id}`.slice(0, 120),
    kind: "compare",
    label: `${left.label} vs ${right.label}`,
    title: `${left.title} vs ${right.title}`,
    verdict: comparisonVerdict(leaderReport, left, right),
    summary: comparisonSummary(leaderReport, left, right, deltas),
    source:
      left.source === right.source
        ? left.source || "RWA research"
        : `${left.source || "RWA research"} + ${right.source || "RWA research"}`,
    updatedAt: new Date().toISOString(),
    scores: {
      left: leftScore,
      right: rightScore,
      delta,
      leader,
    },
    left,
    right,
    deltas,
    findings: comparisonFindings(left, right, leaderReport, deltas),
  };
}

export function comparisonScore(report) {
  const liquidity = number(report.numbers?.liquidityUsd);
  const pairCount = number(report.numbers?.pairCount);
  const confidence = number(report.confidence?.score);
  const liquidityScore = Math.min(20, Math.log10(liquidity + 1) * 2.8);
  const marketCoverage = Math.min(8, pairCount);

  return Math.round(
    clamp((100 - number(report.risk)) * 0.58 + confidence * 0.28 + liquidityScore + marketCoverage, 0, 100) * 10,
  ) / 10;
}

function comparisonDeltas(left, right) {
  return [
    lowerWins("Risk score", left.risk, right.risk, "lower"),
    higherWins("Identity confidence", left.confidence?.score, right.confidence?.score, "higher"),
    higherWins("Liquidity", left.numbers?.liquidityUsd, right.numbers?.liquidityUsd, "higher", money),
    higherWins("24h volume", left.numbers?.volume24h, right.numbers?.volume24h, "context", money),
    higherWins("Market coverage", left.numbers?.pairCount, right.numbers?.pairCount, "higher", (value) => {
      const count = number(value);
      return `${count} pool${count === 1 ? "" : "s"}`;
    }),
  ];
}

function lowerWins(label, leftValue, rightValue, bias, formatter = integer) {
  const left = number(leftValue);
  const right = number(rightValue);
  const difference = right - left;
  return {
    label,
    left: formatter(left),
    right: formatter(right),
    bias,
    leader: Math.abs(difference) < 1 ? "neutral" : difference > 0 ? "left" : "right",
    delta: Math.round(difference * 100) / 100,
  };
}

function higherWins(label, leftValue, rightValue, bias, formatter = integer) {
  const left = number(leftValue);
  const right = number(rightValue);
  const difference = left - right;
  return {
    label,
    left: formatter(left),
    right: formatter(right),
    bias,
    leader: Math.abs(difference) < 1 ? "neutral" : difference > 0 ? "left" : "right",
    delta: Math.round(difference * 100) / 100,
  };
}

function comparisonVerdict(leaderReport, left, right) {
  if (!leaderReport) {
    return "No clear research edge";
  }
  return `${leaderReport.label} has the cleaner first-pass profile`;
}

function comparisonSummary(leaderReport, left, right, deltas) {
  if (!leaderReport) {
    return `${left.label} and ${right.label} are close on the live RWA market evidence. Treat this as a research queue, not a ranking signal.`;
  }

  const wins = deltas.filter((item) => item.leader !== "neutral").filter((item) => {
    return item.leader === (leaderReport === left ? "left" : "right");
  });
  const signal = wins[0]?.label?.toLowerCase() || "market structure";
  return `${leaderReport.label} leads this pass on ${signal}. Verify issuer identity, asset contract, docs, and canonical links before using ticker-level conclusions.`;
}

function comparisonFindings(left, right, leaderReport, deltas) {
  const findings = [];
  const leaderSide = leaderReport === left ? "left" : leaderReport === right ? "right" : "neutral";
  const riskLeader = deltas.find((item) => item.label === "Risk score")?.leader;
  const confidenceLeader = deltas.find((item) => item.label === "Identity confidence")?.leader;
  const liquidityLeader = deltas.find((item) => item.label === "Liquidity")?.leader;

  if (leaderSide === "neutral") {
    findings.push(["mid", "Composite scores are close; review both reports instead of treating one RWA asset as clearly cleaner."]);
  } else {
    findings.push(["low", `${leaderReport.label} has the stronger composite profile across live RWA market risk, issuer confidence, and market depth.`]);
  }

  if (riskLeader !== "neutral") {
    const winner = riskLeader === "left" ? left : right;
    findings.push(["low", `${winner.label} carries the lower live risk score in this comparison.`]);
  }

  if (confidenceLeader !== "neutral") {
    const winner = confidenceLeader === "left" ? left : right;
    findings.push(["mid", `${winner.label} has stronger issuer confidence; still verify the asset contract against official links and docs.`]);
  }

  if (liquidityLeader !== "neutral") {
    const winner = liquidityLeader === "left" ? left : right;
    findings.push(["low", `${winner.label} shows deeper matched liquidity on the selected RWA market set.`]);
  }

  findings.push(["mid", "Comparison is based on market and source evidence only; issuer docs, reserve/collateral proof, redemption terms, custody, and holder checks remain follow-up surfaces."]);

  return findings.slice(0, 5);
}

function integer(value) {
  return String(Math.round(number(value)));
}

function money(value) {
  const amount = number(value);
  if (!amount) return "$0";
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: amount < 10_000 ? 2 : 1,
  }).format(amount)}`;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

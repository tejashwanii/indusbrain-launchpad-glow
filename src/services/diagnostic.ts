export interface DiagnosticAction {
  label: string;
  primary?: boolean;
}

export interface DiagnosticInsight {
  kind: string;
  category: string;
  title: string;
  description: string;
  timing: string;
  severity: "high" | "medium" | "low";
  actions: string[];
}

export interface DiagnosticResponse {
  insights: DiagnosticInsight[];
  message?: string | null;
}

export type InsightCategory =
  | "preventive-maintenance"
  | "risk-mitigation"
  | "safety"
  | "inspection"
  | "compliance"
  | "general";

export interface InsightPresentation {
  category: InsightCategory;
  categoryLabel: string;
  badgeClass: string;
  title: string;
  body: string;
  metaLabel: string;
  metaValue: string;
  actions: DiagnosticAction[];
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const CATEGORY_TOKENS: Record<InsightCategory, RegExp[]> = {
  "preventive-maintenance": [/maintenance/i, /service/i, /replace/i, /replacement/i, /lubric/i, /oil/i, /seal/i],
  "risk-mitigation": [/risk/i, /failure/i, /fault/i, /degradation/i, /overheat/i, /leak/i, /vibration/i],
  safety: [/safety/i, /hazard/i, /incident/i, /protect/i, /evacuation/i],
  inspection: [/inspection/i, /inspect/i, /check/i, /monitor/i, /test/i],
  compliance: [/compliance/i, /standard/i, /audit/i, /procedure/i, /regulation/i],
  general: [],
};

export function presentInsight(insight: DiagnosticInsight): InsightPresentation {
  const category = classifyInsight(insight);
  const title = formatTitle(insight.title, insight.description, category);
  const body = formatBody(insight.description);
  const metadata = formatMetadata(insight);
  const actions = buildContextualActions(category);

  return {
    category,
    categoryLabel: getCategoryLabel(category),
    badgeClass: getBadgeClass(category),
    title,
    body,
    metaLabel: metadata.label,
    metaValue: metadata.value,
    actions,
  };
}

function classifyInsight(insight: DiagnosticInsight): InsightCategory {
  const declaredCategory = insight.category.toLowerCase();
  if (declaredCategory.includes("preventive") || declaredCategory.includes("maintenance")) return "preventive-maintenance";
  if (declaredCategory.includes("risk")) return "risk-mitigation";
  if (declaredCategory.includes("safety")) return "safety";
  if (declaredCategory.includes("inspection")) return "inspection";
  if (declaredCategory.includes("compliance")) return "compliance";

  const text = `${insight.title} ${insight.description} ${insight.timing}`.toLowerCase();

  for (const [category, tokens] of Object.entries(CATEGORY_TOKENS) as [InsightCategory, RegExp[]][]) {
    if (tokens.some((token) => token.test(text))) {
      return category;
    }
  }

  if (insight.severity === "high") {
    return "risk-mitigation";
  }

  return "general";
}

function getCategoryLabel(category: InsightCategory): string {
  switch (category) {
    case "preventive-maintenance":
      return "Preventive Maintenance";
    case "risk-mitigation":
      return "Risk Mitigation";
    case "safety":
      return "Safety";
    case "inspection":
      return "Inspection";
    case "compliance":
      return "Compliance";
    default:
      return "General";
  }
}

function getBadgeClass(category: InsightCategory): string {
  switch (category) {
    case "preventive-maintenance":
      return "bg-amber-500/10 text-amber-700 border-amber-500/25";
    case "risk-mitigation":
      return "bg-rose-500/10 text-rose-700 border-rose-500/25";
    case "safety":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/25";
    case "inspection":
      return "bg-cyan-500/10 text-cyan-700 border-cyan-500/25";
    case "compliance":
      return "bg-violet-500/10 text-violet-700 border-violet-500/25";
    default:
      return "bg-secondary text-muted-foreground border-border-subtle";
  }
}

function formatTitle(title: string, body: string, category: InsightCategory): string {
  const cleaned = title.trim().replace(/\s+/g, " ");
  if (cleaned && !/^(perform|verify|measure|inspect|replace|check|ensure|follow|schedule)\b|maintenance insight|recommended action|ai diagnostic/i.test(cleaned)) {
    const compact = cleaned.replace(/^(recommended|important|priority|action|inspection|safety|risk|maintenance)\s+/i, "").trim();
    if (compact.length <= 56) {
      return compact;
    }
  }

  const normalizedBody = body.trim().replace(/\s+/g, " ");
  if (/oil|seal/i.test(normalizedBody)) {
    return "Hydraulic Oil and Seal Maintenance Schedule";
  }
  if (/vibration|bearing temperature/i.test(normalizedBody)) {
    return "Vibration and Bearing Temperature Thresholds";
  }
  if (/inlet filter|filter replacement/i.test(normalizedBody)) {
    return "Inlet Filter Replacement";
  }
  if (category === "risk-mitigation") {
    return "Critical Risk Follow-Up";
  }
  if (category === "safety") {
    return "Safety Procedures Before Maintenance";
  }
  if (category === "compliance") {
    return "Compliance Follow-Up";
  }
  if (category === "inspection") {
    return "Inspection Priority";
  }
  if (category === "preventive-maintenance") {
    return "Maintenance Priority";
  }
  return "Operational Insight";
}

function formatBody(body: string): string {
  const cleaned = body.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return "No additional guidance was provided for this asset.";
  }

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 2) {
    return `${toInsightSentence(sentences[0])} ${toInsightSentence(sentences[1])}`;
  }

  if (cleaned.length <= 140) {
    return toInsightSentence(cleaned);
  }

  return `${toInsightSentence(cleaned.slice(0, 137).trimEnd())}…`;
}

function toInsightSentence(sentence: string): string {
  const match = sentence.match(/^(perform|verify|measure|inspect|replace|check|ensure|follow|schedule)\s+(.+)/i);
  if (!match) return sentence;

  return `The documentation highlights ${match[2].replace(/\.$/, "")}.`;
}

function formatMetadata(insight: DiagnosticInsight): { label: string; value: string } {
  const sourceText = `${insight.timing} ${insight.description}`.toLowerCase();
  const intervalMatches = sourceText.match(/\b(\d+)\s*(day|days|week|weeks|month|months|year|years)\b/g) ?? [];
  const intervals = intervalMatches
    .map((match) => match.trim())
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3);

  if (intervals.length > 0) {
    return {
      label: "Inspection Interval",
      value: intervals.map((entry) => normalizeInterval(entry)).join(" • "),
    };
  }

  if (/before maintenance/.test(sourceText)) {
    return {
      label: "Recommended Timing",
      value: "Before Maintenance",
    };
  }

  if (/during operation/.test(sourceText)) {
    return {
      label: "Monitoring",
      value: "During Operation",
    };
  }

  if (/next shift|next cycle|weekly|monthly|quarterly|seasonal/.test(sourceText)) {
    return {
      label: "Recommended Timing",
      value: "Next Review Window",
    };
  }

  return {
    label: "Monitoring",
    value: "During Operation",
  };
}

function normalizeInterval(entry: string): string {
  const normalized = entry.trim().toLowerCase();
  const match = normalized.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/);
  if (!match) {
    return entry;
  }

  const amount = match[1];
  const unit = match[2];
  const singular = Number(amount) === 1;

  if (unit.startsWith("day")) {
    return `${amount} day${singular ? "" : "s"}`;
  }
  if (unit.startsWith("week")) {
    return `${amount} week${singular ? "" : "s"}`;
  }
  if (unit.startsWith("month")) {
    return singular ? "Monthly" : `${amount} months`;
  }
  if (unit.startsWith("year")) {
    return singular ? "Yearly" : `${amount} years`;
  }

  return entry;
}

function buildContextualActions(category: InsightCategory): DiagnosticAction[] {
  switch (category) {
    case "preventive-maintenance":
      return [
        { label: "Open SOP", primary: true },
        { label: "Schedule Maintenance" },
      ];
    case "risk-mitigation":
      return [
        { label: "Run Diagnostic", primary: true },
        { label: "Open SOP" },
      ];
    case "safety":
      return [
        { label: "View Safety Procedure", primary: true },
        { label: "Compliance Checklist" },
      ];
    case "inspection":
      return [
        { label: "Open SOP", primary: true },
        { label: "Schedule Inspection" },
      ];
    case "compliance":
      return [
        { label: "View Safety Procedure", primary: true },
        { label: "Compliance Checklist" },
      ];
    default:
      return [{ label: "Ask AI", primary: true }];
  }
}

export async function getDiagnostics(): Promise<DiagnosticResponse> {
  const response = await fetch(`${API_URL}/diagnostic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Unable to load diagnostics.");
  }

  return response.json();
}

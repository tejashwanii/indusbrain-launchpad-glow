import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  BrainCircuit,
  ChevronRight,
  Download,
  FileText,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Share2,
  Upload,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "AI Assistant", icon: MessageSquare },
  { label: "Knowledge Hub", icon: BookOpen },
  { label: "Upload Documents", icon: Upload },
  { label: "Knowledge Graph", icon: Share2 },
  { label: "Compliance Center", icon: ShieldCheck },
  { label: "Maintenance Intelligence", icon: Wrench },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

function Dashboard() {
  return (
    <div className="min-h-screen flex bg-surface-muted text-brand-deep font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="p-8 space-y-6 overflow-y-auto">
          <PageHeader />
          <KpiRow />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <AssetFeed />
              <TelemetryChart />
            </div>
            <div className="space-y-6">
              <CriticalComponents />
              <KnowledgeBaseCard />
              <KnowledgeGraphPreview />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border-subtle bg-card flex flex-col">
      <div className="p-6 border-b border-border-subtle flex items-center gap-3">
        <div className="size-9 rounded-md bg-brand-primary text-brand-primary-foreground font-bold grid place-items-center tracking-tight">
          IB
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-lg tracking-tight">IndusBrain</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            ops · v4.2
          </span>
        </div>
      </div>

      <nav className="p-4 space-y-1 flex-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href="#"
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                item.active
                  ? "bg-brand-primary/5 text-brand-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-brand-deep",
              ].join(" ")}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
              {item.active && (
                <span className="ml-auto size-1.5 rounded-full bg-brand-primary" />
              )}
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-subtle">
        <div className="rounded-lg bg-brand-deep p-3 text-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              AI Engine
            </p>
            <span className="size-2 rounded-full bg-brand-accent status-pulse" />
          </div>
          <p className="text-sm font-medium mt-1">Engine Optimal</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
            14.2k signals / min
          </p>
          <div className="mt-2 h-1 w-full bg-slate-700/70 rounded-full overflow-hidden">
            <div className="h-full bg-brand-accent w-3/4" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="h-16 shrink-0 border-b border-border-subtle bg-card flex items-center justify-between px-8">
      <div className="flex items-center gap-3 text-sm font-medium">
        <span className="text-muted-foreground">Production Floor</span>
        <ChevronRight className="size-3.5 text-slate-300" />
        <span className="text-muted-foreground">Rotterdam Refinery</span>
        <ChevronRight className="size-3.5 text-slate-300" />
        <span className="text-brand-deep">Assembly Line 4A</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ask IndusBrain — sensor, asset, procedure…"
            className="pl-9 pr-16 py-1.5 bg-secondary rounded-full text-sm border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/25 w-80 transition-all placeholder:text-muted-foreground"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-card border border-border-subtle rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>

        <button
          type="button"
          className="relative size-9 grid place-items-center rounded-full hover:bg-secondary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-4 text-brand-deep" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-brand-accent" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
          <div className="size-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-deep grid place-items-center text-white text-xs font-semibold">
            EM
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-xs font-semibold">Elena Morales</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Ops Engineer
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function PageHeader() {
  return (
    <div className="flex justify-between items-end gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-success bg-success/10 px-2 py-1 rounded">
            <span className="size-1.5 rounded-full bg-success status-pulse" />
            Live Monitoring
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            Shift · 08:00 – 20:00 UTC
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">IndusBrain Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Real-time synthesis of sensor telemetry, maintenance logs, and 20+ years of
          plant documentation.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button className="inline-flex items-center gap-2 bg-card border border-border-subtle px-3.5 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-secondary transition-colors">
          <Download className="size-4" />
          Export Report
        </button>
        <button className="inline-flex items-center gap-2 bg-brand-deep text-white px-3.5 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-brand-deep/90 transition-colors">
          <BrainCircuit className="size-4" />
          Run Diagnostic
        </button>
      </div>
    </div>
  );
}

type Kpi = {
  label: string;
  value: string;
  delta: string;
  deltaTone: "positive" | "neutral" | "warning";
  sub: string;
  spark: number[];
};

const KPIS: Kpi[] = [
  {
    label: "Total Knowledge Documents",
    value: "12,480",
    delta: "+184",
    deltaTone: "positive",
    sub: "indexed this week",
    spark: [30, 34, 38, 42, 45, 50, 54, 58, 62, 66, 70, 74],
  },
  {
    label: "Total Assets",
    value: "3,214",
    delta: "+12",
    deltaTone: "positive",
    sub: "across 8 sites",
    spark: [50, 52, 54, 55, 57, 58, 60, 62, 64, 65, 67, 68],
  },
  {
    label: "Compliance Score",
    value: "96.4%",
    delta: "↑ 0.8",
    deltaTone: "positive",
    sub: "ISO 55000 · IEC 61511",
    spark: [70, 72, 74, 73, 75, 76, 78, 79, 80, 82, 83, 84],
  },
  {
    label: "Pending Maintenance",
    value: "27",
    delta: "5 overdue",
    deltaTone: "warning",
    sub: "work orders open",
    spark: [22, 24, 26, 25, 28, 30, 28, 26, 27, 29, 28, 27],
  },
  {
    label: "AI Queries Today",
    value: "1,842",
    delta: "+14%",
    deltaTone: "positive",
    sub: "avg 2.1s response",
    spark: [40, 45, 50, 55, 58, 62, 66, 70, 74, 78, 82, 88],
  },
];

function KpiRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
      {KPIS.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const deltaClass =
    kpi.deltaTone === "positive"
      ? "text-success"
      : kpi.deltaTone === "warning"
      ? "text-brand-accent"
      : "text-muted-foreground";
  const valueClass =
    kpi.label === "Pending Maintenance" ? "text-brand-accent" : "text-brand-deep";

  return (
    <div className="bg-card p-5 rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          {kpi.label}
        </p>
        <ArrowUpRight className="size-3.5 text-muted-foreground/60" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-3xl font-bold font-mono ${valueClass}`}>{kpi.value}</span>
        <span className={`text-xs font-bold font-mono ${deltaClass}`}>{kpi.delta}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">
        {kpi.sub}
      </p>
      <Sparkline points={kpi.spark} accent={kpi.label === "Pending Maintenance"} />
    </div>
  );
}

function Sparkline({ points, accent }: { points: number[]; accent?: boolean }) {
  const width = 220;
  const height = 40;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = accent ? "var(--brand-accent)" : "var(--brand-primary)";
  const fill = accent ? "var(--brand-accent)" : "var(--brand-primary)";
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 w-full h-10 opacity-90"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient
          id={`sg-${accent ? "a" : "p"}`}
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop offset="0%" stopColor={fill} stopOpacity="0.35" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L${width},${height} L0,${height} Z`}
        fill={`url(#sg-${accent ? "a" : "p"})`}
      />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.75" />
    </svg>
  );
}

type FeedItem = {
  kind: "AI" | "LOG" | "SAFE";
  title: string;
  body: string;
  time: string;
  severity?: "critical" | "warning" | "info";
  actions?: { label: string; primary?: boolean }[];
};

const FEED: FeedItem[] = [
  {
    kind: "AI",
    title: "Predictive Alert · Hydraulic Pump H1-2",
    body: "Vibration patterns match signature 0xFF4 (Bearing Wear). Maintenance suggested within 48 operational hours to avoid catastrophic downtime.",
    time: "14:22 UTC · Line 4A",
    severity: "critical",
    actions: [
      { label: "Schedule Inspection", primary: true },
      { label: "View Sensor Logs" },
    ],
  },
  {
    kind: "AI",
    title: "Knowledge Match · SOP-2145",
    body: "Copilot linked incident #8842 to Standard Operating Procedure 2145 (Rev. 7). Recommended isolation sequence attached.",
    time: "13:47 UTC · Rotterdam",
    severity: "warning",
    actions: [{ label: "Open Procedure", primary: true }, { label: "Dismiss" }],
  },
  {
    kind: "LOG",
    title: "System Optimization Update",
    body: "AI recalibrated cooling cycle for Unit 4B based on ambient humidity shifts. Energy efficiency improved by 2.1%.",
    time: "12:10 UTC · Auto",
    severity: "info",
  },
];

function AssetFeed() {
  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm overflow-hidden">
      <header className="p-4 border-b border-border-subtle bg-secondary/40 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-brand-primary" />
          <h2 className="font-bold text-sm">Intelligent Asset Feed</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            42 assets · 3 flagged
          </span>
          <button className="text-[10px] font-bold uppercase tracking-wider text-brand-primary hover:underline">
            View all
          </button>
        </div>
      </header>

      <ul className="divide-y divide-border-subtle">
        {FEED.map((item, idx) => (
          <FeedRow key={idx} item={item} />
        ))}
      </ul>
    </section>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const badgeClass =
    item.severity === "critical"
      ? "bg-brand-accent/10 text-brand-accent border-brand-accent/30"
      : item.severity === "warning"
      ? "bg-brand-primary/10 text-brand-primary border-brand-primary/25"
      : "bg-secondary text-muted-foreground border-border-subtle";
  return (
    <li className="p-5 flex gap-4">
      <div
        className={`size-10 rounded-md border grid place-items-center shrink-0 text-[10px] font-mono font-bold ${badgeClass}`}
      >
        {item.kind}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-semibold text-brand-deep">{item.title}</p>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            {item.time}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {item.body}
        </p>
        {item.actions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.actions.map((a) => (
              <button
                key={a.label}
                className={
                  a.primary
                    ? "text-xs bg-brand-primary text-brand-primary-foreground px-3 py-1.5 rounded-md font-semibold hover:bg-brand-primary/90 transition-colors"
                    : "text-xs bg-secondary text-brand-deep px-3 py-1.5 rounded-md font-semibold border border-border-subtle hover:bg-card transition-colors"
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/** Real SVG telemetry chart — three variables over 24h */
function TelemetryChart() {
  const width = 800;
  const height = 260;
  const padL = 40;
  const padR = 16;
  const padT = 24;
  const padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  // 25 points across 24h
  const throughput = [58, 60, 61, 64, 66, 68, 70, 72, 74, 71, 76, 78, 74, 70, 66, 68, 72, 76, 80, 82, 79, 74, 70, 68, 66];
  const pressure = [52, 55, 54, 58, 60, 63, 61, 66, 70, 68, 66, 60, 55, 62, 66, 70, 68, 64, 60, 62, 66, 63, 60, 58, 56];
  const vibration = [22, 24, 21, 25, 27, 26, 28, 30, 32, 34, 30, 28, 26, 27, 29, 45, 60, 42, 32, 30, 28, 27, 26, 24, 23];

  const toPath = (arr: number[]) => {
    const step = innerW / (arr.length - 1);
    return arr
      .map((v, i) => {
        const x = padL + i * step;
        const y = padT + innerH - (v / 100) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const gridLines = [0, 25, 50, 75, 100];
  const hours = ["00", "04", "08", "12", "16", "20", "24"];

  // anomaly at index 15-16
  const step = innerW / (vibration.length - 1);
  const anomalyX = padL + 15 * step;

  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm overflow-hidden">
      <header className="p-4 border-b border-border-subtle flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-2">
          <LineChart className="size-4 text-brand-primary" />
          <h2 className="font-bold text-sm">Real-time Telemetry · Line 4A</h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
          <Legend color="var(--brand-primary)" label="Throughput" />
          <Legend color="var(--brand-deep)" label="Pressure" />
          <Legend color="var(--brand-accent)" label="Vibration" dashed />
          <div className="flex gap-1 ml-2">
            {["24H", "7D", "30D"].map((t, i) => (
              <button
                key={t}
                className={`px-2 py-1 rounded ${
                  i === 0
                    ? "bg-brand-deep text-white"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64"
          role="img"
          aria-label="Telemetry chart: throughput, pressure, and vibration over 24 hours"
        >
          <defs>
            <linearGradient id="tp-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid */}
          {gridLines.map((g) => {
            const y = padT + innerH - (g / 100) * innerH;
            return (
              <g key={g}>
                <line
                  x1={padL}
                  x2={width - padR}
                  y1={y}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="2 4"
                />
                <text
                  x={padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                >
                  {g}
                </text>
              </g>
            );
          })}

          {/* anomaly band */}
          <rect
            x={anomalyX - step * 0.5}
            y={padT}
            width={step * 1.5}
            height={innerH}
            fill="var(--brand-accent)"
            opacity="0.06"
          />
          <line
            x1={anomalyX}
            x2={anomalyX}
            y1={padT}
            y2={padT + innerH}
            stroke="var(--brand-accent)"
            strokeDasharray="3 3"
            opacity="0.6"
          />

          {/* Throughput area + line */}
          <path
            d={`${toPath(throughput)} L${width - padR},${padT + innerH} L${padL},${
              padT + innerH
            } Z`}
            fill="url(#tp-fill)"
          />
          <path
            d={toPath(throughput)}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="2"
            className="chart-line-draw"
            style={{ ["--dash-len" as string]: "2400" }}
          />

          {/* Pressure line */}
          <path
            d={toPath(pressure)}
            fill="none"
            stroke="var(--brand-deep)"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* Vibration line (dashed) */}
          <path
            d={toPath(vibration)}
            fill="none"
            stroke="var(--brand-accent)"
            strokeWidth="1.75"
            strokeDasharray="4 3"
          />

          {/* Anomaly marker dot */}
          <circle
            cx={anomalyX}
            cy={padT + innerH - (60 / 100) * innerH}
            r="4"
            fill="var(--brand-accent)"
            stroke="white"
            strokeWidth="2"
          />

          {/* x-axis hours */}
          {hours.map((h, i) => {
            const x = padL + (innerW / (hours.length - 1)) * i;
            return (
              <text
                key={h}
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                {h}:00
              </text>
            );
          })}
        </svg>

        <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3 text-[11px] font-mono">
          <span className="text-muted-foreground">
            Anomaly detected · 15:00 UTC · vibration spike +82% above baseline
          </span>
          <button className="text-brand-primary font-semibold hover:underline">
            Investigate →
          </button>
        </div>
      </div>
    </section>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <svg width="18" height="6" aria-hidden>
        <line
          x1="0"
          y1="3"
          x2="18"
          y2="3"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "4 2" : undefined}
        />
      </svg>
      {label}
    </span>
  );
}

const COMPONENTS: {
  name: string;
  location: string;
  metric: string;
  health: number;
  tone: "ok" | "warn" | "crit";
}[] = [
  { name: "Turbine 01", location: "North Bay", metric: "4,208 RPM", health: 100, tone: "ok" },
  { name: "Conveyor Motor", location: "Line 4A", metric: "122 A", health: 92, tone: "ok" },
  { name: "Main Compressor", location: "Utilities", metric: "6.4 bar", health: 45, tone: "warn" },
  { name: "Hydraulic Pump H1-2", location: "Line 4A", metric: "0.72 ips", health: 28, tone: "crit" },
  { name: "Heat Exchanger E-03", location: "Refinery", metric: "142°F", health: 88, tone: "ok" },
];

function CriticalComponents() {
  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm">Critical Components</h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Fleet · 42
        </span>
      </div>
      <ul className="space-y-3.5">
        {COMPONENTS.map((c) => {
          const bar =
            c.tone === "crit"
              ? "bg-brand-accent"
              : c.tone === "warn"
              ? "bg-brand-accent/70"
              : "bg-success";
          return (
            <li key={c.name} className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brand-deep truncate">
                  {c.name}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  {c.location} · {c.metric}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bar}`}
                    style={{ width: `${c.health}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-brand-deep w-8 text-right">
                  {c.health}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function KnowledgeBaseCard() {
  const suggestions = [
    "How to reset H1-2 pump?",
    "SOP for cooling cycle recalibration",
    "Bearing wear · signature 0xFF4",
  ];
  return (
    <section className="bg-brand-deep rounded-xl p-5 text-white shadow-sm relative overflow-hidden">
      <div className="absolute -top-8 -right-8 size-32 rounded-full bg-brand-primary/20 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-brand-accent" />
          <h3 className="text-sm font-bold">Ask IndusBrain AI</h3>
        </div>
        <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">
          Query 20+ years of plant documentation, maintenance logs, and blueprints via
          natural language.
        </p>

        <div className="flex gap-2 p-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur">
          <input
            type="text"
            placeholder="Ask about any asset, procedure, or incident…"
            className="bg-transparent border-none text-xs flex-1 focus:outline-none placeholder:text-slate-500 text-white"
          />
          <button
            type="button"
            className="size-7 shrink-0 bg-brand-primary rounded-md grid place-items-center hover:bg-brand-primary/90 transition-colors"
            aria-label="Send query"
          >
            <Send className="size-3.5" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
            Trending queries
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((s) => (
              <li key={s}>
                <button className="text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-left">
                  <Search className="size-3 text-slate-500" />
                  <span className="truncate">{s}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function KnowledgeGraphPreview() {
  // Node graph: central IndusBrain node with domain clusters
  const width = 400;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;

  type Node = { id: string; label: string; x: number; y: number; r: number; tone: "core" | "primary" | "accent" | "muted" };
  const nodes: Node[] = [
    { id: "core", label: "IndusBrain", x: cx, y: cy, r: 26, tone: "core" },
    { id: "assets", label: "Assets", x: cx - 130, y: cy - 90, r: 16, tone: "primary" },
    { id: "sops", label: "SOPs", x: cx + 130, y: cy - 90, r: 16, tone: "primary" },
    { id: "compliance", label: "Compliance", x: cx + 140, y: cy + 70, r: 16, tone: "accent" },
    { id: "maint", label: "Maintenance", x: cx - 140, y: cy + 80, r: 16, tone: "primary" },
    { id: "sensors", label: "Sensors", x: cx, y: cy - 140, r: 12, tone: "muted" },
    { id: "docs", label: "Documents", x: cx, y: cy + 140, r: 12, tone: "muted" },
    { id: "vendors", label: "Vendors", x: cx - 165, y: cy - 10, r: 11, tone: "muted" },
    { id: "incidents", label: "Incidents", x: cx + 165, y: cy - 10, r: 11, tone: "muted" },
  ];
  const edges: [string, string][] = [
    ["core", "assets"], ["core", "sops"], ["core", "compliance"],
    ["core", "maint"], ["core", "sensors"], ["core", "docs"],
    ["core", "vendors"], ["core", "incidents"],
    ["assets", "sensors"], ["assets", "maint"], ["sops", "compliance"],
    ["maint", "incidents"], ["sops", "docs"], ["compliance", "docs"],
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const fillFor = (tone: Node["tone"]) =>
    tone === "core"
      ? "var(--brand-deep)"
      : tone === "primary"
      ? "var(--brand-primary)"
      : tone === "accent"
      ? "var(--brand-accent)"
      : "var(--card)";
  const strokeFor = (tone: Node["tone"]) =>
    tone === "muted" ? "var(--border-subtle)" : fillFor(tone);
  const textFill = (tone: Node["tone"]) =>
    tone === "muted" ? "var(--brand-deep)" : "#ffffff";

  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm overflow-hidden">
      <header className="p-4 border-b border-border-subtle flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Share2 className="size-4 text-brand-primary" />
          <h3 className="font-bold text-sm">Knowledge Graph Preview</h3>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          12.4k nodes · 48k edges
        </span>
      </header>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full aspect-square"
          role="img"
          aria-label="Knowledge graph preview showing IndusBrain domain clusters"
        >
          <defs>
            <pattern id="kg-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="0.5"
                opacity="0.6"
              />
            </pattern>
            <radialGradient id="kg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={width} height={height} fill="url(#kg-grid)" />
          <circle cx={cx} cy={cy} r={150} fill="url(#kg-glow)" />

          {edges.map(([a, b], i) => {
            const na = byId[a];
            const nb = byId[b];
            return (
              <line
                key={i}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke="var(--brand-primary)"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
            );
          })}

          {nodes.map((n) => (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill={fillFor(n.tone)}
                stroke={strokeFor(n.tone)}
                strokeWidth={n.tone === "muted" ? 1.5 : 2}
              />
              {n.tone === "core" && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r + 6}
                  fill="none"
                  stroke="var(--brand-primary)"
                  strokeOpacity="0.4"
                  strokeDasharray="3 3"
                />
              )}
              <text
                x={n.x}
                y={n.y + 3}
                textAnchor="middle"
                fontSize={n.tone === "core" ? 10 : 9}
                fontFamily="var(--font-mono)"
                fontWeight={n.tone === "core" ? 700 : 500}
                fill={textFill(n.tone)}
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-brand-deep via-brand-deep/70 to-transparent text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-300">
                Live domain graph
              </p>
              <p className="text-sm font-semibold mt-0.5">
                8 core domains · updated 2m ago
              </p>
            </div>
            <button className="text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/15 backdrop-blur px-2.5 py-1.5 rounded-md hover:bg-white/20 transition-colors">
              Explore
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

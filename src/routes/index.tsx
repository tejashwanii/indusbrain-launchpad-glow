import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { askQuestion } from "../services/chat";
import { getDiagnostics, presentInsight, type DiagnosticInsight } from "../services/diagnostic";
import { uploadDocument } from "../services/upload";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  LineChart,
  PanelLeft,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Share2,
  Sparkles,
  Upload,
  Wrench,
  X,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
  { id: "upload-documents", label: "Upload Documents", icon: Upload },
  { id: "knowledge-graph", label: "Knowledge Graph", icon: Share2 },
  { id: "compliance", label: "Compliance Center", icon: ShieldCheck },
  { id: "maintenance", label: "Maintenance Intelligence", icon: Wrench },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [aiOpen, setAiOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll spy
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const els = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root, rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-surface-muted text-brand-deep font-sans">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        active={active}
        onNavigate={scrollTo}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <div
          ref={scrollRef}
          className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]"
        >
          <section id="dashboard" className="space-y-6 scroll-mt-4">
            <PageHeader />
            <KpiRow />
          </section>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6 min-w-0">
              <section id="maintenance" className="scroll-mt-4">
                <AssetFeed />
              </section>
              <section id="analytics" className="scroll-mt-4">
                <TelemetryChart />
              </section>
            </div>
            <div className="space-y-6 min-w-0">
              <section id="knowledge-hub" className="scroll-mt-4">
                <CriticalComponents />
              </section>
              <section id="knowledge-graph" className="scroll-mt-4">
                <KnowledgeGraphPreview />
              </section>
            </div>
          </div>
          <section id="upload-documents" className="scroll-mt-4">
            <UploadDocumentsCard />
          </section>
          <section id="compliance" className="scroll-mt-4">
            <ComplianceCard />
          </section>
          <section id="settings" className="scroll-mt-4">
            <SettingsCard />
          </section>
        </div>
      </main>

      <FloatingAIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}

function Sidebar({
  collapsed,
  onToggle,
  active,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  active: string;
  onNavigate: (id: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-brand-deep/40 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={[
          "shrink-0 border-r border-border-subtle bg-card flex flex-col transition-[width] duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          "fixed inset-y-0 left-0 z-40 lg:static",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform lg:transition-[width]",
        ].join(" ")}
      >
        <div
          className={[
            "p-4 border-b border-border-subtle flex items-center gap-3",
            collapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 shrink-0 rounded-md bg-brand-primary text-brand-primary-foreground font-bold grid place-items-center tracking-tight">
                  IB
                </div>
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="font-bold text-lg tracking-tight truncate">
                    IndusBrain
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    ops · v4.2
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggle}
                aria-label="Collapse sidebar"
                className="size-8 hidden lg:grid place-items-center rounded-md hover:bg-secondary text-muted-foreground transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="size-8 grid lg:hidden place-items-center rounded-md hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand sidebar"
              className="size-9 rounded-md bg-brand-primary text-brand-primary-foreground font-bold grid place-items-center tracking-tight hover:bg-brand-primary/90 transition-colors"
              title="Expand sidebar"
            >
              IB
            </button>
          )}
        </div>

        <nav className={["space-y-1 flex-1", collapsed ? "p-2" : "p-4"].join(" ")}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group relative w-full flex items-center rounded-md text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-brand-primary/5 text-brand-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-brand-deep",
                ].join(" ")}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto size-1.5 rounded-full bg-brand-primary" />
                    )}
                  </>
                )}
                {collapsed && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-brand-deep px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
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
        )}
      </aside>
    </>
  );
}

function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  return (
    <header className="h-16 shrink-0 border-b border-border-subtle bg-card flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
      <div className="flex items-center gap-3 text-sm font-medium min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="size-9 grid lg:hidden place-items-center rounded-md hover:bg-secondary text-brand-deep transition-colors -ml-1"
        >
          <PanelLeft className="size-4" />
        </button>
        <span className="text-muted-foreground hidden sm:inline">Production Floor</span>
        <ChevronRight className="size-3.5 text-slate-300 hidden sm:inline" />
        <span className="text-muted-foreground hidden md:inline">Rotterdam Refinery</span>
        <ChevronRight className="size-3.5 text-slate-300 hidden md:inline" />
        <span className="text-brand-deep truncate">Assembly Line 4A</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ask IndusBrain — sensor, asset, procedure…"
            className="pl-9 pr-16 py-1.5 bg-secondary rounded-full text-sm border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/25 w-72 xl:w-80 transition-all placeholder:text-muted-foreground"
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function FloatingAIAssistant({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const suggestions = [
    "Summarize today's critical alerts",
    "Which assets need maintenance this week?",
    "Show compliance gaps for ISO 55000",
  ];
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: question,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await askQuestion(question);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to contact AI service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label="Open AI Assistant"
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-2.5 bg-brand-deep text-white shadow-lg shadow-brand-deep/25 ring-1 ring-white/10 backdrop-blur hover:bg-brand-deep/90 hover:shadow-xl transition-all sm:bottom-6 sm:right-6"
      >
        <span className="grid place-items-center size-7 rounded-full bg-brand-primary/90 shadow-inner">
          <Sparkles className="size-3.5" />
        </span>
        <span className="text-sm font-semibold tracking-tight">AI Assistant</span>
        <span className="ml-1 size-1.5 rounded-full bg-brand-accent status-pulse" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Close AI Assistant"
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-brand-deep/50 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-label="AI Assistant"
            className="relative w-full max-w-lg rounded-2xl bg-brand-deep text-white shadow-2xl ring-1 ring-white/10 overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 size-40 rounded-full bg-brand-primary/25 blur-2xl" />
            <div className="relative p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="size-4 text-brand-accent" />
                  <h3 className="text-sm font-bold">IndusBrain AI Assistant</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                  className="size-8 grid place-items-center rounded-md hover:bg-white/10 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">
                Ask about assets, procedures, incidents, or compliance across your plant
                knowledge base.
              </p>
              <div className="flex gap-2 p-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur">
                <input
                  type="text"
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend();
                    }
                  }}
                  placeholder="Ask IndusBrain anything…"
                  disabled={loading}
                  className="bg-transparent border-none text-sm flex-1 focus:outline-none placeholder:text-slate-500 text-white disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading}
                  className="size-8 shrink-0 bg-brand-primary rounded-md grid place-items-center hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                  aria-label="Send query"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              {messages.length > 0 && (
                <div className="mt-4 max-h-72 overflow-y-auto space-y-3 rounded-lg bg-white/5 border border-white/10 p-3">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                          message.role === "user"
                            ? "bg-brand-primary text-white"
                            : "bg-white/10 text-slate-200"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="text-xs text-slate-400 italic">
                      IndusBrain is thinking...
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                  Suggested
                </p>
                <ul className="space-y-1.5">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => setInput(s)}
                        className="text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-left w-full"
                      >
                        <Search className="size-3 text-slate-500" />
                        <span className="truncate">{s}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
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

function KpiRow() {
  const KPIS: Kpi[] = [
    {
      label: "Documents Indexed",
      value: "18,420",
      delta: "+248",
      deltaTone: "positive",
      sub: "across 14 knowledge domains",
      spark: [30, 34, 38, 42, 45, 50, 54, 58, 62, 66, 70, 74],
    },
    {
      label: "Registered Assets",
      value: "3,214",
      delta: "+12",
      deltaTone: "positive",
      sub: "across 8 sites",
      spark: [50, 52, 54, 55, 57, 58, 60, 62, 64, 65, 67, 68],
    },
    {
      label: "Compliance Score",
      value: "96.8%",
      delta: "↑ 0.6",
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

function AssetFeed() {
  const [items, setItems] = useState<DiagnosticInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadDiagnostics = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const response = await getDiagnostics();
        if (!active) return;
        setItems(response.insights);
        setMessage(response.message ?? null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load diagnostics.");
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDiagnostics();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm overflow-hidden">
      <header className="p-4 border-b border-border-subtle bg-secondary/40 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-brand-primary" />
          <h2 className="font-bold text-sm">Intelligent Asset Feed</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {loading ? "Loading diagnostics" : `${items.length} AI Insights · Generated from uploaded documents`}
          </span>
          <button className="text-[10px] font-bold uppercase tracking-wider text-brand-primary hover:underline">
            View all
          </button>
        </div>
      </header>

      {loading ? (
        <div className="p-5 text-sm text-muted-foreground">Generating AI diagnostic feed…</div>
      ) : error ? (
        <div className="p-5 text-sm text-muted-foreground">{error}</div>
      ) : items.length === 0 ? (
        <div className="p-5 text-sm text-muted-foreground">{message ?? "No diagnostic insights are available yet. Upload documents to generate recommendations."}</div>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {items.map((item, idx) => (
            <FeedRow key={`${item.title}-${idx}`} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FeedRow({ item }: { item: DiagnosticInsight }) {
  const presentation = presentInsight(item);
  return (
    <li className="p-5 flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide whitespace-nowrap ${presentation.badgeClass}`}>
              {presentation.categoryLabel}
            </span>
            <p className="mt-2 text-sm font-semibold text-brand-deep">{presentation.title}</p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0 text-right">
            <span className="block uppercase tracking-wider">{presentation.metaLabel}</span>
            <span className="block mt-0.5 text-brand-deep normal-case tracking-normal">{presentation.metaValue}</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {presentation.body}
        </p>
        {presentation.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {presentation.actions.slice(0, 2).map((action) => (
              <button
                key={action.label}
                className={
                  action.primary
                    ? "text-xs bg-brand-primary text-brand-primary-foreground px-3 py-1.5 rounded-md font-semibold hover:bg-brand-primary/90 transition-colors"
                    : "text-xs bg-secondary text-brand-deep px-3 py-1.5 rounded-md font-semibold border border-border-subtle hover:bg-card transition-colors"
                }
              >
                {action.label}
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

  const aiQuestions = [38, 42, 45, 48, 52, 54, 58, 62, 66, 64, 68, 72, 70, 66, 62, 64, 70, 72, 74, 76, 74, 70, 66, 62, 60];
  const documentsRetrieved = [44, 46, 48, 51, 54, 56, 58, 61, 63, 60, 64, 68, 66, 62, 60, 63, 66, 70, 72, 74, 72, 69, 66, 63, 61];
  const successfulResponses = [72, 74, 76, 78, 80, 82, 84, 83, 85, 86, 87, 88, 87, 86, 84, 85, 86, 88, 90, 91, 90, 89, 87, 86, 84];

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

  const step = innerW / (successfulResponses.length - 1);
  const anomalyX = padL + 15 * step;

  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm overflow-hidden">
      <header className="p-4 border-b border-border-subtle flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-2">
          <LineChart className="size-4 text-brand-primary" />
          <h2 className="font-bold text-sm">AI Query Trends</h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider flex-wrap">
          <Legend color="var(--brand-primary)" label="AI Questions" />
          <Legend color="var(--brand-deep)" label="Documents Retrieved" />
          <Legend color="var(--brand-accent)" label="Successful Responses" dashed />
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
          aria-label="AI query trends chart showing questions, retrieved documents, and successful responses over 24 hours"
        >
          <defs>
            <linearGradient id="tp-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

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

          <path
            d={`${toPath(aiQuestions)} L${width - padR},${padT + innerH} L${padL},${
              padT + innerH
            } Z`}
            fill="url(#tp-fill)"
          />
          <path
            d={toPath(aiQuestions)}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="2"
            className="chart-line-draw"
            style={{ ["--dash-len" as string]: "2400" }}
          />

          <path
            d={toPath(documentsRetrieved)}
            fill="none"
            stroke="var(--brand-deep)"
            strokeWidth="1.5"
            opacity="0.85"
          />

          <path
            d={toPath(successfulResponses)}
            fill="none"
            stroke="var(--brand-accent)"
            strokeWidth="1.75"
            strokeDasharray="4 3"
          />

          <circle
            cx={anomalyX}
            cy={padT + innerH - (76 / 100) * innerH}
            r="4"
            fill="var(--brand-accent)"
            stroke="white"
            strokeWidth="2"
          />

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

        <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3 text-[11px] font-mono flex-wrap gap-2">
          <span className="text-muted-foreground">
            Peak demand · 15:00 UTC · 76 questions/minute with 91% success rate
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
  { name: "Hydraulic Pump H1-2", location: "Line 4A", metric: "4,208 RPM", health: 100, tone: "ok" },
  { name: "Cooling Tower", location: "Utilities", metric: "122 A", health: 92, tone: "ok" },
  { name: "Steam Turbine", location: "North Bay", metric: "6.4 bar", health: 45, tone: "warn" },
  { name: "Boiler Unit", location: "Refinery", metric: "0.72 ips", health: 28, tone: "crit" },
  { name: "Main Compressor", location: "Line 4A", metric: "142°F", health: 88, tone: "ok" },
];

function CriticalComponents() {
  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm">Most Referenced Assets</h3>
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

function UploadDocumentsCard() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const response = await uploadDocument(file);

      setMessage(
        `✅ ${response.filename} uploaded and indexed successfully.`,
      );
    } catch {
      setMessage("❌ Upload failed.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-brand-primary" />
          <h3 className="font-bold text-sm">Upload Documents</h3>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          PDF · DOCX · XLSX · CAD
        </span>
      </div>
      <div className="border-2 border-dashed border-border-subtle rounded-lg p-8 text-center hover:bg-secondary/30 transition-colors">
        <div className="size-12 mx-auto rounded-full bg-brand-primary/10 grid place-items-center">
          <Upload className="size-5 text-brand-primary" />
        </div>
        <p className="mt-3 text-sm font-semibold text-brand-deep">
          Drop files to ingest into the knowledge base
        </p>
        <p className="text-[11px] font-mono text-muted-foreground mt-1 uppercase tracking-wider">
          or click to browse · max 250 MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex items-center gap-2 bg-brand-primary text-brand-primary-foreground px-3.5 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
        >
          <Upload className="size-4" />
          {uploading ? "Uploading..." : "Select Files"}
        </button>
        {message && (
          <p className="mt-3 text-sm text-brand-primary font-medium">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

function ComplianceCard() {
  const items = [
    { name: "ISO 55000 · Asset Management", score: 98, tone: "ok" as const },
    { name: "IEC 61511 · Functional Safety", score: 95, tone: "ok" as const },
    { name: "OSHA 1910 · Process Safety", score: 88, tone: "warn" as const },
    { name: "ATEX 2014/34/EU", score: 92, tone: "ok" as const },
  ];
  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-brand-primary" />
          <h3 className="font-bold text-sm">Compliance Center</h3>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Overall · 96.8%
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((i) => {
          const bar = i.tone === "warn" ? "bg-brand-accent/80" : "bg-success";
          return (
            <li
              key={i.name}
              className="rounded-lg border border-border-subtle p-3 bg-secondary/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-brand-deep truncate">
                  {i.name}
                </p>
                <span className="text-[10px] font-mono font-bold text-brand-deep">
                  {i.score}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-card rounded-full overflow-hidden">
                <div className={`h-full ${bar}`} style={{ width: `${i.score}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SettingsCard() {
  const rows = [
    { label: "Workspace", value: "Rotterdam Refinery" },
    { label: "Data retention", value: "24 months" },
    { label: "AI model", value: "IndusBrain · v4.2" },
    { label: "SSO Provider", value: "Okta · Enterprise" },
  ];
  return (
    <section className="bg-card rounded-xl border border-border-subtle shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Settings className="size-4 text-brand-primary" />
          <h3 className="font-bold text-sm">Settings</h3>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Configuration
        </span>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between border border-border-subtle rounded-lg p-3 bg-secondary/30"
          >
            <dt className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {r.label}
            </dt>
            <dd className="text-xs font-semibold text-brand-deep">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function KnowledgeGraphPreview() {
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
      <header className="p-4 border-b border-border-subtle flex justify-between items-center flex-wrap gap-2">
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

/* Note: KnowledgeBaseCard removed — replaced by floating AI Assistant per spec. */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  ArrowDownToLine,
  ChevronDown,
  Cloud,
  Expand,
  FileText,
  ImageIcon,
  Maximize2,
  Mic,
  MousePointer2,
  Network,
  PenLine,
  Plus,
  Redo2,
  Share2,
  Sparkles,
  Square,
  Timer as TimerIcon,
  Trash2,
  Type,
  Undo2,
  X,
  Minus,
  Trophy,
} from "lucide-react";
import { useI18n } from "./i18n";
import { cn } from "./cn";
import { useMedia } from "./shared";

type Phase = "idle" | "listening" | "thinking" | "done";

const ease = [0.22, 1, 0.36, 1] as const;

/* ───────────── Mind map ───────────── */
type Box = { x: number; y: number; w: number; h: number };
type MNode = { id: string; label: string; sub?: string; fill: string; d: Box; m: Box };

function MindMap({ mobile }: { mobile: boolean }) {
  const { t } = useI18n();
  const mm = t.demo.mm;

  const nodes: MNode[] = [
    { id: "c", label: mm.center, fill: "#3B34D6", d: { x: 300, y: 160, w: 86, h: 38 }, m: { x: 160, y: 190, w: 92, h: 38 } },
    { id: "e", label: mm.elements, fill: "#1D8FE1", d: { x: 172, y: 160, w: 104, h: 32 }, m: { x: 160, y: 116, w: 116, h: 32 } },
    { id: "i", label: mm.inner, sub: mm.innerSub, fill: "#1E293B", d: { x: 58, y: 92, w: 108, h: 46 }, m: { x: 82, y: 36, w: 142, h: 46 } },
    { id: "o", label: mm.outer, sub: mm.outerSub, fill: "#1E293B", d: { x: 58, y: 228, w: 108, h: 46 }, m: { x: 238, y: 36, w: 142, h: 46 } },
    { id: "t", label: mm.types, fill: "#0BA5D6", d: { x: 428, y: 160, w: 104, h: 32 }, m: { x: 160, y: 264, w: 116, h: 32 } },
    { id: "l", label: mm.old, sub: mm.oldSub, fill: "#C026D3", d: { x: 541, y: 92, w: 110, h: 46 }, m: { x: 82, y: 342, w: 142, h: 46 } },
    { id: "n", label: mm.modern, sub: mm.modernSub, fill: "#C026D3", d: { x: 541, y: 228, w: 110, h: 46 }, m: { x: 238, y: 342, w: 142, h: 46 } },
  ];
  const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges: [string, string][] = [
    ["c", "e"],
    ["c", "t"],
    ["e", "i"],
    ["e", "o"],
    ["t", "l"],
    ["t", "n"],
  ];
  const key = mobile ? "m" : "d";

  const path = (a: Box, b: Box) => {
    if (mobile) {
      const my = (a.y + b.y) / 2;
      return `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
    }
    const mx = (a.x + b.x) / 2;
    return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
  };

  return (
    <svg
      viewBox={mobile ? "0 0 320 380" : "0 0 600 320"}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={mm.title}
    >
      {edges.map(([a, b], i) => (
        <motion.path
          key={a + b}
          d={path(by[a][key], by[b][key])}
          fill="none"
          stroke={by[b].fill}
          strokeWidth={2.2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 0.7, delay: 0.25 + i * 0.12, ease }}
        />
      ))}
      {nodes.map((n, i) => {
        const b = n[key];
        return (
          <motion.g
            key={n.id}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 + i * 0.12 }}
          >
            <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx={n.id === "c" ? b.h / 2 : 7} fill={n.fill} />
            <text
              x={b.x}
              y={n.sub ? b.y - 4 : b.y + 4.5}
              textAnchor="middle"
              fill="#fff"
              fontSize={n.id === "c" ? 13 : 11.5}
              fontWeight={700}
              fontFamily="Inter Tight, sans-serif"
            >
              {n.label}
            </text>
            {n.sub && (
              <text x={b.x} y={b.y + 11} textAnchor="middle" fill="#fff" fillOpacity={0.78} fontSize={8.6} fontFamily="Work Sans, sans-serif">
                {n.sub}
              </text>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}

/* ───────────── Document ───────────── */
function DocView() {
  const { t } = useI18n();
  const d = t.demo.doc;
  const item = (i: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: 0.15 + i * 0.22, ease },
  });
  return (
    <div className="h-full overflow-hidden bg-white p-4 sm:p-7">
      <motion.p {...item(0)} className="mb-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-trido sm:text-[10px]">
        <span className="h-1.5 w-1.5 rounded-full bg-trido" />
        {d.label}
      </motion.p>
      <motion.h4 {...item(1)} className="display border-b-2 border-trido/15 pb-2 text-[1.25rem] text-ink sm:text-[1.75rem]" style={{ letterSpacing: "-0.04em" }}>
        {d.title}
      </motion.h4>
      <motion.p {...item(2)} className="mt-3 font-serif text-[0.95rem] leading-snug text-slate-600 sm:text-[1.05rem]">
        {d.intro}
      </motion.p>
      <motion.p {...item(3)} className="display mt-4 text-[0.95rem] text-ink sm:text-[1.05rem]" style={{ letterSpacing: "-0.03em" }}>
        {d.h1}
      </motion.p>
      <motion.p {...item(4)} className="mt-1.5 font-serif text-base italic text-slate-700 sm:text-xl">
        <span className="rounded bg-sun/70 px-1.5">{d.formula}</span>
      </motion.p>
      <motion.p {...item(5)} className="display mt-4 text-[0.95rem] text-ink sm:text-[1.05rem]" style={{ letterSpacing: "-0.03em" }}>
        {d.h2}
      </motion.p>
      <ul className="mt-1.5 space-y-1">
        {d.items.map(([a, b], i) => (
          <motion.li key={a} {...item(6 + i)} className="text-[12px] text-slate-600 sm:text-[13.5px]">
            <b className="font-semibold text-ink">{a}</b> — {b}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────── Timer + scoreboard ───────────── */
function ToolsView() {
  const { t } = useI18n();
  const [secs, setSecs] = useState(300);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const R = 46;
  const C = 2 * Math.PI * R;
  const scores = [9, 12, 6];
  const colors = ["#1D8FE1", "#1550AA", "#C026D3"];

  return (
    <div className="grid h-full grid-cols-2 gap-2 sm:gap-3">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease }}
        className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(15,23,42,.05),0_10px_30px_-12px_rgba(21,80,170,.25)]"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-[11px] font-semibold text-ink sm:text-xs">
          <TimerIcon className="h-3.5 w-3.5 text-trido" />
          {t.demo.tools.timer}
        </div>
        <div className="grid flex-1 place-items-center p-2">
          <div className="relative aspect-square w-[min(100%,9.5rem)]">
            <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
              <circle cx="55" cy="55" r={R} fill="none" stroke="#E2E8F0" strokeWidth="7" />
              <circle
                cx="55"
                cy="55"
                r={R}
                fill="none"
                stroke="#1550AA"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - secs / 300)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="display absolute inset-0 grid place-items-center text-[1.6rem] text-ink sm:text-[2rem]" style={{ letterSpacing: "-0.05em" }}>
              {mm}:{ss}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.18, ease }}
        className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(15,23,42,.05),0_10px_30px_-12px_rgba(21,80,170,.25)]"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-[11px] font-semibold text-ink sm:text-xs">
          <Trophy className="h-3.5 w-3.5 text-trido" />
          {t.demo.tools.score}
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3 p-3 sm:gap-4 sm:p-5">
          {t.demo.tools.teams.map((team, i) => (
            <div key={team}>
              <div className="mb-1 flex justify-between text-[11px] font-semibold text-ink sm:text-xs">
                <span>{team}</span>
                <span className="display" style={{ letterSpacing: "-0.03em" }}>{scores[i]}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: colors[i] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(scores[i] / 12) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.15, ease }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────── Window chrome ───────────── */
function Win({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.55, ease }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_50px_-24px_rgba(21,80,170,.35)]"
    >
      <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-50 text-emerald-600">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink sm:text-[13px]">{title}</span>
        <ArrowDownToLine className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
        <Expand className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
        <X className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </motion.div>
  );
}

/* ───────────── Main demo ───────────── */
export default function BoardDemo() {
  const { t, lang } = useI18n();
  const mobile = useMedia("(max-width: 639px)");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });

  const [idx, setIdx] = useState(0);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [chars, setChars] = useState(0);

  const say = t.demo.say[idx];

  useEffect(() => {
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setPhase("listening");
    setChars(0);
    let i = 0;
    const typing = setInterval(() => {
      i += 1;
      setChars(i);
      if (i >= say.length) {
        clearInterval(typing);
        timers.push(setTimeout(() => setPhase("thinking"), 450));
        timers.push(setTimeout(() => setPhase("done"), 1500));
        timers.push(setTimeout(() => setIdx((n) => (n + 1) % 3), 1500 + 7500));
      }
    }, 36);
    return () => {
      clearInterval(typing);
      timers.forEach(clearTimeout);
    };
  }, [idx, lang, inView, run, say.length]);

  const pick = (i: number) => {
    setIdx(i);
    setRun((r) => r + 1);
  };

  const status = useMemo(() => {
    const d = t.demo;
    if (phase === "listening") return [d.listening, d.listeningSub];
    if (phase === "thinking") return [d.thinking, d.thinkingSub];
    if (phase === "done") return [d.done, d.doneSub];
    return [d.ready, d.readySub];
  }, [phase, t]);

  const tools = [MousePointer2, PenLine, Square, Type, ImageIcon];
  const bars = Array.from({ length: mobile ? 22 : 40 });

  return (
    <div ref={ref} className="w-full">
      {/* board */}
      <div className="rounded-[1.6rem] bg-[#DCE4EE] p-2 shadow-[0_50px_100px_-40px_rgba(13,58,128,.55),0_0_0_1px_rgba(21,80,170,.08)] sm:rounded-[2rem] sm:p-3">
        {/* top bar */}
        <div className="flex items-center justify-between gap-2 px-1 pb-2 sm:px-2 sm:pb-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/90 px-2.5 py-1.5 shadow-sm sm:gap-3 sm:px-3">
            <span className="grid h-5 w-5 place-items-center">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M7 4.5v15l4.2-4.1 2.9 5.1 2.4-1.3-2.9-5H19L7 4.5Z" fill="#1550AA" stroke="#1550AA" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="display text-[15px] text-ink" style={{ letterSpacing: "-0.04em" }}>Trido</span>
            <span className="hidden h-4 w-px bg-slate-300 sm:block" />
            <span className="hidden text-[12px] text-slate-500 sm:block">{t.demo.classroom}</span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700 md:flex">
            <Sparkles className="h-3 w-3" />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            {t.demo.cloud}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[12px] font-semibold text-trido shadow-sm sm:flex">
              <Sparkles className="h-3.5 w-3.5" /> {t.demo.assistant}
            </span>
            <span className="hidden items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm lg:flex">
              <Share2 className="h-3.5 w-3.5" /> {t.demo.share}
            </span>
            <span className="hidden items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm lg:flex">
              <Cloud className="h-3.5 w-3.5" /> {t.demo.save} <ChevronDown className="h-3 w-3" />
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-trido text-[12px] font-bold text-white">G</span>
          </div>
        </div>

        {/* canvas */}
        <div className="dotgrid relative h-[500px] overflow-hidden rounded-[1.2rem] sm:h-[520px] sm:rounded-[1.6rem] lg:h-[580px]">
          {/* toolbar */}
          <div className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1 rounded-xl bg-white p-1 shadow-md sm:left-3 sm:rounded-2xl sm:p-1.5">
            {tools.map((Icon, i) => (
              <span
                key={i}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl",
                  i === 0 ? "bg-trido text-white" : "text-slate-500"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>

          {/* artifact area */}
          <div className="absolute bottom-[5.6rem] left-[3.4rem] right-3 top-3 sm:left-16 sm:right-4 sm:top-4">
            <AnimatePresence mode="wait">
              {phase === "thinking" && (
                <motion.div
                  key="think"
                  className="absolute inset-0 grid place-items-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="mic-ring absolute inset-0 rounded-full bg-trido" />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-trido" />
                    </span>
                    <span className="text-[13px] font-semibold text-trido">{t.demo.thinking}</span>
                  </div>
                </motion.div>
              )}
              {phase === "done" && (
                <motion.div key={`${idx}-${lang}-${mobile}-${run}`} className="h-full" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  {idx === 0 && (
                    <Win title={t.demo.mm.title} icon={<Network className="h-3.5 w-3.5" />}>
                      <div className="h-full bg-white p-1 sm:p-3">
                        <MindMap mobile={mobile} />
                      </div>
                    </Win>
                  )}
                  {idx === 1 && (
                    <Win title={t.demo.doc.title} icon={<FileText className="h-3.5 w-3.5" />}>
                      <DocView />
                    </Win>
                  )}
                  {idx === 2 && <ToolsView />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* transcript */}
          <AnimatePresence>
            {phase === "listening" && (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease }}
                className="absolute bottom-[5.6rem] left-1/2 z-20 w-[min(92%,36rem)] -translate-x-1/2 rounded-2xl bg-white p-3 shadow-[0_20px_50px_-15px_rgba(21,80,170,.35)] sm:p-4"
              >
                <div className="flex h-7 items-center justify-center gap-[3px] overflow-hidden" aria-hidden>
                  {bars.map((_, i) => (
                    <span
                      key={i}
                      className="wave-bar block w-[3px] rounded-full bg-trido"
                      style={{
                        height: `${8 + ((i * 37) % 17)}px`,
                        animationDelay: `${(i % 9) * 0.09}s`,
                        animationDuration: `${0.7 + (i % 5) * 0.12}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-center text-[14px] font-medium text-ink sm:text-[16px]">
                  “{say.slice(0, chars)}
                  <span className="caret ml-px inline-block h-[1em] w-[2px] translate-y-[2px] bg-trido" />
                  ”
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* idle prompt */}
          {phase === "idle" && (
            <div className="absolute inset-0 grid place-items-center">
              <p className="text-sm text-slate-400">{t.demo.readySub}</p>
            </div>
          )}

          {/* dock */}
          <div className="absolute bottom-3 left-1/2 z-30 flex w-[calc(100%-1.5rem)] max-w-[26rem] -translate-x-1/2 items-center gap-3 rounded-[1.4rem] bg-white p-2 pr-2.5 shadow-[0_18px_40px_-14px_rgba(15,23,42,.35)]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-trido">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-bold text-ink">{status[0]}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", phase === "listening" ? "bg-red-500" : "bg-trido")} />
                {status[1]}
              </p>
            </div>
            <Plus className="hidden h-5 w-5 text-slate-300 sm:block" />
            <div className="relative">
              {phase === "listening" && <span className="mic-ring absolute inset-0 rounded-full bg-trido" />}
              <span className="relative grid h-11 w-11 place-items-center rounded-full bg-trido text-white shadow-[0_8px_18px_-6px_rgba(21,80,170,.8)]">
                <Mic className="h-5 w-5" />
              </span>
            </div>
            <AnimatePresence>
              {phase === "listening" && (
                <motion.span
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 44, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="grid h-11 shrink-0 place-items-center overflow-hidden rounded-full bg-red-50"
                >
                  <span className="h-3.5 w-3.5 rounded-[3px] bg-red-500" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* page + zoom */}
          <div className="absolute bottom-3 left-3 z-20 hidden items-center gap-1 rounded-2xl bg-white p-1.5 shadow-md md:flex">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-trido text-[12px] font-bold text-white">1</span>
            <Plus className="mx-1.5 h-4 w-4 text-slate-400" />
          </div>
          <div className="absolute bottom-3 right-3 z-20 hidden items-center gap-1 lg:flex">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-slate-500 shadow-md">
              <Undo2 className="h-4 w-4" />
              <Redo2 className="h-4 w-4" />
              <Trash2 className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-slate-500 shadow-md">
              <Minus className="h-4 w-4" />
              <span className="text-[12px] font-semibold text-ink">100%</span>
              <Plus className="h-4 w-4" />
              <Maximize2 className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* scenario chips */}
      <div className="mt-5 flex flex-col gap-3 sm:mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-trido/70">{t.hero.try}</p>
        <div className="no-scrollbar -mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {t.demo.tabs.map((label, i) => {
            const active = i === idx;
            return (
              <button
                key={label}
                onClick={() => pick(i)}
                className={cn(
                  "group relative shrink-0 snap-start overflow-hidden rounded-2xl border px-4 py-3 text-left transition-colors duration-300",
                  active ? "border-trido bg-trido text-white" : "border-trido/25 bg-white/60 text-trido hover:border-trido hover:bg-white"
                )}
                aria-pressed={active}
              >
                <span className="display block text-[15px]" style={{ letterSpacing: "-0.03em" }}>{label}</span>
                <span className={cn("mt-0.5 block max-w-[17rem] text-[12px] leading-snug", active ? "text-white/75" : "text-trido/60")}>
                  “{t.demo.say[i]}”
                </span>
                {active && phase !== "idle" && (
                  <motion.span
                    key={`${run}-${idx}-${lang}`}
                    className="absolute bottom-0 left-0 h-[3px] bg-sun"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: (say.length * 36 + 1500 + 7500) / 1000, ease: "linear" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

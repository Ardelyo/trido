import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Calculator,
  CircleHelp,
  Dices,
  Download,
  FileText,
  FlaskConical,
  Keyboard,
  ListChecks,
  Mic,
  PenLine,
  Presentation,
  Share2,
  Sigma,
  Timer,
  Trophy,
  Type,
  Undo2,
  Users,
} from "lucide-react";
import { useI18n } from "./i18n";
import { Reveal, SectionPill } from "./shared";
import { cn } from "./cn";

const widgetIcons = [Calculator, Timer, FileText, CircleHelp, ArrowLeftRight, FlaskConical, Users, ListChecks, Dices, Trophy, Sigma];

function Card({
  children,
  className,
  bg = "#fff",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  bg?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={cn("h-full", className)}>
      <motion.article
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative h-full overflow-hidden rounded-[2rem] p-6 sm:p-8"
        style={{ background: bg }}
      >
        {children}
      </motion.article>
    </Reveal>
  );
}

function Title({ t, d, light, dark }: { t: string; d: string; light?: boolean; dark?: boolean }) {
  return (
    <>
      <h3
        className={cn("display text-[1.7rem] sm:text-[2.1rem]", light ? "text-white" : dark ? "text-trido-deep" : "text-ink")}
        style={{ letterSpacing: "-0.045em", lineHeight: 1 }}
      >
        {t}
      </h3>
      <p className={cn("mt-3 max-w-[34ch] text-[15px] leading-relaxed", light ? "text-white/75" : dark ? "text-trido-deep/75" : "text-ink/65")}>{d}</p>
    </>
  );
}

const pop = { transformBox: "fill-box", transformOrigin: "center" } as const;

function MiniMap() {
  const lines = ["M70,70 C110,70 110,28 150,28", "M70,70 C110,70 110,70 150,70", "M70,70 C110,70 110,112 150,112", "M150,70 C185,70 185,50 215,50", "M150,70 C185,70 185,90 215,90"];
  const cols = ["#1D8FE1", "#0BA5D6", "#C026D3", "#0BA5D6", "#0BA5D6"];
  return (
    <svg viewBox="0 0 260 140" className="h-full w-full">
      {lines.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={cols[i]}
          strokeWidth="2.4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.3 + i * 0.15 }}
        />
      ))}
      <motion.circle cx="70" cy="70" r="20" fill="#3B34D6" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} style={pop} transition={{ type: "spring", delay: 0.1 }} />
      {[
        [150, 28],
        [150, 70],
        [150, 112],
        [215, 50],
        [215, 90],
      ].map(([x, y], i) => (
        <motion.rect
          key={i}
          x={x - 22}
          y={y - 9}
          width="44"
          height="18"
          rx="5"
          fill={i === 2 ? "#C026D3" : i === 0 ? "#1D8FE1" : "#1E293B"}
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={pop}
          transition={{ delay: 0.5 + i * 0.12, type: "spring" }}
        />
      ))}
    </svg>
  );
}

function MiniDoc() {
  return (
    <div className="space-y-2.5">
      <motion.div initial={{ width: 0 }} whileInView={{ width: "70%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="h-3.5 rounded bg-trido" />
      {[100, 92, 84].map((w, i) => (
        <motion.div key={i} initial={{ width: 0 }} whileInView={{ width: `${w}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.4 + i * 0.12 }} className="h-2 rounded bg-slate-300/70" />
      ))}
      <div className="relative w-3/5 pt-1">
        <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 1 }} style={{ originX: 0 }} className="absolute inset-y-0 left-0 w-full rounded bg-sun" />
        <div className="relative h-5 px-2 font-serif text-[13px] italic leading-5 text-trido-deep">A = L + E</div>
      </div>
      {[88, 60].map((w, i) => (
        <motion.div key={i} initial={{ width: 0 }} whileInView={{ width: `${w}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 1.1 + i * 0.12 }} className="h-2 rounded bg-slate-300/70" />
      ))}
    </div>
  );
}

function CloudToggle() {
  const { t } = useI18n();
  const [cloud, setCloud] = useState(true);
  const chip = "flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5";
  const anim = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.25 } };
  return (
    <div className="mt-6">
      <button
        onClick={() => setCloud((c) => !c)}
        aria-pressed={cloud}
        className="relative flex w-full max-w-[18rem] rounded-full bg-trido-deep/10 p-1.5 text-[13px] font-bold text-trido-deep"
      >
        <motion.span
          className="absolute inset-y-1.5 w-[calc(50%-0.375rem)] rounded-full bg-trido"
          animate={{ left: cloud ? "0.375rem" : "50%" }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
        <span className={cn("relative z-10 flex-1 py-2.5 transition-colors", cloud && "text-white")}>{t.features.cloudOn}</span>
        <span className={cn("relative z-10 flex-1 py-2.5 transition-colors", !cloud && "text-white")}>{t.features.cloudOff}</span>
      </button>
      <div className="mt-5 min-h-[4.5rem] text-[12px] font-semibold text-trido-deep">
        <AnimatePresence mode="wait">
          {cloud ? (
            <motion.div key="c" className="flex flex-wrap gap-2" {...anim}>
              {["AI agent", "Mind map", "Document", "Quiz"].map((x) => (
                <span key={x} className={chip}>
                  <Mic className="h-3 w-3" /> {x}
                </span>
              ))}
            </motion.div>
          ) : (
            <motion.div key="o" className="flex flex-wrap gap-2" {...anim}>
              <span className={chip}>
                <Mic className="h-3 w-3" /> Record
              </span>
              <span className={chip}>
                <Keyboard className="h-3 w-3" /> Text
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Features() {
  const { t } = useI18n();
  const f = t.features;
  return (
    <section id="features" className="scroll-mt-20 pb-16 sm:pb-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Reveal>
          <SectionPill n={f.pill} label={f.kicker} />
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="display mt-6 max-w-[18ch] text-[clamp(2.4rem,7vw,6.2rem)] text-trido">{f.title}</h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-6 lg:gap-5">
          <Card className="lg:col-span-3">
            <div className="h-40 sm:h-44">
              <MiniMap />
            </div>
            <div className="mt-6">
              <Title t={f.mm.t} d={f.mm.d} />
            </div>
          </Card>

          <Card className="lg:col-span-3" delay={0.1}>
            <div className="h-40 rounded-2xl bg-paper/60 p-5 sm:h-44">
              <MiniDoc />
            </div>
            <div className="mt-6">
              <Title t={f.doc.t} d={f.doc.d} />
            </div>
          </Card>

          <Card className="lg:col-span-4" bg="#1550AA" delay={0.05}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <Title t={f.widgets.t} d={f.widgets.d} light />
              <span className="display text-[4.5rem] leading-none text-sun sm:text-[6rem]" style={{ letterSpacing: "-0.07em" }}>
                11
              </span>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {f.widgets.list.map((w, i) => {
                const Icon = widgetIcons[i];
                return (
                  <motion.span
                    key={w}
                    initial={{ opacity: 0, y: 14, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.045, type: "spring", stiffness: 280, damping: 22 }}
                    whileHover={{ y: -3, backgroundColor: "#FFCC00", color: "#0D3A80" }}
                    className="inline-flex cursor-default items-center gap-2 rounded-full border border-white/25 px-4 py-2.5 text-[13.5px] font-semibold text-white"
                  >
                    <Icon className="h-4 w-4" />
                    {w}
                  </motion.span>
                );
              })}
            </div>
          </Card>

          <Card className="lg:col-span-2" bg="#FFCC00" delay={0.1}>
            <Title t={f.cloud.t} d={f.cloud.d} dark />
            <CloudToggle />
          </Card>

          <Card className="lg:col-span-3">
            <div className="flex gap-2">
              {[Presentation, Share2, Download, Undo2].map((I, i) => (
                <motion.span key={i} whileHover={{ y: -4, rotate: -6 }} className="grid h-12 w-12 place-items-center rounded-2xl bg-paper text-trido">
                  <I className="h-5 w-5" />
                </motion.span>
              ))}
            </div>
            <div className="mt-6">
              <Title t={f.share.t} d={f.share.d} />
            </div>
          </Card>

          <Card className="lg:col-span-3" delay={0.1}>
            <div className="flex gap-2">
              {[PenLine, Type, Keyboard].map((I, i) => (
                <motion.span key={i} whileHover={{ y: -4, rotate: 6 }} className="grid h-12 w-12 place-items-center rounded-2xl bg-paper text-trido">
                  <I className="h-5 w-5" />
                </motion.span>
              ))}
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-trido text-white">
                <Mic className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-6">
              <Title t={f.pen.t} d={f.pen.d} />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

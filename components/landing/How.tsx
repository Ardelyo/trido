import { motion } from "framer-motion";
import { useI18n } from "./i18n";
import { Reveal, SectionPill } from "./shared";

function SpeakArt() {
  return (
    <div className="flex h-full items-center justify-center gap-[5px]">
      {Array.from({ length: 19 }).map((_, i) => (
        <span
          key={i}
          className="wave-bar block w-[5px] rounded-full bg-trido"
          style={{
            height: `${18 + ((i * 29) % 46)}px`,
            animationDelay: `${(i % 7) * 0.11}s`,
            animationDuration: `${0.8 + (i % 4) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function UnderstandArt() {
  const pts = [
    [40, 110],
    [110, 40],
    [190, 90],
    [250, 30],
    [270, 120],
  ];
  return (
    <svg viewBox="0 0 310 150" className="h-full w-full">
      {pts.slice(0, -1).map((p, i) => (
        <motion.line
          key={i}
          x1={p[0]}
          y1={p[1]}
          x2={pts[i + 1][0]}
          y2={pts[i + 1][1]}
          stroke="#1550AA"
          strokeWidth="2"
          strokeDasharray="4 5"
          animate={{ strokeDashoffset: [0, -18] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      ))}
      {pts.map((p, i) => (
        <motion.circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === 2 ? 11 : 7}
          fill={i === 2 ? "#FFCC00" : "#1550AA"}
          animate={{ scale: [1, 1.25, 1] }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

function AppearArt() {
  return (
    <div className="relative mx-auto h-full w-[78%]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-x-0 rounded-xl border border-trido/20 bg-white p-3 shadow-sm"
          style={{ top: 10 + i * 34 }}
          animate={{ x: [-18, 0, 0, 18], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.5, ease: "easeInOut", times: [0, 0.2, 0.8, 1] }}
        >
          <div className="h-2 w-2/3 rounded-full bg-trido/70" />
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200" />
        </motion.div>
      ))}
    </div>
  );
}

export default function How() {
  const { t } = useI18n();
  const arts = [<SpeakArt />, <UnderstandArt />, <AppearArt />];
  return (
    <section id="how" className="scroll-mt-20 py-16 sm:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Reveal>
          <SectionPill n={t.how.pill} label={t.how.kicker} />
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="display mt-6 max-w-[16ch] text-[clamp(2.4rem,7vw,6.2rem)] text-trido">{t.how.title}</h2>
        </Reveal>

        <div className="relative mt-12 grid gap-4 sm:mt-16 md:grid-cols-3 md:gap-5">
          {t.how.steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.12} className="h-full">
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex h-full flex-col rounded-[2rem] bg-white p-5 shadow-[0_1px_0_rgba(10,26,58,.04)] sm:p-6"
              >
                <div className="h-40 overflow-hidden rounded-[1.4rem] bg-paper/70">{arts[i]}</div>
                <div className="mt-6 flex items-end justify-between">
                  <h3 className="display text-[2.2rem] text-ink sm:text-[2.6rem]">{s.t}</h3>
                  <span
                    className="display text-[3.4rem] leading-none"
                    style={{ WebkitTextStroke: "1.5px #1550AA", color: "transparent" }}
                  >
                    0{i + 1}
                  </span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{s.d}</p>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

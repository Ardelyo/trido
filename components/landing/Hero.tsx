import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Mic } from "lucide-react";
import { useI18n } from "./i18n";
import { Mark, useMedia } from "./shared";
import BoardDemo from "./BoardDemo";

const ease = [0.22, 1, 0.36, 1] as const;

function Rise({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: delay + i * 0.08, ease }}
          >
            {w}
            {"\u00A0"}
          </motion.span>
        </span>
      ))}
    </>
  );
}

function SpinBadge() {
  const { lang } = useI18n();
  const text = lang === "id" ? "SUARA DULU • AI SMARTBOARD • UNTUK GURU • " : "VOICE FIRST • AI SMARTBOARD • FOR TEACHERS • ";
  return (
    <div className="relative h-[8.5rem] w-[8.5rem] xl:h-[10rem] xl:w-[10rem]">
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
      >
        <defs>
          <path id="circ" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="98" fill="#FFCC00" />
        <text fontSize="15.5" fontWeight="800" fontFamily="Inter Tight" letterSpacing="3.2" fill="#1550AA">
          <textPath href="#circ">{text}</textPath>
        </text>
      </motion.svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-trido text-white xl:h-16 xl:w-16">
          <Mic className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

export default function Hero({ onLaunchApp }: { onLaunchApp?: () => void }) {
  const { t, lang } = useI18n();
  const boardRef = useRef<HTMLDivElement>(null);
  const desktop = useMedia("(min-width: 1024px)");
  const { scrollYProgress } = useScroll({ target: boardRef, offset: ["start end", "start 30%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <section id="top" className="paper-grain relative overflow-hidden pt-28 sm:pt-36">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-trido/40 bg-white/40 py-1.5 pl-2 pr-4 text-[12px] font-semibold text-trido backdrop-blur sm:text-[13px]"
        >
          <span className="rounded-full bg-sun px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-trido-deep">
            2026
          </span>
          <span className="truncate">{t.hero.badge}</span>
        </motion.div>

        <div className="relative mt-6 sm:mt-8">
          <h1
            key={lang}
            className="display text-[clamp(2.75rem,10.2vw,9.6rem)] text-trido"
            style={{ letterSpacing: "-0.06em" }}
          >
            <span className="block">
              <Rise text={t.hero.h1a} delay={0.15} />
            </span>
            <motion.span
              className="mt-1 inline-block sm:mt-2"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1, delay: 0.6, ease: [0.76, 0, 0.24, 1] }}
            >
              <Mark>{t.hero.h1b}</Mark>
            </motion.span>
          </h1>

          <motion.div
            className="absolute -top-2 right-0 hidden lg:block"
            initial={{ opacity: 0, scale: 0.5, rotate: -40 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 1.1, ease }}
          >
            <SpinBadge />
          </motion.div>
        </div>

        <div className="mt-8 grid gap-8 sm:mt-12 lg:grid-cols-12 lg:items-end">
          <motion.p
            key={lang + "sub"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
            className="max-w-[40rem] text-[1.05rem] leading-relaxed text-ink/75 sm:text-[1.2rem] lg:col-span-7"
          >
            {t.hero.sub}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.05, ease }}
            className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end"
          >
            <a
              href="/app"
              onClick={(e) => {
                if (onLaunchApp) {
                  e.preventDefault();
                  onLaunchApp();
                }
              }}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-trido px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-trido-deep"
            >
              {t.hero.cta1}
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#board"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-trido px-7 py-4 text-[15px] font-semibold text-trido transition-colors hover:bg-trido hover:text-white"
            >
              {t.hero.cta2}
              <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
          </motion.div>
        </div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-trido/80"
        >
          {t.hero.meta.map((m) => (
            <li key={m} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-trido" />
              {m}
            </li>
          ))}
        </motion.ul>

        {/* board */}
        <div id="board" ref={boardRef} className="relative mt-12 scroll-mt-24 pb-16 sm:mt-16 sm:pb-24" style={{ perspective: 1800 }}>
          <motion.div
            style={desktop ? { rotateX, scale, y, transformOrigin: "50% 0%" } : undefined}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease }}
          >
            <BoardDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

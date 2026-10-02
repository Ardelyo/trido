import { useEffect, useRef } from "react";
import { animate, motion, useInView } from "framer-motion";
import { useI18n } from "./i18n";
import { Reveal, SectionPill } from "./shared";

function Count({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const c = animate(0, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = String(Math.round(v));
      },
    });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span>
      <span ref={ref}>0</span>
      {suffix}
    </span>
  );
}

export default function Award() {
  const { t } = useI18n();
  const a = t.award;
  return (
    <section id="award" className="scroll-mt-20 py-16 sm:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Reveal>
          <SectionPill n={a.pill} label={a.kicker} />
        </Reveal>

        <div className="relative mt-6 grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-8">
            <h2 className="display text-[clamp(3rem,11vw,10.5rem)] text-trido" style={{ letterSpacing: "-0.065em" }}>
              {a.title}
            </h2>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-4">
            <div className="rounded-[1.6rem] bg-sun p-6 text-trido-deep">
              <p className="display text-[1.4rem]" style={{ letterSpacing: "-0.04em", lineHeight: 1.05 }}>
                Gemma 4 Good Hackathon
              </p>
              <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.14em]">by Google · Kaggle</p>
              <p className="mt-3 text-[14.5px] leading-relaxed">{a.sub}</p>
            </div>
          </Reveal>
        </div>

        {/* timeline */}
        <div className="relative mt-14 grid gap-6 sm:mt-20 md:grid-cols-3 md:gap-8">
          <div className="absolute left-[1.15rem] top-3 hidden h-[calc(100%-1.5rem)] w-px bg-trido/25 max-md:block" />
          <motion.div
            className="absolute left-0 top-[1.15rem] hidden h-px w-full origin-left bg-trido/30 md:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
          />
          {a.timeline.map((s, i) => (
            <Reveal key={s.t} delay={0.1 * i} className="relative pl-12 md:pl-0 md:pt-14">
              <span className="display absolute left-0 top-0 grid h-[2.3rem] w-[2.3rem] place-items-center rounded-full bg-trido text-[14px] text-white">
                {i + 1}
              </span>
              <h3 className="display text-[1.7rem] text-ink sm:text-[2rem]" style={{ letterSpacing: "-0.045em", lineHeight: 1 }}>
                {s.t}
              </h3>
              <p className="mt-3 max-w-[32ch] text-[15px] leading-relaxed text-ink/70">{s.d}</p>
            </Reveal>
          ))}
        </div>

        {/* stats */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] bg-trido/20 sm:mt-24 lg:grid-cols-4">
          {a.stats.map((s, i) => (
            <Reveal key={s.l + i} delay={i * 0.08} className="bg-paper">
              <div className="p-6 sm:p-9">
                <div className="display text-[3.6rem] text-trido sm:text-[6rem]" style={{ letterSpacing: "-0.07em" }}>
                  <Count to={Number(s.n)} suffix={s.s} />
                </div>
                <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-trido/70">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* credits */}
        <Reveal className="mt-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-trido/60">{a.by}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {["Ardellio Satria Anindito", "Muhammad Azhar Ayyatullah Al Faridzi"].map((n) => (
              <span key={n} className="display rounded-full border border-trido px-5 py-2.5 text-[1.05rem] text-trido sm:text-[1.3rem]" style={{ letterSpacing: "-0.035em" }}>
                {n}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

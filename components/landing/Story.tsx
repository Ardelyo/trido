import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Mic } from "lucide-react";
import { useI18n } from "./i18n";
import { Mark, Reveal, SectionPill } from "./shared";

const PHOTO =
  "https://images.pexels.com/photos/5427870/pexels-photo-5427870.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800";

export default function Story() {
  const { t } = useI18n();
  const s = t.story;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const stickerR = useTransform(scrollYProgress, [0, 1], [-14, 10]);

  // split title so the last words sit on a yellow block
  const words = s.title.split(" ");
  const head = words.slice(0, -2).join(" ");
  const tail = words.slice(-2).join(" ");

  return (
    <section id="story" ref={ref} className="scroll-mt-20 mx-2 overflow-hidden rounded-[2.5rem] bg-trido py-16 text-white sm:mx-4 sm:rounded-[4rem] sm:py-28">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-7">
          <Reveal>
            <SectionPill n={s.pill} label={s.kicker} light />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="display mt-6 text-[clamp(2.6rem,8vw,7.4rem)] text-white" style={{ letterSpacing: "-0.06em" }}>
              {head} <Mark>{tail}</Mark>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-8 max-w-[34rem] text-[1.1rem] leading-relaxed text-white/85 sm:text-[1.25rem]">{s.p1}</p>
            <p className="mt-4 max-w-[34rem] text-[1.1rem] leading-relaxed text-white/85 sm:text-[1.25rem]">{s.p2}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="display rounded-full border border-white px-7 py-2.5 text-[1.15rem]" style={{ letterSpacing: "-0.02em" }}>
                {s.name}
              </span>
              <span className="text-[15px] font-semibold text-white/85">{s.role}</span>
            </div>
            <p className="mt-10 border-t border-white/20 pt-6 font-serif text-[1.6rem] italic leading-tight text-sun sm:text-[2rem]">
              {s.tagline}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="lg:col-span-5">
          <div className="relative mx-auto w-full max-w-[26rem] lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-trido-deep">
              <motion.img
                src={PHOTO}
                alt=""
                loading="lazy"
                style={{ y: imgY, scale: 1.18 }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-trido-deep/60 via-transparent to-transparent" />
            </div>
            <motion.div
              style={{ rotate: stickerR }}
              className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-2xl bg-sun px-5 py-4 text-trido-deep shadow-[0_20px_40px_-15px_rgba(0,0,0,.5)] sm:-left-8"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-trido text-white">
                <Mic className="h-5 w-5" />
              </span>
              <span className="display text-[1.35rem]" style={{ letterSpacing: "-0.04em", lineHeight: 1 }}>
                {s.sticker}
              </span>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

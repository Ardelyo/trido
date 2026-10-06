import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ArrowUpRight, Check, Download, Plus } from "lucide-react";
import { useI18n } from "./i18n";
import { LangToggle } from "./Navbar";
import { Logo, Mark, Reveal, SectionPill } from "./shared";
import { cn } from "./cn";

export function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-20 pb-16 sm:pb-28">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionPill n={t.faq.pill} label={t.faq.kicker} />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="display mt-6 text-[clamp(2.4rem,6vw,5.2rem)] text-trido">{t.faq.title}</h2>
          </Reveal>
        </div>
        <div className="lg:col-span-7">
          {t.faq.items.map((it, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={it.q} delay={i * 0.06}>
                <div className="border-t border-trido/25 last:border-b">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="display text-[1.35rem] text-ink transition-colors group-hover:text-trido sm:text-[1.7rem]" style={{ letterSpacing: "-0.04em", lineHeight: 1.05 }}>
                      {it.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 135 : 0, backgroundColor: isOpen ? "#1550AA" : "rgba(21,80,170,0)", color: isOpen ? "#fff" : "#1550AA" }}
                      transition={{ duration: 0.35 }}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-trido"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[56ch] pb-6 text-[16px] leading-relaxed text-ink/70">{it.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Cta({ onLaunchApp }: { onLaunchApp?: () => void }) {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (/^\S+@\S+\.\S+$/.test(email)) setState("ok");
    else setState("err");
  };

  return (
    <section id="demo" className="scroll-mt-20 px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[2rem] bg-sun px-5 py-14 sm:rounded-[3rem] sm:px-14 sm:py-24">
        <motion.div
          aria-hidden
          className="absolute -right-24 -top-24 h-[22rem] w-[22rem] rounded-full border-[3px] border-trido/15 sm:h-[34rem] sm:w-[34rem]"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -right-4 -top-4 h-[14rem] w-[14rem] rounded-full border-[3px] border-trido/15 sm:right-12 sm:top-12 sm:h-[20rem] sm:w-[20rem]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />

        <div className="relative">
          <Reveal>
            <SectionPill n={t.cta.pill} label="Demo" />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="display mt-6 max-w-[14ch] text-[clamp(2.8rem,9vw,8.4rem)] text-trido" style={{ letterSpacing: "-0.065em" }}>
              {t.cta.title}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-[34rem] text-[1.1rem] leading-relaxed text-trido-deep/80">{t.cta.sub}</p>

            <div className="mt-8 min-h-[5.5rem] max-w-[36rem]">
              <AnimatePresence mode="wait">
                {state !== "ok" ? (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    noValidate
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <div className="flex-1">
                      <label htmlFor="email" className="sr-only">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (state === "err") setState("idle");
                        }}
                        placeholder={t.cta.placeholder}
                        className={cn(
                          "w-full rounded-full border-2 bg-white/70 px-6 py-4 text-[16px] text-ink outline-none transition-colors placeholder:text-trido/40 focus:bg-white",
                          state === "err" ? "border-red-500" : "border-trido/30 focus:border-trido"
                        )}
                      />
                      {state === "err" && <p className="mt-2 pl-4 text-[13px] font-medium text-red-600">{t.cta.invalid}</p>}
                    </div>
                    <button
                      type="submit"
                      className="group inline-flex items-center justify-center gap-2 self-start rounded-full bg-trido px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-trido-deep sm:self-auto"
                    >
                      {t.cta.button}
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4"
                    role="status"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                      className="grid h-14 w-14 place-items-center rounded-full bg-trido text-white"
                    >
                      <Check className="h-7 w-7" />
                    </motion.span>
                    <div>
                      <p className="display text-[1.8rem] text-trido sm:text-[2.2rem]" style={{ letterSpacing: "-0.05em", lineHeight: 1 }}>
                        <Mark className="bg-white/60">{t.cta.thanks}</Mark>
                      </p>
                      <p className="mt-2 text-[14px] text-trido-deep/80">{t.cta.thanksSub}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-trido/15">
              <span className="text-[14px] font-semibold text-trido-deep/80">
                {t.hero.downloadExeSub || "Aplikasi Desktop Standalone:"}
              </span>
              <a
                href="/download"
                className="group inline-flex items-center gap-2 rounded-full border border-trido bg-trido px-5 py-2.5 text-[14px] font-bold text-white transition-all hover:bg-trido-deep shadow-xs"
              >
                <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                <span>{t.hero.downloadExe || "Unduh Windows (.exe)"}</span>
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto max-w-[1320px] px-5 pb-10 pt-12 sm:px-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4">
          <Logo />
          <span className="inline-block w-fit rounded-full border border-trido px-5 py-2 text-[14px] font-medium text-trido">
            {t.story.tagline}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle id="foot" />
          <a
            href="#top"
            aria-label={t.footer.top}
            className="grid h-11 w-11 place-items-center rounded-full bg-trido text-white transition-transform hover:-translate-y-1"
          >
            <ArrowUp className="h-5 w-5" />
          </a>
        </div>
      </div>
      <p className="mt-10 border-t border-trido/20 pt-6 text-[13px] text-trido/70">{t.footer.rights}</p>
    </footer>
  );
}

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useI18n } from "./i18n";
import { Logo } from "./shared";
import { cn } from "./cn";
import type { Lang } from "./content";

export function LangToggle({ light, id = "lang" }: { light?: boolean; id?: string }) {
  const { lang, setLang } = useI18n();
  const opts: Lang[] = ["en", "id"];
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "relative flex rounded-full border p-[3px]",
        light ? "border-white/40" : "border-trido/30"
      )}
    >
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => setLang(o)}
          aria-pressed={lang === o}
          className={cn(
            "relative z-10 min-w-[2.6rem] rounded-full px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider transition-colors",
            lang === o ? (light ? "text-trido" : "text-white") : light ? "text-white/80" : "text-trido"
          )}
        >
          {lang === o && (
            <motion.span
              layoutId={`${id}-pill`}
              className={cn("absolute inset-0 -z-10 rounded-full", light ? "bg-white" : "bg-trido")}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          {o}
        </button>
      ))}
    </div>
  );
}

export default function Navbar({ onLaunchApp }: { onLaunchApp?: () => void }) {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const handleLaunch = (e: React.MouseEvent) => {
    if (onLaunchApp) {
      e.preventDefault();
      setOpen(false);
      onLaunchApp();
    }
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "#how", label: t.nav.how },
    { href: "#features", label: t.nav.features },
    { href: "#story", label: t.nav.story },
    { href: "#award", label: t.nav.award },
    { href: "#faq", label: t.nav.faq },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1320px] items-center justify-between rounded-full border px-3 py-2 pl-4 transition-all duration-500 sm:pl-5",
            scrolled
              ? "border-trido/15 bg-paper/85 shadow-[0_10px_40px_-18px_rgba(13,58,128,.45)] backdrop-blur-xl"
              : "border-transparent bg-transparent"
          )}
        >
          <a href="#top" aria-label="TRIDO">
            <Logo />
          </a>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-[14px] font-medium text-trido/80 transition-colors hover:bg-trido/10 hover:text-trido"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle id="nav" />
            <a
              href="/app"
              onClick={handleLaunch}
              className="group hidden items-center gap-1.5 rounded-full bg-trido py-2.5 pl-5 pr-4 text-[14px] font-semibold text-white transition-colors hover:bg-trido-deep sm:inline-flex"
            >
              {t.nav.cta}
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <button
              onClick={() => setOpen(true)}
              aria-label={t.nav.menu}
              className="grid h-10 w-10 place-items-center rounded-full bg-trido text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-trido px-6 pb-8 pt-5 text-white"
            initial={{ clipPath: "circle(0% at 92% 4%)" }}
            animate={{ clipPath: "circle(150% at 92% 4%)" }}
            exit={{ clipPath: "circle(0% at 92% 4%)" }}
            transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="flex items-center justify-between">
              <Logo light />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-trido"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-12 flex flex-1 flex-col gap-1">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="display flex items-baseline gap-4 border-b border-white/15 py-3.5 text-[2.4rem]"
                >
                  <span className="text-[13px] font-semibold tracking-normal text-sun">0{i + 1}</span>
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <div className="flex items-center justify-between gap-4">
              <LangToggle light id="sheet" />
              <a
                href="/app"
                onClick={handleLaunch}
                className="inline-flex items-center gap-1.5 rounded-full bg-sun px-6 py-3 text-[15px] font-bold text-trido-deep"
              >
                {t.nav.cta} <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

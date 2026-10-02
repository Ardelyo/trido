import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "./cn";

export function useMedia(query: string) {
  const [m, setM] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setM(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [query]);
  return m;
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid h-8 w-8 place-items-center rounded-[10px]",
          light ? "bg-white" : "bg-trido"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
          <path
            d="M7 4.5v15l4.2-4.1 2.9 5.1 2.4-1.3-2.9-5H19L7 4.5Z"
            fill={light ? "#1550AA" : "#fff"}
            stroke={light ? "#1550AA" : "#fff"}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={cn("display text-[1.55rem]", light ? "text-white" : "text-trido")}
        style={{ letterSpacing: "-0.06em" }}
      >
        Trido
      </span>
    </span>
  );
}

/** Outlined numbered pill — echoes the slide counters of the TRIDO deck */
export function SectionPill({ n, label, light }: { n: string; label: string; light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "display inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-full border px-4 text-[15px]",
          light ? "border-white/60 text-white" : "border-trido text-trido"
        )}
        style={{ letterSpacing: "-0.02em" }}
      >
        {n}
      </span>
      <span
        className={cn(
          "text-[12px] font-semibold uppercase tracking-[0.18em]",
          light ? "text-white/80" : "text-trido/80"
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Highlighter-block text, like the yellow "Trido?" block in the deck */
export function Mark({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "box-decoration-clone rounded-[0.12em] bg-sun px-[0.14em] pb-[0.04em] text-trido",
        className
      )}
    >
      {children}
    </span>
  );
}

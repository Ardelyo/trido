import { Mic } from "lucide-react";
import { useI18n } from "./i18n";

function Row({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-wrap overflow-hidden">
      <div className={`flex w-max gap-3 ${reverse ? "marquee-rev" : "marquee"}`}>
        {doubled.map((q, i) => (
          <span
            key={i}
            className="display inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-white/25 px-5 py-3 text-[1.05rem] text-white sm:px-6 sm:py-3.5 sm:text-[1.35rem]"
            style={{ letterSpacing: "-0.035em", lineHeight: 1.1 }}
          >
            <Mic className="h-4 w-4 text-sun" />“{q}”
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  const { t } = useI18n();
  const a = t.marquee;
  const b = [...t.marquee].reverse();
  return (
    <section aria-hidden className="relative overflow-hidden py-10 sm:py-16">
      <div className="-mx-6 -rotate-[1.4deg] space-y-3 bg-trido py-6 sm:py-8">
        <Row items={a} />
        <Row items={b} reverse />
      </div>
    </section>
  );
}

import { MotionConfig, motion, useScroll, useSpring } from "framer-motion";
import { I18nProvider } from "./i18n";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Marquee from "./Marquee";
import How from "./How";
import Features from "./Features";
import Story from "./Story";
import Award from "./Award";
import { Cta, Faq, Footer } from "./Closing";

function Progress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-trido"
      style={{ scaleX }}
    />
  );
}

export interface LandingPageProps {
  onLaunchApp?: () => void;
}

export default function LandingPage({ onLaunchApp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#e4e3e0] text-[#0a1a3a] antialiased selection:bg-[#ffcc00] selection:text-[#0d3a80]">
      <I18nProvider>
        <MotionConfig reducedMotion="user">
          <Progress />
          <Navbar onLaunchApp={onLaunchApp} />
          <main>
            <Hero onLaunchApp={onLaunchApp} />
            <Marquee />
            <How />
            <Features />
            <Story />
            <Award />
            <Faq />
            <Cta onLaunchApp={onLaunchApp} />
          </main>
          <Footer />
        </MotionConfig>
      </I18nProvider>
    </div>
  );
}

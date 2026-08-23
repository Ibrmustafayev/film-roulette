"use client";

import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Zap,
  Sliders,
  Film,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  Info,
} from "lucide-react";

type Category =
  | "gettingStarted"
  | "features"
  | "filters"
  | "player"
  | "account"
  | "faq";

interface CategoryInfo {
  id: Category;
  icon: React.ElementType;
}

const CATEGORIES: CategoryInfo[] = [
  { id: "gettingStarted", icon: BookOpen },
  { id: "features", icon: Zap },
  { id: "filters", icon: Sliders },
  { id: "player", icon: Film },
  { id: "account", icon: ShieldAlert },
  { id: "faq", icon: HelpCircle },
];

export function HelpView() {
  const { locale } = useStore();
  const t = getTranslations(locale);
  const [activeCategory, setActiveCategory] = useState<Category>("gettingStarted");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Helper to render Category content
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case "gettingStarted":
        return (
          <motion.div
            key="gettingStarted"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10 animate-in fade-in duration-300"
          >
            <div>
              <h3 className="text-h3 font-semibold text-ink-9">
                {t("help.gettingStartedTitle")}
              </h3>
              <p className="text-base md:text-lg text-ink-6/90 mt-4 leading-relaxed">
                {t("help.gettingStartedDesc")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div className="p-8  bg-ink-2/40 border border-ink-4/60 hover:bg-ink-2/60 hover:border-live-border/20 transition-all hover:shadow-lg space-y-5 duration-300">
                <div className="w-14 h-14  bg-live/10 flex items-center justify-center text-live font-prose text-h4 font-semibold">
                  1
                </div>
                <h4 className="text-h4 font-semibold text-ink-9">
                  {t("help.gs1Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed">
                  {t("help.gs1Desc")}
                </p>
              </div>

              <div className="p-8  bg-ink-2/40 border border-ink-4/60 hover:bg-ink-2/60 hover:border-live-border/20 transition-all hover:shadow-lg space-y-5 duration-300">
                <div className="w-14 h-14  bg-live/10 flex items-center justify-center text-live font-prose text-h4 font-semibold">
                  2
                </div>
                <h4 className="text-h4 font-semibold text-ink-9">
                  {t("help.gs2Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed">
                  {t("help.gs2Desc")}
                </p>
              </div>

              <div className="p-8  bg-ink-2/40 border border-ink-4/60 hover:bg-ink-2/60 hover:border-live-border/20 transition-all hover:shadow-lg space-y-5 duration-300">
                <div className="w-14 h-14  bg-live/10 flex items-center justify-center text-live font-prose text-h4 font-semibold">
                  3
                </div>
                <h4 className="text-h4 font-semibold text-ink-9">
                  {t("help.gs3Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed">
                  {t("help.gs3Desc")}
                </p>
              </div>
            </div>
          </motion.div>
        );

      case "features":
        return (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10 animate-in fade-in duration-300"
          >
            <div>
              <h3 className="text-h3 font-semibold text-ink-9">
                {t("help.featuresTitle")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all space-y-4 duration-300">
                <h4 className="text-h4 font-semibold text-live flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-live" />
                  {t("help.feat1Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed pl-5.5">
                  {t("help.feat1Desc")}
                </p>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all space-y-4 duration-300">
                <h4 className="text-h4 font-semibold text-live flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-live" />
                  {t("help.feat2Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed pl-5.5">
                  {t("help.feat2Desc")}
                </p>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all space-y-4 duration-300">
                <h4 className="text-h4 font-semibold text-live flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-live" />
                  {t("help.feat3Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed pl-5.5">
                  {t("help.feat3Desc")}
                </p>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all space-y-4 duration-300">
                <h4 className="text-h4 font-semibold text-live flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-live" />
                  {t("help.feat4Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed pl-5.5">
                  {t("help.feat4Desc")}
                </p>
              </div>
            </div>
          </motion.div>
        );

      case "filters":
        return (
          <motion.div
            key="filters"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10 animate-in fade-in duration-300"
          >
            <div>
              <h3 className="text-h3 font-semibold text-ink-9">
                {t("help.filtersTitle")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all space-y-4 duration-300">
                <h4 className="text-h4 font-semibold text-live flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-live" />
                  {t("help.filt1Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed pl-9">
                  {t("help.filt1Desc")}
                </p>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all space-y-4 duration-300">
                <h4 className="text-h4 font-semibold text-live flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-live" />
                  {t("help.filt2Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed pl-9">
                  {t("help.filt2Desc")}
                </p>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all space-y-4 duration-300">
                <h4 className="text-h4 font-semibold text-live flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-live" />
                  {t("help.filt3Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed pl-9">
                  {t("help.filt3Desc")}
                </p>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all space-y-4 duration-300">
                <h4 className="text-h4 font-semibold text-live flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-live" />
                  {t("help.filt4Title")}
                </h4>
                <p className="text-base text-ink-6/90 leading-relaxed pl-9">
                  {t("help.filt4Desc")}
                </p>
              </div>
            </div>
          </motion.div>
        );

      case "player":
        return (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10 animate-in fade-in duration-300"
          >
            <div>
              <h3 className="text-h3 font-semibold text-ink-9">
                {t("help.playerTitle")}
              </h3>
            </div>

            {/* AdGuard Recommendation Banner */}
            <div className="p-6 bg-amber-500/5 border border-amber-500/20 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-h4 font-semibold text-amber-400">
                    {t("help.adguardTitle")}
                  </h4>
                  <p className="text-base text-ink-6/90 leading-relaxed">
                    {t("help.adguardDesc")}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <a
                      href="https://chromewebstore.google.com/detail/adguard-adblocker/bgnkhhnnamicmpeenaelnjfhikgbkllg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ctl ctl-ghost h-8 text-label gap-1.5 px-3 border border-ink-4 hover:border-amber-500/40 hover:text-amber-400 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                      {t("help.adguardChrome")}
                    </a>
                    <a
                      href="https://addons.mozilla.org/en-US/firefox/addon/adguard-adblocker/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ctl ctl-ghost h-8 text-label gap-1.5 px-3 border border-ink-4 hover:border-amber-500/40 hover:text-amber-400 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                      {t("help.adguardFirefox")}
                    </a>
                    <a
                      href="https://microsoftedge.microsoft.com/addons/detail/adguard-adblocker/pdffkfellgipmhedpbgibhbmoblobing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ctl ctl-ghost h-8 text-label gap-1.5 px-3 border border-ink-4 hover:border-amber-500/40 hover:text-amber-400 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                      {t("help.adguardEdge")}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all flex gap-6 duration-300">
                <div className="p-4  bg-live/10 text-live h-fit shrink-0">
                  <Film className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h4 font-semibold text-ink-9">{t("help.pl1Title")}</h4>
                  <p className="text-base text-ink-6 mt-3 leading-relaxed">
                    {t("help.pl1Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all flex gap-6 duration-300">
                <div className="p-4  bg-live/10 text-live h-fit shrink-0">
                  <Film className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h4 font-semibold text-ink-9">{t("help.pl2Title")}</h4>
                  <p className="text-base text-ink-6 mt-3 leading-relaxed">
                    {t("help.pl2Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all flex gap-6 duration-300">
                <div className="p-4  bg-live/10 text-live h-fit shrink-0">
                  <Film className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h4 font-semibold text-ink-9">{t("help.pl3Title")}</h4>
                  <p className="text-base text-ink-6 mt-3 leading-relaxed">
                    {t("help.pl3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "account":
        return (
          <motion.div
            key="account"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10 animate-in fade-in duration-300"
          >
            <div>
              <h3 className="text-h3 font-semibold text-ink-9">
                {t("help.accountTitle")}
              </h3>
            </div>

            <div className="space-y-8">
              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all flex gap-6 duration-300">
                <div className="p-4  bg-live/10 text-live h-fit shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h4 font-semibold text-ink-9">{t("help.acc1Title")}</h4>
                  <p className="text-base text-ink-6 mt-3 leading-relaxed">
                    {t("help.acc1Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all flex gap-6 duration-300">
                <div className="p-4  bg-live/10 text-live h-fit shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h4 font-semibold text-ink-9">{t("help.acc2Title")}</h4>
                  <p className="text-base text-ink-6 mt-3 leading-relaxed">
                    {t("help.acc2Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8  bg-ink-2/30 border border-ink-4/50 hover:bg-ink-2/45 hover:border-live-border/20 hover:shadow-lg transition-all flex gap-6 duration-300">
                <div className="p-4  bg-live/10 text-live h-fit shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h4 font-semibold text-ink-9">{t("help.acc3Title")}</h4>
                  <p className="text-base text-ink-6 mt-3 leading-relaxed">
                    {t("help.acc3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "faq":
        const faqs = [
          { q: t("help.faq1Q"), a: t("help.faq1A") },
          { q: t("help.faq2Q"), a: t("help.faq2A") },
          { q: t("help.faq3Q"), a: t("help.faq3A") },
          { q: t("help.faq4Q"), a: t("help.faq4A") },
          { q: t("help.faq5Q"), a: t("help.faq5A") },
        ];

        return (
          <motion.div
            key="faq"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10 animate-in fade-in duration-300"
          >
            <div>
              <h3 className="text-h3 font-semibold text-ink-9">
                {t("help.faqTitle")}
              </h3>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-ink-4/60 bg-ink-2/30 overflow-hidden hover:border-live-border/20 transition-colors shadow-sm"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full flex items-center justify-between p-6 md:p-7 font-semibold text-base md:text-lg text-left text-ink-9 hover:text-live transition-colors gap-4"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-6 h-6 shrink-0 text-ink-6 transition-transform duration-300 ${
                          isExpanded ? "rotate-180 text-live" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="p-7 pt-2 text-base text-ink-6/95 leading-relaxed border-t border-ink-4/10 mt-1">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="stage-pad space-y-10 pt-10 sm:pt-16">
      <header>
        <h2 className="rail-heading mb-3">{t("help.title")}</h2>
        <p className="max-w-[62ch] font-prose text-body-lg leading-[1.6] text-ink-6">
          {t("help.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start pt-6">
        {/* Left Sub-Navigation Sidebar */}
        <div className="md:col-span-4 space-y-3.5 bg-ink-2 border border-ink-4/60 p-6  sticky top-24 shadow-sm">
          {CATEGORIES.map(({ id, icon: Icon }) => {
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveCategory(id);
                  setExpandedFaq(null);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4  transition-all text-left group relative ${
                  isActive
                    ? "text-live font-semibold bg-live/10 shadow-sm"
                    : "hover:bg-ink-2 text-ink-9/80 hover:text-ink-9"
                }`}
              >
                <div
                  className={`p-3 rounded-control transition-colors ${
                    isActive
                      ? "bg-live/15"
                      : "bg-ink-2 group-hover:bg-ink-3/40"
                  }`}
                >
                  <Icon className={`w-5.5 h-5.5 ${isActive ? "text-live" : ""}`} />
                </div>
                <span className="text-body font-medium">{t(`help.${id}`)}</span>

                {/* Animated active vertical border line */}
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryLine"
                    className="absolute left-0 top-2 bottom-2 w-px bg-green"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Content Pane */}
        <div className="md:col-span-8 bg-ink-2 border border-ink-4/60 p-8 md:p-12  min-h-[500px] shadow-sm flex flex-col justify-between">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {renderCategoryContent()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

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
              <h3 className="text-h3 font-semibold text-heading">
                {t("help.gettingStartedTitle")}
              </h3>
              <p className="text-base md:text-lg text-meta/90 mt-4 leading-relaxed">
                {t("help.gettingStartedDesc")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div className="p-8 rounded-panel bg-surface/40 border border-surface-alt/60 hover:bg-surface/60 hover:border-green/20 transition-all hover:shadow-lg hover:shadow-primary/5 space-y-5 duration-300">
                <div className="w-14 h-14 rounded-[8px] bg-green-surface/10 flex items-center justify-center text-green font-serif text-h4 font-semibold">
                  1
                </div>
                <h4 className="text-h5 font-semibold text-heading">
                  {t("help.gs1Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed">
                  {t("help.gs1Desc")}
                </p>
              </div>

              <div className="p-8 rounded-panel bg-surface/40 border border-surface-alt/60 hover:bg-surface/60 hover:border-green/20 transition-all hover:shadow-lg hover:shadow-primary/5 space-y-5 duration-300">
                <div className="w-14 h-14 rounded-[8px] bg-green-surface/10 flex items-center justify-center text-green font-serif text-h4 font-semibold">
                  2
                </div>
                <h4 className="text-h5 font-semibold text-heading">
                  {t("help.gs2Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed">
                  {t("help.gs2Desc")}
                </p>
              </div>

              <div className="p-8 rounded-panel bg-surface/40 border border-surface-alt/60 hover:bg-surface/60 hover:border-green/20 transition-all hover:shadow-lg hover:shadow-primary/5 space-y-5 duration-300">
                <div className="w-14 h-14 rounded-[8px] bg-green-surface/10 flex items-center justify-center text-green font-serif text-h4 font-semibold">
                  3
                </div>
                <h4 className="text-h5 font-semibold text-heading">
                  {t("help.gs3Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed">
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
              <h3 className="text-h3 font-semibold text-heading">
                {t("help.featuresTitle")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="text-h5 font-semibold text-green flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-surface" />
                  {t("help.feat1Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed pl-5.5">
                  {t("help.feat1Desc")}
                </p>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="text-h5 font-semibold text-green flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-surface" />
                  {t("help.feat2Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed pl-5.5">
                  {t("help.feat2Desc")}
                </p>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="text-h5 font-semibold text-green flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-surface" />
                  {t("help.feat3Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed pl-5.5">
                  {t("help.feat3Desc")}
                </p>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="text-h5 font-semibold text-green flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-surface" />
                  {t("help.feat4Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed pl-5.5">
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
              <h3 className="text-h3 font-semibold text-heading">
                {t("help.filtersTitle")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="text-h5 font-semibold text-green flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-green" />
                  {t("help.filt1Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed pl-9">
                  {t("help.filt1Desc")}
                </p>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="text-h5 font-semibold text-green flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-green" />
                  {t("help.filt2Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed pl-9">
                  {t("help.filt2Desc")}
                </p>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="text-h5 font-semibold text-green flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-green" />
                  {t("help.filt3Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed pl-9">
                  {t("help.filt3Desc")}
                </p>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="text-h5 font-semibold text-green flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-green" />
                  {t("help.filt4Title")}
                </h4>
                <p className="text-base text-meta/90 leading-relaxed pl-9">
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
              <h3 className="text-h3 font-semibold text-heading">
                {t("help.playerTitle")}
              </h3>
            </div>

            <div className="space-y-8">
              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-[8px] bg-green-surface/10 text-green h-fit shrink-0">
                  <Film className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h5 font-semibold text-heading">{t("help.pl1Title")}</h4>
                  <p className="text-base text-meta mt-3 leading-relaxed">
                    {t("help.pl1Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-[8px] bg-green-surface/10 text-green h-fit shrink-0">
                  <Film className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h5 font-semibold text-heading">{t("help.pl2Title")}</h4>
                  <p className="text-base text-meta mt-3 leading-relaxed">
                    {t("help.pl2Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-[8px] bg-green-surface/10 text-green h-fit shrink-0">
                  <Film className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h5 font-semibold text-heading">{t("help.pl3Title")}</h4>
                  <p className="text-base text-meta mt-3 leading-relaxed">
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
              <h3 className="text-h3 font-semibold text-heading">
                {t("help.accountTitle")}
              </h3>
            </div>

            <div className="space-y-8">
              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-[8px] bg-green-surface/10 text-green h-fit shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h5 font-semibold text-heading">{t("help.acc1Title")}</h4>
                  <p className="text-base text-meta mt-3 leading-relaxed">
                    {t("help.acc1Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-[8px] bg-green-surface/10 text-green h-fit shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h5 font-semibold text-heading">{t("help.acc2Title")}</h4>
                  <p className="text-base text-meta mt-3 leading-relaxed">
                    {t("help.acc2Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-panel bg-surface/30 border border-surface-alt/50 hover:bg-surface/45 hover:border-green/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-[8px] bg-green-surface/10 text-green h-fit shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-h5 font-semibold text-heading">{t("help.acc3Title")}</h4>
                  <p className="text-base text-meta mt-3 leading-relaxed">
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
              <h3 className="text-h3 font-semibold text-heading">
                {t("help.faqTitle")}
              </h3>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-panel border border-surface-alt/60 bg-surface/30 overflow-hidden hover:border-green/20 transition-colors shadow-sm"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full flex items-center justify-between p-6 md:p-7 font-semibold text-base md:text-lg text-left text-heading hover:text-green transition-colors gap-4"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-6 h-6 shrink-0 text-meta transition-transform duration-300 ${
                          isExpanded ? "rotate-180 text-green" : ""
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
                          <div className="p-7 pt-2 text-base text-meta/95 leading-relaxed border-t border-surface-alt/10 mt-1">
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
    <div className="mx-auto w-full max-w-[960px] space-y-10 px-6 pt-10">
      <header>
        <h2 className="label-rule">{t("help.title")}</h2>
        <p className="max-w-[62ch] font-serif text-body-lg leading-[1.6] text-meta">
          {t("help.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start pt-6">
        {/* Left Sub-Navigation Sidebar */}
        <div className="md:col-span-4 space-y-3.5 bg-surface border border-surface-alt/60 p-6 rounded-panel sticky top-24 shadow-sm">
          {CATEGORIES.map(({ id, icon: Icon }) => {
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveCategory(id);
                  setExpandedFaq(null);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[8px] transition-all text-left group relative ${
                  isActive
                    ? "text-green font-semibold bg-green-surface/10 shadow-sm"
                    : "hover:bg-surface text-heading/80 hover:text-heading"
                }`}
              >
                <div
                  className={`p-3 rounded-[4px] transition-colors ${
                    isActive
                      ? "bg-green-surface/15"
                      : "bg-surface group-hover:bg-panel/40"
                  }`}
                >
                  <Icon className={`w-5.5 h-5.5 ${isActive ? "text-green" : ""}`} />
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
        <div className="md:col-span-8 bg-surface border border-surface-alt/60 p-8 md:p-12 rounded-panel min-h-[500px] shadow-sm flex flex-col justify-between">
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

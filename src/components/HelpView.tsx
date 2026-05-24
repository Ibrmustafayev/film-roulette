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
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {t("help.gettingStartedTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {t("help.gettingStartedDesc")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 hover:bg-muted/60 hover:border-primary/20 transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  1
                </div>
                <h4 className="font-semibold text-sm">
                  {t("help.gs1Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("help.gs1Desc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 hover:bg-muted/60 hover:border-primary/20 transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  2
                </div>
                <h4 className="font-semibold text-sm">
                  {t("help.gs2Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("help.gs2Desc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 hover:bg-muted/60 hover:border-primary/20 transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  3
                </div>
                <h4 className="font-semibold text-sm">
                  {t("help.gs3Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
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
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {t("help.featuresTitle")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all space-y-2">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("help.feat1Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-3">
                  {t("help.feat1Desc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all space-y-2">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("help.feat2Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-3">
                  {t("help.feat2Desc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all space-y-2">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("help.feat3Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-3">
                  {t("help.feat3Desc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all space-y-2">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("help.feat4Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-3">
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
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {t("help.filtersTitle")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all space-y-2">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  {t("help.filt1Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("help.filt1Desc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all space-y-2">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  {t("help.filt2Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("help.filt2Desc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all space-y-2">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  {t("help.filt3Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("help.filt3Desc")}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all space-y-2">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  {t("help.filt4Title")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
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
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {t("help.playerTitle")}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all flex gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 h-fit">
                  <Film className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t("help.pl1Title")}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t("help.pl1Desc")}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all flex gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 h-fit">
                  <Film className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t("help.pl2Title")}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t("help.pl2Desc")}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all flex gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 h-fit">
                  <Film className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t("help.pl3Title")}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {t("help.accountTitle")}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all flex gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 h-fit">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t("help.acc1Title")}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t("help.acc1Desc")}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all flex gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 h-fit">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t("help.acc2Title")}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t("help.acc2Desc")}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/45 hover:border-primary/20 transition-all flex gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 h-fit">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t("help.acc3Title")}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {t("help.faqTitle")}
              </h3>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-border/60 bg-muted/30 overflow-hidden hover:border-primary/20 transition-colors"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full flex items-center justify-between p-4 font-semibold text-sm text-left text-foreground hover:text-primary transition-colors gap-4"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-350 ${
                          isExpanded ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/20 mt-1">
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
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-primary/20"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{t("help.title")}</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-2xl md:text-3xl font-black"
        >
          {t("help.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-muted-foreground text-sm"
        >
          {t("help.subtitle")}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-4">
        {/* Left Sub-Navigation Sidebar */}
        <div className="md:col-span-4 space-y-2 bg-card border border-border/60 p-4 rounded-3xl sticky top-24 shadow-sm">
          {CATEGORIES.map(({ id, icon: Icon }) => {
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveCategory(id);
                  setExpandedFaq(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group relative ${
                  isActive
                    ? "text-primary font-bold bg-primary/10"
                    : "hover:bg-muted text-foreground/80 hover:text-foreground"
                }`}
              >
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/15"
                      : "bg-muted group-hover:bg-muted-foreground/10"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                </div>
                <span className="text-xs md:text-sm">{t(`help.${id}`)}</span>

                {/* Animated active vertical border line */}
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryLine"
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Content Pane */}
        <div className="md:col-span-8 bg-card border border-border/60 p-6 rounded-3xl min-h-[400px] shadow-sm flex flex-col justify-between">
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

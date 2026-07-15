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
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                {t("help.gettingStartedTitle")}
              </h3>
              <p className="text-base md:text-lg text-muted-foreground/90 mt-4 leading-relaxed">
                {t("help.gettingStartedDesc")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div className="p-8 rounded-[24px] bg-muted/40 border border-border/60 hover:bg-muted/60 hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5 space-y-5 duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                  1
                </div>
                <h4 className="font-black text-lg text-foreground">
                  {t("help.gs1Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed">
                  {t("help.gs1Desc")}
                </p>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/40 border border-border/60 hover:bg-muted/60 hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5 space-y-5 duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                  2
                </div>
                <h4 className="font-black text-lg text-foreground">
                  {t("help.gs2Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed">
                  {t("help.gs2Desc")}
                </p>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/40 border border-border/60 hover:bg-muted/60 hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5 space-y-5 duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                  3
                </div>
                <h4 className="font-black text-lg text-foreground">
                  {t("help.gs3Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed">
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
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                {t("help.featuresTitle")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="font-black text-lg text-primary flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  {t("help.feat1Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed pl-5.5">
                  {t("help.feat1Desc")}
                </p>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="font-black text-lg text-primary flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  {t("help.feat2Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed pl-5.5">
                  {t("help.feat2Desc")}
                </p>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="font-black text-lg text-primary flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  {t("help.feat3Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed pl-5.5">
                  {t("help.feat3Desc")}
                </p>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="font-black text-lg text-primary flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  {t("help.feat4Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed pl-5.5">
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
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                {t("help.filtersTitle")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="font-black text-lg text-primary flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-primary" />
                  {t("help.filt1Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed pl-9">
                  {t("help.filt1Desc")}
                </p>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="font-black text-lg text-primary flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-primary" />
                  {t("help.filt2Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed pl-9">
                  {t("help.filt2Desc")}
                </p>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="font-black text-lg text-primary flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-primary" />
                  {t("help.filt3Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed pl-9">
                  {t("help.filt3Desc")}
                </p>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all space-y-4 duration-300">
                <h4 className="font-black text-lg text-primary flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-primary" />
                  {t("help.filt4Title")}
                </h4>
                <p className="text-base text-muted-foreground/90 leading-relaxed pl-9">
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
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                {t("help.playerTitle")}
              </h3>
            </div>

            <div className="space-y-8">
              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary h-fit shrink-0">
                  <Film className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground">{t("help.pl1Title")}</h4>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                    {t("help.pl1Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary h-fit shrink-0">
                  <Film className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground">{t("help.pl2Title")}</h4>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                    {t("help.pl2Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary h-fit shrink-0">
                  <Film className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground">{t("help.pl3Title")}</h4>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">
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
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                {t("help.accountTitle")}
              </h3>
            </div>

            <div className="space-y-8">
              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary h-fit shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground">{t("help.acc1Title")}</h4>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                    {t("help.acc1Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary h-fit shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground">{t("help.acc2Title")}</h4>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                    {t("help.acc2Desc")}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-[24px] bg-muted/30 border border-border/50 hover:bg-muted/45 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex gap-6 duration-300">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary h-fit shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground">{t("help.acc3Title")}</h4>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">
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
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                {t("help.faqTitle")}
              </h3>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-[24px] border border-border/60 bg-muted/30 overflow-hidden hover:border-primary/20 transition-colors shadow-sm"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full flex items-center justify-between p-6 md:p-7 font-black text-base md:text-lg text-left text-foreground hover:text-primary transition-colors gap-4"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-6 h-6 shrink-0 text-muted-foreground transition-transform duration-300 ${
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
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="p-7 pt-2 text-base text-muted-foreground/95 leading-relaxed border-t border-border/10 mt-1">
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
    <div className="w-full max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2.5 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20 shadow-sm"
        >
          <Info className="w-4 h-4" />
          <span>{t("help.title")}</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-4xl md:text-5xl font-black text-foreground tracking-tight"
        >
          {t("help.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed"
        >
          {t("help.subtitle")}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start pt-6">
        {/* Left Sub-Navigation Sidebar */}
        <div className="md:col-span-4 space-y-3.5 bg-card border border-border/60 p-6 rounded-[32px] sticky top-24 shadow-sm">
          {CATEGORIES.map(({ id, icon: Icon }) => {
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveCategory(id);
                  setExpandedFaq(null);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left group relative ${
                  isActive
                    ? "text-primary font-black bg-primary/10 shadow-sm"
                    : "hover:bg-muted text-foreground/80 hover:text-foreground"
                }`}
              >
                <div
                  className={`p-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-primary/15"
                      : "bg-muted group-hover:bg-muted-foreground/10"
                  }`}
                >
                  <Icon className={`w-5.5 h-5.5 ${isActive ? "text-primary" : ""}`} />
                </div>
                <span className="text-base md:text-lg font-bold">{t(`help.${id}`)}</span>

                {/* Animated active vertical border line */}
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryLine"
                    className="absolute left-0 top-3.5 bottom-3.5 w-1.5 rounded-r-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Content Pane */}
        <div className="md:col-span-8 bg-card border border-border/60 p-8 md:p-12 rounded-[32px] min-h-[500px] shadow-sm flex flex-col justify-between">
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

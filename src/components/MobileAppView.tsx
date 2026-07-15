"use client";

import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Download,
  Wifi,
  Zap,
  Moon,
  ExternalLink,
} from "lucide-react";

function FeatureChip({
  icon: Icon,
  label,
  desc,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-5 p-6 rounded-[24px] bg-muted/30 border border-border/50 hover:border-primary/20 transition-all hover:bg-muted/40 hover:shadow-lg hover:shadow-primary/5 duration-300">
      <div className="shrink-0 p-3.5 rounded-2xl bg-primary/10 text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-black text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground/90 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export function MobileAppView() {
  const { locale } = useStore();
  const t = getTranslations(locale);
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");
  const [siteUrl, setSiteUrl] = useState("https://filmroulette.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteUrl(window.location.origin);
    }
  }, []);

  const androidSteps = [
    t("mobileapp.androidStep1"),
    t("mobileapp.androidStep2"),
    t("mobileapp.androidStep3"),
    t("mobileapp.androidStep4"),
  ];

  const iosSteps = [
    t("mobileapp.iosStep1"),
    t("mobileapp.iosStep2"),
    t("mobileapp.iosStep3"),
    t("mobileapp.iosStep4"),
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2.5 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20 shadow-sm"
        >
          <Smartphone className="w-4 h-4" />
          <span>{t("mobileapp.badge")}</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-4xl md:text-5xl font-black text-foreground tracking-tight"
        >
          {t("mobileapp.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed"
        >
          {t("mobileapp.subtitle")}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-6">
        {/* Left Column: Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-5 flex justify-center lg:sticky lg:top-24"
        >
          <div className="relative w-[300px] h-[610px] rounded-[56px] border-[14px] border-neutral-900 bg-neutral-950 shadow-2xl overflow-hidden ring-4 ring-neutral-800/10 shadow-primary/5 flex flex-col justify-between">
            {/* Speaker & Camera (Dynamic Island style Notch) */}
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-full z-20 flex items-center justify-center">
              <div className="w-3 h-3 bg-neutral-950 rounded-full absolute left-4" />
              <div className="w-2 h-2 bg-neutral-800 rounded-full absolute right-4" />
            </div>

            {/* Screen Content - Real Mockup Image */}
            <div className="w-full h-full relative z-10 overflow-hidden bg-black">
              <img
                src="/mobile_app_screenshot.png"
                alt="Film Roulette Mobile App Screenshot"
                className="w-full h-full object-cover scale-[1.01]"
              />
              {/* Glossy sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-15" />
            </div>

            {/* Home Bar */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-36 h-1.5 bg-white/30 rounded-full z-20" />
          </div>
        </motion.div>

        {/* Right Column: App details & Guide */}
        <div className="lg:col-span-7 space-y-10">
          {/* QR + Download */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative overflow-hidden rounded-[32px] border border-border bg-gradient-to-br from-muted/70 via-card to-muted/50 p-8 md:p-10 flex flex-col sm:flex-row items-center gap-10 shadow-sm"
          >
            {/* Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {/* QR Code Visual - Real Scannable QR Code */}
            <div className="shrink-0 w-40 h-40 rounded-2xl bg-white p-3 flex items-center justify-center shadow-xl border border-border/40 overflow-hidden">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(siteUrl)}&color=0f172a&margin=10`}
                alt="QR Code to download Film Roulette app"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-5 text-center sm:text-left flex-1">
              <div>
                <p className="font-black text-xl text-foreground">{t("mobileapp.scanTitle")}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {t("mobileapp.scanDesc")}
                </p>
              </div>
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/95 text-primary-foreground px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] duration-200"
              >
                <Download className="w-5 h-5" />
                {t("mobileapp.downloadBtn")}
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <FeatureChip icon={Wifi} label={t("mobileapp.featureOffline")} desc={t("mobileapp.featureOfflineDesc")} />
            <FeatureChip icon={Zap} label={t("mobileapp.featureFast")} desc={t("mobileapp.featureFastDesc")} />
            <FeatureChip icon={Moon} label={t("mobileapp.featureTheme")} desc={t("mobileapp.featureThemeDesc")} />
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-4 pt-6">
            <div className="h-px bg-border/60 flex-1" />
            <span className="text-xs font-black uppercase tracking-widest text-primary/80 bg-primary/5 border border-primary/15 px-5 py-2 rounded-full shadow-sm">
              Installation Guide
            </span>
            <div className="h-px bg-border/60 flex-1" />
          </div>

          {/* Interactive Installation Guide */}
          <div className="space-y-8">
            {/* Platform Selection Tabs */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setActiveTab("android")}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl border transition-all font-black text-sm uppercase tracking-wider shadow-sm ${
                  activeTab === "android"
                    ? "bg-green-500/10 text-green-500 border-green-500/35 shadow-green-500/5 scale-[1.02]"
                    : "bg-muted/45 text-muted-foreground border-transparent hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <span className="text-lg">🤖</span> {t("mobileapp.androidTitle")}
              </button>
              <button
                onClick={() => setActiveTab("ios")}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl border transition-all font-black text-sm uppercase tracking-wider shadow-sm ${
                  activeTab === "ios"
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/35 shadow-blue-500/5 scale-[1.02]"
                    : "bg-muted/45 text-muted-foreground border-transparent hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <span className="text-lg">🍎</span> {t("mobileapp.iosTitle")}
              </button>
            </div>

            {/* Vertical timeline for the steps */}
            <div className="relative border-l-2 border-dashed border-border/80 ml-8 pl-10 space-y-8 pt-4 pb-4">
              {(activeTab === "android" ? androidSteps : iosSteps).map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 120 }}
                  className="relative group"
                >
                  {/* Step number badge */}
                  <div className={`absolute -left-[60px] top-1.5 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border transition-all shadow-md ${
                    activeTab === "android"
                      ? "bg-green-500/15 text-green-500 border-green-500/35 group-hover:bg-green-500 group-hover:text-white group-hover:shadow-green-500/20"
                      : "bg-blue-500/15 text-blue-500 border-blue-500/35 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-blue-500/20"
                  }`}>
                    {i + 1}
                  </div>

                  {/* Step content card */}
                  <div className="p-6 md:p-7 rounded-[24px] bg-muted/30 border border-border/50 hover:border-primary/20 transition-all hover:bg-muted/45 hover:shadow-lg hover:shadow-primary/5 hover:translate-x-1 duration-300">
                    <p className="text-base font-bold text-foreground/90 leading-relaxed">
                      {step}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-center pt-6 pb-6"
      >
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-semibold text-primary/70 hover:text-primary underline underline-offset-4 transition-colors"
        >
          {siteUrl}
        </a>
      </motion.div>
    </div>
  );
}

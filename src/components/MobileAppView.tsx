"use client";

import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { motion } from "framer-motion";
import {
  Smartphone,
  Download,
  Wifi,
  Zap,
  Moon,
  CheckCircle2,
  ExternalLink,
  QrCode,
} from "lucide-react";

const APP_URL = "https://www.alinovruz.app/film-sys";

function StepCard({
  number,
  title,
  desc,
  delay,
}: {
  number: number;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex gap-4 p-4 rounded-xl bg-muted/40 border border-border/60 hover:border-primary/20 hover:bg-muted/60 transition-all"
    >
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
        {number}
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

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
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
      <div className="shrink-0 p-2 rounded-lg bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export function MobileAppView() {
  const { locale } = useStore();
  const t = getTranslations(locale);

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
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-primary/20"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{t("mobileapp.badge")}</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-2xl md:text-3xl font-black"
        >
          {t("mobileapp.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-muted-foreground text-sm"
        >
          {t("mobileapp.subtitle")}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
        {/* Left Column: Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-5 flex justify-center lg:sticky lg:top-24"
        >
          <div className="relative w-[280px] h-[570px] rounded-[48px] border-[10px] border-neutral-900 bg-neutral-950 shadow-2xl overflow-hidden ring-4 ring-neutral-800/30 flex flex-col justify-between">
            {/* Speaker & Camera (Dynamic Island style Notch) */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-neutral-900 rounded-full z-20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-neutral-950 rounded-full absolute left-4" />
              <div className="w-1.5 h-1.5 bg-neutral-850 rounded-full absolute right-4" />
            </div>

            {/* Screen Content - Premium Mockup Image */}
            <div className="w-full h-full relative z-10 overflow-hidden">
              <img
                src="/mobile_app_mockup.png"
                alt="Film Roulette Mobile App Mockup"
                className="w-full h-full object-cover"
              />
              {/* Glossy sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-15" />
            </div>

            {/* Home Bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-20" />
          </div>
        </motion.div>

        {/* Right Column: App details & Guide */}
        <div className="lg:col-span-7 space-y-8">
          {/* QR + Download */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/60 via-card to-muted/40 p-6 flex flex-col sm:flex-row items-center gap-6"
          >
            {/* Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {/* QR Code Visual */}
            <div className="shrink-0 w-32 h-32 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border border-border/40">
              <div className="w-full h-full rounded-xl bg-foreground/5 flex flex-col items-center justify-center gap-1.5">
                <QrCode className="w-10 h-10 text-foreground/70" />
                <span className="text-[9px] text-muted-foreground font-medium text-center leading-tight px-1">
                  Scan with camera
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-center sm:text-left flex-1">
              <div>
                <p className="font-bold text-base">{t("mobileapp.scanTitle")}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t("mobileapp.scanDesc")}
                </p>
              </div>
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                {t("mobileapp.downloadBtn")}
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <FeatureChip icon={Wifi} label={t("mobileapp.featureOffline")} desc={t("mobileapp.featureOfflineDesc")} />
            <FeatureChip icon={Zap} label={t("mobileapp.featureFast")} desc={t("mobileapp.featureFastDesc")} />
            <FeatureChip icon={Moon} label={t("mobileapp.featureTheme")} desc={t("mobileapp.featureThemeDesc")} />
          </motion.div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                Installation Guide
              </span>
            </div>
          </div>

          {/* Platform Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Android */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 px-1">
                <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <span className="text-sm">🤖</span>
                </div>
                <h3 className="font-bold text-sm text-green-600 dark:text-green-400">
                  {t("mobileapp.androidTitle")}
                </h3>
              </div>
              <div className="space-y-2">
                {androidSteps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-xs text-foreground/80">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* iOS */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 px-1">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <span className="text-sm">🍎</span>
                </div>
                <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400">
                  {t("mobileapp.iosTitle")}
                </h3>
              </div>
              <div className="space-y-2">
                {iosSteps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs text-foreground/80">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-center pt-2 pb-4"
      >
        <a
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary/70 hover:text-primary underline underline-offset-4 transition-colors"
        >
          {APP_URL}
        </a>
      </motion.div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Shield, X, ExternalLink } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "film_roulette_adguard_dismissed";

export function AdGuardBanner() {
  const { locale } = useStore();
  const t = getTranslations(locale);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(STORAGE_KEY);
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25 }}
        id="adguard-home-banner"
        className="relative my-6 overflow-hidden rounded-xs border border-amber-500/25 bg-amber-500/10 p-4 sm:p-4.5 backdrop-blur-sm transition-all"
      >
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left info & text */}
          <div className="flex items-start gap-3 min-w-0 flex-1 pr-6 sm:pr-2">
            <div className="mt-0.5 rounded-full bg-amber-500/20 p-1.5 text-amber-400 shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-small font-semibold text-amber-300">
                {t("help.adguardTitle")}
              </p>
              <p className="text-[13px] leading-relaxed text-amber-100/80">
                {t("help.adguardDesc")}
              </p>
            </div>
          </div>

          {/* Right badges & dismiss */}
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0 shrink-0">
            <a
              href="https://adguard.com/adguard-browser-extension/chrome/overview.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xs border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/25 hover:border-amber-400 hover:text-white transition-all shadow-xs"
            >
              <span>{t("help.adguardChrome")}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </a>

            <a
              href="https://addons.mozilla.org/firefox/addon/adguard-adblocker/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xs border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/25 hover:border-amber-400 hover:text-white transition-all shadow-xs"
            >
              <span>{t("help.adguardFirefox")}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </a>

            <a
              href="https://microsoftedge.microsoft.com/addons/detail/adguard-adblocker/pdffkfellgipmhklpdmokmckkkfcopbh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xs border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/25 hover:border-amber-400 hover:text-white transition-all shadow-xs"
            >
              <span>{t("help.adguardEdge")}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("menu.close") || "Close"}
          className="absolute right-2 top-2 p-1.5 text-amber-400/60 hover:text-amber-200 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

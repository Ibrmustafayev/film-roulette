"use client";

import { useState, useEffect } from "react";
import { Shield, X, ExternalLink, Smartphone, Copy, Check, Info } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "film_roulette_adguard_dismissed";
const DNS_HOST = "dns.adguard-dns.com";

export function AdGuardBanner() {
  const { locale } = useStore();
  const t = getTranslations(locale);
  const [dismissed, setDismissed] = useState(true);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [copiedDns, setCopiedDns] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(STORAGE_KEY);
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }

    const checkMobile = () => {
      const mobile =
        typeof window !== "undefined" &&
        (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  };

  const copyDns = async () => {
    try {
      await navigator.clipboard.writeText(DNS_HOST);
      setCopiedDns(true);
      setTimeout(() => setCopiedDns(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (dismissed) return null;

  return (
    <>
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

            {/* Desktop-Only Extension Badges (hidden on mobile) */}
            <div className="hidden md:flex flex-wrap items-center gap-2 pt-1 sm:pt-0 shrink-0" id="desktop-adguard-badges">
              <a
                href="https://chromewebstore.google.com/detail/adguard-adblocker/bgnkhhnnamicmpeenaelnjfhikgbkllg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xs border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/25 hover:border-amber-400 hover:text-white transition-all shadow-xs"
              >
                <span>{t("help.adguardChrome")}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </a>

              <a
                href="https://addons.mozilla.org/en-US/firefox/addon/adguard-adblocker/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xs border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/25 hover:border-amber-400 hover:text-white transition-all shadow-xs"
              >
                <span>{t("help.adguardFirefox")}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </a>

              <a
                href="https://microsoftedge.microsoft.com/addons/detail/adguard-adblocker/pdffkfellgipmhedpbgibhbmoblobing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xs border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/25 hover:border-amber-400 hover:text-white transition-all shadow-xs"
              >
                <span>{t("help.adguardEdge")}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </a>
            </div>

            {/* Mobile-Only Action Buttons & Quick Guide (hidden on desktop) */}
            <div className="flex md:hidden flex-wrap items-center gap-2 pt-1 shrink-0" id="mobile-adguard-badges">
              <button
                type="button"
                id="mobile-adguard-guide-btn"
                onClick={() => setShowMobileModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xs border border-amber-400/50 bg-amber-500/25 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/35 hover:text-white transition-all shadow-xs"
              >
                <Smartphone className="h-3 w-3 text-amber-300" />
                <span>{t("help.adguardMobileGuide") || "📱 Mobile Guide"}</span>
              </button>

              <a
                href="https://brave.com/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xs border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/25 transition-all"
              >
                <span>🦁 Brave</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </a>

              <a
                href="https://www.mozilla.org/firefox/browsers/mobile/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xs border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/25 transition-all"
              >
                <span>🦊 Firefox</span>
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

      {/* Mobile Ad-Blocking Guide Modal */}
      <AnimatePresence>
        {showMobileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowMobileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-ink-2 border border-amber-500/30 p-5 shadow-lifted rounded-xs space-y-4 text-ink-9"
            >
              <div className="flex items-center justify-between border-b border-ink-4 pb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Smartphone className="h-5 w-5" />
                  <h3 className="text-body font-semibold">{t("help.adguardMobileTitle")}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileModal(false)}
                  className="ctl ctl-ghost h-7 w-7 px-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 1. Private DNS */}
              <div className="space-y-2 rounded-xs border border-amber-500/20 bg-amber-500/5 p-3.5">
                <h4 className="text-small font-semibold text-amber-300">
                  {t("help.adguardMobileDnsTitle")}
                </h4>
                <p className="text-xs text-ink-7 leading-relaxed">
                  {t("help.adguardMobileDnsAndroid")}
                </p>
                <div className="flex items-center justify-between gap-2 rounded-xs bg-ink-1 px-2.5 py-1.5 border border-ink-4">
                  <code className="text-xs font-mono text-live select-all">{DNS_HOST}</code>
                  <button
                    type="button"
                    onClick={copyDns}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-100 transition-colors"
                  >
                    {copiedDns ? <Check className="h-3 w-3 text-live" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedDns ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-xs text-ink-7 leading-relaxed pt-1">
                  {t("help.adguardMobileDnsIos")}
                </p>
              </div>

              {/* 2. Built-in AdBlock Browsers */}
              <div className="space-y-2 rounded-xs border border-ink-4 bg-ink-1/50 p-3.5">
                <h4 className="text-small font-semibold text-ink-9">
                  {t("help.adguardMobileBrowsersTitle")}
                </h4>
                <p className="text-xs text-ink-7">
                  {t("help.adguardMobileBrave")}
                </p>
                <a
                  href="https://brave.com/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-link hover:underline"
                >
                  <span>Brave Browser Yüklə</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* 3. Android Extensions */}
              <div className="space-y-2 rounded-xs border border-ink-4 bg-ink-1/50 p-3.5">
                <h4 className="text-small font-semibold text-ink-9">
                  {t("help.adguardMobileExtensionsTitle")}
                </h4>
                <p className="text-xs text-ink-7">
                  {t("help.adguardMobileFirefox")}
                </p>
                <a
                  href="https://www.mozilla.org/firefox/browsers/mobile/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-link hover:underline"
                >
                  <span>Firefox Mobile Yüklə</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="ctl ctl-primary w-full h-8 text-xs font-medium"
              >
                {t("feedback.close") || "Bağla"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

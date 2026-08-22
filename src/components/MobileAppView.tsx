"use client";

import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { useState, useEffect } from "react";
import {
  Smartphone,
  TabletSmartphone,
  Download,
  Wifi,
  Zap,
  Moon,
  ExternalLink,
} from "lucide-react";
import { StageHeading } from "./StageHeading";

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

  const steps =
    activeTab === "android"
      ? [
          t("mobileapp.androidStep1"),
          t("mobileapp.androidStep2"),
          t("mobileapp.androidStep3"),
          t("mobileapp.androidStep4"),
        ]
      : [
          t("mobileapp.iosStep1"),
          t("mobileapp.iosStep2"),
          t("mobileapp.iosStep3"),
          t("mobileapp.iosStep4"),
        ];

  const features = [
    { icon: Wifi, label: t("mobileapp.featureOffline"), desc: t("mobileapp.featureOfflineDesc") },
    { icon: Zap, label: t("mobileapp.featureFast"), desc: t("mobileapp.featureFastDesc") },
    { icon: Moon, label: t("mobileapp.featureTheme"), desc: t("mobileapp.featureThemeDesc") },
  ];

  return (
    <section aria-label={t("mobileapp.title")} className="stage-pad pt-10 sm:pt-16">
      <StageHeading
        title={t("mobileapp.title")}
        subtitle={t("mobileapp.subtitle")}
      />

      {/* Scan block — hairline, hard-cornered, no gradient */}
      <div className="flex flex-col items-start gap-8 border border-ink-4 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="w-36 shrink-0 bg-white p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              siteUrl
            )}&margin=8`}
            alt={t("mobileapp.scanTitle")}
            className="block h-full w-full"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-h4 font-semibold text-ink-9">
            {t("mobileapp.scanTitle")}
          </h3>
          <p className="mt-2 max-w-[52ch] font-prose text-body leading-[1.6] text-ink-7">
            {t("mobileapp.scanDesc")}
          </p>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ctl ctl-live mt-5"
          >
            <Download className="h-3.5 w-3.5" />
            {t("mobileapp.downloadBtn")}
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        </div>
      </div>

      {/* Features — a ruled row, not three equal cards */}
      <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, label, desc }) => (
          <li key={label} className="border-t border-ink-4 pt-4">
            <Icon className="h-4 w-4 text-live" />
            <h3 className="mt-3 text-h4 font-semibold text-ink-9">{label}</h3>
            <p className="mt-1.5 max-w-[34ch] font-prose text-body leading-[1.6] text-ink-7">
              {desc}
            </p>
          </li>
        ))}
      </ul>

      {/* Installation guide */}
      <div className="mt-16">
        <h2 className="rail-heading mb-5">{t("mobileapp.guide")}</h2>

        <div role="tablist" className="flex gap-2">
          <button
            role="tab"
            aria-selected={activeTab === "android"}
            onClick={() => setActiveTab("android")}
            className={`ctl ${
              activeTab === "android"
                ? "border-live-border bg-live-subtle text-live"
                : "ctl-ghost"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            {t("mobileapp.androidTitle")}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "ios"}
            onClick={() => setActiveTab("ios")}
            className={`ctl ${
              activeTab === "ios"
                ? "border-link-border bg-link-subtle text-link"
                : "ctl-ghost"
            }`}
          >
            <TabletSmartphone className="h-3.5 w-3.5" />
            {t("mobileapp.iosTitle")}
          </button>
        </div>

        {/* Steps: a numbered list on a single hairline, not stacked cards */}
        <ol className="mt-8 border-l border-ink-4 pl-6">
          {steps.map((step, i) => (
            <li
              key={`${activeTab}-${i}`}
              className="relative pb-6 last:pb-0"
            >
              <span
                className="absolute -left-[1.6875rem] top-0.5 flex h-4 w-4 items-center justify-center bg-ink-1 text-label text-ink-6"
                data-num
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <p className="max-w-[56ch] font-prose text-body leading-[1.6] text-ink-8">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-12 border-t border-ink-4 pt-5">
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-small text-link transition-colors duration-[120ms] hover:text-link-hover"
          data-num
        >
          {siteUrl}
        </a>
      </p>
    </section>
  );
}

"use client";

import { useEffect } from "react";

/**
 * Comprehensive Blacklist of Ad Networks, Crypto Hijacks, and Casino/Betting Redirects
 */
const AD_DOMAIN_PATTERNS = [
  // Malicious Crypto Popups & Exchanges
  "whitebit.com", "whitebit", "cryptoexchange", "coingape",
  "buycrypto", "freebitco", "cryptocoin", "tokensale",
  "airdrop", "binance-giveaway", "uniswap-airdrop",

  // Ad & Popunder Networks
  "popads", "adcash", "adsterra", "propellerads", "exoclick",
  "trafficjunky", "monetag", "clickadu", "hilltopads", "adbuffs",
  "richpush", "trafficstars", "trafficforce", "juicyads",
  "syndication", "zeroredirect", "popunder", "clickunder",
  "adx", "adsystem", "adnxs", "adskeeper", "mgid", "outbrain",
  "taboola", "adcolony", "applovin", "unityads", "inmobi",
  "onclickmega", "ad-maven", "deloton", "fastclick", "serving-sys",
  "doubleclick", "googlesyndication", "googleadservices",

  // Casino & Betting Redirects
  "bet365", "1xbet", "melbet", "mostbet", "pin-up", "vulkan",
  "betway", "parimatch", "aviator", "stake.com", "roobet",
  "gamble", "casino", "poker", "slots", "winbet",
];

const WHITELISTED_DOMAINS = [
  "imdb.com",
  "youtube.com",
  "themoviedb.org",
  "github.com",
  "chromewebstore.google.com",
  "addons.mozilla.org",
  "microsoftedge.microsoft.com",
  "adguard.com",
];

function isAdUrl(urlStr: string): boolean {
  if (!urlStr) return false;
  const lower = urlStr.toLowerCase();
  if (AD_DOMAIN_PATTERNS.some((pattern) => lower.includes(pattern))) return true;

  const isWhitelisted = WHITELISTED_DOMAINS.some((domain) => lower.includes(domain));
  const isInternal =
    lower.startsWith("/") ||
    lower.startsWith("#") ||
    lower.startsWith("blob:") ||
    (typeof window !== "undefined" && window.location && lower.startsWith(window.location.origin));

  if (!isWhitelisted && !isInternal && lower.startsWith("http")) {
    return true;
  }

  return false;
}

// 1. Prototype Overrides executed at module initialization in browser
if (typeof window !== "undefined") {
  try {
    // A. Override window.open to suppress unauthorized popups immediately
    const originalOpen = window.open;
    window.open = function (...args) {
      const urlStr = args[0] ? String(args[0]) : "";
      if (!urlStr || urlStr === "about:blank" || isAdUrl(urlStr)) {
        console.warn("[AdGuard Engine] Hard-blocked window.open popup:", urlStr);
        return null;
      }
      return originalOpen ? originalOpen.apply(window, args as [string, string, string]) : null;
    };

    // B. Override HTMLAnchorElement.prototype.click to prevent programmatic link clicks
    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.href && isAdUrl(this.href)) {
        console.warn("[AdGuard Engine] Dynamic anchor click neutralized:", this.href);
        return;
      }
      return originalAnchorClick.apply(this);
    };

    // C. Override HTMLFormElement.prototype.submit to prevent ad form posts
    const originalFormSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      if (this.action && isAdUrl(this.action)) {
        console.warn("[AdGuard Engine] Ad form submit neutralized:", this.action);
        return;
      }
      return originalFormSubmit.apply(this);
    };
  } catch {
    /* ignore */
  }
}

/**
 * Site-Wide Native AdGuard Engine Component
 */
export function AdBarrier() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register AdGuard Service Worker for Network-Level Interception
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw-adguard.js")
        .then(() => {
          console.log("[AdGuard Engine] Service Worker registered successfully.");
        })
        .catch((err) => {
          console.warn("[AdGuard Engine] SW Registration failed:", err);
        });
    }

    // Event Capture Shield: Intercept click events attempting ad redirects
    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (anchor && anchor.href && isAdUrl(anchor.href)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn("[AdGuard Engine] Blocked capture click redirect:", anchor.href);
      }
    };

    // Anti-Popunder Focus Restoration
    const handleBlur = () => {
      setTimeout(() => {
        try {
          if (document.activeElement?.tagName === "IFRAME") {
            return;
          }
          window.focus();
        } catch {
          /* ignore */
        }
      }, 50);
    };

    // MutationObserver: Strip target from dynamically injected ad elements
    const sanitizeNode = (node: Node) => {
      if (node instanceof HTMLAnchorElement) {
        if (isAdUrl(node.href)) {
          node.target = "_self";
          node.rel = "noopener noreferrer";
        }
      } else if (node instanceof HTMLScriptElement) {
        const src = (node.src || "").toLowerCase();
        if (AD_DOMAIN_PATTERNS.some((pattern) => src.includes(pattern))) {
          node.remove();
          console.warn("[AdGuard Engine] Purged injected ad script:", src);
        }
      } else if (node instanceof HTMLIFrameElement) {
        const src = (node.src || "").toLowerCase();
        if (AD_DOMAIN_PATTERNS.some((pattern) => src.includes(pattern))) {
          node.remove();
          console.warn("[AdGuard Engine] Purged injected ad iframe:", src);
        }
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          sanitizeNode(node);
          if (node instanceof HTMLElement) {
            node.querySelectorAll("a").forEach((a) => {
              const anchor = a as HTMLAnchorElement;
              if (isAdUrl(anchor.href)) {
                anchor.target = "_self";
              }
            });
          }
        }
      }
    });

    window.addEventListener("click", handleCaptureClick, { capture: true });
    window.addEventListener("auxclick", handleCaptureClick, { capture: true });
    window.addEventListener("blur", handleBlur);

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener("click", handleCaptureClick, { capture: true });
      window.removeEventListener("auxclick", handleCaptureClick, { capture: true });
      window.removeEventListener("blur", handleBlur);
      observer.disconnect();
    };
  }, []);

  return null;
}

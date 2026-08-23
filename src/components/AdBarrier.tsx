"use client";

import { useEffect } from "react";

/**
 * Known ad networks, popunder scripts, trackers, and casino/betting redirect domains.
 */
const AD_DOMAIN_PATTERNS = [
  "popads", "adcash", "adsterra", "propellerads", "exoclick",
  "trafficjunky", "bet365", "1xbet", "melbet", "mostbet",
  "pin-up", "vulkan", "doubleclick", "onclickmega", "ad-maven",
  "deloton", "monetag", "clickadu", "hilltopads", "adbuffs",
  "richpush", "trafficstars", "trafficforce", "juicyads",
  "syndication", "zeroredirect", "popunder", "clickunder",
  "adx", "adsystem", "adnxs", "adskeeper", "mgid", "outbrain",
  "taboola", "adcolony", "applovin", "unityads", "inmobi",
  "betway", "parimatch", "aviator", "stake.com", "roobet",
  "gamble", "casino", "redirector", "fastclick", "serving-sys",
];

const WHITELISTED_DOMAINS = [
  "imdb.com",
  "youtube.com",
  "themoviedb.org",
  "github.com",
  "localhost",
  "127.0.0.1",
];

/**
 * Site-Wide AdGuard-Style Barrier
 * Intercepts popup creation, ad redirects, and popunders at the global window and DOM level
 * while ensuring 100% responsive pass-through for legitimate controls.
 */
export function AdBarrier() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Global Window Interceptor: Neutralize unauthorized window.open popup attempts
    const originalOpen = window.open;
    window.open = function (
      url?: string | URL,
      target?: string,
      features?: string
    ): WindowProxy | null {
      const urlStr = url ? String(url).toLowerCase() : "";

      const isAd = AD_DOMAIN_PATTERNS.some((pattern) => urlStr.includes(pattern));
      const isWhitelisted = WHITELISTED_DOMAINS.some((domain) => urlStr.includes(domain));
      const isInternal = urlStr.startsWith("/") || (urlStr.startsWith(window.location.origin));

      // Block known ad domains and unauthorized blank/script popups
      if (isAd || (!isWhitelisted && !isInternal && urlStr.length > 0 && !urlStr.startsWith("blob:"))) {
        console.warn("[AdGuard Barrier] Neutralized unauthorized window.open popup:", urlStr);
        return null;
      }

      if (!urlStr || urlStr === "about:blank") {
        console.warn("[AdGuard Barrier] Neutralized blank popup attempt");
        return null;
      }

      return originalOpen.call(window, url, target, features);
    };

    // 2. Global Event Capture Shield: Intercept click events attempting ad redirects
    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (anchor && anchor.href) {
        const href = anchor.href.toLowerCase();
        const isAd = AD_DOMAIN_PATTERNS.some((pattern) => href.includes(pattern));

        if (isAd) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.warn("[AdGuard Barrier] Blocked ad link click redirect:", href);
        }
      }
    };

    // 3. Anti-Popunder Refocus: Prevent third-party frames from unfocusing the parent app
    const handleBlur = () => {
      setTimeout(() => {
        try {
          if (document.activeElement?.tagName === "IFRAME") {
            // User interacted with legitimate iframe player -> allow interaction
            return;
          }
          window.focus();
        } catch {
          /* ignore */
        }
      }, 80);
    };

    // 4. DOM Mutation Observer: Clean up injected malicious ad scripts / popunder elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLScriptElement) {
            const src = (node.src || "").toLowerCase();
            if (AD_DOMAIN_PATTERNS.some((pattern) => src.includes(pattern))) {
              node.remove();
              console.warn("[AdGuard Barrier] Removed injected ad script:", src);
            }
          } else if (node instanceof HTMLIFrameElement) {
            const src = (node.src || "").toLowerCase();
            if (AD_DOMAIN_PATTERNS.some((pattern) => src.includes(pattern))) {
              node.remove();
              console.warn("[AdGuard Barrier] Removed injected ad iframe:", src);
            }
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
      window.open = originalOpen;
      window.removeEventListener("click", handleCaptureClick, { capture: true });
      window.removeEventListener("auxclick", handleCaptureClick, { capture: true });
      window.removeEventListener("blur", handleBlur);
      observer.disconnect();
    };
  }, []);

  return null;
}

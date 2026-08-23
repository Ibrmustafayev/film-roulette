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
];

// Pre-emptive immediate window.open suppression if executed in browser context
if (typeof window !== "undefined") {
  try {
    const originalOpen = window.open;
    window.open = function (...args) {
      const urlStr = args[0] ? String(args[0]).toLowerCase() : "";
      const isWhitelisted = WHITELISTED_DOMAINS.some((domain) => urlStr.includes(domain));
      const isInternal = urlStr.startsWith("/") || (window.location && urlStr.startsWith(window.location.origin));

      if (isWhitelisted || isInternal) {
        return originalOpen ? originalOpen.apply(window, args as [string, string, string]) : null;
      }

      console.warn("[AdGuard Barrier] Hard-blocked popup attempt:", args[0]);
      return null; // Instantly suppress creation so no window flashes on screen
    };
  } catch {
    /* ignore */
  }
}

/**
 * Site-Wide Hardened AdGuard-Style Barrier
 * Intercepts popup creation, ad redirects, and popunders at the global window and DOM level
 * while ensuring 100% responsive pass-through for legitimate controls.
 */
export function AdBarrier() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Global Pre-emptive Window.open Overwrite
    const originalOpen = window.open;
    window.open = function (...args): WindowProxy | null {
      const urlStr = args[0] ? String(args[0]).toLowerCase() : "";
      const isWhitelisted = WHITELISTED_DOMAINS.some((domain) => urlStr.includes(domain));
      const isInternal = urlStr.startsWith("/") || urlStr.startsWith(window.location.origin);

      if (isWhitelisted || isInternal) {
        return originalOpen ? originalOpen.apply(window, args as [string, string, string]) : null;
      }

      console.warn("[AdGuard Barrier] Hard-blocked popup attempt:", args[0]);
      return null; // Instantly suppress creation so no window flashes on screen
    };

    // 2. Global Event Capture Shield & Target Blank Neutralizer
    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (anchor) {
        const href = (anchor.href || "").toLowerCase();
        const isAd = AD_DOMAIN_PATTERNS.some((pattern) => href.includes(pattern));
        const isWhitelisted = WHITELISTED_DOMAINS.some((domain) => href.includes(domain));
        const isInternal = href.startsWith("/") || href.startsWith(window.location.origin) || href.startsWith("#");

        if (isAd || (!isWhitelisted && !isInternal && href.startsWith("http"))) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.warn("[AdGuard Barrier] Blocked ad link click redirect:", href);
        }
      }
    };

    // 3. Anti-Popunder Refocus
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

    // 4. Target="_blank" Neutralizer & Pointer Hijack Shield via MutationObserver
    const sanitizeNode = (node: Node) => {
      if (node instanceof HTMLAnchorElement) {
        const href = (node.href || "").toLowerCase();
        const isWhitelisted = WHITELISTED_DOMAINS.some((domain) => href.includes(domain));
        const isInternal = href.startsWith("/") || href.startsWith(window.location.origin);

        if (!isWhitelisted && !isInternal && node.target === "_blank") {
          node.target = "_self";
          node.rel = "noopener noreferrer";
        }
      } else if (node instanceof HTMLScriptElement) {
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
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          sanitizeNode(node);
          if (node instanceof HTMLElement) {
            node.querySelectorAll("a[target='_blank']").forEach((a) => {
              const anchor = a as HTMLAnchorElement;
              const href = (anchor.href || "").toLowerCase();
              const isWhitelisted = WHITELISTED_DOMAINS.some((domain) => href.includes(domain));
              const isInternal = href.startsWith("/") || href.startsWith(window.location.origin);
              if (!isWhitelisted && !isInternal) {
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
      window.open = originalOpen;
      window.removeEventListener("click", handleCaptureClick, { capture: true });
      window.removeEventListener("auxclick", handleCaptureClick, { capture: true });
      window.removeEventListener("blur", handleBlur);
      observer.disconnect();
    };
  }, []);

  return null;
}

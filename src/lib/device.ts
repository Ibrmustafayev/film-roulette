export interface MobileStoreUrls {
  isIOS: boolean;
  braveUrl: string;
  firefoxUrl: string;
  adguardUrl: string;
}

export const getMobileStoreUrls = (): MobileStoreUrls => {
  const isIOS =
    typeof window !== "undefined" &&
    /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return {
    isIOS,
    braveUrl: isIOS
      ? "https://apps.apple.com/app/brave-private-web-browser/id1052879175"
      : "https://play.google.com/store/apps/details?id=com.brave.browser",
    firefoxUrl: isIOS
      ? "https://apps.apple.com/app/firefox-private-safe-browser/id989804926"
      : "https://play.google.com/store/apps/details?id=org.mozilla.firefox",
    adguardUrl: isIOS
      ? "https://apps.apple.com/app/adguard-adblock-privacy/id1047223162"
      : "https://adguard-dns.io/en/public-dns.html",
  };
};

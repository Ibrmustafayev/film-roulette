// In-Site AdGuard Service Worker & Network Request Interceptor
// Version: 1.1.0 - Film Roulette Security Shield

const AD_BLOCKLIST = [
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

  // Casino, Betting & Gambling Redirects
  "bet365", "1xbet", "melbet", "mostbet", "pin-up", "vulkan",
  "betway", "parimatch", "aviator", "stake.com", "roobet",
  "gamble", "casino", "poker", "slots", "winbet",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = (event.request.url || "").toLowerCase();

  const isBlocked = AD_BLOCKLIST.some((domain) => url.includes(domain));

  if (isBlocked) {
    console.warn("[AdGuard SW] Network request BLOCKED:", url);
    event.respondWith(
      new Response(JSON.stringify({ error: "Blocked by In-Site AdGuard Engine" }), {
        status: 403,
        statusText: "Blocked by In-Site AdGuard",
        headers: { "Content-Type": "application/json" },
      })
    );
    return;
  }
});

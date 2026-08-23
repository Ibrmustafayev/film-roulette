import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const AD_KEYWORDS = [
  "popads", "adcash", "adsterra", "propellerads", "exoclick",
  "trafficjunky", "monetag", "clickadu", "hilltopads", "adbuffs",
  "richpush", "trafficstars", "trafficforce", "juicyads",
  "syndication", "zeroredirect", "popunder", "clickunder",
  "adx", "adsystem", "adnxs", "adskeeper", "mgid", "outbrain",
  "taboola", "adcolony", "applovin", "unityads", "inmobi",
  "onclickmega", "ad-maven", "deloton", "fastclick", "serving-sys",
  "doubleclick", "googlesyndication", "googleadservices",
  "bet365", "1xbet", "melbet", "mostbet", "pin-up", "vulkan",
  "betway", "parimatch", "aviator", "stake.com", "roobet",
  "cryptoexchange", "coingape", "buycrypto", "freebitco",
];

const ANTI_POPUP_INJECTION = `
<script>
(function() {
  try {
    window.open = function() {
      console.warn('[Embed Proxy] Blocked window.open popup attempt');
      return null;
    };
    if (typeof HTMLAnchorElement !== 'undefined' && HTMLAnchorElement.prototype) {
      var origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function() {
        if (this.target === '_blank' || (this.href && /popads|adcash|1xbet|crypto|bet/i.test(this.href))) {
          console.warn('[Embed Proxy] Blocked dynamic anchor click:', this.href);
          return;
        }
        return origClick ? origClick.apply(this, arguments) : undefined;
      };
    }
    if (typeof HTMLFormElement !== 'undefined' && HTMLFormElement.prototype) {
      var origSubmit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = function() {
        if (this.action && /popads|adcash|1xbet|crypto|bet/i.test(this.action)) {
          console.warn('[Embed Proxy] Blocked ad form submit:', this.action);
          return;
        }
        return origSubmit ? origSubmit.apply(this, arguments) : undefined;
      };
    }
    window.focus = function() {};
    window.blur = function() {};
  } catch(e) {}
})();
</script>
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new NextResponse("Invalid protocol", { status: 400 });
    }

    const upstreamHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: `${parsed.protocol}//${parsed.host}/`,
      Origin: `${parsed.protocol}//${parsed.host}`,
    };

    const upstreamRes = await fetch(targetUrl, {
      headers: upstreamHeaders,
      cache: "no-store",
    });

    const contentType = upstreamRes.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      // If the upstream is a direct redirect or stream, forward it cleanly
      return new NextResponse(upstreamRes.body, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType || "text/html",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    let html = await upstreamRes.text();
    const baseHref = `${parsed.protocol}//${parsed.host}${parsed.pathname.substring(0, parsed.pathname.lastIndexOf("/") + 1)}`;

    // 1. Strip script tags containing blacklisted ad keywords
    html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match) => {
      const matchLower = match.toLowerCase();
      if (AD_KEYWORDS.some((kw) => matchLower.includes(kw))) {
        return "<!-- stripped ad script -->";
      }
      return match;
    });

    // 2. Inject <base> tag and Anti-Popup protection at the top of <head>
    const headInjection = `<head>\n<base href="${baseHref}">\n${ANTI_POPUP_INJECTION}`;
    if (html.includes("<head>")) {
      html = html.replace("<head>", headInjection);
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", headInjection);
    } else {
      html = `${headInjection}\n${html}`;
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("Embed Proxy Error:", error);
    return new NextResponse("Failed to proxy embed stream", { status: 502 });
  }
}

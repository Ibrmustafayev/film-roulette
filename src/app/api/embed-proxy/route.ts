import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const AD_KEYWORDS = [
  "whitebit.com", "whitebit", "cryptoexchange", "coingape",
  "buycrypto", "freebitco", "cryptocoin", "tokensale",
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
];

const buildAntiPopupAndSubResourceScript = (targetOrigin: string) => `
<script>
(function() {
  var targetOrigin = "${targetOrigin}";

  try {
    // 1. Popup & Window Neutralization
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

    // 2. Fetch API Sub-Resource Interceptor (Rewrites relative paths to targetOrigin)
    var originalFetch = window.fetch;
    window.fetch = function(input, init) {
      if (typeof input === 'string') {
        if (input.startsWith('/') && !input.startsWith('/api/embed-proxy')) {
          input = targetOrigin + input;
        }
      } else if (input instanceof Request && typeof input.url === 'string') {
        if (input.url.startsWith(window.location.origin + '/')) {
          var path = input.url.replace(window.location.origin, '');
          if (!path.startsWith('/api/embed-proxy')) {
            input = targetOrigin + path;
          }
        }
      }
      return originalFetch.call(this, input, init);
    };

    // 3. XMLHttpRequest Sub-Resource Interceptor (Rewrites relative paths to targetOrigin)
    var originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      var rest = Array.prototype.slice.call(arguments, 2);
      if (typeof url === 'string') {
        if (url.startsWith('/') && !url.startsWith('/api/embed-proxy')) {
          url = targetOrigin + url;
        }
      }
      return originalXhrOpen.apply(this, [method, url].concat(rest));
    };
  } catch(e) {
    console.error('[Embed Proxy] Interceptor setup error:', e);
  }
})();
</script>
`;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

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

    const targetOrigin = parsed.origin;

    const upstreamHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/vtt,*/*;q=0.8",
      "Accept-Language": "tr,tr-TR,en-US,en;q=0.9",
      Referer: `${targetOrigin}/`,
      Origin: targetOrigin,
    };

    const upstreamRes = await fetch(targetUrl, {
      headers: upstreamHeaders,
      cache: "no-store",
    });

    const contentType = upstreamRes.headers.get("content-type") || "";

    // If the upstream is a subtitle track (.vtt / .srt), media chunk or direct stream
    if (!contentType.includes("text/html")) {
      return new NextResponse(upstreamRes.body, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType || "text/plain",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    let html = await upstreamRes.text();
    const baseHref = `${targetOrigin}/`;

    // 1. Strip script tags containing blacklisted ad keywords
    html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match) => {
      const matchLower = match.toLowerCase();
      if (AD_KEYWORDS.some((kw) => matchLower.includes(kw))) {
        return "<!-- stripped ad script -->";
      }
      return match;
    });

    // 2. Inject <base> tag and Anti-Popup + Sub-Resource Interceptor at the top of <head>
    const headInjection = `<head>\n<base href="${baseHref}">\n${buildAntiPopupAndSubResourceScript(targetOrigin)}`;
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

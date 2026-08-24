import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing under these paths is useful to a crawler: they are either
        // per-user, transient, or proxy plumbing that would waste crawl budget.
        disallow: ["/api/", "/room/", "/rooms"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}

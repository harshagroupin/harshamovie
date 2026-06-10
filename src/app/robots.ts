import { MetadataRoute } from "next";
import { APP_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/"],
      },
      // Allow AI crawlers explicitly for AEO/GEO
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/admin/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/admin/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/admin/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}

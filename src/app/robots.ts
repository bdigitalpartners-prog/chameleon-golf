import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/profile"],
      },
    ],
    sitemap: "https://golfequalizer.ai/sitemap.xml",
  };
}

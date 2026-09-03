import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/cuenta/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

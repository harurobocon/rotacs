import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
      { userAgent: "Google-Extended", disallow: "/" },
      { userAgent: "Applebot-Extended", disallow: "/" },
      { userAgent: "Googlebot", disallow: "/" },
      { userAgent: "Bingbot", disallow: "/" },
      { userAgent: "Slurp", disallow: "/" },
      { userAgent: "DuckDuckBot", disallow: "/" },
      { userAgent: "Baiduspider", disallow: "/" },
      { userAgent: "Yandex", disallow: "/" },
      { userAgent: "facebookexternalhit", disallow: "/" },
      { userAgent: "Twitterbot", disallow: "/" },
      { userAgent: "LinkedInBot", disallow: "/" },
      { userAgent: "Applebot", disallow: "/" },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "OAI-SearchBot", disallow: "/" },
      { userAgent: "ChatGPT-User", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
      { userAgent: "Claude-Web", disallow: "/" },
      { userAgent: "PerplexityBot", disallow: "/" },
      { userAgent: "Perplexity-User", disallow: "/" },
      { userAgent: "cohere-ai", disallow: "/" },
      { userAgent: "Meta-ExternalAgent", disallow: "/" },
      { userAgent: "meta-externalfetcher", disallow: "/" },
      { userAgent: "Diffbot", disallow: "/" },
      { userAgent: "PetalBot", disallow: "/" },
      { userAgent: "YouBot", disallow: "/" },
      { userAgent: "Amazonbot", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
      { userAgent: "BytedanceSpider", disallow: "/" },
    ],
  };
}

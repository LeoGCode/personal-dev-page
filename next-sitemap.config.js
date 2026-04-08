/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://leogcode.dev",
  generateRobotsTxt: true,
  exclude: ["/api/*"],
  alternateRefs: [
    {
      href: `${process.env.NEXT_PUBLIC_SITE_URL || "https://leogcode.dev"}/en`,
      hreflang: "en",
    },
    {
      href: `${process.env.NEXT_PUBLIC_SITE_URL || "https://leogcode.dev"}/es`,
      hreflang: "es",
    },
  ],
};

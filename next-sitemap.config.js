/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://leoneldev.com",
  generateRobotsTxt: true,
  exclude: ["/api/*"],
  alternateRefs: [
    {
      href: `${process.env.NEXT_PUBLIC_SITE_URL || "https://leoneldev.com"}/en`,
      hreflang: "en",
    },
    {
      href: `${process.env.NEXT_PUBLIC_SITE_URL || "https://leoneldev.com"}/es`,
      hreflang: "es",
    },
  ],
};

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // puppeteer-core will be used later for Arabic PDF generation
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduces JS bundle sizes by intelligently loading large libraries
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
  },
  // puppeteer-core will be used later for Arabic PDF generation
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
  outputFileTracingIncludes: {
    "/api/export": ["src/template/**/*", "fonts/**/*", "src/generators/**/*"]
  }
};

export default nextConfig;

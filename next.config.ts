import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://static.cloudflareinsights.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://static.cloudflareinsights.com https://cloudflareinsights.com",
  "frame-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const deploymentId =
  process.env.DEPLOYMENT_ID ||
  process.env.COOLIFY_DEPLOYMENT_UUID ||
  process.env.SOURCE_COMMIT ||
  process.env.GIT_COMMIT_SHA ||
  undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  ...(deploymentId ? { deploymentId } : {}),
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@swc/helpers/**/*"],
  },
  webpack: (config) => {
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());

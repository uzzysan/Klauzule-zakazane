"use client";

export function Analytics() {
  const umamiScriptUrl =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://umami.maculewicz.pro/umami.js";
  const umamiWebsiteId =
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "3a4c88cf-5adf-4c69-88f5-2f757ea53ac6";

  if (!umamiScriptUrl || !umamiWebsiteId) {
    return null;
  }

  return <script defer src={umamiScriptUrl} data-website-id={umamiWebsiteId} />;
}

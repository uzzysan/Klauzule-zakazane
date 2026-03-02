"use client";

import Script from "next/script";

export function Analytics() {
  const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  if (!umamiScriptUrl || !umamiWebsiteId) {
    return null;
  }

  return <Script src={umamiScriptUrl} data-website-id={umamiWebsiteId} strategy="lazyOnload" />;
}

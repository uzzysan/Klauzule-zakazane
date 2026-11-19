import { ImageResponse } from "next/og";

// Apple touch icon (also used by Safari as a favicon fallback). Mirrors src/app/icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
// Edge runtime: also avoids a Windows path bug in @vercel/og under the Node runtime (Next 14.1).
export const runtime = "edge";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#254974",
      }}
    >
      <svg width="132" height="132" viewBox="4 3 24 26">
        <path
          d="M10 5.5h8.5L23 10v15a1.5 1.5 0 0 1-1.5 1.5h-11.5A1.5 1.5 0 0 1 8.5 25V7A1.5 1.5 0 0 1 10 5.5Z"
          fill="#FCFAF6"
        />
        <path d="M18.5 5.5V9a1 1 0 0 0 1 1H23Z" fill="#C9D6E6" />
        <rect x="11.5" y="14" width="8.5" height="2.25" rx="1.1" fill="#254974" />
        <rect x="11.5" y="19" width="8.5" height="2.25" rx="1.1" fill="#254974" />
      </svg>
    </div>,
    size
  );
}

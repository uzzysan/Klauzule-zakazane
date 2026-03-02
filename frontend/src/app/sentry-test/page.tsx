"use client";

export default function SentryTestPage() {
  return (
    <div
      style={{
        padding: "50px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Sentry Test Page</h1>
      <p>Click the button below to test client-side error reporting.</p>
      <button
        onClick={() => {
          throw new Error("Sentry Test Client Error");
        }}
        style={{
          padding: "10px 20px",
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Throw Client Error
      </button>
    </div>
  );
}

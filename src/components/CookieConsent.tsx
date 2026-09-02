"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user already accepted/declined
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    document.cookie = "cookie_consent=accepted; path=/; max-age=31536000; secure; samesite=lax";
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie_consent", "declined");
    document.cookie = "cookie_consent=declined; path=/; max-age=31536000; secure; samesite=lax";
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#111",
        borderTop: "2px solid var(--accent)",
        padding: "16px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "slideUp 0.4s ease-out",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <p style={{ color: "#ccc", fontSize: "14px", margin: 0, flex: "1 1 300px", lineHeight: 1.5 }}>
        We use cookies and similar technologies to improve your experience, analyze traffic, and personalize content.
        By clicking &quot;Accept All&quot;, you consent to our use of cookies.
        Read our{" "}
        <a
          href="/privacy"
          style={{ color: "var(--accent)", textDecoration: "underline" }}
        >
          Privacy Policy
        </a>{" "}
        and{" "}
        <a
          href="/terms"
          style={{ color: "var(--accent)", textDecoration: "underline" }}
        >
          Terms of Service
        </a>
        .
      </p>

      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            padding: "10px 20px",
            background: "transparent",
            border: "1px solid #555",
            color: "#aaa",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            padding: "10px 24px",
            background: "var(--accent)",
            border: "none",
            color: "#fff",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}

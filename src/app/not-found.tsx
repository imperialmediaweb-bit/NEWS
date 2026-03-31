import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#111",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "120px",
          fontWeight: 900,
          margin: 0,
          color: "#c1121f",
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <h2 style={{ fontSize: "28px", margin: "16px 0 8px", fontWeight: 700 }}>
        Page Not Found
      </h2>
      <p style={{ color: "#888", fontSize: "16px", maxWidth: "400px", lineHeight: 1.6 }}>
        The article you&apos;re looking for may have been moved or no longer exists.
        Check the URL or browse our latest stories.
      </p>
      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <Link
          href="/"
          style={{
            padding: "12px 28px",
            background: "#c1121f",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "15px",
          }}
        >
          Go Home
        </Link>
        <Link
          href="/local-news"
          style={{
            padding: "12px 28px",
            background: "transparent",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "15px",
          }}
        >
          Latest News
        </Link>
      </div>
    </div>
  );
}

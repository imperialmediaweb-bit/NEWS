"use client";
export default function PrintButton() {
  return <button onClick={() => window.print()} style={{ padding: "10px 18px", borderRadius: 8, border: 0, background: "#111", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Print / save as PDF</button>;
}

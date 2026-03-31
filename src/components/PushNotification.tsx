"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotification() {
  const [permission, setPermission] = useState<string>("default");
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    setPermission(Notification.permission);

    // Show banner after 10 seconds if not already subscribed
    if (Notification.permission === "default") {
      const dismissed = localStorage.getItem("push_dismissed");
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        // Show again after 7 days
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
      }
      const timer = setTimeout(() => setShowBanner(true), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function subscribe() {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
          });

          // Send subscription to server
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription: subscription.toJSON(),
              hostname: window.location.hostname,
            }),
          });
        }
      }

      setShowBanner(false);
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
  }

  function dismiss() {
    localStorage.setItem("push_dismissed", String(Date.now()));
    setShowBanner(false);
  }

  if (!showBanner || permission !== "default") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        background: "linear-gradient(135deg, #c1121f 0%, #780000 100%)",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        animation: "slideDown 0.4s ease-out",
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
        <span style={{ fontSize: "20px" }}>&#128276;</span>
        <p style={{ color: "#fff", fontSize: "14px", margin: 0, fontWeight: 500 }}>
          Get breaking news alerts delivered to your device instantly!
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={dismiss}
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Later
        </button>
        <button
          onClick={subscribe}
          style={{
            padding: "8px 20px",
            background: "#fff",
            border: "none",
            color: "#c1121f",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Enable Alerts
        </button>
      </div>
    </div>
  );
}

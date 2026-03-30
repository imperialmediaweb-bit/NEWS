"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Server-side login — sets httpOnly cookie (not accessible by JS)
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Store secret for API calls from admin dashboard
        localStorage.setItem("cron_secret", password);
        // Redirect — cookie is already set by server
        window.location.href = redirect;
      } else {
        const data = await res.json().catch(() => ({ error: "Login failed" }));
        setError(data.error || "Invalid password. Access denied.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            NEWS <span className="text-[#c1121f]">ADMIN</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Secure access required
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] rounded-xl p-8 shadow-2xl border border-gray-800"
        >
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-400 text-sm mb-2"
            >
              Admin Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#c1121f] transition-colors"
              placeholder="Enter admin secret"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#c1121f] text-white font-bold rounded-lg hover:bg-[#9b111e] transition-colors disabled:opacity-50"
          >
            {loading ? "Checking..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Protected by server-side authentication.
          <br />
          Cookie expires in 7 days.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111] flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

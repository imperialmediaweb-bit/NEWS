"use client";

import { useState } from "react";
import { sites } from "@/config/sites";
import { Globe, CheckCircle, XCircle, Loader2, Play } from "lucide-react";

interface DomainResult {
  domain: string;
  status: "waiting" | "success" | "error" | "running";
  message?: string;
}

export default function DomainsPage() {
  const siteList = Object.values(sites);
  const [token, setToken] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DomainResult[]>([]);

  const addDomain = async (domain: string): Promise<{ ok: boolean; message: string }> => {
    // Add both www and non-www
    const domains = [`www.${domain}`, domain];
    const messages: string[] = [];

    for (const d of domains) {
      try {
        const res = await fetch("/api/admin/add-domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, serviceId, environmentId, domain: d }),
        });
        const data = await res.json();
        if (data.error) {
          messages.push(`${d}: ${data.error}`);
        } else {
          messages.push(`${d}: ✓`);
        }
      } catch (e) {
        messages.push(`${d}: ${String(e)}`);
      }
    }

    const allOk = messages.every((m) => m.includes("✓"));
    return { ok: allOk, message: messages.join(" | ") };
  };

  const handleStart = async () => {
    if (!token || !serviceId || !environmentId) return;
    setRunning(true);

    const allResults: DomainResult[] = siteList.map((s) => ({
      domain: s.domain,
      status: "waiting" as const,
    }));
    setResults([...allResults]);

    for (let i = 0; i < siteList.length; i++) {
      allResults[i] = { ...allResults[i], status: "running" };
      setResults([...allResults]);

      const result = await addDomain(siteList[i].domain);
      allResults[i] = {
        ...allResults[i],
        status: result.ok ? "success" : "error",
        message: result.message,
      };
      setResults([...allResults]);
    }

    setRunning(false);
  };

  const totalDone = results.filter((r) => r.status === "success").length;
  const totalError = results.filter((r) => r.status === "error").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Add Domains to Railway</h1>
      <p className="text-gray-500 mb-6">
        Adds all 50 domains (www + non-www) to your Railway service automatically.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Railway API Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="railway_token_..."
                className="w-full px-4 py-2 border rounded-lg outline-none text-sm font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Account Settings → Tokens → Create Token
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Service ID</label>
              <input
                type="text"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-2 border rounded-lg outline-none text-sm font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Service → Settings → Service ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Environment ID</label>
              <input
                type="text"
                value={environmentId}
                onChange={(e) => setEnvironmentId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-2 border rounded-lg outline-none text-sm font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Settings → Environments → Click environment → ID in URL
              </p>
            </div>

            <button
              onClick={handleStart}
              disabled={running || !token || !serviceId || !environmentId}
              className="w-full py-3 rounded-xl font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
            >
              {running ? (
                <><Loader2 size={18} className="animate-spin" /> Adding {totalDone}/{siteList.length}...</>
              ) : (
                <><Play size={18} /> Add All 50 Domains</>
              )}
            </button>

            {totalDone > 0 && (
              <div className="text-center py-3 bg-green-50 rounded-lg">
                <p className="text-xl font-bold text-green-700">{totalDone} added</p>
                {totalError > 0 && <p className="text-sm text-red-500">{totalError} failed</p>}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
            <p className="text-sm font-medium text-yellow-800 mb-2">After adding domains:</p>
            <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Railway shows CNAME/A record for each domain</li>
              <li>Go to Namecheap → DNS → set CNAME or A record</li>
              <li>Railway auto-issues SSL certificate</li>
              <li>Wait ~5 min for DNS propagation</li>
            </ol>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold mb-4">
              Domain Progress {totalDone > 0 && `(${totalDone + totalError}/${results.length})`}
            </h2>
            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Globe size={48} className="mx-auto mb-4 opacity-30" />
                <p>Enter your Railway credentials and click &quot;Add All 50 Domains&quot;</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                      r.status === "success" ? "bg-green-50 border-green-200"
                        : r.status === "error" ? "bg-red-50 border-red-200"
                        : r.status === "running" ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {r.status === "success" ? <CheckCircle size={18} className="text-green-500" />
                        : r.status === "error" ? <XCircle size={18} className="text-red-500" />
                        : r.status === "running" ? <Loader2 size={18} className="text-blue-500 animate-spin" />
                        : <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />}
                      <div>
                        <p className="font-medium text-sm">{r.domain}</p>
                        {r.message && <p className="text-xs text-gray-500">{r.message}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

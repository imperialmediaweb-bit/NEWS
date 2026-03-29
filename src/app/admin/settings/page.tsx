"use client";

import { useState, useEffect } from "react";
import { sites } from "@/config/sites";
import { Loader2, CheckCircle, Save, BarChart3 } from "lucide-react";

interface SiteGa {
  slug: string;
  name: string;
  domain: string;
  gaId: string;
  saved: boolean;
}

export default function SettingsPage() {
  const siteList = Object.values(sites);
  const [gaList, setGaList] = useState<SiteGa[]>(
    siteList.map((s) => ({ slug: s.slug, name: s.name, domain: s.domain, gaId: "", saved: false }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Load existing GA codes from DB
  useEffect(() => {
    fetch("/api/admin/ga-codes")
      .then((r) => r.json())
      .then((data) => {
        if (data.codes) {
          setGaList((prev) =>
            prev.map((s) => ({
              ...s,
              gaId: data.codes[s.slug] || "",
              saved: !!data.codes[s.slug],
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateGa = (slug: string, value: string) => {
    setGaList((prev) =>
      prev.map((s) => (s.slug === slug ? { ...s, gaId: value, saved: false } : s))
    );
  };

  // Paste same GA code to all empty fields
  const pasteToAll = (gaId: string) => {
    setGaList((prev) =>
      prev.map((s) => (s.gaId ? s : { ...s, gaId, saved: false }))
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveMsg("");
    const toSave = gaList.filter((s) => s.gaId && !s.saved);

    try {
      const res = await fetch("/api/admin/ga-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codes: Object.fromEntries(toSave.map((s) => [s.slug, s.gaId])),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGaList((prev) =>
          prev.map((s) => (s.gaId ? { ...s, saved: true } : s))
        );
        setSaveMsg(`${data.updated} sites updated!`);
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        setSaveMsg(`Error: ${data.error}`);
      }
    } catch (e) {
      setSaveMsg(`Error: ${String(e)}`);
    }
    setSaving(false);
  };

  const totalWithGa = gaList.filter((s) => s.gaId).length;
  const unsaved = gaList.filter((s) => s.gaId && !s.saved).length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings & SEO</h1>
      <p className="text-gray-500 mb-6">Manage Google Analytics codes and SEO settings.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-[#c1121f]" />
                <h2 className="font-bold">Google Analytics Codes</h2>
              </div>
              <span className="text-sm text-gray-500">
                {totalWithGa}/{siteList.length} configured
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Paste the GA4 Measurement ID (G-XXXXXXXXXX) for each site.
              Find it in Google Analytics → Admin → Data Streams → Measurement ID.
            </p>

            {loading ? (
              <div className="text-center py-12 text-gray-400">
                <Loader2 size={32} className="mx-auto mb-2 animate-spin" />
                <p>Loading existing codes...</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {gaList.map((site) => (
                  <div
                    key={site.slug}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                      site.saved && site.gaId
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {site.saved && site.gaId ? (
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <div className="w-48 shrink-0">
                      <p className="text-sm font-medium truncate">{site.name}</p>
                      <p className="text-xs text-gray-400">{site.domain}</p>
                    </div>
                    <input
                      type="text"
                      value={site.gaId}
                      onChange={(e) => updateGa(site.slug, e.target.value.trim())}
                      placeholder="G-XXXXXXXXXX"
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-[#c1121f] focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSaveAll}
                disabled={saving || unsaved === 0}
                className="px-6 py-3 rounded-xl font-bold text-white bg-[#c1121f] hover:bg-[#8b0000] disabled:bg-gray-300 flex items-center gap-2 transition-colors"
              >
                {saving ? (
                  <><Loader2 size={18} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={18} /> Save All ({unsaved} unsaved)</>
                )}
              </button>
              {saveMsg && (
                <p className={`text-sm font-medium ${saveMsg.includes("Error") ? "text-red-500" : "text-green-600"}`}>
                  {saveMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold mb-3">Quick Fill</h2>
            <p className="text-sm text-gray-500 mb-3">
              Paste a GA code to fill all empty fields:
            </p>
            <div className="flex gap-2">
              <input
                id="quickFill"
                type="text"
                placeholder="G-XXXXXXXXXX"
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono outline-none"
              />
              <button
                onClick={() => {
                  const input = document.getElementById("quickFill") as HTMLInputElement;
                  if (input?.value) pasteToAll(input.value.trim());
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
              >
                Fill
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold mb-3">SEO Status</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Sitemap.xml (dynamic from DB)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Robots.txt</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Open Graph meta tags</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Twitter Cards</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>JSON-LD Structured Data</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Canonical URLs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>News Sitemap (Google News)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>RSS & Atom feeds</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>IndexNow (Bing/Yandex)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>500 SEO landing pages</span>
              </li>
              <li className="flex items-center gap-2">
                {totalWithGa === siteList.length ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-400" />
                )}
                <span>Google Analytics ({totalWithGa}/{siteList.length})</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

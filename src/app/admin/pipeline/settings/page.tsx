"use client";

import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";

interface ConfigEntry {
  key: string;
  value: string;
  label: string;
  type: "text" | "select" | "boolean";
  options?: { value: string; label: string }[];
}

const CONFIG_FIELDS: Omit<ConfigEntry, "value">[] = [
  {
    key: "enabled",
    label: "Pipeline Enabled",
    type: "boolean",
  },
  {
    key: "llm_provider",
    label: "LLM Strategy",
    type: "select",
    options: [
      { value: "rotation", label: "Rotation: Gemini → OpenAI → Claude (recommended)" },
      { value: "cheapest", label: "Cheapest first: Gemini → OpenAI → Claude" },
      { value: "gemini", label: "Gemini Flash only (cheapest)" },
      { value: "openai", label: "OpenAI GPT-4o-mini only" },
      { value: "anthropic", label: "Claude Haiku only" },
    ],
  },
  {
    key: "articles_per_batch",
    label: "Articles Per Batch",
    type: "select",
    options: [
      { value: "3", label: "3" },
      { value: "5", label: "5" },
      { value: "10", label: "10" },
      { value: "15", label: "15" },
    ],
  },
  {
    key: "image_provider",
    label: "Image Provider",
    type: "select",
    options: [
      { value: "pixabay", label: "Pixabay (free, recommended)" },
      { value: "pexels", label: "Pexels" },
      { value: "unsplash", label: "Unsplash" },
    ],
  },
  {
    key: "opinion_enabled",
    label: "Opinion Generation",
    type: "boolean",
  },
];

export default function PipelineSettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const secret = localStorage.getItem("cron_secret") || "";
      const res = await fetch(
        "/api/pipeline/status?key=" + encodeURIComponent(secret)
      );
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || {});
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(key: string, value: string) {
    setSaving(true);
    try {
      const secret = localStorage.getItem("cron_secret") || "";
      await fetch("/api/pipeline/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ key, value }),
      });
      setConfig((prev) => ({ ...prev, [key]: value }));
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#c1121f]" />
          Pipeline Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure the automated content pipeline
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {CONFIG_FIELDS.map((field) => (
          <div
            key={field.key}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
          >
            <label className="text-sm font-medium w-48 shrink-0">
              {field.label}
            </label>
            {field.type === "boolean" ? (
              <button
                onClick={() =>
                  saveConfig(
                    field.key,
                    config[field.key] === "true" ? "false" : "true"
                  )
                }
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  config[field.key] === "true"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {config[field.key] === "true" ? "Enabled" : "Disabled"}
              </button>
            ) : field.type === "select" ? (
              <select
                value={config[field.key] || ""}
                onChange={(e) => saveConfig(field.key, e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm bg-white"
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config[field.key] || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border text-sm flex-1"
                />
                <button
                  onClick={() => saveConfig(field.key, config[field.key] || "")}
                  disabled={saving}
                  className="px-3 py-2 bg-[#c1121f] text-white rounded-lg text-sm hover:bg-[#9b111e] transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Environment Variables Info */}
      <div className="bg-yellow-50 rounded-xl p-6">
        <h2 className="font-bold text-sm mb-2">Required Environment Variables</h2>
        <div className="text-xs text-gray-600 space-y-1 font-mono">
          <p>CRON_SECRET=your-random-secret</p>
          <p>GEMINI_API_KEY=your-google-ai-studio-key</p>
          <p>OPENAI_API_KEY=your-openai-key</p>
          <p>ANTHROPIC_API_KEY=your-anthropic-key</p>
          <p>PIXABAY_API_KEY=your-pixabay-key</p>
          <p>PEXELS_API_KEY=your-pexels-key (optional)</p>
          <p>UNSPLASH_ACCESS_KEY=your-unsplash-key (optional)</p>
          <p>INDEXNOW_KEY=your-indexnow-key (optional)</p>
        </div>
      </div>

      {/* Cron Schedule Info */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h2 className="font-bold text-sm mb-2">Cron Schedule (cron-job.org)</h2>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Fetch Local:</strong> POST /api/pipeline/fetch {`{"categories":["local-news"]}`} — Every 2h</p>
          <p><strong>Fetch National:</strong> POST /api/pipeline/fetch {`{"categories":["us-news","politics"]}`} — Every 3h</p>
          <p><strong>Fetch Other:</strong> POST /api/pipeline/fetch {`{"categories":["sports","entertainment","celebrity","technology","world-news","lifestyle","crime","business"]}`} — Every 4h</p>
          <p><strong>Rewrite:</strong> POST /api/pipeline/rewrite {`{"batchSize":5}`} — Every 30min</p>
          <p><strong>IndexNow:</strong> POST /api/pipeline/notify — Every 2h</p>
          <p><strong>Opinion:</strong> POST /api/pipeline/opinion — Every 12h</p>
          <p><strong>Cleanup:</strong> POST /api/pipeline/cleanup — Daily 3 AM</p>
        </div>
      </div>
    </div>
  );
}

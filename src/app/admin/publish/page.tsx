"use client";

import { useState } from "react";
import { sites } from "@/config/sites";
import { Send, Check } from "lucide-react";

export default function PublishPage() {
  const siteList = Object.values(sites);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("local-news");
  const [author, setAuthor] = useState("Staff Reporter");
  const [featuredImage, setFeaturedImage] = useState("");
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const toggleSite = (slug: string) => {
    setSelectedSites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const selectAll = () => {
    if (selectedSites.length === siteList.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(siteList.map((s) => s.slug));
    }
  };

  const handlePublish = async () => {
    if (!title || selectedSites.length === 0) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          summary,
          category,
          author,
          featured_image: featuredImage,
          sites: selectedSites,
        }),
      });
      if (res.ok) {
        setPublished(true);
        setTimeout(() => setPublished(false), 3000);
        setTitle("");
        setContent("");
        setSummary("");
        setFeaturedImage("");
        setSelectedSites([]);
      }
    } finally {
      setPublishing(false);
    }
  };

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Publish Article</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Article Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article headline..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c1121f] focus:border-transparent outline-none text-lg"
              />
              {slug && (
                <p className="text-xs text-gray-400 mt-1">Slug: {slug}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Summary</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c1121f] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Full article content..."
                rows={12}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c1121f] focus:border-transparent outline-none resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                >
                  <option value="local-news">Local News</option>
                  <option value="us-news">US News</option>
                  <option value="world-news">World News</option>
                  <option value="politics">Politics</option>
                  <option value="business">Business</option>
                  <option value="technology">Technology</option>
                  <option value="sports">Sports</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="opinion">Opinion</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Featured Image URL
                </label>
                <input
                  type="text"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Site Selector + Publish */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">
                Publish to ({selectedSites.length}/{siteList.length})
              </h2>
              <button
                onClick={selectAll}
                className="text-xs text-[#c1121f] font-medium hover:underline"
              >
                {selectedSites.length === siteList.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {siteList.map((site) => (
                <label
                  key={site.slug}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedSites.includes(site.slug)
                      ? "bg-red-50 border border-[#c1121f]"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSites.includes(site.slug)}
                    onChange={() => toggleSite(site.slug)}
                    className="accent-[#c1121f]"
                  />
                  <div>
                    <p className="text-sm font-medium">{site.name}</p>
                    <p className="text-xs text-gray-400">{site.domain}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handlePublish}
            disabled={!title || selectedSites.length === 0 || publishing}
            className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${
              published
                ? "bg-green-500"
                : "bg-[#c1121f] hover:bg-[#8b0000] disabled:bg-gray-300"
            }`}
          >
            {published ? (
              <>
                <Check size={20} /> Published!
              </>
            ) : publishing ? (
              "Publishing..."
            ) : (
              <>
                <Send size={18} /> Publish to {selectedSites.length} site
                {selectedSites.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

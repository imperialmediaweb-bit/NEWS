"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Check } from "lucide-react";
import ContentEditor from "@/components/admin/ContentEditor";
import ImageUpload from "@/components/admin/ImageUpload";

interface ArticleData {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category: string;
  author: string;
  featured_image: string;
  site_name: string;
  site_slug: string;
  published_at: string;
}

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("local-news");
  const [author, setAuthor] = useState("Staff Reporter");
  const [featuredImage, setFeaturedImage] = useState("");

  useEffect(() => {
    fetch(`/api/admin/articles/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.article) {
          const a = data.article;
          setArticle(a);
          setTitle(a.title);
          setSummary(a.summary || "");
          setContent(a.content || "");
          setCategory(a.category || "local-news");
          setAuthor(a.author || "Staff Reporter");
          setFeaturedImage(a.featured_image || "");
        } else {
          setError("Article not found");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load article");
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, summary, category, author, featured_image: featuredImage }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.push("/admin/articles")} className="text-[#c1121f] hover:underline">
          Back to Articles
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push("/admin/articles")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Edit Article</h1>
          {article && <p className="text-sm text-gray-400">{article.site_name} &bull; ID: {article.id}</p>}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c1121f] focus:border-transparent outline-none text-lg"
            />
            {slug && <p className="text-xs text-gray-400 mt-1">Slug: {slug}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Summary</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c1121f] focus:border-transparent outline-none"
            />
          </div>

          <ContentEditor value={content} onChange={setContent} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
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
          </div>

          <ImageUpload value={featuredImage} onChange={setFeaturedImage} />
        </div>

        <button
          onClick={handleSave}
          disabled={!title || saving}
          className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${
            saved ? "bg-green-500" : "bg-[#c1121f] hover:bg-[#8b0000] disabled:bg-gray-300"
          }`}
        >
          {saved ? (
            <><Check size={20} /> Saved!</>
          ) : saving ? (
            <><Loader2 size={20} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={18} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}

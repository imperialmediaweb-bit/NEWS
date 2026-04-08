"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Image, Minus, Upload, Loader2 } from "lucide-react";

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ContentEditor({ value, onChange }: ContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const wrapSelection = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const newValue = value.substring(0, start) + text + value.substring(start);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    }, 0);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        insertAtCursor(`\n<img src="${data.url}" alt="" />\n`);
      }
    } finally {
      setUploading(false);
    }
  };

  const tools = [
    { icon: Bold, label: "Bold", action: () => wrapSelection("<strong>", "</strong>") },
    { icon: Italic, label: "Italic", action: () => wrapSelection("<em>", "</em>") },
    { icon: Heading2, label: "Heading 2", action: () => wrapSelection("<h2>", "</h2>") },
    { icon: Heading3, label: "Heading 3", action: () => wrapSelection("<h3>", "</h3>") },
    { icon: Quote, label: "Blockquote", action: () => wrapSelection("<blockquote>", "</blockquote>") },
    { icon: List, label: "Bullet List", action: () => insertAtCursor("\n<ul>\n  <li></li>\n  <li></li>\n</ul>\n") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertAtCursor("\n<ol>\n  <li></li>\n  <li></li>\n</ol>\n") },
    { icon: Minus, label: "Separator", action: () => insertAtCursor("\n<hr />\n") },
    {
      icon: uploading ? Loader2 : Image,
      label: "Insert Image",
      action: () => fileRef.current?.click(),
      spinning: uploading,
    },
  ];

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Content</label>
      <div className="border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#c1121f] focus-within:border-transparent">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-gray-50 border-b">
          {tools.map((tool, i) => (
            <button
              key={i}
              type="button"
              onClick={tool.action}
              title={tool.label}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <tool.icon size={16} className={tool.spinning ? "animate-spin" : ""} />
            </button>
          ))}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your article content here...&#10;&#10;Use the toolbar above for formatting, or write HTML directly.&#10;&#10;Paragraphs are created automatically from double line breaks."
          rows={16}
          className="w-full px-4 py-3 outline-none resize-y font-mono text-sm leading-relaxed"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Supports HTML. Double line breaks become paragraphs automatically.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ContactFormProps {
  siteName: string;
  siteDomain: string;
}

export default function ContactForm({ siteName, siteDomain }: ContactFormProps) {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, siteName, siteDomain }),
      });

      if (res.ok) {
        setStatus("sent");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
          Message Sent!
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Thank you for contacting {siteName}. We typically respond within 1-2 business days.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="bg-[#c1121f] text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#9b111e] transition-colors"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
        Send Us a Message
      </h2>

      {status === "error" && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1.5 uppercase tracking-wider text-gray-700" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Your Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c1121f] focus:ring-1 focus:ring-[#c1121f] transition-colors"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5 uppercase tracking-wider text-gray-700" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Your Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c1121f] focus:ring-1 focus:ring-[#c1121f] transition-colors"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5 uppercase tracking-wider text-gray-700" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Subject
          </label>
          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c1121f] focus:ring-1 focus:ring-[#c1121f] transition-colors"
            placeholder="What is this about?"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5 uppercase tracking-wider text-gray-700" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Message
          </label>
          <textarea
            required
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c1121f] focus:ring-1 focus:ring-[#c1121f] transition-colors resize-none"
            placeholder="Write your message here..."
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full bg-[#c1121f] text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#9b111e] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {status === "sending" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>
      </form>
    </div>
  );
}

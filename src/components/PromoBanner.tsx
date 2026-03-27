"use client";

export default function PromoBanner() {
  return (
    <div className="bg-gradient-to-r from-tabloid-dark-red via-tabloid-red to-tabloid-dark-red shadow-md">
      <div className="max-w-[1200px] mx-auto px-4 py-3 text-center">
        <span className="text-white text-sm font-bold tracking-wide">
          Promote your business.{" "}
          <a href="#" className="underline underline-offset-2 hover:text-white/80 transition-colors">
            Contact us!
          </a>
        </span>
      </div>
    </div>
  );
}

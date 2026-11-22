import type { Metadata } from "next";

/** Rendered in the browser and canonical to the homepage: kept out of the index. */
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

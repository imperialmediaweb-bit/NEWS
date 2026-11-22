import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import SubmitForm from "@/components/SubmitForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `Send us a news tip, photo or event | ${site.name}`,
    description: `Tell the ${site.name} newsroom what is happening in your part of ${site.state}: news tips, photos and video, community events and local achievements.`,
    alternates: { canonical: `https://${site.domain}/submit` },
  };
}

export default function SubmitPage() {
  const site = siteFromHeaders();
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[860px] px-4 py-10">
        <h1 className="text-[34px] font-extrabold leading-tight md:text-[44px]">Send us your news</h1>
        <p className="mt-3 text-[17px] text-gray-700">
          Saw something happen in your town? Have photos of the storm, an event coming up, or a student who won something? Send it to the {site.name} newsroom. An editor reviews every submission before anything is published.
        </p>
        <div className="mt-8">
          <SubmitForm siteName={site.name} state={site.state} accent={site.accent || "#b91c1c"} />
        </div>
        <p className="mt-8 text-[13px] text-gray-500">
          Urgent? In an emergency call 911 first. To correct a story, see our <a href="/corrections" className="underline">corrections policy</a>.
        </p>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}

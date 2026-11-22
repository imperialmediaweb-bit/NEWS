# FOR SALE: 50 US State News Websites — Automated Local News Platform with Payments, Newsletter and Local Data

**Asking price:** $50,000 · **Revenue:** none yet (pre-revenue, monetization built and ready) · **Fully online, run from anywhere**

A complete, custom-built local news network: one news site for every US state under the "Express" brand (Texas Express, California Express, Florida Express, New York Express…), running on its own platform with automated news gathering, rewriting, publishing, search-engine submission, payments and a daily newsletter. Built from scratch in Next.js 14 + TypeScript + PostgreSQL, no WordPress, no plugins.

This is sold honestly as a **pre-revenue platform with live sites**: the value is the technology, the 49 live domains and the work already done. Traffic and revenue are early; the numbers below are real and can be verified in Search Console, Analytics and Stripe during due diligence.

---

## 1. The network

- **50 state brands; 49 live domains** (southdakota-express.com is configured but not registered)
- Domains registered at Namecheap, DNS and email on Cloudflare
- Each site covers local news, politics, business, sports, life, opinion, weather, plus city, county and team pages for its state
- ~480–960 new articles per day across the network (aim: 12+ per site per day), archive of 50,000+ articles

## 2. Unique design for every state

- **9 design families** (newspaper, magazine, tabloid, broadsheet, coastal, dark premium, western, gazette, live), each site with its own colours, logo, slogan, landscape art and state map
- Home, article, section, county, city and team pages in each family's design
- Live local data modules on the homepages: National Weather Service weather and alerts, hurricanes, earthquakes (USGS), wildfires (NIFC), gas prices (EIA), airport delays (FAA), rocket launches, drought, snowpack, river and buoy data, volcano status, lottery and more, depending on the state
- Fast: Lighthouse mobile performance 80–90, CLS 0, images as WebP in 5 sizes on Cloudflare R2

## 3. Automated news gathering (sources)

- **321 local outlet feeds** (public radio, TV stations, newspapers, nonprofit state newsrooms) across the 50 states
- **Official sources on 33 states**: governors, attorneys general, state police, transportation departments and city halls — RSS where available, a custom press-release page reader where not (release text, date and photo, last 72 hours only)
- **Release inbox**: releases@{each domain} receives agencies' press-release emails and queues them automatically (Cloudflare Email Worker)
- **Google News searches per state**, rotating through every city, town and county, the state's own pro and college teams, business news (hiring, layoffs, openings, closings, deals) and high-school sports
- **Google Trends per state**: what each state is searching today becomes a priority news search
- Duplicate detection, "is this about the state?" relevance check before any AI cost

## 4. AI rewriting with strict accuracy rules

- Every story rewritten in original words from its source; facts, names, figures and quotes only from the source, quotes verbatim and attributed, nothing invented
- Names of people and institutions restored to the source's exact spelling after rewriting
- Legal safety rules: "alleged/charged", no minors, no addresses or medical details
- Sources too thin to write from are rejected, not padded
- Headlines lead with the place and main name; first paragraph answers who/what/where/when
- Multi-provider AI with fallback; stories signed "{Site} Newsroom" (no invented reporters)

## 5. Images

- Real free-licence photos first (Wikimedia Commons, Flickr Creative Commons via Openverse) of the town, county, team or subject, with the required credit printed under the story
- Official release photos credited to the agency; stock libraries (Pexels, Pixabay, Unsplash) as fallback
- All stored and resized on Cloudflare R2

## 6. SEO and indexing

- Google Search Console connected on 49 sites (service account), sitemaps submitted daily; Bing Webmaster Tools with all 49 sites verified and API submission; IndexNow on every new article; WebSub
- Google News sitemap, NewsArticle / Organization / Breadcrumb structured data, canonical tags, Open Graph and Twitter cards
- Thin and empty pages removed from the index; city, county and team landing pages; "More from {town}" internal links in every story; related stories by place
- AI-search ready: llms.txt, answer-first story structure; search and answer crawlers allowed, AI-training crawlers declined
- Honest trust pages: About, Editorial policy ("How we work"), Corrections, Ethics, Contact with working contact@ address, DMCA, Privacy, Terms

## 7. Revenue features already built

- **Sponsored stories, $49, paid by card (Stripe Checkout)**: the business writes it, pays, the editor publishes it labelled "Sponsored" with rel="sponsored" links, or declines with an automatic full refund
- **Obituaries, $25** with photo, same flow
- Prohibited-category filter before payment (drugs, pills, cannabis, gambling, crypto, payday loans, adult, weapons, tobacco, link selling)
- **Advertise page** with buy-now by card and a proposal form for bigger campaigns (emailed to the owner)
- **Daily morning newsletter per state**: double opt-in sign-up on every site, sent at 7 am local time with one-click unsubscribe (Resend)
- Ad slots ready for Google AdSense (switch on with one setting)

## 8. Community features

- **Reader submissions** (news tips, photos and video, community events, local achievements, closings and delays) with an editor review queue and email notification
- **Alerts page per state**: every active National Weather Service alert plus checked school/business closings and delays
- Browser push notifications for breaking news

## 9. Admin and operations

- One admin for all sites: articles, pipeline, submissions, paid placements, imports, analytics
- Reports: indexing per state (Google URL Inspection), Google Analytics 4 per site by channel, Search Console clicks and impressions, pipeline throughput and failure reasons, duplicate check
- Cloudflare cache purge, DNS and email routing managed from the admin
- Running cost: hosting (Railway) + database, AI rewriting, storage and email — roughly $50–150/month depending on volume

## 10. Current numbers (verifiable)

- Search: indexing in progress. Search Console submission was fixed in November 2026; most articles were not yet indexed at that point. Last 28 days before the fix: ~73 Google clicks network-wide.
- Analytics: ~100,000 users in 28 days recorded in GA4, but ~97% are "Direct" single-page visits that look automated; real organic, social and AI-assistant visitors were ~2,400. Buyers should judge traffic on Search Console.
- Revenue: none yet.
- **Facebook: the 50 pages were restricted by Meta in late October 2026** after high-volume automated posting; posting is switched off. The pages are included as-is, with no guarantee they can be restored.

## 11. Included in the sale

- 49 registered domains (transfer at Namecheap), Cloudflare setup
- Full source code (GitHub) and database with the full content archive
- Railway configuration, R2 storage, all integrations documented (Search Console, Bing, Analytics, Stripe, Resend, Cloudflare)
- Facebook pages as-is (restricted)
- 2-hour handover session and 30 days of email support; ongoing development available on retainer

## Why selling

The platform is built; growing traffic and selling local advertising in 50 states needs an owner with the time and budget to focus on it.

**Serious buyers only.** Search Console, Analytics and code walkthrough available on request.

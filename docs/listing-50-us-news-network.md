# FOR SALE: 50 US State News Websites + MediaChief Press-Release Platform — Complete Automated Local Media Business

**Asking price:** $50,000 · **Revenue:** pre-revenue (all monetization built and live) · **Fully online, run from anywhere**

Two businesses sold together:

1. **The "Express" network** — a news website for every US state (Texas Express, California Express, Florida Express, New York Express…), each with its own design, fully automated news gathering, AI rewriting with strict accuracy rules, local data, SEO and built-in revenue features.
2. **MediaChief (media-chief.com)** — a live press-release distribution platform that sells publication across the 50 Express newspapers (packages from $150 to $1,500), with customer accounts, Stripe checkout, admin and order tracking.

Everything is custom code (Next.js 14 + TypeScript + PostgreSQL), no WordPress, no plugins. Sold honestly as a pre-revenue platform: traffic and revenue are early and every number below can be verified in Search Console, Analytics and Stripe.

---

## PART 1 — THE 50-STATE NEWS NETWORK

### 1. Sites and brands
- 50 state brands, **49 live domains** (southdakota-express.com configured but not registered)
- Domains registered at Namecheap; DNS, email routing and caching on Cloudflare
- Sections: local news, politics, business, sports, life, opinion, weather, obituaries, sponsored; plus city, county and team pages for every state
- Archive of 50,000+ articles; ~480+ new articles a day, scaling to 12+ per site per day

### 2. A unique design for every state
- **9 design families** — newspaper, magazine, tabloid, broadsheet, coastal, dark premium, western, gazette and "live" — each state with its own colours, custom logo, slogan, landscape artwork and state map
- Cinematic homepage slider, breaking ticker, animated sections, mobile menus
- Every page in the new design: home, articles, sections, county / city / team pages, alerts, submit, contact, about, policies
- **Fast**: Lighthouse mobile performance 80–90, CLS 0; images as WebP in 5 sizes from **Cloudflare R2** (own image CDN, 150,000+ images migrated)

### 3. Live local data on every homepage (free public APIs)
National Weather Service forecasts and alerts · hurricanes (NHC) · earthquakes (USGS) · wildfires (NIFC) · gas prices (EIA) · airport delays (FAA) · rocket launches · drought monitor · snowpack (SNOTEL) · UV index (EPA) · ocean buoys (NDBC) · volcano status · subway status (NYC) · Lake Mead level · lottery — shown per state where relevant

### 4. Where the news comes from (fully automated)
- **321 local outlet feeds**: public radio, TV stations, newspapers and nonprofit state newsrooms across the 50 states
- **Official sources on 33 states**: governors, attorneys general, state police, transportation departments and city halls — via RSS, or a custom press-release page reader (release text, date and photo, last 72 hours only)
- **Release inbox**: releases@{each domain} receives agencies' email releases and queues them automatically (Cloudflare Email Worker)
- **Google News searches per state**, rotating through every city, town and county (Texas alone: 254 counties), the state's pro and college teams, local business (hiring, layoffs, plants, openings, closings, deals) and high-school sports
- **Google Trends per state**: what each state is searching today becomes a priority story, written first
- **Reader submissions**: tips, photos/video, events, achievements, closings — reviewed by an editor
- Duplicate detection and an "is this really about this state?" check before any AI cost

### 5. AI rewriting built not to hallucinate
- Every story rewritten in original words; facts, names, figures and quotes only from the source; quotes verbatim and attributed; nothing invented
- People's and institutions' names restored to the source's exact spelling after rewriting
- Legal safety: "alleged / charged with", no minors, no addresses or medical details
- Thin sources rejected rather than padded
- Headlines lead with the place and the main name, as people search; first paragraph answers who / what / where / when
- Multi-provider AI with automatic fallback; stories signed "{Site} Newsroom" (no invented reporters)
- Rewriting every 5 minutes, states with the fewest stories served first

### 6. Images, legally
- Real free-licence photos first — Wikimedia Commons and Flickr Creative Commons (via Openverse) of the town, county, team, venue or event — with the licence credit printed under the story
- Official release photos credited to the agency; stock libraries (Pexels, Pixabay, Unsplash) as fallback
- No scraped or copyrighted photos

### 7. SEO, Google Discover and AI search
- **Google Search Console** connected on 49 sites (service account): sitemaps submitted daily, URL-level indexing reports
- **Bing Webmaster Tools**: all 49 sites verified, API sitemap submission; **IndexNow** on every new article; WebSub
- **Google News** sitemap; NewsArticle, Organization, WebSite/SearchAction and Breadcrumb structured data; canonical URLs; Open Graph and Twitter cards
- **Google Discover ready**: large-image preview allowed, 1,200 px images, fast pages, trust pages
- **City, county and team landing pages** ("Houston News Today", "Harris County News", "Dallas Cowboys News"); "More from {town}" links inside every story; related stories by place; thin pages kept out of the index
- **AI search** (ChatGPT, Claude, Copilot, Google AI Overviews): llms.txt, answer-first stories; answer crawlers allowed, AI-training crawlers declined
- Trust pages on every site: About, Editorial policy, Corrections, Ethics, Contact (working contact@ address), DMCA, Privacy, Terms, Advertise

### 8. Revenue features already built and live
- **Sponsored stories — $49, paid by card (Stripe Checkout)**: the business writes it and pays; the editor publishes it labelled "Sponsored" with rel="sponsored" links, or declines with an automatic full refund
- **Obituaries — $25** with photo, same flow
- Prohibited-category filter before payment (drugs, pills, cannabis, gambling, crypto, payday loans, adult, weapons, tobacco, link selling)
- **Advertise page** with buy-now by card plus a proposal form for larger campaigns (emailed to the owner)
- **Daily morning newsletter per state**: double opt-in sign-up on every site; sent at 7 am local time; one-click unsubscribe
- **Alerts page per state**: every active National Weather Service alert plus checked school/business closings and delays
- Browser push notifications for breaking news
- Google AdSense slots ready (one setting to switch on); premium networks (Raptive from 25k monthly page views) as traffic grows

### 9. Admin and reporting
- One admin for all sites: articles, pipeline, reader submissions, paid placements, imports, analytics
- Reports: Google indexing per state, Google Analytics 4 per site by channel, Search Console clicks and impressions, pipeline throughput and rejection reasons, cross-site duplicates, Facebook history
- Cloudflare cache purge, DNS and email routing managed from the platform

---

## PART 2 — MEDIACHIEF (media-chief.com)

A live B2B site selling press-release publication across the 50 Express newspapers.
- **Packages**: Local $150 · Regional $500 · National 50 $1,500; plus Casino Local $300 · Casino Regional $900 · Casino National $2,500 (note: the newspapers currently refuse gambling content in self-serve ads — the buyer decides the policy)
- Customer accounts with email login, order flow, **Stripe checkout (USD)**, webhook, admin for orders and newspapers, request-a-list form, contact form, blog (MDX)
- Next.js 14 + TypeScript + Tailwind + Drizzle/Postgres + Resend + Stripe, deployed on Railway
- Note for buyers: the testimonials on the site should be verified or replaced before use

---

## Facebook
**47 Facebook pages** were created for the states. In late October 2026 Meta restricted them after high-volume automated posting; automated posting is switched off. The pages are included as-is, with no guarantee they can be restored.

## Why traffic is still low
All the time so far went into building the platform, not into growing the audience: no paid promotion, no outreach, no link building, and search submission was only fixed in November 2026. The infrastructure for growth is finished — a new owner can put 100% of the effort into audience and sales from day one.

## The technology in short
- **Next.js 14 (App Router) + TypeScript + PostgreSQL**, custom code end to end — no WordPress, no plugins, no themes
- One codebase serves all 50 sites by domain, each with its own design, colours, logo and data
- Hosted on Railway; Cloudflare for DNS, cache, email routing, Workers and R2 image storage
- Fully automated around the clock: source discovery, Google Trends, deduplication, relevance checks, AI rewriting with accuracy safeguards, images with licences, publishing, sitemaps, Google/Bing/IndexNow submission, daily newsletter, alerts — no daily manual work required; the owner only reviews reader submissions and paid placements
- Clean, documented code; admin reports for every stage

## Current numbers (honest, verifiable)
- **Search**: indexing is in progress. Search Console submission was fixed in November 2026; at that point most articles were not yet indexed. ~73 Google clicks network-wide in the 28 days before the fix.
- **Analytics**: ~100,000 users in 28 days recorded in GA4, but ~97% are "Direct" single-page visits that look automated; real organic, social and AI-assistant visitors were ~2,400. Judge traffic on Search Console.
- **Revenue**: none yet on either business.
- **Running cost**: hosting and database (Railway), AI rewriting, storage and email — about $50–150 a month depending on volume.

## Fast transfer, free support and a complete user guide
- **Fast handover, typically 24–72 hours**: domains pushed to the buyer's Namecheap account, GitHub repositories transferred, Railway project and Cloudflare zones moved to the buyer's accounts, Stripe and API keys swapped for the buyer's own
- **Free support after the sale**: setup on the buyer's accounts, a live walkthrough, and email support for questions about running the network
- **Complete user guide** included: how the news pipeline works, the admin, reviewing reader submissions and paid placements, the newsletter, sources, SEO reports, costs and how to switch features on and off — written for a non-technical owner

## Support and maintenance after the sale
The developer who built both platforms stays available:
- **Free support** after the handover: setup on the buyer's accounts, questions about running the network, fixes for anything that does not work as described
- **Optional monthly packages** after the free period:

| Package | What it covers |
|---|---|
| **Maintenance** | Sources and feeds kept working, AI and API updates, security and dependency updates, pipeline and indexing monitoring, monthly report |
| **Growth** | Everything in Maintenance, plus new features every month: AdSense / Raptive setup, more official sources per state, new pages and revenue tools, SEO improvements |
| **Custom development** | Any new feature, new sites or countries, integrations — quoted per project |

- Package prices agreed with the buyer; quick response by email and chat

## Included in the sale
- 49 news domains + media-chief.com (transfer at Namecheap), Cloudflare setup
- Full source code of both platforms (GitHub) and the databases with the full content archive
- Railway configuration, Cloudflare R2 image storage, Email Routing and Worker
- All integrations documented: Google Search Console, Bing Webmaster, Google Analytics 4, Stripe, Resend, Cloudflare, AI providers
- 47 Facebook pages as-is (restricted)
- 2-hour handover session and 30 days of email support; ongoing development on retainer

## Why selling
Both platforms are built and running; growing traffic and selling local advertising and press releases across 50 states needs an owner with the time and budget to focus on it.

**Serious buyers only.** Live walkthrough of the sites, admin, Search Console and code on request.

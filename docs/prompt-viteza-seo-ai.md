# Prompt: viteză maximă, SEO și optimizare pentru motoarele AI

Se aplică la toate cele 50 de site-uri, pe toate designurile (homepage, articol, categorie, AMP).

**Punct de plecare (22.11.2026, telefon, Lighthouse):**
- performanță 58–60 din 100;
- SEO 92 din 100;
- elementul principal (LCP) apare în 5,1–5,4 s;
- pagina e blocată (TBT) 730–780 ms;
- CLS 0.

Cel mai greu sunt AdSense (223 KB) și Google Tag Manager (179 KB).

**Ținte:**

| Măsurătoare | Țintă |
|---|---|
| Performanță pe telefon | ≥ 90 |
| SEO | 100 |
| LCP | < 2,5 s |
| TBT | < 200 ms |
| CLS | < 0,05 |
| INP | < 200 ms |

## 1. Viteză
1. **AdSense oprit deocamdată** (decizia userului), printr-o variabilă: `ADSENSE_ON=1` îl pornește înapoi fără cod.
2. **Analytics după încărcare:** gtag se încarcă după prima interacțiune sau după 4 s, nu în `<head>`.
3. **Poza principală:**
   - prima poză din slider vine în HTML-ul de la server, cu `fetchpriority="high"` și `preload`;
   - dimensiuni explicite;
   - nimic nu o ascunde până rulează JS.
4. **Poze:**
   - toate au `srcset`/`sizes`, `loading="lazy"` sub ecran și `decoding="async"`;
   - Pexels și Unsplash vin redimensionate de CDN-ul lor;
   - pozele noastre sunt WebP.
5. **JS mai puțin:**
   - efectele (fx, tilt, magnet, count-up) pornesc după `requestIdleCallback`;
   - sliderul încarcă gsap doar când e pe ecran;
   - nimic din bundle care nu se vede.
6. **Fonturi:** doar cele două fonturi ale stilului, subset latin, `display: swap`, preload numai pentru fontul titlului.
7. **CSS:** fără animații pe proprietăți care forțează layout; doar `transform` și `opacity`.
8. **Cache:**
   - homepage la edge 10 minute, articole 1 zi, cu `stale-while-revalidate`;
   - asset-urile au cache imutabil un an.
9. **Third-party:** `preconnect` doar la ce se folosește în primele 2 s.

## 2. SEO clasic
1. **Pe fiecare pagină:**
   - un singur `<h1>`;
   - titlu de cel mult 60 de caractere și meta description de 140–160;
   - canonical corect pe domeniul site-ului;
   - `og:` și `twitter:` complete, cu poză 1200×630.
2. **Date structurate:**
   - **articol:** `NewsArticle` complet (headline, image, datePublished, dateModified, author ca Person cu url, publisher NewsMediaOrganization cu logo, mainEntityOfPage), plus `BreadcrumbList`;
   - **homepage:** `NewsMediaOrganization` (logo, sameAs, publishingPrinciples, correctionsPolicy, ethicsPolicy) și `WebSite` cu `SearchAction`;
   - **categorie:** `CollectionPage` și `ItemList`.
3. **Sitemap-uri:** `sitemap.xml` și `news-sitemap.xml` (Google News, ultimele 48 de ore) pe fiecare domeniu, plus IndexNow la publicare.
4. **Linkuri interne:** breadcrumb, „More from {stat}” și linkuri spre categorie și județ.
5. **Accesibilitate** (contează și la SEO): `alt` la poze, contrast, `lang="en"`, linkuri cu text clar.
6. **Previzualizarea** (`?design=nou`) rămâne `noindex`.

## 3. Optimizare pentru motoarele AI (GEO: ChatGPT, Perplexity, Gemini, Copilot, Google AI Overviews)
1. **`/llms.txt`** pe fiecare domeniu: cine suntem, ce acoperim (statul, orașele, secțiunile), linkuri spre sitemap, politica editorială și corecturi.
2. **`robots.txt`:** permite explicit GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended și Bingbot, ca site-urile să fie citate.
3. **Răspuns clar la început:** primul paragraf al articolului răspunde la cine, ce, unde, când, în 1–2 fraze (stil AP). Nu se inventează nimic.
4. **Fapte ușor de citat:** date, cifre și nume exacte, cu sursa numită în text („the National Weather Service said”).
5. **Autor și încredere (E-E-A-T):**
   - pagină de autor cu bio;
   - `author.url` în JSON-LD;
   - paginile About, Editorial policy, Corrections și Contact, legate din footer și din `publisher`.
6. **Date proaspete:** `dateModified` real și „Updated” vizibil.
7. **Conținut în HTML de la server:** textul articolului e în HTML-ul trimis de server, nu doar după JS, ca să-l poată citi și boții AI.

## 4. Verificare la final
- Lighthouse pe telefon la 5 site-uri din stiluri diferite (homepage și articol).
- Rich Results Test pe un articol.
- `robots.txt`, `llms.txt`, `sitemap.xml` și `news-sitemap.xml` răspund 200 pe toate domeniile.
- Commit, push, apoi raport cu cifrele de dinainte și de după.

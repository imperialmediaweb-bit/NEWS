Lucrezi pe repo-ul rețelei Expres din România (reteau-expres). Scopul e să aplici aici ce a mers pe rețeaua din SUA: mai multă indexare, mai mult trafic, mai mulți bani, fără risc. Răspunde în română, simplu.

REGULI
- Întâi VERIFICI și raportezi. Nu schimbi comportamentul site-urilor fără „da” de la mine. Lucrările de peste ~10 pași îmi spui întâi cât de mari sunt.
- Citești fișierele pe bucăți (grep, sed -n); ieșirile, scurte.
- Nimic inventat: fără autori falși, fără recenzii false, fără afirmații de tip „cel mai mare”.
- Secretele stau doar în variabilele din Railway, niciodată în cod sau în chat.
- La sfârșitul fiecărei etape îmi dai: ce ai găsit, cifra, ce propui, costul.

ETAPA 1 — Google și Bing (cel mai important)
1. Search Console: sitemap-urile se trimit pe proprietatea corectă? În SUA, trimiterea mergea pe „https://domeniu/” în timp ce contul avea doar „sc-domain:domeniu” și dădea 403 pe aproape toate site-urile. Verifică răspunsul real al API-ului pe fiecare ziar.
2. Indexarea reală: ia articole mai vechi de 7 zile, la întâmplare, plus prima pagină, prin URL Inspection API. Raportează pe fiecare județ: indexate, „Discovered – not indexed”, „Crawled – not indexed”, „unknown to Google”.
3. IndexNow: cheia trimisă e aceeași cu cea din fișierul-cheie de pe site? Dacă Bing răspunde 403 „UserForbiddedToAccessSite”, s-ar putea să fie legat de o cheie veche: servește și fișierul cheii vechi și încearcă cu amândouă.
4. Bing Webmaster: toate ziarele adăugate și verificate? Trimitere de sitemap-uri prin API, cu oprire la limita zilnică și pornire de la alt ziar în fiecare zi.

ETAPA 2 — Pagini slabe (Google pierde timp pe ele)
- Caută pagini din sitemap cu foarte puțin text sau cu canonical spre prima pagină (pagini generate, „web stories” goale, landing-uri de SEO, tag-uri cu 1–2 articole).
- Propune: scoase din sitemap și noindex,follow. Arată-mi lista înainte să aplici.
- Verifică dacă un sitemap al unui ziar conține linkuri de pe alte domenii.

ETAPA 3 — Încredere (Google News, Discover, Facebook)
- Autori: există nume de reporteri care nu există? Dacă da, propune semnătura „Redacția {Ziar}”.
- Politica editorială spune adevărul despre cum se fac articolele? Pagina de contact are o adresă de email care funcționează?
- Pagini About, Corecturi, Etică: există pe toate ziarele?

ETAPA 4 — Mai mult conținut local
- Ținta: minimum 12 știri pe zi pe fiecare ziar. Raportează ce publică fiecare ziar în ultimele 24 de ore, cât e în coadă și de ce se resping știrile.
- Dacă rescrierea e mai lentă decât sursele, propune o rulare mai deasă și prioritate pentru județele rămase în urmă.
- Google Trends pentru România (geo=RO): subiectele zilei să devină căutări de știri și să fie scrise primele.
- Căutări prin rotație pe toate orașele, comunele și echipele din fiecare județ, nu doar pe reședință.

ETAPA 5 — Legături interne și pagini noi
- „Mai multe din {localitate}” la final de articol, doar cu știri chiar din acea localitate (atenție la nume care se repetă: străzi, școli sau echipe care poartă numele orașului).
- Pagini de localitate și de echipă, în designul ziarului, cu noindex până au cel puțin 3 articole.
- Articole înrudite: întâi aceeași localitate, apoi aceeași perioadă, nu doar cele mai noi.

ETAPA 6 — Poze
- Întâi poze cu licență liberă reale (Wikimedia, Flickr CC prin Openverse) ale localității sau subiectului, cu sursa scrisă sub articol. Apoi poza din comunicatul oficial, cu instituția ca sursă. Stock doar la final.
- Nicio poză luată din Google, Facebook sau de la alte publicații.

ETAPA 7 — Bani
- Plată cu cardul (Stripe) pentru articol sponsorizat și pentru anunț de deces sau comemorare, cu aprobare de la editor și rambursare automată la refuz.
- Filtru înainte de plată pentru ce nu publicăm. Prețul mai mare pentru categoriile „sensibile” îl hotărăsc eu.
- Newsletter de dimineață pe fiecare ziar, cu dublă confirmare și dezabonare dintr-un click (GDPR: consimțământ și date de identificare în subsol).

ETAPA 8 — Viteză și cache
- Lighthouse pe telefon pe 3 ziare: performanță, LCP, CLS. Ținta: peste 80, CLS 0.
- Cache-ul Cloudflare pe articole și golirea lui după schimbări.

ETAPA 9 — Motoare AI
- robots.txt: lasă roboții care caută și citează (ChatGPT search, Perplexity, Claude, Bing, Google) și blochează-i doar pe cei de antrenare. Verifică și ce blochează Cloudflare.
- llms.txt pe fiecare ziar.

ETAPA 10 — Facebook (cu grijă)
- Verifică ritmul postării automate. În SUA, 8–9 postări pe zi pe fiecare pagină, ca poză cu linkul în primul comentariu, pe ~50 de pagini, au dus la blocarea paginilor în 4 zile.
- Propune un ritm sigur: puține postări, link normal, ore diferite, oprire automată la prima eroare de tip „blocked”.

LA FINAL: un tabel cu etapa, ce ai găsit, ce propui, pașii, costul și efectul așteptat, în ordinea câștigului. Nu aplici nimic fără „da”.

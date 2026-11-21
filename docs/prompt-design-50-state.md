# Prompt: design unic pentru toate cele 50 de ziare din SUA

Folosește acest prompt pentru fiecare stat, pe rând. Înlocuiește {STAT} și {slug}.

---

Fă designul complet pentru **{STAT} Express** ({slug}). Trebuie să fie premium, lung, colorat și „mega tare”, ca un mare ziar american local din {STAT}. Să nu semene cu niciun alt stat din rețea.

## 1. Respectă macheta
- Macheta e în `machete2/{slug}-home.png`, generată cu gpt-image. Urmeaz-o fidel: aceeași ordine a secțiunilor, aceleași culori, același stil al titlurilor și aceleași benzi. Nu o „freca”.
- Logo-ul este `public/logos/{slug}.svg`. Ia culorile din logo și pune-le în paleta paginii.
- Fiecare stat are propria familie vizuală: alt font de titlu, alt header și altă așezare a deschiderii. Texas folosește familia „live”; nu o copia la alt stat.

## 2. Pagini (desktop și telefon)
1. **Homepage lung**, cu minimum 14 secțiuni:
   - zona de sus: top bar cu data și vremea, header cu logo mare, meniu, bandă „Breaking”;
   - deschidere: slider cinematic cu 5 știri;
   - repere: Live updates, Today in brief, plus un modul specific statului (vezi mai jos);
   - date locale: vreme zi și noapte pe 6–8 orașe, prețul benzinei, alerte NWS, „Your county” cu căutare;
   - știri: Top stories, apoi benzi full-width colorate pentru Politics, Sports, Business și Life;
   - finalul paginii: loterie, Latest, Crime & Safety, Education, Most read, Opinion, More from {STAT}, tip și alerte, footer.
2. **Pagina de articol**:
   - titlu mare, standfirst, byline și share;
   - poză cinematică cu credit;
   - drop cap, bară de progres a citirii, share vertical lipit;
   - „Up next”;
   - sidebar cu Latest, Most read, prognoza pe 4 zile, alerte și county;
   - „More from {STAT}” la final.
3. **Pagina de categorie**: banner colorat, top story, grilă de 4, titluri, subsecțiuni specifice statului (de exemplu „Statehouse”), paginare.
4. **Telefon**:
   - nimic tăiat sus;
   - meniu hamburger;
   - fără scroll orizontal;
   - controalele sliderului să nu acopere textul.

## 3. Efecte din Imperial Design (toate cele potrivite)
- **Cinematic Parallax Slider**: componenta `design/imperial/CinematicParallaxSlider` pentru deschidere.
- **SpotlightCard**: lumină care urmărește mouse-ul pe carduri.
- **ClipPathReveal**: poze care se deschid ca o cortină la scroll.
- **StaggeredGridReveal**: cardurile intră pe rând.
- **SplitTextReveal**: titlul principal apare cuvânt cu cuvânt.
- **Marquee**: banda de știri care curge, plus liniile animate sub titlurile de secțiune.
- **Pentru poze**: zoom lent la hover (Ken Burns) și ridicarea cardului (lift).
- **Pentru pagina de articol**: parallax ușor pe poza mare și bară de progres.
- **Organizare**: grile bento pentru „Most read” și benzile Life.
- **Reguli pentru efecte**:
  - Cu `prefers-reduced-motion` sau fără JavaScript, totul e vizibil de la început.
  - Fără biblioteci noi, în afară de gsap, care e deja instalat.
  - Nu folosi `transform` pe elementele full-bleed.

## 4. Personalizat pe {STAT}
- **Orașele din vreme** sunt cele mai mari 6–8 orașe ale statului, cu coordonatele lor (`WEATHER_CITIES`).
- **Modulul specific statului** depinde de stat. Exemple:
  - Florida, Louisiana și Carolinas: Hurricane tracker;
  - Colorado, Utah și Vermont: Ski & snow report din prognoza NWS;
  - California, Oregon și Washington: Wildfire și calitatea aerului, din alertele NWS;
  - Alaska: Aurora și zilele scurte;
  - Nevada: Las Vegas;
  - Hawaii: Ocean & surf, din alertele NWS.
  
  Doar date reale. Dacă nu există o sursă gratuită, modulul lipsește.
- **Subsecțiunile** reflectă instituțiile reale ale statului: capitala, legislativul, marile universități și echipele locale.
- **Simbolul statului** din logo apare discret în header și în footer.

## 5. Reguli care nu se schimbă
- **Date**: zero date inventate. Folosește doar `lib/local-data.ts` (NWS, NHC, EIA, data.ny.gov, us-atlas). Dacă o sursă nu răspunde, modulul dispare.
- **Nume**: nu altera numele de persoane și instituții.
- **Poze**: doar din surse gratuite și legale (Commons cu licență liberă, Pixabay, Pexels, Unsplash), cu credit. Niciodată AP, Reuters sau Getty.
- **Activare**: designul se vede doar cu `?design=nou` (noindex). Îl pornesc live doar când scriu „pornește {STAT}”.
- **Ritm**: un stat o dată, verificat pe desktop și pe telefon cu screenshot, apoi commit și push. Abia după aceea treci la următorul.
- **Fiecare stat e unic**: dacă două state ajung să arate la fel, schimbă familia, nu doar culorile.

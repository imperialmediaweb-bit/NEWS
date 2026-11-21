# Prompt 2: personalizare per stat

Se folosește împreună cu `prompt-design-50-state.md`, care rămâne activ.

Regulile de mai jos vin din cererile din 21.11.2026: „fă customizată pentru toate”, „să nu semene toate între ele”, „păstrezi din machetă ce are sus”, „slider la toate”.

## 1. Niciun stat nu seamănă cu altul
- Machetele sunt împărțite în 8 stiluri:
  - Live news screen;
  - Broadsheet (ziar clasic, ca New York Times);
  - Tabloid (ca New York Post);
  - Magazine (revistă, ca The Atlantic);
  - Dark premium;
  - Western;
  - Bright coastal;
  - Community gazette.
- În același stil, fiecare stat are:
  - altă deschidere sus;
  - altă ordine a secțiunilor;
  - alt font de titlu;
  - alt modul special.
- **Testul de la final:** pune pozele statului lângă cele ale statelor deja făcute. Dacă partea de sus seamănă, schimb-o înainte de commit.

## 2. Partea de sus vine din machetă
- Bara de sus, header-ul (logo și meniu) și bara de breaking se fac exact ca în machetă: poziția logo-ului, stilul meniului, forma barei.
- Locul știrii mari din machetă îl ia **sliderul cinematic Imperial** (`HeroCinema`), la toate statele. Ce stă lângă el în machetă (Today in brief, Live updates etc.) rămâne lângă el.
- Fonturile și stilul titlurilor din slider se potrivesc cu stilul statului. De exemplu, la tabloid titlurile sunt mari, înclinate și cu majuscule.

## 3. Module diferite după stat
- **Modulul mare** e cel care contează pentru statul respectiv:
  - Florida, Louisiana, Carolinas, Texas și Georgia: uragane;
  - Colorado, Utah și Vermont: zăpadă și schi;
  - California, Oregon și Washington: incendii și calitatea aerului;
  - Alaska: aurora și zilele scurte;
  - Hawaii: ocean și surf;
  - Nevada: Las Vegas.
- **Benzina:**
  - modul mare doar la cele 9 state cu date proprii EIA (TX, CA, CO, FL, MA, MN, NY, OH, WA);
  - la celelalte, rând mic etichetat „regional average”.
- **Loteria lipsește** în Alabama, Alaska, Hawaii, Nevada și Utah, unde nu se joacă.
- **Orașele din vreme** sunt orașele mari ale statului, iar căutarea de județ arată exemple din județele statului.
- **Echipele, instituțiile și subsecțiunile** sunt cele reale ale statului. De exemplu: „Under the Gold Dome” pentru Georgia, „Tallahassee” pentru Florida, iar la sport Gators, Seminoles, Dolphins și Lightning pentru Florida.

## 4. Familia de cod
- Fiecare stil are propriul folder în `src/components/design/` (de exemplu `live/`, `peach/`, `tabloid/`).
- Statele din același stil folosesc același folder, cu o configurație per stat:
  - culori, slogan, capitală;
  - ordinea secțiunilor;
  - tipul deschiderii;
  - modulul special;
  - subsecțiunile.
- Piesele comune (vremea, județul, alertele, share, progresul citirii, efectele) se refolosesc. Nu se copiază.

## 5. Verificare la fiecare stat
- Fac poze pe desktop (1440) și pe telefon (iPhone) pentru homepage, articol și categorie.
- Verific:
  - fără scroll lateral;
  - nimic tăiat sus;
  - spațiile din titluri;
  - nimic rămas din alt stat (exemple de județe, echipe, orașe).
- Fac commit și push, apoi trimit linkurile `?design=nou`. Statul se pornește live doar la „pornește {STAT}”.

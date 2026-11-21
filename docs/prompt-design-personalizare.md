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

## 6. De ținut cont la fiecare stat (aprobat 21.11.2026)
1. **Module reale noi, unde se potrivesc:**
   - mareele (NOAA CO-OPS) la statele de pe coastă;
   - cutremurele (USGS) în California, Alaska, Oregon, Washington și Wyoming;
   - incendiile active (NIFC) în Vest;
   - zăpada (NRCS SNOTEL) la statele cu munți și schi.
2. **Trafic:** închideri și accidente de pe 511, doar unde statul are feed gratuit.
3. **Calitatea aerului (AirNow):** cheia API e gratuită, o cer userului când ajung în Vest.
4. **Reclame:** aceleași 3 poziții în fiecare design, ca reclamele să se pună o singură dată pentru toate:
   - după slider;
   - între secțiuni;
   - în coloana din dreapta.
5. **Viteză:** Lighthouse înainte de pornire, cu ținta 90+ pe telefon.
6. **Newsletter real:** cu cheia Resend existentă, în locul casetei doar de alerte.
7. **Hartă la articol:** o hartă mică OpenStreetMap a locului din știre, cu creditul OSM.
8. **Poze legale:**
   - Surse: Wikimedia Commons (doar licențe libere, cu autor și licență sub poză), apoi Pixabay, Pexels și Unsplash.
   - Niciodată AP, Reuters sau Getty.

## 7. Modulul-semnătură al fiecărui stat (unic, date oficiale gratuite)
\* cheie gratuită, se cere userului.

| Stat | Modul | Sursă |
|---|---|---|
| Alabama | Countdown Iron Bowl, steagurile de pe plajele Gulf Shores | dată fixă, NWS |
| Alaska | Aurora diseară, ore de lumină | NOAA SWPC |
| Arizona | UV și căldură extremă, monsonul | EPA UV, NWS |
| Arkansas | Nivelul râurilor | USGS |
| California | Cutremure, incendii, aer | USGS, CAL FIRE, AirNow* |
| Colorado | Zăpada, schi | SNOTEL |
| Connecticut | Mareele din Long Island Sound | NOAA |
| Delaware | Plaja: maree, temperatura apei | NOAA |
| Florida | Lansări de rachete de la Cape Canaveral, uragane | Launch Library 2, NHC |
| Georgia | Întârzieri pe aeroportul din Atlanta | FAA NAS Status |
| Hawaii | Vulcanul Kilauea, surf | USGS HVO, geamanduri NOAA NDBC |
| Idaho | Fumul de la incendii, râuri | NIFC, USGS |
| Illinois | Întârzieri la O'Hare, Lake Michigan | FAA, NOAA |
| Indiana | Countdown Indy 500, râuri | dată fixă, USGS |
| Iowa | Seceta pe județe | U.S. Drought Monitor |
| Kansas | Tornade raportate azi | NOAA SPC |
| Kentucky | Countdown Kentucky Derby, râul Ohio | dată fixă, USGS |
| Louisiana | Nivelul Mississippi la New Orleans, uragane | NWS, NHC |
| Maine | Mareele, ore de lumină | NOAA |
| Maryland | Golful Chesapeake | NOAA |
| Massachusetts | Alertele de metrou MBTA | MBTA |
| Michigan | Marile Lacuri: nivel, temperatură, gheață | NOAA GLERL |
| Minnesota | Gheața pe lacuri, aurora | NOAA |
| Mississippi | Râul Mississippi, uragane | USGS, NHC |
| Missouri | Râurile la St. Louis, tornade | USGS, SPC |
| Montana | Alertele din Glacier și Yellowstone | NPS* |
| Nebraska | Seceta, countdown College World Series | Drought Monitor |
| Nevada | Nivelul lacului Mead, întârzieri la Las Vegas | USBR, FAA |
| New Hampshire | Vremea pe Mount Washington | NWS |
| New Jersey | Coasta, întârzieri la Newark | NOAA, FAA |
| New Mexico | Countdown Balloon Fiesta, UV, incendii | dată fixă, EPA, NIFC |
| New York | Alertele MTA, întârzieri la JFK și LaGuardia | MTA, FAA |
| North Carolina | Outer Banks, uragane | NOAA, NHC |
| North Dakota | Aurora, seceta | NOAA, Drought Monitor |
| Ohio | Lake Erie | NOAA GLERL |
| Oklahoma | Tornade, Mesonet | SPC, OK Mesonet |
| Oregon | Cutremure, incendii, aer | USGS, NIFC |
| Pennsylvania | Râuri, întârzieri la Philadelphia | USGS, FAA |
| Rhode Island | Golful Narragansett | NOAA |
| South Carolina | Mareele la Charleston, uragane | NOAA, NHC |
| South Dakota | Alertele de la Mount Rushmore și Badlands | NPS* |
| Tennessee | Smoky Mountains, întârzieri la Nashville | NPS*, FAA |
| Texas | Uragane, benzina | NHC, EIA |
| Utah | Zăpada, nivelul Great Salt Lake | SNOTEL, USGS |
| Vermont | Zăpada și schiul | SNOTEL |
| Virginia | Chesapeake, întârzieri la Dulles și Reagan | NOAA, FAA |
| Washington | Feriboturile, vulcanul Rainier, cutremure | WSDOT*, USGS |
| West Virginia | New River Gorge, râuri | NPS*, USGS |
| Wisconsin | Lake Michigan, seceta | NOAA, Drought Monitor |
| Wyoming | Cutremurele din Yellowstone, zăpada | USGS, SNOTEL |

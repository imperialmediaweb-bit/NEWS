Lucrezi în Chrome-ul meu, unde sunt deja logat. Fă pașii de mai jos în ordine. Nu copia în chat nicio cheie, niciun token și nicio parolă. Dacă o pagină cere o confirmare de plată sau ștergerea a ceva, te oprești și mă întrebi.

## 1. Cloudflare: permisiuni pentru token (dash.cloudflare.com)
1. Mergi la My Profile → API Tokens.
2. Găsește tokenul folosit de site-urile „Express”. Are deja permisiunea de DNS edit pe toate zonele.
3. Apasă Edit. Nu crea alt token, ca să rămână aceeași valoare.
4. Adaugă aceste permisiuni:
   - Zone → Cache Purge → Purge
   - Zone → WAF → Edit
   - Zone → Firewall Services → Edit
5. La „Zone Resources” trebuie să rămână „All zones”.
6. Salvează. Spune-mi doar numele tokenului și lista permisiunilor finale.

## 2. Bing Webmaster Tools (bing.com/webmasters)
1. Loghează-te cu același cont Google ca la Search Console.
2. Alege „Import from Google Search Console” și importă TOATE site-urile „…express…” / „…expres…”. Sunt în jur de 49.
3. După import, verifică la câteva site-uri că la Sitemaps apar sitemap.xml și news-sitemap.xml. Dacă lipsesc, le adaugi:
   - https://DOMENIU/sitemap.xml
   - https://DOMENIU/news-sitemap.xml
4. Mergi la Settings (rotița) → API Access → API Key și generează cheia. NU o scrie în chat. Lasă pagina deschisă și spune-mi „cheia Bing e generată”, ca s-o pun eu în Railway.

## 3. Google Analytics (analytics.google.com), opțional
1. Deschide search.google.com/search-console, orice proprietate „sc-domain:…express…” → Settings → Users and permissions.
2. Copiază emailul care se termină în „.iam.gserviceaccount.com”. Ăsta e contul serverului, nu e secret.
3. În Google Analytics, mergi la Admin → Account access management (la nivel de cont, ca să acopere toate proprietățile).
4. Adaugă acel email cu rolul „Viewer”.
5. Spune-mi câte proprietăți GA are contul și ID-urile lor (G-XXXX).

## La final
Scrie-mi un rezumat scurt, cu ce a mers și ce nu la fiecare pas.

## Pentru referință: cele 36 de domenii unde Cloudflare blochează roboții
arizona-express.com, delaware-express.com, florida-expres.com, hawaiiexpres.com, kansas-express.com, kentucky-express.com, louisiana-express.com, maineeexpres.com, maryland-express.com, massachusettsexpress.com, michigan-express.com, minnesota-express.com, mississippi-express.com, missouri-express.com, montana-express.com, nebraska-express.com, nevada-express.com, newhampshire-express.com, newjersey-express.com, newmexico-express.com, newyork-express.com, northcarolinasexpress.com, northdakota-express.com, ohioexpres.com, oklahoma-express.com, pennsylvaniaexpres.com, rhodeisland-express.com, southcarolina-express.com, tennesseeexpres.com, texasexpres.com, utah-express.com, vermont-express.com, virginiaexpres.com, westvirginia-express.com, wisconsin-express.com, wyoming-express.com

(Nu schimba nimic de securitate pe ele. Regula de excepție o fac eu prin API după pasul 1.)

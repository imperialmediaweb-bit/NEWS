# Planul de abonamente pentru firmele din director

Scop: firmele care se înscriu gratuit să ajungă la un abonament plătit, automat.

## Pachete
| Pachet | Preț | Conține |
|---|---|---|
| Free | $0 | Anunț de bază: nume, telefon, adresă, recenzii |
| Standard | $29/lună sau $249/an (prima lună $9) | Site-ul firmei (AI, logo, poze, programări), anunț cu logo și poze, 1 articol pe lună în ziarul statului (marcat Sponsored), raport lunar |
| Premium | $59/lună sau $549/an | Tot din Standard + locul 1 în orașul lui + 7 zile pe prima pagină în fiecare trimestru + cupon inclus + articolul postat pe Facebook-ul ziarului |
| Agency | $99/lună | 10 firme, fiecare cu Spotlight și articol lunar |
| Extra o singură dată | $49 Spotlight, $149 Spotlight + prima pagină, $19 cupon | rămân cum sunt |

## Faze (fiecare se termină cu commit și verificare)
1. **Reparații:** eroarea 500 la înscriere; salvarea sursei înscrierii (pagina, referrer, UTM), vizibilă în admin.
2. **Oferta după înscriere:** pe ecran apare site-ul gata făcut + „Publică-l acum, prima lună $9”.
3. **Standard și Premium în Stripe:** plată lunară și anuală, prima lună $9, activare automată (site publicat, nivel plătit, la Premium locul 1 în oraș).
4. **Notificări de plată:** ție la cumpărare, plată eșuată și anulare; clientului la plată eșuată, cu link pentru card.
5. **Emailurile după înscriere:** zilele 3, 7, 10 și 14; se opresc imediat după cumpărare; link de dezabonare; adresă poștală.
6. **Articolul lunar:** AI pe domeniul firmei și pe anotimp, doar din date reale; clientul aprobă sau, dacă nu răspunde, se publică după 3 zile; Sponsored + rel="sponsored".
7. **Raportul lunar:** vizite, clickuri pe telefon și site, mesaje.
8. **Pachetul Agency:** ofertă automată către cei care înscriu mai multe firme.
9. **Mai târziu, cu aprobarea ta:** invitații către firmele importate care au email (domeniu separat, trimitere treptată, verificarea adreselor).

## De la proprietar
- Adresa poștală din SUA pentru emailuri (NEWSLETTER_POSTAL_ADDRESS). Fără ea nu pleacă emailurile automate din faza 5.

# TK77 Skalica - rezervačný systém (Next.js + TypeScript + Supabase)

Nasadenie rezervačného modulu BeOnCourt pre konkrétny klub - **TK77 Skalica**
(7 vonkajších antukových kurtov, Športová 1, Skalica; údaje z verejnej
facebookovej stránky facebook.com/Tk77Skalica, keďže tk77.sk aktuálne
nefunguje). Kredit sa dobíja QR platbou (PayBySquare), admin ho ručne
potvrdzuje - rovnaký model ako `REZERVACE`. Beží **Next.js 16 (App Router,
React 19) + TypeScript + Supabase** (Postgres, Auth, Storage, Row Level
Security) + Tailwind.

**Rezervácia vyžaduje kredit vopred.** Na rozdiel od pôvodného BeOnCourt
modulu (kde `create_order` iba držalo termín a platba prebiehala až
samostatným krokom potom) `create_order()` teraz **atomicky strhne kredit v
tej istej transakcii, v ktorej objednávku vytvára** (pozri
`supabase/migrations/0002_tk77_credit_gated_booking.sql`) - bez dostatočného
kreditu rezervácia vôbec nevznikne. Nezalogovaný alebo bezkreditný
návštevník preto v `/courts` vidí iba obsadenosť kurtov, výber času je
zablokovaný (`ReservationGrid`'s `canSelect`). Keďže platba už nie je
samostatný krok, `pay_order()` bol zrušený a nahradený:
`club_decide_order()` (atomické schválenie/zamietnutie klubom, s refundom pri
zamietnutí) a `expire_stale_orders()` (refund + expirácia rezervácií, na
ktoré klub dlho nereagoval).

**Jeden klub.** Na rozdiel od oboch Sails variant, ktoré modelujú ľubovoľný
počet klubov/rezortov (tabuľka `suppliers`, každý s vlastnými kurtami), táto
verzia je navrhnutá pre **jeden klub** - `club_settings` je jednoriadková
tabuľka (kontakt, cenové sezóny, potvrdzovací režim, SMS nastavenia) a
`courts` na nič neodkazujú, sú priamo klubu.

## Prečo je to bezpečnostne iné (a väčšinou lepšie) ako Sails varianty

**Autorizácia je v databáze, nie v aplikácii.** V Sails variantách sme museli
ručne písať policies (`doesOrderExist`, `ownsTopUp`), ktoré kontrolujú
vlastníctvo záznamu - keby na to niekto v budúcnosti zabudol pridať k novej
akcii, vznikne IDOR. Tu to rieši **Row Level Security** priamo na tabuľkách
(`supabase/migrations/0001_init.sql`) - `SELECT * FROM orders WHERE id = ?`
jednoducho nič nevráti, ak riadok nie je vlastníkovho, úplne nezávisle od
toho, čo (ne)urobí kód v Next.js.

**Cena sa nedá podvrhnúť z klienta.** Toto je dôležitý rozdiel oproti tomu, na
čo je človek zvyknutý z tradičného backendu: Supabase vystavuje REST/RPC
rozhranie, na ktoré sa dá pristupovať **priamo z prehliadača s JWT
prihláseného používateľa**, obídením Next.js appky úplne. Preto `create_order`
prepočítava cenu sám v Postgres funkcii (`_calculate_order_price`) - nikdy
neprijíma cenu ako parameter. Rovnaký dôvod stojí za tým, prečo `orders.token`
(jednorazový token na potvrdenie/zamietnutie e-mailom) nie je nikdy súčasťou
žiadnej odpovede smerom ku klientovi (viď stĺpcové GRANTy aj vlastný typ
`order_public` v migrácii) - keby ho vlastník objednávky videl, mohol by si
sám "potvrdiť" rezerváciu bez klubu.

**Kredit sa mení v skutočnej Postgres transakcii.** `pay_order()` je jedna
plpgsql funkcia - guardovaný `UPDATE` zostatku + insert do ledgeru + zmena
stavu objednávky sú atomické naozaj, nie len "vo väčšine prípadov" ako v
Sails 0.12 (kde to bolo zdokumentované obmedzenie).

**Heslá/tokeny rieši Supabase Auth**, nie vlastný kód - žiadny ručný bcrypt,
žiadny ručný confirm/recovery token ako v oboch Sails variantách.

## Čo je kde

- `supabase/migrations/0001_init.sql` - **jadro systému**: schéma, RLS
  politiky, a všetky peniazoachtiace funkcie (`create_order`, `pay_order`,
  `request_topup`, `confirm_topup`, `grant_cash_credit`, `cancel_order`).
  Prečítaj si hlavičkový komentár, vysvetľuje bezpečnostný model do detailu.
- `src/lib/supabase/{client,server,admin}.ts` - tri Supabase klienty:
  prehliadačový, server (beží ako prihlásený používateľ, RLS platí), a
  **service-role** (`admin.ts`, obchádza RLS - použitý len pre SMS webhook,
  e-mailový potvrdzovací odkaz a cron na expiráciu, nikdy nie z bežnej
  stránky/akcie).
- `proxy.ts` (predtým `middleware.ts` - Next.js 16 premenoval konvenciu) -
  obnovuje session cookie a presmeruje neprihlásených/ne-adminov preč z
  chránených ciest (pohodlie pre UI, nie bezpečnostná hranica - tou je RLS +
  kontrola `is_admin()` vo funkciách).
- `src/app/**/actions.ts` - Server Actions, tenké obaly nad Postgres
  funkciami/RLS dotazmi.
- `src/app/api/orders/sms/[secret]`, `src/app/potvrdenie-rezervacie`,
  `src/app/api/cron/expire-orders` - neautentifikované vstupné body (SMS
  gateway callback, e-mailový odkaz, plánovaná úloha), preto bežia cez
  `admin.ts`.

## Vyžaduje ešte doladenie / nebolo overené

- ~~`bysquare` integrácia~~ **overené naživo (2026-09-24)** - lokálny
  `supabase start` napokon zabehol (Docker sa na tomto stroji rozchodil) a QR
  platba sa dala naskenovateľne vygenerovať pre skutočnú sumu/variabilný
  symbol. Funguje to len s IBAN-om, ktorý prejde kontrolným súčtom - príklad
  v `.env.example` (samé nuly) zámerne neprejde, aby bolo jasné, že sa musí
  nahradiť reálnym.
- **PWA ikona** - `public/icons/icon.svg` je hotová a funkčná (favicon,
  Android/Chrome "Pridať na plochu"), ale **iOS Safari vyžaduje PNG**
  (`<link rel="apple-touch-icon">` negeneruje sa z SVG). Doplň
  `public/icons/apple-touch-icon.png` (180×180) a pridaj ho do
  `metadata.icons.apple` v `src/app/layout.tsx` - ja som v tomto prostredí
  nemal k dispozícii nástroj na rasterizáciu SVG → PNG.
- **SMS notifikácia klubu** - teraz doplnená (`src/lib/sms.ts`, port
  pôvodného `EuroSmsService.js`, MD5 podpis cez Node `crypto` namiesto
  externého balíčka), zapojená v `src/app/orders/actions.ts` (posiela sa iba
  ak `club_settings.sms_notification` je zapnuté a prípadne v rámci
  nastaveného časového okna `sms_from`-`sms_to`). Rovnako ako pri `bysquare`
  som to nemohol reálne odoslať cez živé EuroSMS API - over si to.
- **Cron expirácia objednávok** (`/api/cron/expire-orders`) potrebuje
  externého volajúceho - `vercel.json` to nastavuje pre Vercel Cron (posiela
  `Authorization: Bearer $CRON_SECRET` automaticky, keď nastavíš `CRON_SECRET`
  ako Vercel env var); mimo Vercel treba vlastný cron/scheduler.
- **Reálne údaje o klube** - telefónne číslo TK77 Skalica sa nikde verejne
  nenašlo (`club_settings.phone` je `null`), cenník v
  `0002_tk77_credit_gated_booking.sql` (4 €/30 min = 8 €/hod) je len
  odhad - over/doplň obe veci pred nasadením. Migrácia navyše
  **truncuje `courts`/`orders`** - spúšťaj ju len na čistom/demo projekte.
- **Zamietnutá rezervácia blokovala termín navždy** - `excl_orders_no_overlap`
  aj `create_order()`'s pre-check počítali `'rejected'` medzi stavmi, ktoré
  obsadzujú slot, hoci zamietnutá objednávka je vrátený kredit a mŕtva história.
  Opravené v `0003_fix_rejected_orders_block_slot.sql` (nová migrácia -
  `excl_orders_no_overlap` a `create_order()` z `0001`/`0002` sú historické
  snapshoty, nemenia sa spätne) + `BLOCKING_STATUSES` v `courts/page.tsx`.
- **`@supabase/ssr` bolo treba zdvihnúť z `^0.5.1` na `^0.12.7`** - so
  zainštalovaným `@supabase/supabase-js@2.117` staré `0.5.1` interne
  importovalo typy z cesty (`@supabase/supabase-js/dist/module/lib/types`),
  ktorá v tejto verzii supabase-js už neexistuje. Prejavovalo sa to zákerne:
  žiadna chyba pri buildení, len každý `.from(...)`/`.rpc(...)` v CELEJ appke
  potichu vrátil typ `never`/`undefined` namiesto skutočných stĺpcov -
  `npx tsc --noEmit` bol pred opravou "čistý" len preto, že nič nemal čo
  skontrolovať. `src/lib/types/database.types.ts` bol pri tej príležitosti
  doplnený o `Views`/`Insert`/`Update`/`Relationships` (vyžaduje si to
  aktuálny tvar `GenericSchema` v `@supabase/postgrest-js`) a
  `server.ts`/`middleware.ts` prešli na nezastarané `getAll`/`setAll` cookie
  API. Over `npx tsc --noEmit` po každom ďalšom upgrade `@supabase/*` -
  presne toto sa dá ľahko prehliadnuť.

## Bezpečnostný hardening (druhé kolo)

- **Next.js 14 → 16, React 18 → 19** (`npx @next/codemod upgrade latest` +
  ručný doťah). Next 14.2.35 mal viacero high/critical CVE opravených až v
  16.x (mj. neautentifikované RCE na Windows serveroch, SSRF v Server
  Actions) - `npm audit` išiel z 5 (3 high, 2 critical) na 0. Vedľajšie
  dopady: `middleware.ts` → `proxy.ts` (Next 16 premenoval konvenciu),
  `cookies()`/`params`/`searchParams` sú teraz async všade (`await`).
  `server.ts`'s `createClient()` je preto tiež `async` - zámerne NIE cez
  `UnsafeUnwrappedCookies` skratku, ktorú by `@next/codemod` inak použil (je
  "unsafe" naschvál a v ďalších verziách úplne zmizne).
- **`nodemailer` 6 → 10, `supabase` CLI 1 → 2** - obe len kvôli CVE v
  závislostiach (SMTP/CRLF injection; zraniteľný `tar` v CLI, ktorý beží iba
  lokálne cez `npm run supabase:types`). API použité v `email.ts` sa
  nezmenilo.
- **E-mailový odkaz klubu na potvrdenie/zamietnutie rezervácie už nie je
  GET, ktorý rovno vykoná akciu** - presunuté z `/api/orders/confirm` na
  `/potvrdenie-rezervacie` (obyčajná stránka + `decideOrder()` server
  action). Dôvod: GET je stavovo meniaci (a od zavedenia credit-gated
  rezervácií pri zamietnutí aj vracia kredit) - firemné e-mailové
  skenery/link-prefetchery bežne GET odkazy z mailu samé navštívia bez toho,
  aby si to niekto vôbec prečítal. Teraz taký odkaz iba zobrazí, čo sa má
  stať (kurt, termín, cena, zákazník) - k reálnej zmene stavu treba
  skutočné kliknutie na tlačidlo (POST). SMS webhook (`/api/orders/sms/`)
  zostal GET zámerne - to je kontrakt konkrétnej SMS brány, nie odkaz z
  e-mailu, takže prefetch riziko sa naň nevzťahuje.
- **`club_decide_order()`/`expire_stale_orders()` majú explicitný `REVOKE
  EXECUTE ... FROM PUBLIC, anon, authenticated`** (koniec
  `0002_tk77_credit_gated_booking.sql`) - defense-in-depth nad rámec
  spoliehania sa na to, že Supabase defaultne nesprístupňuje nové funkcie
  cez PostgREST. Bez toho by ich (aj s `p_token = null`) mohol zavolať
  ktokoľvek prihlásený priamo cez `/rpc/`.
- `CRON_SECRET`/`ORDER_SMS_WEBHOOK_SECRET` sa porovnávajú cez
  `secretEquals()` (`src/lib/secretEquals.ts`, `crypto.timingSafeEqual`)
  namiesto `===`, aby porovnanie neuniklo cez časovanie.
- Projekt beží lokálne aj bez pripojeného Supabase (žiadne dáta), takže
  vizuálne/interakčné veci (mriežka rezervácií, layout) boli overované cez
  izolované statické HTML makety s rovnakou logikou/farbami, nie proti
  živému `next dev`. `npx tsc --noEmit` a `npm run build` sú ale zelené proti
  reálnemu kódu.

## Overené naživo (2026-09-24) - `supabase start` + `npm run dev`

Docker sa na vývojovom stroji napokon rozbehol, takže sa dalo prvýkrát
spustiť naozaj (4 migrácie + `seed.sql` naostro, prihlásenie ako všetci 4
seedovaní používatelia, reálna rezervácia cez `create_order()`, potvrdenie
čakajúcej platby adminom, vygenerovanie skutočného QR kódu). Vyplávali pritom
dva reálne bugy, oba opravené (`0004_public_court_availability_view.sql` +
zmeny v `courts/page.tsx`/`format.ts`/`admin/credit/pending/page.tsx`):

- **Časové pásmo** - výpočet "dnešného dátumu" používal
  `date.toISOString().slice(0, 10)` na `Date` objekte, ktorý mal reprezentovať
  LOKÁLNY deň - `toISOString()` ale prevádza na UTC, takže "dnes" sa v
  strednej Európe (UTC+1/+2) v skorých ranných hodinách vyhodnotilo ako
  "včera". `/courts` tak defaultne ukazoval včerajší (väčšinou prázdny)
  rozvrh namiesto dnešného. Opravené v `src/lib/format.ts`'s `toIsoDate()`
  (lokálne gettery namiesto UTC).
- **Bežní zákazníci nevideli cudzie rezervácie** - `orders_select_own_or_admin`
  (RLS na `orders`) správne obmedzuje SELECT na vlastné riadky alebo admina,
  ale `courts/page.tsx` cez ňu zisťoval obsadenosť pre CELÚ mriežku - takže
  neprihlásený návštevník (alebo iný zákazník) videl len svoje vlastné
  rezervácie ako obsadené, cudzie ako voľné. Skutočnému dvojitému rezervovaniu
  bránilo aj tak `excl_orders_no_overlap` (odmietnutie pri odoslaní), ale
  mriežka klamala o dostupnosti. Rieši nový pohľad `public.court_booked_slots`
  (vlastník-pohľadu obchádza RLS pre `orders` zámerne - pozri jeho hlavičkový
  komentár), ktorý zverejňuje len (kurt, dátum, čas), nikdy kto/za koľko.
- Vedľajší nález: `admin/credit/pending` mal nejednoznačný embed
  (`profiles(...)` z `credit_transactions`, ktorá má dve FK na `profiles` -
  `user_id` aj `created_by`) - PostgREST na to vrátil chybu `PGRST201`, ktorú
  kód nekontroloval, takže sa tabuľka len ticho zobrazila prázdna. Opravené
  hintom `profiles!credit_transactions_user_id_fkey(...)`.

## Bezpečnostný audit naživo (2026-09-24, pokračovanie) - reálne útoky, nie len čítanie kódu

Po vyššie uvedenom sa urobil skutočný penetračný test proti bežiacemu
lokálnemu stacku - prihlásenie ako reálny (neadmin) používateľ cez
`/auth/v1/token`, a jeho tokenom priame volania na PostgREST (obídenie
Next.js appky úplne, presne ten útočný vektor, pred ktorým celý bezpečnostný
model tejto appky varuje). Väčšina obranných vrstiev obstála (RLS scoping na
`orders`/`credit_transactions`, column-level grant na `orders.token`,
`REVOKE EXECUTE` na `club_decide_order`/`expire_stale_orders`/interné
`_`-funkcie, `insufficient_credit`/`slot_unavailable` p_price injection cez
RPC, XSS-escaping, storage RLS) - **až na jednu kritickú výnimku, ktorá sa
pri tom našla a rovno aj reálne spôsobila škodu**:

**`court_booked_slots` (0004) dovoľoval hocijakému prihlásenému používateľovi
(aj anonymovi) INSERT/UPDATE/DELETE priamo do `orders` cez pohľad**, nielen
SELECT. Príčina: novovytvorená VIEW dostala od Supabase (lokálny aj hostovaný
projekt si default privileges nastavuje tak, aby RLS bola jediná ochrana
tabuliek) plné `arwdDxtm` práva pre `anon`/`authenticated` ešte predtým, než
0004 spravil `grant select` - ktorý len PRIDÁVA, nikdy nezužuje. V kombinácii
s `security_invoker = false` (nutné, aby SELECT cez pohľad obišiel RLS na
`orders`, presne podľa zámeru) to znamenalo, že aj zápis cez pohľad bežal ako
vlastník pohľadu - teda obišiel RLS aj zúžené granty na `orders` úplne.
Overené tak, že sa to počas testovania reálne využilo: `DELETE
.../court_booked_slots?court_id=eq.1` ako bežný používateľ naozaj zmazal dve
skutočné rezervácie (opravené cez `supabase db reset`, ktorý dáta obnovil zo
`seed.sql`). Oprava (`0005_fix_court_booked_slots_write_access.sql`):
`REVOKE ALL` pred úzkym re-grantom - presne vzor, ktorý `0001_init.sql` už
používa pre `profiles`/`orders`, len som ho zabudol aplikovať aj na novú
VIEW. Overené znova naživo - INSERT/DELETE cez pohľad teraz 403, SELECT
funguje ako predtým.

Popri tom sa overilo (priamymi útokmi, nie len čítaním), že **obyčajné
tabuľky** (`club_settings`, `courts`, `profiles`, `credit_transactions`) sú
napriek rovnako širokým defaultným grantom v poriadku - RLS bez politiky pre
daný príkaz (napr. žiadna UPDATE politika na `club_settings`) príkaz
nezablokuje na úrovni grantu, ale potichu vynuluje na 0 zasiahnutých riadkov.
Rozdiel oproti pohľadu je `security_invoker` - obyčajná tabuľka nemá
"vlastníka, ktorý obchádza RLS" mechanizmus, VIEW s `security_invoker =
false` ho má. Presne to bola príčina jedinej skutočnej diery.

## Optimalizácia + druhý bezpečnostný audit (2026-09-24, ďalšie pokračovanie)

Refaktoring kvôli budúcemu preštylovaniu (napr. Bootstrap šablóna): vyňaté
opakujúce sa JSX vzory do `src/components/ui/` (`Table`/`TableHead`/`Th`/
`Tr`/`Td`, `PageHeader`, `StatCard`) a nasadené naprieč ~24 stránkami -
budúca zmena vzhľadu tabuliek/nadpisov teda znamená úpravu na jednom mieste,
nie v každej stránke zvlášť. `ReservationGrid.tsx` (najkomplexnejší
komponent) teraz počíta `slotMaps`/`columns` cez `useMemo` namiesto pri
každom rendri - predtým sa prepočítavalo aj počas ťahania myšou pri výbere
termínu. Pridaný kompozitný index `idx_orders_court_date_active` (0006) na
presne ten dopyt, ktorý `/courts` robí pri načítaní obsadenosti.

Nasledovný penetračný test (rovnaká metóda ako vyššie) našiel **jednu
kritickú a jednu reálnu, hoci menej závažnú, chybu**:

**Middleware (`proxy.ts`) sa vôbec nespúšťal.** Next.js 16 zaviedol `proxy.ts`
ako nový názov pre `middleware.ts` (Next interne `middleware.ts` označuje za
"deprecated", odporúča `proxy.ts`) a táto appka bola na `proxy.ts` prepnutá v
predchádzajúcom kole. Živý test (prihlásenie ako bežný používateľ,
priama návšteva `/admin`) ale ukázal, že appka **admin obrazovku rovno
zobrazila** - žiadne presmerovanie. Ukázalo sa, že `proxy.ts` pod `next dev
--turbopack` v tomto prostredí ticho vôbec nebeží (build ho *vidí* a vypíše
`ƒ Proxy (Middleware)`, ale za behu sa nikdy nezavolá) - `/orders/[id]` a
`/credit/topup` (ktoré sa spoliehali výlučne na middleware a interne rátali
s tým, že `user` už nie je `null`) boli pre neprihláseného návštevníka
priamo prístupné (`/credit/topup` dokonca spadlo na 500 kvôli `user!.id`).
Vrátené na pôvodný, jednoznačne podporovaný názov `middleware.ts` - po
premenovaní presmerovanie fungovalo. Keďže ale **celý konvenčný súbor sa už
raz potichu prestal spúšťať**, nemôže byť jediná ochrana: každá stránka pod
`/profile`, `/orders`, `/credit`, `/admin` teraz kontroluje prihlásenie (a
`/admin/*` navyše `is_admin`) sama v sebe (`redirect()` ak nie je splnené),
middleware je už len doplnková vrstva navyše. Pridaný `src/app/admin/
layout.tsx` s vlastnou `is_admin` kontrolou pre celý `/admin/*` strom.
Overené naživo znova - všetkých 6 testovaných URL (`/profile`, `/orders/1`,
`/orders/1/result`, `/credit/topup`, `/credit/topup/13`, `/admin`) teraz bez
prihlásenia korektne 307-presmerúva na `/login`, a admin/bežný používateľ
majú po prihlásení prístup presne k tomu, k čomu majú.

Overené aj (bez nálezu): cudzí `create_order`/dvojrezervácia rovnakého
termínu (blokované `slot_unavailable`), `grant_cash_credit`/`confirm_topup`/
`cancel_order` ako neadmin (všetky `403 not permitted`), storage upload mimo
vlastného `profiles/<uid>/` priečinka (`403`), `club_settings`/`courts`
UPDATE ako neadmin (RLS ticho vynuluje na 0 riadkov, dáta nezmenené).

## Tretí bezpečnostný audit naživo (2026-09-24, ďalšie pokračovanie)

Ďalší penetračný test rovnakou metódou (prihlásenie ako reálny neadmin cez
`/auth/v1/token`, priame volania na PostgREST/Storage/GraphQL/GoTrue mimo
Next.js appky) našiel **jednu reálnu chybu v biznis logike** a jeden menší
hardening:

**`create_order` neoveroval `order_date` vôbec.** `courts/page.tsx`
obmedzuje výber dátumu na dnešok .. +30 dní (`DAYS_AHEAD_MAX`), ale to je iba
UI - RPC `/rest/v1/rpc/create_order` je priamo dosiahnuteľné z prehliadača
tokenom bežného používateľa (presne ten útočný model, na ktorom celá appka
stojí). Overené naživo: bežný používateľ si zarezervoval kurt v **minulosti**
(dátum 3 dni dozadu) aj ~9 mesiacov dopredu, oboje s reálnym stiahnutím
kreditu. Rezervácie ďaleko v budúcnosti sú v mriežke neviditeľné (ukazuje len
30 dní), ale zaberajú `excl_orders_no_overlap` - dá sa nimi ticho blokovať
dostupnosť. Oprava (`0007_create_order_date_bounds.sql`): kontrola
`current_date <= order_date <= current_date + 30` priamo vo funkcii, mimo
rozsahu vyhodí `invalid_order_date` (v `orders/actions.ts` zmapované na
priateľskú hlášku). Overené znova naživo - minulosť, +31 dní aj +200 dní teraz
`400 invalid_order_date`, legitímne +5 dní a dnešok prejdú.

**Menší hardening: prípona nahraného avataru sa brala z názvu súboru
používateľa** (`file.name.split('.').pop()`) - útočník tak mohol do kľúča
storage objektu (verejný bucket, servírovaný cez URL) dostať ľubovoľnú
príponu, napr. `avatar.html`. Zapísať sa síce dá len do vlastného
`profiles/<uid>/` priečinka (storage RLS drží) a súbor sa servíruje z iného
originu než appka a s deklarovaným `image/*` content-type, takže reálny XSS
dopad je nízky, no vstupom riadená prípona v ceste je zbytočná. Opravené v
`profile/actions.ts` - prípona sa teraz odvodí z overeného MIME typu, nie z
názvu súboru.

Overené aj (bez nálezu, priamymi útokmi): eskalácia práv cez PostgREST
(`PATCH profiles.is_admin/credit_balance`, `PATCH` cudzieho profilu, priamy
`INSERT` do `credit_transactions`/`orders`, `PATCH/POST/DELETE` cez pohľad
`court_booked_slots`, `UPDATE club_settings/courts`) - všetko `403` alebo RLS
ticho vynuluje na 0 riadkov; admin RPC (`grant_cash_credit`, `confirm_topup`,
`cancel_order`) a interné RPC (`club_decide_order` bez tokenu,
`expire_stale_orders`, `_calculate_order_price`) ako neadmin/anon - všetko
`403`/`not permitted`; čítanie stĺpca `orders.token` cez REST (`403`);
`request_topup` hraničné/nezmyselné sumy (`-50`, `0`, `4.99`, `1000.01`,
`Infinity`, `1e12` - všetko odmietnuté); `create_order` s nezmyselným časom
(nepárna minúta, `to<from`, obrovský rozsah - všetko odmietnuté). Osobitne
overené, že `PUT /auth/v1/user` s `data.is_admin=true` (zápis do JWT
metadát) **nemá žiadny vplyv na autorizáciu** - appka číta `is_admin` z
tabuľky `profiles` cez `is_admin()`, nikdy z JWT claimu (po zápise ostalo
`is_admin=false`).

## Testovacie dáta

`supabase/seed.sql` - 4 fiktívni používatelia (3 bežní + 1 admin) s históriou
kreditu a rezervácií (minulé aj dnešné/budúce, aby `/courts` hneď po naseedovaní
ukázal obsadené termíny), plus jedno čakajúce dobitie kreditu pre
`/admin/credit/pending`. Mená/heslá/e-maily sú vymyslené - zoznam bol daný
používateľovi samostatne. Spúšťa sa automaticky cez `supabase start`/
`supabase db reset` (lokálny vývoj), **nikdy cez `supabase db push`** - na
reálny/vzdialený projekt sa teda nedostane omylom.

Kým appka beží s `NEXT_PUBLIC_DEMO_MODE` inak ako `"false"` (default),
zobrazuje sa na každej stránke veľký banner "TESTOVACIA VERZIA"
(`src/components/DemoBanner.tsx`) - vypni ho až pri nasadení pre skutočný
klub so skutočnými rezerváciami/platbami.

Priame seedovanie `auth.users`/`auth.identities` je zaužívaný postup pri
Supabase, ale presná sada povinných stĺpcov sa medzi verziami GoTrue líšila -
ak sa po seedovaní nedá prihlásiť, pozri najprv logy auth služby.

## Development

1. `cp .env.example .env.local` a vyplň (Supabase URL/kľúče z Project
   Settings > API, `BANK_IBAN`, `ORDER_SMS_WEBHOOK_SECRET`, `CRON_SECRET`).
2. Vytvor Supabase projekt (alebo lokálne cez `supabase start`, ak máš
   Supabase CLI) a aplikuj migráciu:
   ```bash
   supabase link --project-ref <tvoj-projekt>
   supabase db push
   ```
3. Aspoň jedného usera nastav ako admina - `is_admin` sa nedá nastaviť cez
   appku (zámerne, viď migráciu), len priamym SQL:
   ```sql
   update public.profiles set is_admin = true where email = 'ty@example.com';
   ```
4. `npm install && npm run dev`

## Klubový web

Okrem `/courts` (rezervačná mriežka) pribudli aj verejné stránky: `/` (úvod),
`/o-klube`, `/cennik` (počíta ceny/otváracie hodiny priamo z `courts`/
`club_settings`, nie sú hardkódované) a `/kontakt` (mapa cez embed bez API
kľúča). Spoločný `Nav`/`Footer` je v `src/components`.

## Čo v tomto module chýba (bolo mimo zadania, rovnako ako v `REZERVACE`)

- Správa kurtov cez web UI - zatiaľ treba nahrávať priamo do `courts`/
  `club_settings` tabuliek.
- Novinky (News) z Facebooku sa nezobrazujú automaticky (žiadne API
  volanie) - `/o-klube` má zatiaľ len statický text.
- Kontaktný formulár a stránka s podmienkami.

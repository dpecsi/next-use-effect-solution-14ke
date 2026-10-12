# useEffect gyakorló feladat — „Időjárás jelentés”

## A feladat célja

A `useEffect` hook önálló használatának gyakorlása egyetlen oldalon, a `useState` mellett. A
feladat végére mind a három tipikus effekt-fajtát megírod:

| Függőségi tömb | Mikor fut le?                                        | Ebben a feladatban          |
| -------------- | ---------------------------------------------------- | --------------------------- |
| `[]`           | csak egyszer, betöltéskor                            | óra indítása + takarítás    |
| `[valami]`     | betöltéskor, majd a `valami` minden változásakor     | adatlekérés az API-ról      |
| `[a, b]`       | betöltéskor, majd ha `a` vagy `b` értéke megváltozik | `document.title` frissítése |

> **Fontos:** az **első** renderelés után **minden** effekt lefut, a függőségi tömbtől
> függetlenül — a React ilyenkor még nem tud mihez hasonlítani. A függőségi tömb csak azt
> szabályozza, hogy a **további** renderelések után lefusson-e újra.

Emellett gyakorlod, hogy **mikor NEM kell** `useEffect`: ami kiszámolható a meglévő
állapotokból, azt renderelés közben számoljuk ki.

Segédlet a hookhoz: `USEEFFECT.md`.

## Játékszabályok

**Használható:**

- egyetlen fájl: `app/page.tsx`, a legelső sorában `"use client";`
- a `useState` és a `useEffect` hook (akárhány példányban)
- `axios` (`import axios from "axios";`) — vagy a beépített `fetch`, ahogy kényelmesebb
- `react-hot-toast` — a `<Toaster>` már be van kötve az `app/layout.tsx`-ben
- Tailwind CSS osztályok
- a **daisyUI** kész osztályai (`btn`, `btn-primary`, `btn-outline`, …) — már be van kötve az
  `app/globals.css`-ben, a gomboknál ezzel sokkal gyorsabb a formázás

**Nem használható (nem kell hozzá):**

- `useRef`, `useContext`, Zustand vagy bármilyen globális store
- külön komponensekre bontás (szándékosan maradjon egy fájlban)
- saját backend, API route, adatbázis, `localStorage`
- külső UI könyvtár (a daisyUI osztályai megengedettek, de nem szükségesek)

## A kész alkalmazás felépítése

Egy középre igazított kártyán, egymás alatt:

1. **Fejléc:** „⛅ Időjárás jelentés” cím, alatta egy **élő óra** (másodpercenként lépő időpont).
2. **Városválasztó:** öt gomb rácsban, a kiválasztott látványosan kiemelve. Induláskor Győr a
   kiválasztott város.
3. **Időjárás-doboz:** a kiválasztott város aktuális adatai — állapot, hőmérséklet, szél.
   Amíg tölt, „Betöltés…” látszik; hiba esetén hibaüzenet.
4. **Öltözködési tanács:** a hőmérsékletből **számolt** szöveg (nem állapot!).
5. **„Frissítés” gomb**, ami újra lekéri ugyanannak a városnak az adatait.

## Az API

Az [Open-Meteo](https://open-meteo.com/) publikus, ingyenes API-ját használjuk — **nem kell
kulcs**, de **internet igen**. A hívandó cím:

```
https://api.open-meteo.com/v1/forecast?latitude=47.6875&longitude=17.6504&current=temperature_2m,wind_speed_10m,weather_code
```

A válasz (a minket érdeklő rész):

```json
{
  "current": {
    "time": "2026-09-12T14:00",
    "temperature_2m": 21.4,
    "wind_speed_10m": 9.7,
    "weather_code": 3
  }
}
```

## Adatok

Ezek **konstansok**, nem állapotok — a komponens **fölött** definiáld őket:

**Városok:**

| id   | felirat  | latitude | longitude |
| ---- | -------- | -------- | --------- |
| `gy` | Győr     | 47.6875  | 17.6504   |
| `bp` | Budapest | 47.4979  | 19.0402   |
| `db` | Debrecen | 47.5316  | 21.6273   |
| `sz` | Szeged   | 46.2530  | 20.1414   |
| `pe` | Pécs     | 46.0727  | 18.2323   |

**Időjárás-kódok** (WMO kódok, csak a leggyakoribbak — a többihez legyen egy „Ismeretlen” tartalék):

| kód            | felirat        | ikon |
| -------------- | -------------- | ---- |
| `0`            | Derült         | ☀️   |
| `1`, `2`, `3`  | Részben felhős | ⛅   |
| `45`, `48`     | Ködös          | 🌫️   |
| `51`,`53`,`55` | Szitálás       | 🌦️   |
| `61`,`63`,`65` | Esős           | 🌧️   |
| `71`,`73`,`75` | Havazás        | 🌨️   |
| `80`,`81`,`82` | Zápor          | 🌦️   |
| `95`           | Zivatar        | ⛈️   |

Ezt ugyanolyan **objektum-tömbben** tárold, mint a városokat — a `codes` tömbben soroljuk fel
azokat a kódokat, amikhez ugyanaz a felirat és ikon tartozik:

```js
const WEATHER = [
  { codes: [0], label: "Derült", icon: "☀️" },
  { codes: [1, 2, 3], label: "Részben felhős", icon: "⛅" },
  // ...
];
```

---

## 1. lépés — Előkészítés

Töröld ki az `app/page.tsx` tartalmát, és hozz létre egy `HomePage` komponenst `"use client";`
direktívával. Importáld a `useState`-et, a `useEffect`-et és az `axios`-t. Vedd fel a fenti
konstansokat (városok, időjárás-kódok) a komponens fölé.

Indítsd a fejlesztői szervert: `npm run dev` → http://localhost:8080

## 2. lépés — Élő óra (`[]` függőségi tömb + takarítás)

Készíts egy `clock` állapotot, **`null` kezdőértékkel** — ne `new Date()` legyen!

> **Miért?** Mert a kezdőérték a szerveren és a böngészőben is lefutna, más-más eredménnyel:
> ez **hidratálási hiba**. Az időt ezért csak az effektben állítjuk be, ami már kizárólag a
> böngészőben fut.

Írj egy effektet **üres függőségi tömbbel** (`[]`), ami:

1. elindít egy `setInterval`-t, ami másodpercenként beállítja az aktuális időt,
2. **visszaad egy takarító függvényt**, ami `clearInterval`-lal leállítja az időzítőt.

A fejlécben jelenítsd meg az időt (`toLocaleTimeString("hu-HU")`), amíg `null`, addig `--:--:--`.
Az első időpontot az intervallum első ütése állítja be, tehát a helyőrző egy másodpercig
látszik — ez így rendben van.

> **Miért nem írunk egy `setClock(new Date())`-et az effekt elejére, hogy ne kelljen várni?**
> Mert az effekt **törzsében** hívott `setState` felesleges extra renderelést okoz — a lint
> hibának is jelzi. Az időzítő callback függvényéből (és az `await` után) viszont szabad.

> **Miért kell a takarítás?** Takarítás nélkül az időzítő a komponens eltűnése után is tovább
> ketyegne, és `setState`-et hívna egy már nem létező komponensen — ez memóriaszivárgás.

### Mikor fut le a takarító függvény?

Az effektből visszaadott függvény **nem a `return` pillanatában** fut le — a React eltárolja, és
később hívja meg. Pontosan két alkalommal:

1. **Mielőtt ugyanaz az effekt újra lefutna**, ha a függőségi tömbben változott valami: előbb az
   _előző_ futás takarítója fut le, csak utána indul az új effekt.
2. **Amikor a komponens eltűnik** (unmount) — ilyenkor már nem jön új effekt, csak a takarítás.

```
mount        →  effekt
dep változik →  takarítás (az előző futásé)  →  effekt
unmount      →  takarítás
```

Az **első** renderelés után tehát nincs takarítás — nincs is mit takarítani. Ennek az effektnek
üres (`[]`) a függőségi tömbje, így itt a takarító **csak unmountkor** fut le: az időzítő a
komponens teljes élettartama alatt végig ketyeg, ahogy kell.

Bővebben (closure, versenyhelyzet, Strict Mode): `USEEFFECT.md` 3. pontja.

## 3. lépés — Városválasztó (`useState`)

Készíts egy `cityId` állapotot `"gy"` kezdőértékkel (tehát Győr az alapértelmezett város), és
a városok tömbjén `.map()`-pel öt gombot. Kattintásra állítsd be az adott város `id`-ját.
Minden `.map()`-nél legyen `key`!

A kiválasztott város objektumát **származtatott értékként** keresd ki (`find()`), ne tedd
külön állapotba.

## 4. lépés — Adatlekérés az API-ról (`[cityId, refreshCounter]`)

Ehhez négy állapot kell:

- `weather` — az API-tól kapott adat (kezdőérték `null`)
- `loading` — logikai, kezdőértéke `true` (mert a lekérés rögtön betöltéskor indul)
- `error` — szöveg, kezdőértéke `""`
- `refreshCounter` — szám, `0` kezdőértékkel; ennek a növelése kér új adatot

Írj egy effektet `[cityId, refreshCounter]` függőségi tömbbel:

1. Definiálj **az effekten belül** egy `async` függvényt, és hívd meg.
   **Maga az effekt nem lehet `async`!** (Az Promise-t adna vissza, a React viszont takarító
   függvényt vár.)
2. `try` ágban: `axios.get(...)` a kiválasztott város koordinátáival, majd
   `setWeather(response.data.current)` és `setError("")`.
3. `catch` ágban: `setError("Nem sikerült lekérni az időjárást.")` és egy `toast.error(...)`.
4. `finally` ágban: `setLoading(false)`.

> **Figyelem:** az effekt **törzsében** (az `await` előtt) ne hívj `setState`-et — pl. a
> `setLoading(true)`-t ne ide tedd, mert felesleges extra renderelést okoz. A betöltés
> jelzését a városváltó és a „Frissítés” gomb **eseménykezelőjében** kapcsold be.

A „Frissítés” gomb `onClick`-je tehát: `setLoading(true)` **és**
`setRefreshCounter((prev) => prev + 1)`. A városválasztó gombnál is kapcsold be a
`setLoading(true)`-t.

## 5. lépés — Megjelenítés és származtatott érték

Az időjárás-dobozban három eset van, ebben a sorrendben:

1. ha `loading` → „Betöltés…”
2. különben, ha `error` → a hibaüzenet
3. különben, ha van `weather` → az ikon, az állapot felirata, a hőmérséklet (egy tizedesre) és
   a szélsebesség (`km/h`)

Az időjárás-kódhoz tartozó feliratot a `WEATHER` tömbből `find()`-dal keresd ki — ugyanúgy,
mint a kiválasztott várost —, a `codes` tömbön `includes()`-szal:

```js
WEATHER.find((item) => item.codes.includes(weather.weather_code));
```

Legyen tartalék értéke (`?? { label: "Ismeretlen", icon: "❓" }`) arra az esetre, ha az API
olyan kódot ad vissza, ami nincs a listában.

**Öltözködési tanács** — ezt egy sima `const`-ba számold ki renderelés közben, a `return`
előtt, **ne** `useEffect`-ben és **ne** külön állapotban:

| hőmérséklet | tanács                           |
| ----------- | -------------------------------- |
| < 0 °C      | „Kabát, sapka, sál! 🧣”          |
| 0–14 °C     | „Vegyél fel kabátot. 🧥”         |
| 15–24 °C    | „Kellemes idő, pulóver elég. 🙂” |
| ≥ 25 °C     | „Meleg van, igyál sok vizet! 💧” |

> **Miért nem effekt?** Mert a tanács mindig kiszámolható a hőmérsékletből. Ha effektben
> állapotba mentenéd, egy renderelési körrel mindig elmaradna a valóságtól.

## 6. lépés — `document.title` frissítése (`[a, b]` függőségi tömb)

Írj egy harmadik effektet, ami a böngészőfül címét állítja be — ez tipikus mellékhatás, mert a
komponensen kívüli világot (a DOM-ot) módosítja:

```
Győr 21.4 °C — Időjárás jelentés
```

A függőségi tömbben a **város neve** és a **hőmérséklet** szerepeljen, hogy bármelyik
változásakor lefusson. Ha még nincs adat, írj ki egy „Időjárás jelentés” alapcímet.

---

## Tailwind formázási feladatok

### T1. Reszponzív városválasztó, kiválasztott állapottal

Az öt városgomb mobilon 2, kis képernyőtől (`sm:`) 5 oszlopban jelenjen meg
(`grid grid-cols-2 sm:grid-cols-5 gap-2`). A gombokhoz használd a daisyUI kész `btn` osztályait, a
kiválasztott állapotot pedig feltételes osztálylistával jelezd:

```
className={`btn btn-sm ${city.id === cityId ? "btn-primary" : "btn-outline"}`}
```

A „Frissítés" gomb `btn btn-primary w-full` legyen, és betöltés közben letiltva (`disabled`) — a
letiltott állapot formázását is a daisyUI adja, nem kell hozzá külön `disabled:` osztály.

### T2. Az időjárás-doboz három állapota

- **Betöltés:** a doboz szövege szürke és dőlt (`text-gray-400 italic`), a doboz pedig
  `animate-pulse`.
- **Hiba:** piros keretes, halvány piros hátterű doboz (`border-red-200 bg-red-50 text-red-700`).
- **Adat:** a hőmérséklet legyen kiemelve — nagy és félkövér, egyenlő szélességű számjegyekkel
  (`text-5xl font-bold tabular-nums`), az ikon még nagyobb (`text-6xl`). A doboznak legyen
  lekerekített sarka, halvány háttere és belső margója (`rounded-2xl bg-sky-50 p-6`).

Mindhárom eset **azonos magasságú** legyen (pl. `min-h-48`), hogy az oldal ne ugráljon
betöltéskor.

---

## Ellenőrző lista

- [ ] Az óra effektje `[]` függőségi tömbű, és **van** takarító függvénye (`clearInterval`).
- [ ] Az óra kezdőértéke `null`, nem `new Date()` (nincs hidratálási hiba a konzolban).
- [ ] Az adatlekérő effekt függőségi tömbje `[cityId, refreshCounter]`.
- [ ] Az effekt **maga nem `async`**, hanem egy benne definiált `async` függvényt hív.
- [ ] A hibakezelés `try` / `catch` / `finally` ágakkal készült.
- [ ] A `setLoading(true)` az eseménykezelőben van, nem az effekt törzsében.
- [ ] Az öltözködési tanács renderelés közben számolt érték, nincs se effektje, se állapota.
- [ ] A `document.title`-t beállító effekt függőségi tömbje a város nevét és a hőmérsékletet
      tartalmazza.
- [ ] Minden `.map()`-nél van `key`.
- [ ] A gombok daisyUI osztályokat használnak (`btn`, `btn-primary`, `btn-outline`).
- [ ] A T1–T2 formázási feladatok elkészültek.

## Gyakori hibák

1. **Végtelen ciklus.** Ha az effekt `setState`-et hív, és **nincs** függőségi tömbje, az
   állapotváltozás újrarenderel, ami újra lefuttatja az effektet — a végtelenségig. Mindig add
   meg a függőségi tömböt!
2. **Elmaradt takarítás.** `setInterval` / `addEventListener` takarítás nélkül a komponens
   eltűnése után is él tovább.
3. **`async` effekt.** `useEffect(async () => {...})` **hibás** — az effekt visszatérési értéke
   csak a takarító függvény lehet.
4. **Hidratálási hiba.** `new Date()` vagy `Math.random()` a `useState` kezdőértékében: a
   szerveren generált HTML nem egyezik a böngészőben renderelttel.
5. **Felesleges effekt.** Ha egy érték kiszámolható a meglévő állapotból (öltözködési tanács,
   kiválasztott város objektuma), akkor renderelés közben számold ki.
6. **`setState` az effekt törzsében.** A React figyelmeztet rá, és felesleges extra renderelést
   okoz. Az `await` **után** hívott setterek viszont rendben vannak.

## Bónusz (opcionális)

- **Automatikus frissítés:** egy kapcsolóval indíts egy 30 másodperces `setInterval`-t, ami
  növeli a `refreshCounter`-t. A függőségi tömbben a kapcsoló állapota szerepeljen — és ne
  felejtsd el a takarítást!
- **Utoljára frissítve:** írd ki, hogy mikor érkezett az adat (az `error` / `loading` mellé egy
  újabb állapot).
- **Versenyhelyzet (race condition):** ha gyorsan kattintgatsz a városok között, előfordulhat,
  hogy egy régebbi válasz érkezik meg utoljára. Védekezz ellene az effekt takarító
  függvényével: `let cancelled = false;` … `return () => { cancelled = true; };`, és csak akkor
  hívj `setState`-et, ha `!cancelled`.

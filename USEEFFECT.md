# A useEffect hook — tanulói segédlet

Indítás:

```
npm run dev
```

Majd nyisd meg: http://localhost:8080

## 1. Mi az a mellékhatás (side effect)?

Egy React komponens fő feladata, hogy a saját állapotából (`useState`) **kiszámolja a képernyő
tartalmát**. Ez tiszta számítás: ugyanaz az állapot mindig ugyanazt a JSX-et adja.

Minden más, ami "kihat a külvilágra", **mellékhatás**:

- időzítő indítása (`setInterval`, `setTimeout`)
- adatlekérés a szerverről (`fetch`)
- feliratkozás eseményre (`addEventListener`, WebSocket)
- a DOM közvetlen módosítása (pl. `document.title`)
- naplózás, `localStorage` írása

Ezeket **nem szabad renderelés közben** elindítani. Erre való a `useEffect`: a benne lévő kód
mindig **a renderelés után**, akkor fut le, amikor a képernyő már frissült.

## 2. A hook szerkezete

```
useEffect(() => {
  // 1. a mellékhatás kódja

  return () => {
    // 2. takarítás (cleanup) - takarító függvény - elhagyható
  };
}, [/* 3. függőségi tömb */]);
```

| Függőségi tömb | Mikor fut le az effekt?                                               |
| -------------- | --------------------------------------------------------------------- |
| nincs megadva  | **minden** renderelés után                                            |
| `[]`           | csak **egyszer**, a komponens megjelenésekor (mount)                  |
| `[a, b]`       | az első rendereléskor, majd valahányszor `a` vagy `b` értéke változik |

**Fontos:** az **első** renderelés után **minden** effekt lefut, a függőségi tömbtől függetlenül
— a React ilyenkor még nem tud mihez hasonlítani. A függőségi tömb csak azt szabályozza, hogy a
**további** renderelések után lefusson-e újra.

A React a függőségeket **referencia szerint** hasonlítja össze.

## 3. A takarító függvény (cleanup) — mikor fut le?

Az effektből visszaadott függvény **nem a `return` pillanatában** fut le: a React eltárolja, és
később hívja meg. Pontosan **két** alkalommal:

1. **Mielőtt ugyanaz az effekt újra lefutna.** Ha a függőségi tömbben változott valami, a React
   először lefuttatja az _előző_ futásból eltárolt takarítót, és csak utána indítja az új
   effektet.
2. **Amikor a komponens eltűnik** (unmount) — elnavigálunk az oldalról, vagy egy
   `{feltétel && <Komponens />}` feltétele hamisra vált. Ilyenkor már nem jön új effekt, csak a
   takarítás.

Az **első** renderelés után tehát **nincs** takarítás — nincs is mit takarítani. A sorrend
mindig „előbb az effekt, utána (később) a takarítás”:

```
mount        →  effekt
dep változik →  takarítás (az előző futásé)  →  effekt
dep változik →  takarítás (az előző futásé)  →  effekt
unmount      →  takarítás
```

Ebből következik, hogy **üres (`[]`) függőségi tömbnél a takarító csak unmountkor fut le** — egy
ilyen óra `setInterval`-ja a komponens teljes élettartama alatt végig ketyeg, ahogy kell (a
gyakorló feladat órája is ilyen lesz).

A demó órája szándékosan **nem** üres tömbös: a `[running]` függőség miatt a Stop gombra azonnal
lefut a takarítás, így a képernyőn is látszik, mikor és milyen sorrendben történik.

A takarító a **saját futásának** változóit látja (closure), nem a legfrissebbeket. Ezért működik
a versenyhelyzet elleni védekezés is: minden effekt-futás a maga `cancelled` változóját kapja meg.

```js
useEffect(() => {
  let cancelled = false;

  async function getData() {
    const response = await axios.get(url);
    if (!cancelled) setData(response.data); // csak ha ez a futás még "érvényes"
  }

  getData();

  return () => {
    cancelled = true; // az ÉPPEN LEZÁRULÓ futás cancelled változóját állítja
  };
}, [id]);
```

Ha gyorsan váltogatunk `id`-t, a régi futás takarítója `true`-ra állítja a saját `cancelled`-jét,
így a későn beérkező régi válasz már nem írja felül a képernyőt.

Innen látszik az is, **miért nem lehet az effekt maga `async`**: a React a visszatérési értéket
takarító függvényként tárolja el és hívja meg később, egy `async` függvény viszont mindig
`Promise`-t ad vissza — azt a React nem tudja mivel kezdeni.

> **Fejlesztés közben többször látod lefutni:** a Fast Refresh minden mentéskor újramountolja a
> komponenst, a Strict Mode pedig szándékosan kétszer futtatja az effektet
> (`effekt → takarítás → effekt`), hogy kibukjon a hiányzó takarítás. Lásd a 6. pontot.

## 4. A demó (`app/page.tsx`)

Öt effekt egyetlen oldalon, mindegyik más függőségi tömbbel:

| Effekt                         | Mikor fut le?                          | Mit mutat be?                                |
| ------------------------------ | -------------------------------------- | -------------------------------------------- |
| `useEffect(fn)`                | minden renderelés után (gépeléskor is) | mi történik függőségi tömb nélkül            |
| `useEffect(fn, [])`            | csak egyszer, betöltéskor              | egyszeri inicializálás                       |
| `useEffect(fn, [name, age])`   | ha a `name` **vagy** az `age` változik | több state figyelése egyszerre               |
| `useEffect(fn, [running])`     | a Start/Stop gomb minden megnyomásakor | `setInterval` + **takarító függvény**        |
| `useEffect(fn, [factCounter])` | betöltéskor és minden gombnyomás után  | adatlekérés axios-szal, betöltési állapottal |

A lefutásokat toast üzenetek jelzik, így a képernyőn is látszik, melyik effekt mikor futott le.

**Az órán ezt érdemes kipróbálni:** nyomd meg a Stop gombot — csak a 🧹 takarítás üzenet jelenik
meg, az óra megáll. Majd a Start gombot — csak az ⏱️ indulás üzenet jön. Ez pontosan a 3. pontban
leírt sorrend. Ha kikommentezed a `return () => { ... }` blokkot, a Stop után is tovább ketyeg az
óra, és minden újabb Start egy **újabb** időzítőt indít mellé — ez a legjobb bizonyíték arra, hogy
mire való a takarítás.

Az adatlekérés a [catfact.ninja](https://catfact.ninja/) publikus API-ját hívja (nem kell hozzá
kulcs, de **internet igen**). A `message` változót viszont szándékosan **renderelés közben**
számoljuk ki, nem effektben — erre való példa, hogy mikor **nem** kell `useEffect`.

### Miért fut le kétszer a renderelés egy „új tény” kérésekor?

Az „új tény kérése” gombra **két** „Oldal renderelve!” üzenet jelenik meg — ez nem hiba, és nem is
a Strict Mode (az ki van kapcsolva). Összesen **négy** `setState` hívás történik, ezekből viszont
csak **két** renderelés lesz:

| Renderelés | Mikor?                   | Mi történik?                                              |
| ---------- | ------------------------ | --------------------------------------------------------- |
| 1.         | a kattintás pillanatában | `setLoading(true)` + `setFactCounter(...)` az onClick-ben |
| 2.         | amikor megjön a válasz   | `setFact(...)` + `setLoading(false)` az `await` után      |

A React ugyanis **nem** rendereli újra az oldalt minden `setState` után: az egy „körben” történő
állapotváltozásokat összevonja (ez az _automatic batching_). Jól látszik ez a köztes képernyőn: a
`Betöltés...` felirat és a gomb megnövelt sorszáma **egyszerre** jelenik meg, tehát a kattintás két
`setState`-je egyetlen renderelés volt.

Két tanulság:

- **A renderelések száma nem egyenlő a `setState` hívások számával.** (React 18 előtt az `await`
  utáni két setState még nem vonódott össze — akkor ez három renderelés lett volna.)
- **Egy adatlekérés természetéből adódóan két renderelés:** egy a „most kezdődik, mutasd a
  töltésjelzőt”, egy a „megjött, mutasd az adatot” állapotra. Épp ettől működik a `Betöltés...`.

## 5. Gyakori hibák

1. **Végtelen ciklus.** Ha az effekt `setState`-et hív, és nincs függőségi tömbje, akkor az
   állapotváltozás újrarenderelést okoz, ami újra lefuttatja az effektet — a végtelenségig.
   (A demó első effektje ezért csak toastot jelenít meg, state-et nem ír!)
2. **Elmaradt takarítás.** Az időzítő vagy az eseményfigyelő a komponens eltűnése után is él
   tovább → memóriaszivárgás. Ilyenkor az effektből adj vissza egy takarító függvényt:
   `return () => clearInterval(id);` (lásd a demó óráját).
3. **`async` effekt.** `useEffect(async () => {...})` **hibás**, mert az effekt visszatérési
   értéke csak a cleanup függvény lehet, egy `async` függvény viszont Promise-t ad vissza.
   Helyette definiálj egy `async` függvényt az effekten **belül**, és hívd meg (mint a demóban),
   vagy használj `.then()` láncot.
4. **Hydration hiba.** Ne `new Date()` / `Math.random()` legyen a `useState` kezdőértéke: a
   szerveren generált HTML nem fog egyezni a böngészőben renderelttel. Az ilyen értéket az
   effektben állítsd be.
5. **Amire NEM kell useEffect.** Ha egy érték kiszámolható a meglévő állapotból, számold ki
   egyszerűen renderelés közben — ne állapotba mentsd effektből. Eseménykezelőbe (`onClick`)
   való kód se kerüljön effektbe.

## 6. React Strict Mode

A React fejlesztői módban alapértelmezetten **kétszer** futtatja le az effekteket
(effekt → cleanup → effekt), hogy kibukjanak a hiányzó takarítások. Ebben a demóban ezt a
`next.config.ts`-ben kikapcsoltuk (`reactStrictMode: false`), hogy minden toast pontosan
egyszer jelenjen meg, és az API-t se hívjuk feleslegesen kétszer. **Éles projektben hagyd
bekapcsolva!** Ha kíváncsi vagy a jelenségre, kommentezd ki azt a sort, és nézd meg újra az
üzeneteket.

## 7. Dokumentáció

- [useEffect – React dokumentáció](https://react.dev/reference/react/useEffect)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)

# Moje Stavba — hra

Izometrický stavitelský tycoon. Vanilla JS + Canvas, žádný build, žádné závislosti.
Nahraj celou složku na GitHub Pages a jede to.

## Soubory

| Soubor | Co dělá |
|---|---|
| `index.html` | kostra stránky, načítá skripty v pořadí |
| `style.css` | veškerý vzhled |
| `data.js` | konfigurace — suroviny, stavby, stanice, parcely, levely |
| `icons.js` | ikony surovin jako inline SVG |
| `state.js` | herní stav, ukládání, doběh času |
| `render.js` | izometrické vykreslování |
| `ui.js` | HUD, panely, oznámení, obrazovky |
| `main.js` | herní logika, ovládání, úkoly, smyčka |
| `sw.js`, `manifest.json` | PWA — offline běh a přidání na plochu |

## Oblasti

Otevírají se levelem a jsou zdarma. Platí se jen parcely a stavby.

| Oblast | LVL | Co v ní je |
|---|---|---|
| Domovský pozemek | 1 | 4 těžební stanice v rozích, 5 parcel |
| Průmyslová zóna | 20 | uhelný důl, elektrárna 3 × 3, pět chladicích věží |
| Sídliště | 24 | 6 parcel pro činžáky |
| Předměstí | 27 | 4 vily 3 × 3 a 2 parky |
| Obchodní zóna | 33 | obchodní centrum 4 × 4, 2 parkoviště, 4 stánky |
| Vodárna | 48 | vodojem 3 × 3 a dvě čerpací stanice |
| Lázeňská čtvrť | 52 | 4 hotely 3 × 3 |
| Železárny | 46 | železný důl, hutní závod, 2 haly |
| Lunapark | 58 | kolotoče, horská dráha, aquapark, stánky, parkoviště |
| Obchodní čtvrť | 64 | 2 mrakodrapy (20 fází), pasáž, parkovací dům |

## Zakázky

Hlavní zdroj peněz. Odemkne je **Stavební dvůr** — třetí stavba po skladu,
na parcele 3 od LVL 6 za 400 ¤.
Materiál se odevzdá hned, peníze přijdou po uplynutí času — a zakázka běží,
i když je hra zavřená.

| Typ | Doba | Násobek výkupní ceny |
|---|---|---|
| Rychlá | 45 s | 8× |
| Střední | 4 min | 12× |
| Velká | 15 min | 18× |

Odměna roste s levelem (`ORDER_TIERS` a `lvlMul` ve `state.js`). Nabídku jde
přehazovat, ale jen **třikrát za hodinu** — jedna výměna se doplní každých
20 minut a víc než tři se jich nenastřádá (`REROLL_MAX`, `REROLL_EVERY`).

Dvůr sám nevydělává — funguje jako sklad, je to jen přístup k zakázkám.
Jeho přístavby (LVL 12 a 22) přidávají další slot, takže můžeš mít
až tři zakázky naráz.

## Suroviny

| Stupeň | Suroviny | Odkud |
|---|---|---|
| Základní | dřevo, kámen, sláma, hlína, uhlí | těžební stanice |
| Zpracované | prkna, štěrk, cihly, balíky | stanice od LVL 2 |
| Ušlechtilé | trámy, dlažba, obklady, izolace | závody od LVL 4 |
| Ocelové | ruda, roxory, traverzy | železný důl a hutní závod (LVL 46) |

Všechno se vyrábí přímo ze základní suroviny, ušlechtilé jen dráž:

```
2× dřevo → prkno      4× dřevo → trám
2× kámen → štěrk      4× kámen → dlažba
2× hlína → cihla      4× hlína → obklad
2× sláma → balík      4× sláma → izolace
```

Recepty jsou v `RECIPE` v `data.js` — stačí přepsat, když budeš chtít
řetězení (`tram:{ prkno:2 }` místo `tram:{ drevo:4 }`).

Každý výrobek má **vlastní automat** — zapneš ho jen na to, co ti dochází,
nebo tlačítkem *Automat vše* na celou stanici. Automat doplní frontu
u toho výrobku, kterému došla, nezávisle na ostatních.

Stanice mají pět úrovní. Každá zvedne kapacitu, zrychlí těžbu i výrobu
a zvětší frontu (15 → 30 → 45 → 60 kusů). Výroba jednoho kusu klesá
z 9 s na 2,6 s. V záložce Výroba jde zapnout **automat**.

## Elektrická síť

Jedna elektrárna, do které přidáváš **turbíny**. Turbína ale potřebuje
chlazení — jedna chladicí věž uchladí dvě turbíny.

| | 1 turbína | 2 | 3 | 4 |
|---|---|---|---|---|
| Výkon | 50 MW | 110 | 190 | 300 |
| Palivo | 1 uhlí/18 s | 1/9 s | 1/6 s | 1/4,5 s |

Odběr: činžák 20 MW, vila 45 MW, obchodní centrum 160 MW. Vylepšení budovy
odběr zvyšuje. Když dojde uhlí, síť zhasne a budovy na proud nevydělávají.

## Elektřina — jedna elektrárna, dvě éry

Uhlí i jádro jsou jedna stavba na jednom místě. Turbíny zůstávají, mění se palivo.

| LVL | Krok | Výkon |
|---|---|---|
| 20 | Elektrárna, uhelný důl | 50 MW |
| 26 | Turbína 2 | 110 MW |
| 28 | Chladicí věž 2 | podmínka turbíny 3 |
| 31 | Turbína 3 | 190 MW |
| 34 | Chladicí věž 3 | podmínka přestavby |
| 36 | Turbína 4 | 300 MW — strop uhlí |
| 40 | Těžební kombinát | z uhlí vyrábí uran |
| 42 | Vodojem | voda pro věže i vylepšení |
| 44 | **Přestavba na jádro** | 700 MW, palivem uran |
| 48 | Chladicí věž 4 · 60 m³ | podmínka bloku 2 |
| 50 | Reaktor blok 2 · 80 m³ | 1 150 MW |
| 55 | Chladicí věž 5 · 90 m³ | podmínka bloku 3 |
| 56 | Reaktor blok 3 · 160 m³ | 1 900 MW |

Uran se **vyrábí z uhlí** v uhelném dole od LVL 4 (8× uhlí → 1 uran), stejně jako
prkna ze dřeva. Uhlí tak zůstává potřeba i po přestavbě.

Po přestavbě se elektrárna vizuálně změní — komíny zmizí, místo nich vyroste
reaktorová kupole a areál dostane výstražné pruhy.

### Když dojde výkon

Každou budovu na proud jde **odpojit od sítě**. Přestane vydělávat, ale uvolní
svoje MW i m³ vody. Díky tomu se nedá zaseknout ve stavu „nemám výkon na nic
nového". Tlačítko je v panelu budovy a hromadně v přehledu sítě (blesk nahoře).

Zpátky připojit jde jen tehdy, když je volný výkon i voda.

## Vodovodní síť### Když dojde výkon

Každou budovu na proud jde **odpojit od sítě**. Přestane vydělávat, ale uvolní
svoje MW i m³ vody. Díky tomu se nedá zaseknout ve stavu „nemám výkon na nic
nového". Tlačítko je v panelu budovy a hromadně v přehledu sítě (blesk nahoře).

Zpátky připojit jde jen tehdy, když je volný výkon i voda.

## Vodovodní síť

Druhá síť vedle elektřiny, ale **jen pro vylepšení** — nic, co už stojí,
se kvůli ní nezastaví.

| | Odběr vody |
|---|---|
| Chladicí věž 3 | 40 m³ |
| Vila LVL 2 / 3 | 30 / 50 m³ |
| Činžák LVL 3 | 25 m³ |
| Obchoďák LVL 2 / 3 | 80 / 120 m³ |
| Hotel LVL 1 / 2 / 3 | 60 / 90 / 140 m³ |

Vodojem dá 150 m³ a zvětší se na 320 a 600. Každá čerpací stanice přidá 120 m³.

Háček: **vodojem sám jede na proud** — základ bere 40 MW, největší 150 MW,
každá čerpací stanice dalších 30 MW. Chceš vodu → potřebuješ silnější
elektrárnu → chceš další turbínu → potřebuješ chladicí věž → ta chce vodu.

## Ukoly

Retez ukolu je v `main.js` jako tabulka `QUESTS` — 74 kroku od posekani travy
po paty blok reaktoru. Prochazi se shora dolu a aktivni je prvni nesplneny.
Kdyz hrac neco udela mimo poradi, krok se sam preskoci, takze se neda zaseknout.

Pridat krok = pridat radek do tabulky. Pomocne generatory:
`qLevel`, `qBuy`, `qBuild`, `qNode`, `qPlant`, `qPump`, `qPlat`.

## Rudny sklad

Ruda, roxory a traverzy se do bezneho skladu nevejdou — maji vlastni halu
na platforme Zelezarny (`IRON_STORE` v `data.js`). Ctyri urovne: 60 / 140 / 280 / 520 ks.
Bez ni se ruda neda ani sebrat.

## Obnovitelne zdroje

Platforma **Prehrada** (LVL 66) — reka, hraz a vetrny hreben.
Vetrniky 120 / 200 / 320 MW, vodni elektrarna 600 / 1000 / 1600 MW.

Nepotrebuji palivo: `renewMw()` se pricita k `plantMw()`, ale do `livePower()`
jde vzdy — takze kdyz elektrarne dojde uhli nebo uran, mesto bezi dal
na vitr a vodu. To je jejich hlavni vyhoda proti reaktoru.

## Poruchy

Kazdych 5 az 15 minut (`FAULT_MIN`/`FAULT_MAX` v `data.js`) se nahodne rozbije
jedna hotova stavba nebo stanice. Prestane fungovat — nevydelava, netezi,
nevyrabi, nebere ani nedava proud. Nad stavbou se objevi cerveny vykricnik
a prijde hlaska.

Nazev zavady sedi k typu stavby (`FAULTS`): v dole se rozbije rypadlo,
na pile se pretrhne pas, v cinzaku vypadne vytah. Ke kazdemu typu jsou
dve az tri varianty, celkem 88 hlasek.

Oprava se zaplati a teprve pak vyjedou hasici — stavba naskoci, az dojedou
(`REPAIR_DRIVE`, 8 s). Oprava stoji zhruba **deset minut toho, co stavba vydela** — od 200 ¤
u chatky po 52 000 ¤ u mrakodrapu. Poruchy zacinaji az od LVL 8.

## Zivot na mape

Nejde o simulaci dopravy, je to divadlo. `trafficWanted()` v `render.js`
spocita z postavenych staveb, kolik aut a chodcu ma byt videt (strop 12 aut
a 14 chodcu). Auta jedou po silnicich od kraje ke kraji, chodci se motaji
kolem obydli. Pri porue vyjede hasicske auto s majakem.

## Udalosti na mape

Kazde 2 az 5 minut (`EV_MIN`/`EV_MAX`) se objevi jedna z dvou udalosti.
Obe vzdycky ohlasi kartou pres obrazovku:

- **Ztraceny naklad** — bedna s otaznikem na volnem poli. Tuknutim ziskas
  material nebo penize (`cargoLoot()`), pocka minutu a pul.
- **Festival v lunaparku** — pet minut dvojnasobny najem vsech atrakci.
  Nahore svitni oranzovy pruh s odpoctem.

Zacinaji od LVL 6.

## Stare mesto a pristav

**Stare mesto** (LVL 69) — radnice, kostel, muzeum a mestanske domy
**nemaji zadny najem**. Maji pole `city`,
ktere se scita v `cityBoost()` a nasobi najem **vsech** staveb ve meste.
Na maximu je to +75 % — jedina mechanika, ktera zpetne zhodnoti
uz postavene budovy. Cela ctvrt je cista investice.

**Pristav** (LVL 76) — more, kam ustí reka z udoli.

| Lod | Plavby | Material |
|---|---|---|
| Nakladni | 30 / 60 / 90 min | ano, drahy |
| Vyletni | 20 / 40 / 60 min | zadny |

Plavba bezi, i kdyz je hra zavrena (`S.ships` ve `state.js`).
Cisla jsou v `PORT` v `data.js`.

## Statistiky

Pod logem → *Statistiky mesta*. Ctyri sekce: mesto, suroviny, vydelane penize,
staveni a udrzba. Data se sbiraji do `S.stats` pres `bump()` a `bumpRes()`
a ukladaji se s hrou.

## Automatizace a nadrazi

**Ridici centrum** (LVL 80) — tri stavby, ktere mesto obslouzi za hrace:

| Stavba | Zaklad | Maximum |
|---|---|---|
| Dispecink tezby | sveze suroviny co 60 s | co 15 s |
| Spravcovska firma | vybere najem co 120 s | co 30 s |
| Udrzbarska ceta | opravi poruchu za 2,0x cenu | za 1,3x |

**Nadrazi** (LVL 80) — hlavni nadrazi o sesti fazich. Nevydelava nic,
jen otevre vlevo dole tlacitko **SVET**, branu do horskeho kraje.

Obe platformy maji `soon:true` — zustavaji zamcene jako *pripravujeme*,
dokud nebude hotovy horsky kraj. Ukoly na ne se samy preskoci.

Retez konci trvalym ukolem **Vylepsuj prvni mesto**; dalsi ukoly budou
v horach.

## Doby staveb

Stavby trvají — velké opravdu dlouho a **urychlit je nejde**.

| Stavba | Fáze | Celkem |
|---|---|---|
| Chatka | 15 s × 5 | 1,3 min |
| Rodinný dům | 45 s × 6 | 4,5 min |
| Vila | 90 s × 6 | 9 min |
| Obchoďák, hotel | 150 s × 6 | 15 min |
| Aquapark | 150 s × 5 | 12,5 min |
| Mrakodrap | 180 s × 20 | 60 min |

Urychlování za peníze je záměrně pryč — vrátí se až jako prémiová měna.

## Vyvážení

Všechna čísla jsou v `data.js`: `LVL_STEP`, `BUILDINGS`, `ST_UP`, `MAKE_DUR`,
`PLANT`, `SKLAD_UP`, `PARC`, `PLATFORMS`.

## Testovací stavy

Soubor `dev.js` umí načíst rozehranou hru, ať se nemusí hrát od nuly.
Najdeš ho pod logem → *Načíst testovací stav*. Do ostré verze stačí smazat
řádek `<script src="dev.js">` v `index.html`.

## Aktualizace a uložená hra

Postup se ukládá do `localStorage` pod klíčem `mojestavba_hra_v3` a načte se
sám při spuštění. Zůstane i po nahrání nové verze na GitHub Pages — **pokud
se nezmění `S.ver` ve `state.js`**. Ta se zvedá jen tehdy, když se změní
datový model tak, že by starý postup nedával smysl; pak se stará hra zahodí
a začíná se znovu.

Service worker bere soubory **nejdřív ze sítě** a cache používá jen offline.
Po nahrání nové verze se tedy načte hned — stránka si sama všimne aktualizace
a jednou se překreslí. Není potřeba mazat aplikaci z plochy.

Aktuální verzi zjistíš ťuknutím na logo, je dole v panelu restartu.

## Běh na pozadí

Prohlížeč nedovolí webové stránce počítat, když je zavřená — to platí i pro
aplikaci přidanou na plochu. Hra proto ukládá časové razítko a po návratu
dopočítá, co se mezitím vytěžilo, vyrobilo a nastřádalo na nájmu, nejvýš za
12 hodin (`OFFLINE_MAX` ve `state.js`). Těžba se ale zastaví, jakmile se
stanice naplní — proto se vyplatí zvyšovat kapacitu.

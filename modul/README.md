# MODUL (ex-CHROMA · MUSICBOX)

Plateforme de l'écoute prouvée. Un fichier HTML par page, zéro dépendance, un serveur Node sans paquet.

```
modul/
├── index.html          MODUL — landing (le module, les gestes, la musique, le studio, les exports)
├── play/               MODUL — le jeu : un cube, un tempo, compose le morceau le plus long
│   ├── studio.html     MODUL Studio — le cube comme station de travail : faces = sections, rangées = instruments, pads à 3 niveaux, chef d'orchestre en français (règles, pas d'IA), lecture, MIDI, WAV
│   └── engine.js       moteur partagé (jeu + studio) : description du morceau, conduite des voix, rendu hors-ligne, export
│   └── samples/        vrais sons (CC0 : 808, kits Sonic Pi, percussions ; CC BY 3.0 : piano, basse, guitare, xylophone) — voir LICENSES.md
├── scene/              version « scène » : jouer sur un vrai titre d'artiste (+ chroma-analysis.js : tempo, premier temps, tonalité)
├── cote/               La Cote — classement par écoute prouvée (démo → réel dès qu'il y a des données)
├── studio/             Le Studio — régie partenaires (coût par piste jouée, inventaire réel si disponible)
├── assets/             CSS partagé, données de démonstration (étiquetées comme telles)
└── server/             API + statique : node modul/server/server.mjs  (Node ≥ 22.13, SQLite intégré)
```

## Lancer

```
node modul/server/server.mjs        # PORT=8090 HOST=0.0.0.0 MUSICBOX_DATA=modul/server/data
```

Sans serveur, les pages statiques fonctionnent aussi (La Cote et le Studio restent en mode démonstration).

## API

| Route | Rôle |
|---|---|
| `POST /api/tracks` | un morceau composé dans le jeu : nom, graine, BPM, tonalité, mesures, secondes, score, journal des tapes (≤ 4 000) — permet la réécoute exacte |
| `GET /api/tracks?limit=50` · `?id=` | Top 30 jours trié par mesures puis score ; détail avec journal pour réécouter |
| `POST /api/plays` | une piste jouée, envoyée par le jeu à la fin d'un niveau (titre, artiste, réussite, récolte, taps dans le tempo, minutes, région déclarée) |
| `POST /api/events` | `share` / `click` / `conversion` sur un titre |
| `GET /api/cote` | agrégats 30 j : classement (formule affichée dans la page), inventaire par région, totaux. `real:false` tant qu'il n'y a aucune donnée |
| `GET /api/health` | — |

Règles : un niveau abandonné avant 50 % ne compte pas ; identifiant joueur anonyme (code `ref` local) ; pas de cookie, pas d'IP stockée ; 60 écritures/min/IP.

## Tests

- `node` sur `scene/chroma-analysis.js` : 7 titres synthétiques 92–172 BPM, tempo ±0,02 %, premier temps ±10 ms.
- Simulation d'équilibrage : bot glouton ~100 % jusqu'au niveau 20, 76–93 % ensuite.

## MODUL Studio (`play/studio.html`)

Le studio n'ajoute pas d'interface de DAW : c'est le même cube que le jeu. Une face = une section (Intro, Couplet, Pré-refrain, Refrain, Pont, Final), une rangée = un instrument, un pad = éteint / présent / fort. L'arrangement (`arr`, 6 énergies par section) et les réglages (`over` : mode, tonalité, tempo) sont envoyés au moteur et stockés sur le serveur (colonne `studio`, exclue des classements). Un morceau joué s'ouvre dans le studio : ses énergies de jeu deviennent des pads (`arrangementFrom`).

Le « chef d'orchestre » est un analyseur de commandes en français **à base de règles** (instruments, sections, plus fort / moins fort / retire, N bpm, mineur / majeur, styles, « surprends-moi », « vide ») — pas un modèle de langage. L'interface est prête à en brancher un : une fonction `conductor(texte)` qui modifie `proj.pads` / `proj.over`.

## Pas encore réel

Attribution des conversions (partenaire billetterie / pré-save), hébergement des titres et licence, tableau de bord artiste, vérification du nom à l'INPI.

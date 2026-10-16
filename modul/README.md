# MODUL (ex-CHROMA · MUSICBOX)

Le studio est un cube. Un fichier HTML par page, une seule dépendance tierce (three.js, embarquée), un serveur Node sans paquet.

```
modul/
├── index.html          MODUL — landing (le module, les gestes, la musique, le studio, les exports)
├── play/               MODUL Studio — le cube comme station de travail : faces = sections, rangées = instruments, pads à 3 niveaux, chef d'orchestre en français (règles, pas d'IA), lecture, MIDI, WAV, bibliothèque, partage
│   ├── index.html      la page du studio (logique, transport, chef d'orchestre, bibliothèque)
│   ├── studio3d.js     la vue 3D du studio : cube manipulable (glisser, inertie, retombée sur la face), pads en relief, lueur
│   ├── vendor/         three.bundle.js = three.js r186 (MIT) + RoundedBoxGeometry, EffectComposer, RenderPass, UnrealBloomPass, OutputPass — bundle esbuild, seule dépendance tierce du projet
│   ├── engine.js       moteur : description du morceau, conduite des voix, rendu temps réel et hors-ligne, export MIDI/WAV
│   └── samples/        vrais sons (CC0 : 808, kits Sonic Pi, percussions ; CC BY 3.0 : piano, basse, guitare, xylophone) — voir LICENSES.md
├── scene/              version « scène » : jouer sur un vrai titre d'artiste (+ chroma-analysis.js : tempo, premier temps, tonalité)
├── cote/               La Cote — classement par écoute prouvée (démo → réel dès qu'il y a des données)
├── studio/             Le Studio — régie partenaires (coût par piste jouée, inventaire réel si disponible)
├── assets/             CSS partagé, données de démonstration (étiquetées comme telles)
├── VEILLE.md           analyse des générateurs de musique (Suno, Udio, Mubert, Soundraw, Beatoven, Endel…) et ce que MODUL en retient
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
| `POST /api/tracks` | un projet du studio partagé : nom, graine, BPM, tonalité, mesures, arrangement (`arr`), réglages (`over`), pads — permet la réécoute exacte par lien |
| `POST /api/conductor` | `{text,state}` → `{llm,actions,reply}` ; `{llm:false}` si aucun modèle n'est configuré |
| `GET /api/brief?url=` | titre, description, site, langue d'une page (brief depuis une URL) |
| `play/?use=<usage>&mood=<ambiance>[&sec=N][&embed=1]` | ouvre le studio directement sur un usage (`wedding`, `kids`, `yoga`, `jingle`…). `embed=1` = mode intégré au site : pas d'actions de fichier, un bouton « Écouter » |
| `GET /api/tracks?id=` | détail d'un projet partagé (ouvert par `play/?t=<id>`) ; `?limit=` liste les anciens morceaux de jeu s'il en reste |
| `POST /api/plays` | une piste jouée, envoyée par le jeu à la fin d'un niveau (titre, artiste, réussite, récolte, taps dans le tempo, minutes, région déclarée) |
| `POST /api/events` | `share` / `click` / `conversion` sur un titre |
| `GET /api/cote` | agrégats 30 j : classement (formule affichée dans la page), inventaire par région, totaux. `real:false` tant qu'il n'y a aucune donnée |
| `GET /api/health` | — |

### Modes : le moteur ne change pas, ce que les pads règlent si

| Usage | Mode | Faces | Pads (4 rangées × 4) | Panneau de sortie | Export |
|---|---|---|---|---|---|
| Chanson, jingle, pub, générique, film, berceuse, podcast, jeu, enfants | `music` | sections musicales | instruments (batterie / basse / accords / mélodie) | — | MIDI, WAV, stems |
| Mariage | `program` | moments avec heure et durée (Arrivée 16:00 · Dîner 2 h…) | **réglages du moment** : ambiance (élégant, festif, romantique, dansant) · invités · moments (discours, entrée, gâteau, surprise) · son (volume, tempo, chant, électro) | **Déroulé** : moments, en cours, temps restant | déroulé `.txt` + extrait musical |
| Concentration | `program` | mise en route · travail 25 · pause 5… | rythme · ambiance (café, pluie, bibliothèque, nuit) · pauses · son | Déroulé | `.txt` |
| Soirée · Lumière | `light` | portes · montée · climax · respiration · rappel · sortie | salle (chaud, froid, intensité, brume) · scène (face, contres, mouvants, poursuite) · effets (strobe, laser, blackout, UV) · son | **Scène** animée au tempo | feuille de cues `.csv` |
| Yoga, sport, méditation | `session` | phases de la séance | souffle (lent, profond, rétention…) · corps · esprit / coach · son | **Séance** : cercle de respiration (avec rétention), consigne, intensité | plan de séance `.txt` |

Hors musique, les pads ne sont donc plus des instruments : chaque réglage a un effet musical déclaré (`DOMAINS[*].pads[i].fx` : énergie par instrument, volume du moment, tempo, vote de style / mode). La musique du moment en découle ; le tempo, le style et le mode sont votés par l'ensemble des réglages, sauf si l'utilisateur les a fixés à la main (verrou). Chaque moment a un motif de 8 mesures bouclé pendant sa durée réelle ; les exports audio restent sur le motif. Le chef d'orchestre comprend les noms des moments et des réglages : « discours pendant le dîner », « la soirée plus festive », « sans enfants », « blackout au climax », « rétention au repos », « le dîner dure 2 h 30 », « commence à 18 h 30 ».


Règles : un niveau abandonné avant 50 % ne compte pas ; identifiant joueur anonyme (code `ref` local) ; pas de cookie, pas d'IP stockée ; 60 écritures/min/IP.

## Tests

- `node` sur `scene/chroma-analysis.js` : 7 titres synthétiques 92–172 BPM, tempo ±0,02 %, premier temps ±10 ms.
- Simulation d'équilibrage : bot glouton ~100 % jusqu'au niveau 20, 76–93 % ensuite.

## MODUL Studio (`play/`)

**Le brief d'abord.** À l'ouverture : « Que veux-tu créer ? » — 12 usages (jingle, publicité, générique, film, sport, yoga, méditation, berceuse, podcast, jeu vidéo, concentration, chanson) × 6 ambiances. Chaque usage pose une structure (`setForm`, de 4 à 68 mesures), un tempo, un mode, un style et un gabarit de pads ; une durée demandée (« 20 secondes ») étire ou resserre les sections. Voir `VEILLE.md` pour l'analyse des outils existants et ce qu'on en a retenu.

Le studio n'ajoute pas d'interface de DAW : tout est dans le cube. Une face = une section (Intro, Couplet, Pré-refrain, Refrain, Pont, Final), une rangée = un instrument, un pad = éteint / présent / fort. L'arrangement (`arr`, 6 énergies par section) et les réglages (`over` : mode, tonalité, tempo) sont envoyés au moteur et stockés sur le serveur (colonne `studio`, exclue des classements). Les anciens morceaux de jeu encore en local s'ouvrent aussi : leurs énergies deviennent des pads (`arrangementFrom`).

La vue est en vraie 3D (WebGL, three.js) : on attrape le cube au doigt ou à la souris, on le retourne, il retombe sur la face la plus proche ; un tap sur un pad l'allume. Sans WebGL, la page reste utilisable (chef d'orchestre, transport, exports). Pour régénérer le bundle : `npx esbuild entry.js --bundle --minify --format=esm --outfile=play/vendor/three.bundle.js` avec un `entry.js` qui ré-exporte `three` et les cinq addons listés ci-dessus.

**Sept styles** : Pop, House, Trap, Lo-fi, Cinéma (violons, violoncelle, harpe), Doux (piano feutré, harpe, flûte), Ambiant (nappes de cordes, souffle). **Exports** : MIDI 5 pistes, WAV normalisé (crête −1 dBFS), **stems** (ZIP : une piste WAV par instrument + mix + MIDI, sans dépendance). **Sans fin** (∞) : lecture infinie pour yoga, méditation, concentration. **Variantes** (« variante du refrain ») et **Annuler**. **Vidéo** : charger une vidéo cale la durée de la musique dessus, « Marquer » pendant la lecture pose les changements de section. **Brief depuis une URL** : coller un lien dans le brief, le serveur lit titre + description (`GET /api/brief?url=`) pour nommer et orienter le projet.

Le « chef d'orchestre » est un analyseur de commandes en français **à base de règles** (instruments, sections, plus fort / moins fort / retire, N bpm, mineur / majeur, styles, « surprends-moi », « vide ») — pas un modèle de langage. Un modèle de langage se branche sans toucher au client : `MODUL_LLM_URL` (API compatible OpenAI chat/completions), `MODUL_LLM_KEY`, `MODUL_LLM_MODEL` sur le serveur → `POST /api/conductor` renvoie des actions JSON (`use`, `seconds`, `bpm`, `mode`, `root`, `style`, `pads`, `variant`, `clear`, `undo`, `loop`) que le studio applique (`applyActions`). Sans clé, le serveur répond `{llm:false}` et les règles prennent le relais.

## Retiré

Le mode jeu (ondes du chef d'orchestre, points, combo, module du jour, classement) a été retiré au profit du studio — dernière version dans l'historique git : `play/index.html` au commit `c5a960e`.

## Pas encore réel

Attribution des conversions (partenaire billetterie / pré-save), hébergement des titres et licence, tableau de bord artiste, vérification du nom à l'INPI.

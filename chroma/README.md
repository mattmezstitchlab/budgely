# MUSICBOX · CHROMA

Plateforme de l'écoute prouvée. Un fichier HTML par page, zéro dépendance, un serveur Node sans paquet.

```
chroma/
├── index.html          MUSICBOX — landing (principe, mécanique, plateforme, artistes, économie, FAQ)
├── play/               CHROMA — le jeu (+ chroma-analysis.js : tempo, premier temps, tonalité)
├── cote/               La Cote — classement par écoute prouvée (démo → réel dès qu'il y a des données)
├── studio/             Le Studio — régie partenaires (coût par piste jouée, inventaire réel si disponible)
├── assets/             CSS partagé, données de démonstration (étiquetées comme telles)
└── server/             API + statique : node chroma/server/server.mjs  (Node ≥ 22.13, SQLite intégré)
```

## Lancer

```
node chroma/server/server.mjs        # PORT=8090 HOST=0.0.0.0 MUSICBOX_DATA=chroma/server/data
```

Sans serveur, les pages statiques fonctionnent aussi (La Cote et le Studio restent en mode démonstration).

## API

| Route | Rôle |
|---|---|
| `POST /api/plays` | une piste jouée, envoyée par le jeu à la fin d'un niveau (titre, artiste, réussite, récolte, taps dans le tempo, minutes, région déclarée) |
| `POST /api/events` | `share` / `click` / `conversion` sur un titre |
| `GET /api/cote` | agrégats 30 j : classement (formule affichée dans la page), inventaire par région, totaux. `real:false` tant qu'il n'y a aucune donnée |
| `GET /api/health` | — |

Règles : un niveau abandonné avant 50 % ne compte pas ; identifiant joueur anonyme (code `ref` local) ; pas de cookie, pas d'IP stockée ; 60 écritures/min/IP.

## Tests

- `node` sur `play/chroma-analysis.js` : 7 titres synthétiques 92–172 BPM, tempo ±0,02 %, premier temps ±10 ms.
- Simulation d'équilibrage : bot glouton ~100 % jusqu'au niveau 20, 76–93 % ensuite.

## Pas encore réel

Attribution des conversions (partenaire billetterie / pré-save), hébergement des titres et licence, tableau de bord artiste, vérification du nom à l'INPI.

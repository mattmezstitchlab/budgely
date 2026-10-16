# Veille — générateurs de musique dans le monde (octobre 2026) et ce que MODUL en retient

Objectif : faire de MODUL « le Lovable / Manus de la musique » — on décrit ce qu'on veut (un jingle, un générique, une berceuse), on obtient un morceau, on l'ajuste dans **un seul studio**, plus simple que Suno. Ce document liste ce qui existe, ce qui marche, et ce qu'on a intégré ou pas.

## 1. Les grandes familles

| Famille | Qui | Ce qu'ils font de fort | Limite pour le grand public |
|---|---|---|---|
| **Générateurs de chansons** | Suno (v5.5, Studio 1.2), Udio (Sessions), ElevenLabs Music, Mureka, MusicWave | Voix réalistes, chanson complète en < 60 s, stems, extend, cover | Prompt libre = page blanche ; le Studio de Suno est un DAW à part entière (desktop seulement, 768 px mini, abonnement Premier) |
| **Musique par usage** | Mubert, Soundraw, Beatoven.ai, Soundful, Loudly, AIVA | Préréglages par activité (workout, focus, relax), longueur ajustable après coup, humeur par section, scoring de vidéo | Catalogue de « beds » interchangeables, peu de contrôle musical, licences par paliers |
| **Musique fonctionnelle** | Endel, Brain.fm | Paysages sonores infinis, personnalisés (heure, météo, rythme cardiaque), modes sommeil / focus / relax | Ce n'est plus vraiment de la musique ; monotone au bout de 2–3 h |
| **Jingles & pubs** | Jingle Maker (ElevenLabs), Lyro Song Ad, Melodio, Musely | Partent d'un site web ou d'un slogan et chantent une pub de 60–100 s | Mono-usage |

Sources : guide Suno Studio 2026 (slstudio.pro), mise à jour Studio février 2026 (mystats.music), revue Suno (eesel.ai), comparatifs 2026 (musicwave.ai, wavespeed.ai, gudz.ai, musci.io, somio.ai), lyromusic.com sur les jingles, endel.io/science, comparatif Endel / Brain.fm (innercalmguide.com, omix.app).

## 2. Les innovations relevées, une par une

| Innovation | Vue chez | Dans MODUL ? |
|---|---|---|
| **Préréglages par usage** (workout, focus, relax ; intro de podcast ; pub) | Mubert, Soundraw, Beatoven | **Oui** — écran « Que veux-tu créer ? » : 12 usages (jingle, pub, générique, film, sport, yoga, méditation, berceuse, podcast, jeu vidéo, concentration, chanson) qui posent structure, tempo, mode, style et pads |
| **Humeur / émotion** (16 tags chez Beatoven, humeur par section) | Beatoven, Soundraw | **Oui, simplifié** — 6 ambiances (énergique, calme, lumineux, sombre, épique, chaleureux) qui modifient tempo, mode, gabarit de pads ; par section = les faces du cube |
| **Longueur ajustable après génération** | Soundraw, Beatoven | **Oui** — « 20 secondes », « 2 minutes » : la structure s'étire ou se resserre section par section |
| **Prompt en langage naturel qui pilote l'édition** (« change this to a string section ») | Suno Studio (stem swapping), Udio | **Oui** — règles en local + prise pour un modèle de langage côté serveur (`/api/conductor`, actions JSON) ; sans clé, les règles suffisent pour usage, durée, ambiance, instruments, sections, tempo, tonalité, variantes |
| **Timeline / sections éditables, inpainting d'une section** | Suno Studio, Udio Sessions, Mureka Region Editing | **Oui, autrement** — pas de timeline : une face = une section ; on retouche le refrain sans toucher au couplet |
| **Stems / pistes séparées, EQ par piste** | Suno Studio 1.2, Udio | **Oui** — « Exporter les stems » : ZIP avec un WAV par instrument + mix + MIDI ; pas d'EQ par piste (les trois niveaux de pads en tiennent lieu) |
| **Export MIDI** (rare : AIVA, Suno à 10 crédits) | AIVA, Suno | **Oui, gratuit** — MIDI 5 pistes avec tempo et armure, WAV 44,1 kHz |
| **Personas (voix constante)** | Suno | Non — MODUL n'a pas de chant, seulement une voix-texture ; hors périmètre volontaire (licence, poids) |
| **Génération temps réel qui réagit au contexte** (heure, cœur) | Endel, Lyria RealTime | **Oui, sans capteurs** — mode ∞ sans fin (activé d'office pour yoga, méditation, concentration), changements appliqués à la mesure suivante |
| **Scoring de vidéo** (la musique suit le montage) | Beatoven | **Oui** — « Caler sur une vidéo… » : la durée fixe la structure, « Marquer » pendant la lecture pose les changements de section, la vidéo joue en synchro |
| **Partir d'un site ou d'un slogan** | Jingle Maker, Lyro | **Oui** — coller une URL dans le brief : le serveur lit titre + description, nomme le projet et passe le texte au chef d'orchestre |
| **Alternates** (variantes d'une section) | Suno Studio 1.2 | **Oui** — « variante du refrain » : les piliers restent (kick, basse, accord), le reste est retiré ; « annule » revient en arrière |
| **Licences claires** | ElevenLabs (Merlin, Kobalt), AIVA Pro | **Oui par construction** — sons CC0 / CC BY crédités, moteur maison, pas d'entraînement sur des œuvres |
| **Gratuit avec téléchargement** | Google Flow Music | **Oui** — tout est local, pas de crédits |

## 3. Ce que MODUL fait que les autres ne font pas

1. **Un seul objet.** Pas de Home / Create / Studio / Library : le cube est la timeline, les pistes, le mixeur et le brief. Suno a quatre écrans et un DAW desktop ; MODUL tient dans une main.
2. **La transparence musicale.** Tonalité, progression en chiffrage romain, structure mesurée : on voit ce qu'on entend, et ça sort en MIDI. Les générateurs audio neuronaux ne peuvent pas le montrer, ils n'ont pas de partition.
3. **Le temps réel.** On change un pad pendant la lecture, ça change à la mesure suivante. Pas de file d'attente, pas de crédits, pas de 60 secondes d'attente.
4. **Inclusif.** Pas de mot technique obligatoire : « un jingle de 10 secondes, lumineux » suffit ; les pads ont trois états et ne peuvent pas jouer faux.

## 4. État (16 octobre 2026)

Fait : trois styles acoustiques de plus (Cinéma, Doux, Ambiant — violon, violoncelle, harpe, flûte, CC BY 3.0), normalisation de sortie, stems ZIP, variantes + annuler, mode sans fin, calage vidéo, brief depuis une URL, prise pour un modèle de langage côté serveur.

Reste, honnêtement :
1. **Le son** reste celui d'un moteur à échantillons : propre, juste, mais sans l'épaisseur d'un rendu neuronal. Prochain pas : plus de notes par instrument (aujourd'hui 4–5 par banque), des articulations (pizzicato, trémolo), un piano feutré enregistré plutôt qu'un filtre.
2. **Le modèle de langage** n'est pas fourni : il faut une clé (`MODUL_LLM_URL`, `MODUL_LLM_KEY`). Sans lui, les formulations très libres tombent sur les règles.
3. **Le brief depuis une URL** dépend de l'accès internet du serveur (bloqué dans l'environnement de développement actuel — testé seulement en erreur propre).
4. Pas de chant, pas de paroles : choix assumé (licence, poids, crédibilité).

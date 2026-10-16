# CHROMA — audit rapide (octobre 2026) : ce que font les jeux de rythme et de création musicale, et ce qu'on en a pris

## Jeux de rythme (DDR, osu!, Beatstar, Cytus, World Dai Star…)
- **Jugements à paliers** (Perfect / Great / Good / Miss) avec fenêtres en millisecondes ; les jeux mobiles grand public tournent autour de ±25–40 ms pour le Perfect et ±100 ms pour le dernier palier qui ne casse pas le combo.
  → CHROMA : **Parfait ±45 ms, Bien ±100 ms**, au-delà « Tôt / Tard · hors temps ». Affiché à chaque tape avec l'instrument joué.
- **Calibrage de latence** : tous les jeux sérieux proposent un offset audio/entrée ; sans ça, un joueur « toujours en retard » croit être mauvais.
  → CHROMA : écran **Calibrer** (8 tapes sur un clic, médiane mémorisée, appliquée aux jugements) + `outputLatency` du navigateur.
- **Combo fragile, précision durable** : le combo motive, la précision reflète le contrôle.
  → CHROMA : combo ×1…×8 remis à 1 hors temps, **précision %** sur la fiche du morceau.
- **Première partie trop dure = abandon** ; **effets qui masquent la zone de jeu = erreur classique**.
  → CHROMA : palette 4 couleurs puis 5 (mesure 20) et 6 (mesure 44) ; bandeau de section et jugement **sur** le plateau mais translucides et 1,5 s max ; aucun effet permanent.

## Création musicale par le jeu (Incredibox / Sprunki, Beatstar, Suno)
- Incredibox : **une icône = une boucle**, tout est toujours juste et en place, le plaisir vient de l'empilement ; des « combos » cachés récompensent certaines associations ; la sortie est **enregistrable et partageable**.
  → CHROMA : une couleur = un instrument, toujours dans l'accord ; le « combo caché » est la **section réussie** (les bons instruments au bon moment) ; chaque partie devient un morceau **rejouable à l'identique** et classé.
- Ce qui n'existe pas encore ailleurs, et que CHROMA fait : **la durée du morceau est le score**, la structure (intro → couplet → pré-refrain → refrain → pont → final) est imposée par le jeu, et les vrais instruments entrent **parce que tu tapes en rythme**.
- Suno-like « tous les sons et stems à disposition » : impossible à faire tourner dans un navigateur sans serveur GPU, et les licences des sorties IA sont floues. Choix fait : **banques de vrais instruments enregistrés, libres** (CC0 / CC BY) + synthèse pour ce qui manque, un **style** choisi avant de jouer (Pop, House, Trap, Lo-fi) qui change tempo, kit, voix, swing et motifs.

## Pistes suivantes, par ordre de rendement
1. Deux styles de plus (Afro/amapiano, Synthwave) : c'est 30 lignes de paramètres chacun.
2. « Défi du jour » : même graine pour tout le monde, classement du jour — le levier Wordle.
3. Partage d'un lien de réécoute (`play/?t=<id>`) avec pochette, pour que le morceau sorte du jeu.
4. Mode « deux doigts » (taper deux groupes dans la même mesure) pour les joueurs avancés, au lieu d'ajouter des couleurs.
5. Export audio du morceau (rendu hors-ligne via OfflineAudioContext) : WAV téléchargeable.

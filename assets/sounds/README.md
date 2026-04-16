# GymLevel — Audio Assets

Drop the following MP3 files in this folder. They are referenced by name in
`services/SoundService.ts` (constant `SOUND_FILES`).

| Event id            | Filename                       | Trigger                              |
| ------------------- | ------------------------------ | ------------------------------------ |
| `LEVEL_UP`          | `Palier_Atteint.mp3`           | Player level-up or muscle rank-up    |
| `ARISE_EXTRACTION`  | `Extrayez_l_Essence.mp3`       | "Extraire l'Ombre" button click      |
| `DUNGEON_START`     | `Le_Contrat_de_Fer.mp3`        | A workout session starts             |
| `THEME_AMBIENT`     | `Le_Regne_du_Monarque.mp3`     | Looping ambient on the Profile page  |
| `EVOLUTION_THEME`   | `Le_Monarque_s_eveille.mp3`    | Class evolution (Second Éveil)       |
| `IMPACT_METAL`      | `Impact_Metal.mp3` (optional)  | Each set logged → World Boss damage  |
| `CLICK_NEON`        | `Click_Neon.mp3` (optional)    | Tab change feedback                  |

The files are copied as-is into `dist/assets/sounds/` by `npm run deploy`,
which runs `cp -r public/* dist/` after `expo export`. On GitHub Pages they
resolve to `/GymLevel/assets/sounds/<file>.mp3`.

If a file is missing the SoundService silently falls back to the synthetic
WebAudio click for `CLICK_NEON` and `IMPACT_METAL`, and skips playback for
the others. The UI never breaks.

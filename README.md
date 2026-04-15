# GymLevel

Application mobile de fitness gamifiée (RPG) — React Native · Expo · TypeScript · Zustand.

> **État actuel** : architecture et logique métier (pas d'UI). Branche de développement : `claude/fitness-rpg-app-architecture-YqTVA`.

## Stack

| Couche              | Technologie                                    |
| ------------------- | ---------------------------------------------- |
| Framework           | React Native 0.74 + Expo 51 (TypeScript strict)|
| Routing             | `expo-router` (typed routes)                   |
| Gestion d'état      | Zustand + persist (AsyncStorage)               |
| Base de données     | `expo-sqlite` (mirror prévu via services/db)   |
| Styling (à venir)   | NativeWind                                     |

## Arborescence

```
GymLevel/
├── app/                        # Écrans Expo Router (UI — à venir)
├── components/                 # Composants UI (à venir)
├── store/
│   └── useAppStore.ts          # Store Zustand unique — orchestre tout
├── services/
│   ├── gamificationService.ts  # Volume -> XP, level curves
│   ├── recoveryService.ts      # Mode Survie & statuts musculaires
│   ├── questService.ts         # Génération + suivi des quêtes
│   ├── workoutService.ts       # Lifecycle sessions & templates
│   └── database/               # Couche SQLite (à venir)
├── data/
│   ├── muscleGroups.ts         # Les 17 groupes musculaires
│   ├── exercises.ts            # Librairie d'exercices + activation musculaire
│   ├── playerClasses.ts        # Classes RPG (Novice / Tank / Assassin / Berserker / Ranger)
│   └── workoutTemplates.ts     # Routines pré-construites
├── constants/
│   └── gamification.ts         # Tous les nombres magiques du RPG
├── types/
│   └── index.ts                # TOUTES les interfaces TS
├── hooks/                      # Hooks réutilisables (à venir)
└── assets/
```

## Modèles de données (résumé)

Voir `types/index.ts`. Entités principales :
- `MuscleGroup` / `MuscleGroupStats` (17 muscles, statut `frais | actif | fatigue | epuise`)
- `Exercise` + `MuscleInvolvement[]` (routage XP pondéré)
- `WorkoutSet`, `WorkoutExercise`, `WorkoutSession`
- `WorkoutTemplate` (built-in ou clonés)
- `Quest` (quotidiennes)
- `UserProfile` (XP global + 17 barres muscle + streaks)

## Mécaniques RPG implémentées

1. **Formule XP** — `XP = volume × setModifier × exerciseMult × classMult` puis routage pondéré par muscle (× statusMod) via `Exercise.muscleInvolvement`.
2. **Courbe de niveau** — `xpRequired(n) = 100 · n^1.5`, cap à 99.
3. **Classes RPG (Chasseur)** — 5 classes aux bonus data-driven :
   - **Novice** — aucun bonus (par défaut).
   - **Tank** 🛡️ — +30 % sur composés lourds (≤5 reps, ≥1× BW), +10 % sur tout composé.
   - **Assassin** 🗡️ — +35 % sur exercices au poids du corps, +15 % sur séries 20+ reps.
   - **Berserker** 🔥 — +30 % sur isolations en hypertrophie (8-15 reps).
   - **Ranger** 🏹 — +30 % HIIT, +20 % cardio, +15 % endurance (25+ reps).
   Les bonus d'une classe stackent multiplicativement lorsqu'ils matchent tous, avec un plafond global `MAX_CLASS_MULTIPLIER = 1.5` pour éviter l'inflation d'XP.
4. **Mode Survie (Déconditionnement)** — après 7j d'inactivité, perte de 2 % d'XP/jour (cap 50 %), vérifié au lancement avec cooldown de 12 h.
5. **Statut Épuisé** — dépasser un seuil de volume 24h fait passer un muscle en `epuise` → XP × 0.5 jusqu'au lendemain.
6. **Quêtes quotidiennes** — 3 quêtes générées par tranche de difficulté (easy/medium/hard), expirent à 04:00 locale.
7. **Streaks** — bonus XP de 25/jour jusqu'à 14 jours consécutifs.
8. **Bodyweight personnalisé** — `UserPreferences.bodyweightKg` (nullable). Utilisé comme poids effectif pour les exercices au poids du corps et comme référence du ratio Tank.
9. **Gate d'onboarding** — `needsOnboarding: true` tant que `bodyweightKg` est `null`. `initializeApp()` court-circuite et `addSet` refuse de logger tant que la valeur n'est pas renseignée (écran "Évaluation du Système").

## Prochaine étape

Une fois les modèles validés :
- Couche SQLite (`services/database/`) pour remplacer la persistance AsyncStorage.
- UI Expo Router (`app/`) — écrans Tracker, Profile, Quests, Templates, BodyMap.

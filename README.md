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

1. **Formule XP** — `XP = volume × multiplicateurs` puis routage pondéré par muscle via `Exercise.muscleInvolvement`.
2. **Courbe de niveau** — `xpRequired(n) = 100 · n^1.5`, cap à 99.
3. **Mode Survie (Déconditionnement)** — après 7j d'inactivité, perte de 2 % d'XP/jour (cap 50 %), vérifié au lancement avec cooldown de 12 h.
4. **Statut Épuisé** — dépasser un seuil de volume 24h fait passer un muscle en `epuise` → XP × 0.5 jusqu'au lendemain.
5. **Quêtes quotidiennes** — 3 quêtes générées par tranche de difficulté (easy/medium/hard), expirent à 04:00 locale.
6. **Streaks** — bonus XP de 25/jour jusqu'à 14 jours consécutifs.

## Prochaine étape

Une fois les modèles validés :
- Couche SQLite (`services/database/`) pour remplacer la persistance AsyncStorage.
- UI Expo Router (`app/`) — écrans Tracker, Profile, Quests, Templates, BodyMap.

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
│   ├── playerClasses.ts        # Classes RPG Solo Leveling (7 classes)
│   ├── equipment.ts            # Loot — templates d'items + pool par rareté
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
3. **Classes RPG (Chasseur, univers Solo Leveling)** — 7 classes aux bonus data-driven :
   - **Novice** 🌱 — aucun bonus (classe de départ).
   - **Fighter** 🥊 — +25 % hypertrophie (8-12 reps), +15 % haltères.
   - **Tanker** 🛡️ — +30 % force pure (compound 1-5 reps), +10 % tout composé.
   - **Assassin** 🗡️ — +35 % exercices au poids du corps, +10 % séries 20+ reps.
   - **Ranger** 🏹 — +30 % HIIT, +20 % cardio, +15 % endurance (15+ reps).
   - **Mage** 🧙 — +30 % isolation sur machine ou poulie, +10 % tout exercice à la poulie.
   - **Healer** ⛑️ — +30 % exercices core, +15 % passif dès 3 jours de streak.

   Les bonus stackent multiplicativement lorsqu'ils matchent tous, avec un plafond global `MAX_CLASS_MULTIPLIER = 1.5` pour éviter l'inflation d'XP. Les conditions supportent la composition logique via `all_of` et peuvent lire le streak courant via `streak_active`.
4. **Mode Survie (Déconditionnement)** — après 7j d'inactivité, perte de 2 % d'XP/jour (cap 50 %), vérifié au lancement avec cooldown de 12 h.
5. **Statut Épuisé** — dépasser un seuil de volume 24h fait passer un muscle en `epuise` → XP × 0.5 jusqu'au lendemain.
6. **Quêtes quotidiennes** — 3 quêtes générées par tranche de difficulté (easy/medium/hard), expirent à 04:00 locale.
7. **Streaks** — bonus XP de 25/jour jusqu'à 14 jours consécutifs.
8. **Bodyweight personnalisé** — `UserPreferences.bodyweightKg` (nullable). Utilisé comme poids effectif pour les exercices au poids du corps et comme référence du ratio Tank.
9. **Gate d'onboarding** — `needsOnboarding: true` tant que `bodyweightKg` est `null`. `initializeApp()` court-circuite et `addSet` refuse de logger tant que la valeur n'est pas renseignée (écran "Évaluation du Système").
10. **Équipement (Loot)** — 4 slots (tête / corps / arme / accessoire), 4 raretés (Commun / Rare / Épique / Légendaire). Les items embarquent un tableau `ClassBonus[]` évalué par le même moteur que les classes. `equipmentMult` stacke multiplicativement, plafonné par `MAX_EQUIPMENT_MULTIPLIER = 1.3`. Les quêtes droppent du loot selon leur difficulté (medium→Commun, hard→Rare, epic→Épique) via `rollLootFromQuest`. Actions du store : `equipItem(itemId)`, `unequipItem(slot)`, `dismissLootDrop()`.

## Prochaine étape

Une fois les modèles validés :
- Couche SQLite (`services/database/`) pour remplacer la persistance AsyncStorage.
- UI Expo Router (`app/`) — écrans Tracker, Profile, Quests, Templates, BodyMap.

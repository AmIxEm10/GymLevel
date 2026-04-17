# GDD — GymLevel : Le Système d'Éveil

Document extrait du repository SDK 51 (branche `migration/sdk-54`, snapshot juste avant refonte). Il cristallise l'intégralité des mécaniques implémentées pour servir de spec à la reconstruction propre en Expo SDK 54.

---

## 1. PITCH ET VISION

**Tagline** : "Levez-vous." — l'appli fitness qui transforme l'entraînement en quête de Rang S.

**Univers** : inspiration directe de *Solo Leveling*. "Le Système" interpelle le Chasseur (utilisateur), lui adresse des messages narratifs (mailbox), le fait évoluer de Rang E (Éveillé récent) à Rang S (Monarque).

**Ton** : froid, clinique, ominous. Les notifications ressemblent à des ordres du Système. Aucune gamification enfantine, aucun emoji enfantin. Palette nocturne, bordures acier, néons cyan/violet.

**Ce que l'app FAIT** :
- Tracker de séances de musculation (sets, reps, poids, RPE, dropsets, warm-ups, failure).
- Moteur d'XP par muscle (17 groupes discrets) avec tiers Fer → Légende par muscle.
- Système de classe RPG (7 archétypes × 4 stages d'évolution) avec bonus XP conditionnels par set.
- Loot d'équipement et consommables à la fin de chaque "donjon" (séance).
- Quêtes quotidiennes (3/jour, reset 4h), quêtes secrètes (20), défis long-terme (3).
- Silhouette musculaire avec fatigue passive linéaire (2%/h, Healer à 4%/h).
- Mode Survie : déconditionnement si pas entraîné pendant >7 jours.
- Anti-cheat heuristique : détection de cadence implausible, jump PR >25%.

**Ce que l'app NE FAIT PAS** :
- Pas de tracker nutrition / calories.
- Pas de social / feed / amis (hormis leaderboard mondial simulé).
- Pas de programmes prescrits par un coach IA — l'utilisateur pilote.
- Pas de paywall actuellement.

---

## 2. PERSONA UTILISATEUR

**Le Chasseur** : pratiquant de salle (débutant à avancé), attiré par la gamification RPG, fan de l'esthétique Solo Leveling / dark fantasy, cherche une raison *narrative* de s'entraîner régulièrement.

**Motivations** :
- Progresser en rang (E→S), débloquer des titres.
- Voir sa silhouette "bleuir" (muscles frais prêts au combat).
- Chasser le loot Légendaire (gated à L40).
- Battre ses PR (Epley 1RM) pour voir les chiffres monter.

**Frictions évitées** :
- Onboarding court (4 steps : Identifiant / Morphologie / Classe / Pacte).
- Pas de publicité. Pas de timer passif-agressif. Pas de quête ratée (quêtes expirent silencieusement).
- Validation de sécurité : si un PR saute de +25%, il est marqué `pendingValidation` sans crier.

---

## 3. MÉCANIQUES CORE

### 3.1 Classes (7 archétypes)

| Id        | Nom      | Couleur  | Tagline                                     | Bonus signature                                                                 | Passifs                           |
|-----------|----------|----------|---------------------------------------------|--------------------------------------------------------------------------------|-----------------------------------|
| novice    | Novice   | #94A3B8  | Le Système t'évalue…                        | aucun                                                                          | —                                 |
| guerrier  | Guerrier | #EF4444  | Brise les barres.                           | +30% compound 1-5 reps · +15% compound ≥1×BW · +10% tout compound              | —                                 |
| assassin  | Assassin | #8B5CF6  | Ton corps est l'arme ultime.                | +35% bodyweight · +15% séries 20+ reps                                         | —                                 |
| tank      | Tank     | #F97316  | Chair contre le fer.                        | +30% 8-12 reps · +15% haltères · +10% isolations 8+ reps                        | —                                 |
| ranger    | Ranger   | #10B981  | Le souffle du loup, la foulée infinie.       | +25% 15+ reps · +20% HIIT · +15% cardio                                        | —                                 |
| mage      | Mage     | #A855F7  | La précision prime sur la force.            | +30% isolation machine/cable · +10% tout cable                                 | lootLuck 1.5× · rarityUpgradeChance 30% |
| healer    | Healer   | #22D3A4  | La régularité est ton pouvoir.              | +30% core · +15% tout set si streak ≥3 jours                                   | recoveryRate 0.04/h (2× normal)   |

**Stacking** : les bonuses d'une même classe multiplient multiplicativement. Produit clampé par `MAX_CLASS_MULTIPLIER = 1.5`.

### 3.2 Évolution de Classe (lineage ladder)

- **Stages** : 0 (base) → 1 (L30) → 2 (L60) → 3 (L90).
- **Cross-classing interdit** : on évolue DANS sa lignée.
- **Bonus passif** : `evolutionBonus(stage) = 1 + stage × 0.05`. Stage 3 = +15%.

Chaîne de noms (source `data/classEvolution.ts`) :
- novice → Éclaireur → Pionnier → Transcendant
- guerrier → Gladiateur → Berserker → Seigneur de Guerre
- assassin → Silencieux → Maître des Ombres → Monarque du Vide
- tank → Juggernaut → Forteresse Vivante → Indestructible
- ranger → Traqueur → Éclaireur Fantôme → Maître du Vent
- mage → Archimage → Suprématie Arcane → Éveillé de la Réalité
- healer → Prêtre → Saint de la Vitalité → Porteur de Vie

Chaque évolution déclenche un `SystemMessage` de tone `evolution` avec le flavor text associé.

### 3.3 Rangs E → S (global)

```ts
computeRank(level) :
  level >= 61  → S
  level >= 36  → A
  level >= 21  → B
  level >= 11  → C
  level >=  6  → D
  sinon        → E
```

Couleurs (data/ranks.ts) :
- E #64748B "Éveillé récent"
- D #22C55E "Chasseur confirmé"
- C #22D3EE "Traqueur d'ombres"
- B #A855F7 "Lame des Abysses"
- A #F97316 "Élite du Système"
- S #FBBF24 "Monarque"

### 3.4 Formule d'XP

**Constantes** (`constants/gamification.ts`) :
```
BASE_XP_PER_LEVEL       = 100
LEVEL_EXPONENT          = 1.8
MAX_LEVEL               = 99
VOLUME_TO_XP_RATIO      = 0.5
MAX_CLASS_MULTIPLIER    = 1.5
MAX_EQUIPMENT_MULTIPLIER= 1.3
MAX_SET_MULTIPLIER      = 1.25    // panoplies
WARMUP_XP_MULTIPLIER    = 0.2
DROPSET_XP_MULTIPLIER   = 1.1
FAILURE_XP_MULTIPLIER   = 1.15
COMPOUND_GLOBAL_MULT    = 1.0
MUSCLE_XP_MATURITY_THRESHOLD = 5000
MUSCLE_XP_MATURITY_REDUCTION = 0.3   // -30% passé le seuil
EXHAUSTED_XP_MULTIPLIER = 0.5
STREAK_XP_BONUS_PER_DAY = 25
STREAK_MAX_BONUS_DAYS   = 14
BODYWEIGHT_MIN_KG       = 25
BODYWEIGHT_MAX_KG       = 300
```

**Courbe de niveau** :
```ts
xpRequiredForLevel(n) = round(100 * n^1.8)
// L10 ≈ 6 310 · L20 ≈ 21 950 · L50 ≈ 118 586
```

**Pipeline d'XP par set** :
```
volume  = reps × effectiveWeight
          (effectiveWeight = bodyweightKg si exercice isBodyweight && set.weight = 0)
setMod  = (warmup?×0.2) × (dropset?×1.1) × (failure?×1.15) × (compound?×1.0) × exercise.xpMultiplier
classMult = clamp(produit des bonuses matchant, 1.5)
equipMult = clamp(produit des bonuses d'items équipés matchant, 1.3)
baseXp  = volume × 0.5 × setMod × classMult × equipMult
perMuscle = baseXp × involvement.weight × statusXpMult(muscle.status)
```

Rendement décroissant : passé 5 000 XP sur un muscle, le gain est réduit de 30%.

### 3.5 Statut musculaire & récupération

**Statuts** : `frais` · `actif` · `fatigue` · `epuise`. `epuise` divise l'XP par 2.

**Thresholds** (`recoveryService.ts`, ratio volume24h / peakVolumePr) :
- < 0.05 → frais
- < 0.30 → actif
- < 0.70 → fatigue
- ≥ 0.70 → epuise

**Décroissance passive** : linéaire, `volumeLast24h *= max(0, 1 - hours × recoveryRate)`.
- `HOURLY_RECOVERY_RATE = 0.02` (2%/h par défaut)
- Healer : 0.04 (2× plus rapide)
- Titre "Briseur de Limites" : +0.005

Peak fallback : si pas de PR, on utilise OVERLOAD_VOLUME_24H (LARGE 8000, MEDIUM 4000, SMALL 2000).

### 3.6 Déconditionnement (Mode Survie)

Appliqué au démarrage de l'app, cooldown 12h.
```
daysSince > 7 → penalty = min(0.5, (daysSince-7) × 0.02) × stats.xp
```
50% max de perte en une passe. Mise à jour de `lastDeconditioningAppliedAt` pour éviter double comptage.

### 3.7 Power Level (formule v3)

```
base       = totalVolumeLifetime/100 + level×100 + Σ tierRankIndex(muscle)×50
strengthMult = 1 + max(0, peakWeight/bw − 1) × 0.2
vo2Bonus   = clamp((vo2 − 30)/50, 0..1) × 0.15
rhrBonus   = clamp((70 − rbpm)/20, 0..1) × 0.10
cardioMult = 1 + vo2Bonus + rhrBonus
PL         = round(base × strengthMult × cardioMult)
```

### 3.8 Personal Records (PR)

- `bestWeight`, `bestReps`, `bestVolume`, `bestEstimated1RM` (Epley : `w × (1 + reps/30)`).
- Si jump >25% sur weight/volume/1RM → `pendingValidation = true` (anti-cheat).
- Le record est stocké mais glow/bonus retenus tant que pending.

### 3.9 Loot

**Drop chance par rang** (`lootService.ts`) :
```
E: 0.35, D: 0.50, C: 0.65, B: 0.80, A: 0.92, S: 1.00
```

**Rareté par rang** :
```
E,D: common · C,B: rare · A: epic · S: legendary
```

**Level gating** :
- L <10  : aucun équipement (consommables seulement)
- L 10-19 : common + rare
- L 20-39 : + epic
- L 40+   : + legendary

**Pipeline de drop** :
```
chance = min(1, DROP_CHANCE_BY_RANK[rank] × lootLuck)
if random > chance → null
rarity = RARITY_BY_RANK[rank]
if upgradeChance > 0 && random < upgradeChance → rarity++
clampRarityToLevel(rarity, playerLevel) || null
pickRandomTemplate(rarity) → mint
```

**Dungeon rank auto** :
```
advanced     + ≥6 ex → S, sinon A
intermediate + ≥6 ex → B, sinon C
beginner     + ≥5 ex → D, sinon E
rankOverride (template) écrase tout.
```

### 3.10 Quêtes

**Daily quests** : 3 par jour, reset à 4h locale (`QUEST_REFRESH_HOUR`).

**Types** (13) :
```
volume_total | muscle_volume | exercises_category | exercise_specific
| muscle_xp | workout_duration | streak_day | set_count
| total_reps | max_weight | early_workout
```

**Catégories UI** : `strength` · `endurance` · `discipline`.
**Difficultés** : easy / medium / hard / epic.

**XP par difficulté** (nerfed -40%) :
```
easy: 30 · medium: 90 · hard: 240 · epic: 600
```

**Scaling** :
```
scaled = baseTarget × (1 + level × levelScaling)
max_weight   → max(scaled, peakWeightPr × 1.05)
volume_total → max(scaled, peakVolumePr × 1.05)
durations arrondies à 30s, reps à entier, kg au 5 près.
```

**Rank de quête** = `shiftRank(playerRank, DIFFICULTY_RANK_OFFSET[diff])` avec offsets `easy:-1 · medium:0 · hard:+1 · epic:+2`.

**Progress aggregation** :
- `max_weight` → `progress = max(current, event.value)`
- autres → `progress = min(target, current + event.value)`

**Loot par difficulté** :
- easy: aucun · medium: random common · hard: random rare · epic: random epic.

### 3.11 Secret Quests (20)

Déclenchées par gameplay sans apparaître dans la liste. Exemples (src `data/secretQuests.ts`) :
- `reveil_demon` : 100 pompes en 1 set → +2000 XP + rare
- `colosse_immobile` : 200 kg squat → +3000 XP + epic
- `moine_inlassable` : planche 3 min → +1500 XP + rare
- `transe_volume` : 10 000 kg en 1 séance → +2500 XP + epic
- `reigne_corde` : 30 tractions 1 set → +2000 XP + rare

Total 20 déclencheurs couvrant force / endurance / discipline / temporal edges (night owl, dawn raider, lightning session). Primes 1500-8000 XP, rareté rare→legendary.

### 3.12 Titres (13)

Chaque titre a :
- `condition` (session_ended_before_hour · session_prs · zero_fatigue_sessions · fresh_start_sessions)
- `effectId` : `morning_xp_boost` (+10% XP 5h-10h) · `recovery_boost_5` (+5% récup) · `fatigue_reduction_10` (-10 pts fatigue affichée)
- Catégorie UI : `progression` · `feats` · `legendary`
- Couleur néon

Exemples :
- "Chasseur de l'Aube" : finir une séance avant 7h → morning_xp_boost
- "Briseur de Limites" : 5 PR dans une séance → recovery_boost_5
- "Ami des Muscles" : N sessions à fatigue 0

### 3.13 Challenges (3 long-terme)

| id                | rank | metric                | target  | XP    |
|-------------------|------|-----------------------|---------|-------|
| la_montagne       | S    | totalVolumeLifetime   | 50 000 kg | 5000  |
| ombre_constante   | A    | longestStreak         | 7 jours | 3000  |
| cent_chasses      | S    | totalWorkouts         | 100     | 8000  |

Progression computée live depuis le profil. Completion persistée dans `profile.completedChallenges`.

### 3.14 Consommables

Templates (`data/consumables.ts`) :
- `RATION_FRAICHE` (common elixir) : -10% volume24h
- `ELIXIR_FATIGUE` (rare elixir) : -30% volume24h
- `SCROLL_DOUBLE_XP` (epic scroll) : ×2 XP pendant 60 min
- `KEY_S_RANK` (legendary key) : prochaine séance = Rang S
- `monarch_heart` (legendary relic) : reset tous muscles à frais
- Starter consumables mintés à la création du profil.

### 3.15 Streak & bonus

- Streak incrémenté par jour d'activité.
- Bonus XP : `+25 XP × min(streak, 14) `.
- Classe Healer débloque +15% XP dès 3 jours.

### 3.16 Anti-cheat (security protocols)

- `simulationDetected` : sets loggués à cadence implausible.
- `densityWarning` : volume/temps dépasse le seuil athlétique du rang.
- `pendingValidation` sur PR si jump >25%.
- UI ne décerne pas glow/bonus tant que flag actif.

---

## 4. ÉCRANS ET NAVIGATION

**Stack racine** (`app/_layout.tsx`) :
- `(tabs)` — tabs group
- `onboarding`
- `workout/selection`
- `workout/active`
- `workout/recap`
- `admin/console` (debug)
- `mailbox/index`

**Overlays globaux montés au racine** : `LootDropModal` · `SecretQuestModal` · `MuscleRankUpModal`.

**Gate d'onboarding** : `RootLayout` redirige vers `/onboarding` tant que `profile.hasAcceptedSystemTerms` est false.

**Tabs** (`app/(tabs)/_layout.tsx`) — 5 onglets, icônes lucide, couleurs actives #60A5FA :
1. `index` → **Quêtes** (ScrollText) — Dashboard principal : XP globale, level, rang, quêtes du jour, challenges.
2. `ranking` → **Ranking** (Trophy) — leaderboard mondial simulé.
3. `muscles` → **Muscles** (Dumbbell) — silhouette biométrique, tiers par muscle, filtre par zone.
4. `inventory` → **Inventaire** (Backpack) — équipements + consommables, slots head/body/weapon/accessory.
5. `profile` → **Statut** (User) — fiche RPG : classe, évolution, PR, poids history, titres actifs, biométrie (VO2/RHR/height).

**Flow de séance** (tous en Stack racine, hors tabs) :
- `workout/selection` : liste des templates built-in + clonés ; filtre difficulté, affichage du rang calculé.
- `workout/active` : HUD en combat — timer, compteur séries, logger de sets (reps, poids, RPE, flags warmup/dropset/failure), rest timer.
- `workout/recap` : totalXP, xp par muscle, PRs battus, loot droppé.

**Autres** :
- `admin/console` : console Maxime (debug) pour forcer XP boost, S-key, reset, dropper loot manuellement.
- `mailbox/index` : messages du Système (tones info/warning/ominous/reward/evolution).

---

## 5. ENTITÉS DE DONNÉES

### 5.1 Types TypeScript (source `types/index.ts`)

**MuscleGroupId** (union) : `pectoraux` · `dorsaux` · `trapezes` · `lombaires` · `deltoides_anterieur` · `deltoides_lateral` · `deltoides_posterieur` · `biceps` · `triceps` · `avant_bras` · `abdominaux` · `obliques` · `quadriceps` · `ischio_jambiers` · `fessiers` · `mollets` · `adducteurs`.

**MuscleStatus** : `frais` | `actif` | `fatigue` | `epuise`.

**MuscleGroupStats** (par muscle du profil) :
```ts
{
  muscleId, xp, level, xpToNextLevel,
  totalVolumeLifetime, lastTrainedAt,
  status, statusUntil,
  volumeLast24h, volumeLast7d, sessionsLast7d,
  lastDeconditioningAppliedAt
}
```

**Exercise** : id, name, nameEn?, category (push/pull/legs/core/cardio/hiit/mobility), movement (compound/isolation), equipment (barbell/dumbbell/machine/cable/bodyweight/kettlebell/band/other), isBodyweight, muscleInvolvement[{muscleId, weight 0..1, role}], primary/secondaryMuscles, xpMultiplier, instructions?, tips?, videoUrl?, isCustom, createdAt.

**WorkoutSet** : id, exerciseId, setNumber, reps, weight, rpe?, isWarmup, isDropset, isFailure, completedAt, restAfterSeconds?, notes?.

**WorkoutExercise** : id, exerciseId, order, sets[], targetSets?, targetReps?, targetRestSeconds?, notes?.

**WorkoutSession** : id, templateId?, name, startedAt, endedAt?, durationSeconds?, exercises[], totalVolume, totalXpGained, xpByMuscle, prsBrokenCount?, secretQuestsTriggered?[], simulationDetected?, densityWarning?, workingTimeSeconds?, status (planned/in_progress/completed/abandoned).

**WorkoutTemplate** : id, name, description?, tags[], difficulty, estimatedDurationMinutes, exercises[{exerciseId, order, targetSets, targetReps, targetRestSeconds?, notes?}], rankOverride?, isBuiltIn, clonedFrom?, createdAt, updatedAt.

**Quest** : id, title, description, type, filter?, target, progress, xpReward, lootReward?, difficulty, category, rank, templateId?, status, createdAt, expiresAt, completedAt?.

**PlayerClass** : id, name, nameEn, tagline, description, colorHex, icon, affinity{categories?, muscles?}, bonuses[ClassBonus], passiveEffects{recoveryRate?, lootLuck?, rarityUpgradeChance?}.

**EquipmentItem** / **ItemTemplate** : id (instance), templateId, name, description?, icon?, rarity, slot (head/body/weapon/accessory), bonuses[ClassBonus], acquiredAt, sourceQuestId?.

**ConsumableItem** / **ConsumableTemplate** : subtype (elixir/scroll/key/relic), effect (reduce_fatigue/reduce_volume24h/instant_xp/unlock_dungeon/xp_boost_timed).

**PersonalRecord** : exerciseId, bestWeight, bestReps, bestVolume, bestEstimated1RM, lastUpdatedAt, pendingValidation?.

**Title** : id, name, description, unlockHint, effectDescription, effectId, colorHex, condition, category.

**SecretQuestDef** : id, name, description, hint, trigger, xpReward, lootRarity, titleIdReward?.

**Challenge** : id, name, description, metric (totalVolumeLifetime/longestStreak/totalWorkouts), target, unit, xpReward, titleIdReward?, rank (A|S).

**SystemMessage** : id, title, body, sentAt, read, tone (info/warning/ominous/reward/evolution).

**UserProfile** (agrégat principal, persisté dans Zustand) :
```ts
{
  id, nickname, avatarUrl?, createdAt,
  hasAcceptedSystemTerms,
  playerClassId, playerClassChangedAt, classEvolutionStage: 0|1|2|3,
  totalXp, level, xpToNextLevel,
  muscleStats: Record<MuscleGroupId, MuscleGroupStats>,
  personalRecords: Record<exerciseId, PersonalRecord>,
  weightHistory: WeightLogEntry[],
  buffs: { pendingFatigueReduction? },
  xpBoostUntil?, xpBoostMultiplier?,
  bossInstanceActive?,
  inventory: { equipment[], equipped: Record<slot, item|null>, consumables[] },
  unlockedTitles[], activeTitleId,
  completedSecretQuests[], completedChallenges[],
  zeroFatigueSessionsCount, freshStartSessionsCount,
  messages: SystemMessage[],
  currentStreak, longestStreak, totalWorkouts, totalVolumeLifetime, lastWorkoutAt,
  preferences: {
    weightUnit, bodyweightKg (null avant onboarding),
    heightCm?, restingBpm?, vo2max?,
    defaultRestSeconds, theme, hapticFeedback, soundEffects, notifications
  }
}
```

### 5.2 Store Zustand (`store/useAppStore.ts`)

Persistance via `createJSONStorage(AsyncStorage)`. État principal :
- `profile: UserProfile`
- `currentSession: WorkoutSession | null`
- `templates: WorkoutTemplate[]`
- `dailyQuests: Quest[]`
- `needsOnboarding: boolean`
- `pendingLoot: EquipmentItem | null`
- `pendingSecretDrop: SecretQuestDrop | null`
- `pendingMuscleRankUp: MuscleRankUp | null`

Actions clés :
- `initializeApp()` : décond. + refresh statuses + regen quêtes si expirées.
- `updateNickname`, `setBodyweight`, `setPlayerClass`, `acceptSystemTerms` (onboarding).
- `startSession(templateId?)`, `addSetToExercise`, `endSession()`, `abandonSession()`.
- `claimQuestReward(questId)`, `expireQuests()`.
- `equipItem`, `unequipItem`, `consumeItem`.
- `updatePreferences`, `appendSystemMessage`, `markMessageRead`.
- Admin : `adminGrantXp`, `adminActivateXpBoost`, `adminFlagBossInstance`.

### 5.3 Schéma SQLite (`services/database/dbHelper.native.ts`)

```sql
CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  startedAt INTEGER NOT NULL,
  endedAt INTEGER,
  durationSeconds INTEGER,
  totalVolume REAL,
  totalXpGained REAL,
  status TEXT,
  payload TEXT NOT NULL
);
```

API helper :
```ts
init()
saveSession(session: WorkoutSession)
getRecentSessions(limit=50): WorkoutSession[]
clearAll()
```

Le payload stocke la session JSON complète pour une restitution ultérieure.

**Web fallback** (`dbHelper.web.ts`) : mock mémoire — no-op saveSession + tableau in-memory.

**Sélection** (`dbHelper.ts`) : export conditionnel via Platform.select / resolver Metro (`.native.ts` / `.web.ts`).

---

## 6. SYSTÈMES DE GAMIFICATION (interactions)

**Inventaire ↔ XP** : chaque item équipé apporte un `ClassBonus` évalué par le même `matchesClassBonus()` que les classes. Produit clampé par `MAX_EQUIPMENT_MULTIPLIER = 1.3`.

**Panoplies (ItemSets)** : bonus d'ensemble quand N items d'un set sont équipés simultanément (cap 1.25×).

**Power Level** : rang visible qui monte avec volume lifetime + level + tier muscle + strength/cardio mult.

**Leaderboard** : classement régional/mondial simulé, basé sur Power Level.

**Muscle Rankings** : ladder Fer → Légende par muscle, déblocage de titres "Maître" par famille.

**Secret Quests** : scan à `addSet` + `endSession` pour déclencher primes narratives.

**Titles** : appliqués en fin de session, sélectionnables dans Statut, effet passif actif.

**Aura de classe** : border/glow selon `PlayerClass.colorHex`. Évolution applique +5%/stage.

**Mailbox** : archives narratives — chaque évolution, chaque secret, chaque perte par décond. pousse un SystemMessage.

---

## 7. DIRECTION ARTISTIQUE

**Palette "Deep Night" / The System** (source `tailwind.config.js`) :
```js
system: {
  bg:     '#020617',   // Bleu nuit profond — fond global
  panel:  '#101624',   // Panneau sombre — cartes
  border: '#1E293B',   // Acier sombre — bordures
  neon:   '#60A5FA',   // Bleu néon — accents primaires
  cyan:   '#22D3EE',   // Cyan hologramme — énergie
  violet: '#A855F7',   // Violet arcane — rareté / classes
  gold:   '#FBBF24',   // Or — rang S, titres prestige
}
```

Autres couleurs tier (muscleTiers) : fer #9CA3AF, bronze #F97316, argent #CBD5E1, or #FBBF24, platine #22D3EE, diamant #818CF8, maître #A855F7, légende #F43F5E.

Couleurs muscle (17, cohérentes avec zones) : pectoraux #FF5C7A, dorsaux #4C8BF5, quadriceps #F97316, biceps #A855F7, abdominaux #22D3A4, etc.

**Typographie** : font system actuellement, slot prévu pour pixel/holo font (vide dans tailwind).

**Effets** :
- Fond `#020617` forcé `!important` sur html/body/#root pour tuer les bands blancs iOS PWA.
- `color-scheme: dark`, `overscroll-behavior-y: none`, `-webkit-tap-highlight-color: transparent`.
- Glow cyan/violet autour des stats critiques, des boutons actifs, des items rares.
- StatusBar claire sur fond sombre, `translucent=true`.

**Règles UI** :
- Pas d'emojis décoratifs dans l'UI (les `icon` des data sont hérités mais remplacés par lucide-react-native dans les composants finaux).
- Icônes : `lucide-react-native` (Backpack, Dumbbell, ScrollText, Trophy, User, Swords, Shield, Sparkles, HeartPulse, Sprout, Target, Sword…).
- Tout écran sur `SafeAreaView` avec fond `#020617`.
- Animations : `Animated` core RN + `Easing`, pas de reanimated (désactivé dans babel pour éviter worklets).

---

## 8. BASE DE DONNÉES D'EXERCICES

**Volume** : 39 exercices dans `data/exercises.ts` (vérifié par grep `id: '`).

**Répartition par catégorie** (ordre d'apparition) :
- PUSH : bench_press_barbell, incline_db_press, push_up, overhead_press, lateral_raise, triceps_pushdown, dips, …
- PULL : pull_up, barbell_row, seated_row, face_pull, biceps_curl_db, hammer_curl, …
- LEGS : back_squat, front_squat, romanian_deadlift, leg_press, calf_raise, …
- CORE : plank, hanging_leg_raise, russian_twist, …
- HIIT / CARDIO : burpees, mountain_climbers, running, etc.

Chaque exercice définit :
- `muscleInvolvement` dont la somme des `weight` ≈ 1 (le primary prend la part du lion).
- `xpMultiplier` (1.0 – 1.1) pour valoriser les compounds lourds.
- `isBodyweight` → utilise `bodyweightKg` comme masse effective.

**Signature Dungeons** (templates built-in, `data/workoutTemplates.ts`) :
- `tpl_push_intermediate` — 60 min, 6 exercices, Rank B/C.
- `tpl_pull_intermediate` — 60 min, 6 exercices.
- (+ templates legs, fullbody, etc.)

**ItemSets** (panoplies) : définitions dans `data/itemSets.ts` groupant plusieurs items de même thème.

---

## 9. ÉTAT D'IMPLÉMENTATION DU REPO ACTUEL

**Ce qui marche (commits squashés de `claude/fitness-rpg-app-architecture-YqTVA`)** :
- Moteur XP complet (set → muscle → level-up global + par muscle).
- 7 classes + évolutions + bonus conditionnels.
- Loot drop + minting + level gating.
- Quest engine (daily + scaling PR + secret + challenges).
- Silhouette biométrique UI (components/BodyView.tsx).
- Persistance Zustand + AsyncStorage + mirror SQLite pour sessions.
- Onboarding 4-steps.
- Admin console Maxime.
- Mailbox narratif.
- Anti-cheat heuristique (simulation, densité, PR jump).
- Palette Deep Night appliquée globalement.
- Titres + battle pass + consommables.
- Ranking + Muscle Rankings + Power Level.

**Régressions connues** (commit `6be8f5c Revert "feat: SFX engine + I-Rise extraction + World Boss bar"`) :
- SFX engine a été reverti — pas de sons dans l'app actuellement.
- World Boss bar enlevée.
- I-Rise animation extraction enlevée.

**Statut migration SDK 54** :
- `package.json` déjà modifié vers SDK 54 (expo ^54.0.33, react 19.1.0, RN 0.81.5, expo-router 6.0.23, nativewind 4.1.23) — changements NON commités.
- Le dernier commit `1e6bb77 chore: état stable SDK 51 avant migration SDK 54` capture l'état SDK 51 stable.
- La mission de nuit demande de partir d'une base propre : archiver le repo, créer un nouveau projet SDK 54 avec `create-expo-app`, reconstruire écrans/services à partir de ce GDD.

**Points d'attention migration** :
- `react-native-worklets` présent mais babel config désactive reanimated → pas d'usage actuel, mais dépendance transitive possible de gesture-handler.
- `expo-sqlite` v16 : API `openDatabaseSync` / `runAsync` / `getAllAsync` (déjà utilisée dans dbHelper.native.ts — compatible SDK 54).
- Expo Router 6 : `expo-router/entry` toujours le main, stack + tabs compatibles.
- `newArchEnabled: true` dans app.json — OK pour SDK 54, à valider au build.
- `experiments.baseUrl: '/GymLevel'` pour GitHub Pages — à reporter dans le nouveau projet.

---

## 10. STACK TECHNIQUE V2 (versions cibles SDK 54)

Source `package.json` (déjà présent dans le snapshot) :
```json
"expo": "^54.0.33",
"expo-router": "~6.0.23",
"react": "19.1.0",
"react-dom": "19.1.0",
"react-native": "0.81.5",
"react-native-web": "^0.21.0",
"@expo/metro-runtime": "~6.1.2",
"@react-native-async-storage/async-storage": "2.2.0",
"expo-constants": "~18.0.13",
"expo-haptics": "~15.0.8",
"expo-linking": "~8.0.11",
"expo-notifications": "~0.32.16",
"expo-sqlite": "~16.0.10",
"expo-status-bar": "~3.0.9",
"lucide-react-native": "^0.445.0",
"nativewind": "^4.1.23",
"react-native-gesture-handler": "~2.28.0",
"react-native-safe-area-context": "~5.6.0",
"react-native-screens": "~4.16.0",
"react-native-svg": "15.12.1",
"react-native-worklets": "0.5.1",
"zustand": "^4.5.2",
"date-fns": "^3.6.0",
"uuid": "^9.0.1",
"tailwindcss": "^3.4.17" (devDep)
```

**Build tooling** :
- NativeWind 4 : preset tailwind + plugin babel + `withNativeWind(metroCfg, { input: './global.css' })`.
- Babel : `babel-preset-expo` avec `jsxImportSource: 'nativewind'` + `reanimated: false` + `'nativewind/babel'`.
- Metro : standard Expo + NativeWind wrapper.
- TypeScript strict + `noUncheckedIndexedAccess` + `noImplicitOverride`.

---

## 11. ARBORESCENCE ACTUELLE DU REPO SDK 51

```
GymLevel/
├── app/
│   ├── _layout.tsx                        # Stack racine + gate onboarding + overlays globaux
│   ├── +html.tsx                          # HTML shell web
│   ├── onboarding.tsx                     # 4 steps : identité / poids / classe / pacte
│   ├── (tabs)/
│   │   ├── _layout.tsx                    # 5 onglets : quêtes / ranking / muscles / inventaire / statut
│   │   ├── index.tsx                      # Dashboard Quêtes
│   │   ├── ranking.tsx                    # Leaderboard
│   │   ├── muscles.tsx                    # Silhouette + tiers
│   │   ├── inventory.tsx                  # Inventaire équipé + consommables
│   │   └── profile.tsx                    # Statut RPG
│   ├── workout/
│   │   ├── selection.tsx                  # Choix du donjon
│   │   ├── active.tsx                     # Séance en cours
│   │   └── recap.tsx                      # Bilan + loot
│   ├── admin/console.tsx                  # Console debug Maxime
│   └── mailbox/index.tsx                  # Messages du Système
├── components/
│   ├── BiometricModal.tsx
│   ├── BodyView.tsx                       # Silhouette SVG front/back
│   ├── DungeonEntryModal.tsx
│   ├── FatigueBar.tsx                     # (+ computeGlobalFatigue helper exporté)
│   ├── GradientBar.tsx
│   ├── GrowthChart.tsx
│   ├── InventoryItemDetailModal.tsx
│   ├── InventorySlot.tsx
│   ├── LootDropModal.tsx                  # Overlay global
│   ├── MuscleRankUpModal.tsx              # Overlay global
│   ├── RankEmblem.tsx
│   └── SecretQuestModal.tsx               # Overlay global
├── services/
│   ├── database/
│   │   ├── dbHelper.ts                    # Export conditionnel
│   │   ├── dbHelper.native.ts             # expo-sqlite
│   │   └── dbHelper.web.ts                # mock mémoire
│   ├── gamificationService.ts             # Pure — formules XP / PR / PowerLevel
│   ├── workoutService.ts                  # Pure — template → session, set mutations
│   ├── recoveryService.ts                 # Décond. + statuts passifs
│   ├── lootService.ts                     # Drop resolution
│   └── questService.ts                    # Generate/progress/expire/rollLoot
├── store/
│   └── useAppStore.ts                     # Zustand + persist AsyncStorage
├── types/
│   └── index.ts                           # Source of truth entités
├── data/
│   ├── exercises.ts                       # 39 exercices
│   ├── muscleGroups.ts                    # 17 muscles + MUSCLE_SIZE
│   ├── muscleTiers.ts                     # 18 tiers + thresholds
│   ├── playerClasses.ts                   # 7 classes
│   ├── classEvolution.ts                  # Chains + flavor + stage bonus
│   ├── ranks.ts                           # E→S
│   ├── equipment.ts                       # Item templates + pools
│   ├── consumables.ts                     # Templates + starter
│   ├── itemSets.ts                        # Panoplies
│   ├── questLibrary.ts                    # Templates de quêtes
│   ├── secretQuests.ts                    # 20 secrets
│   ├── titles.ts                          # 13 titres
│   ├── challenges.ts                      # 3 défis A/S
│   └── workoutTemplates.ts                # Built-ins
├── constants/
│   └── gamification.ts                    # Magic numbers
├── hooks/                                 # (vide actuellement — répertoire présent)
├── public/                                # favicon + manifest PWA
├── app.json, babel.config.js, metro.config.js, tailwind.config.js
├── global.css, tsconfig.json
└── package.json (SDK 54 deps pending)
```

---

## CONVENTIONS DE CODE (V2)

- **TypeScript strict** : `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`.
- **Commits** : Conventional Commits en français (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`).
- **Pas d'emojis** dans le code, les commentaires, les commits.
- **Styling** : NativeWind `className=""`. Pas de StyleSheet hors cas exotique.
- **Persistance** : Zustand `persist` avec `createJSONStorage(AsyncStorage)`. Partialize si besoin d'exclure du runtime state.
- **DB** : pattern `dbHelper.native.ts` + `dbHelper.web.ts`, export via `dbHelper.ts`.
- **Composants** : PascalCase, fichier = export default.
- **Hooks** : camelCase préfixés `use`.
- **Écrans** : dans `app/`, Expo Router file-based. `app/(tabs)/` pour les tabs.
- **Services** : pure functions sans side-effects quand possible. La mutation atomique vit dans le store.
- **Chemins** : alias `@/…` (tsconfig paths) → types, store, services, data, constants, hooks, components.
- **Pas de dépendance hors whitelist** sans discussion.

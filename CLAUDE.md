# CLAUDE.md — GymLevel V2 (Expo SDK 54)

Guide de référence pour Claude Code travaillant sur GymLevel. Source de vérité gameplay/design : **GDD_GYMLEVEL.md** à la racine.

---

## Projet en 1 paragraphe

GymLevel est une app fitness-RPG React Native / Expo inspirée de Solo Leveling. L'utilisateur ("Chasseur") choisit une classe (7 archétypes, 4 stages d'évolution), logue ses séances comme des "donjons", gagne de l'XP par muscle (17 groupes), monte en rang (E→S), récupère du loot (common/rare/epic/legendary gated par level) et des titres. La palette "Deep Night" (#020617 fond, #1E293B bordures, cyan/violet/or néon) soutient l'ambiance.

---

## Stack technique V2

- **Expo SDK 54** (expo ^54.0.33)
- **Expo Router 6** file-based routing (`app/` + `(tabs)`)
- **React 19** / React Native 0.81 / react-native-web 0.21
- **NativeWind 4.1.23** (Tailwind 3.4 + preset + babel plugin)
- **Zustand 4** + `persist` + `createJSONStorage(AsyncStorage)`
- **expo-sqlite 16** (API async, pattern `.native.ts` / `.web.ts`)
- **react-native-svg 15.12** pour la silhouette biométrique
- **lucide-react-native** pour toutes les icônes (pas d'emoji UI)
- **date-fns**, **uuid**, **expo-haptics**, **expo-notifications**, **expo-linking**
- TypeScript strict + `noUncheckedIndexedAccess` + `noImplicitOverride`

---

## Arborescence

```
app/                 # Écrans Expo Router
  _layout.tsx           # Stack racine + gate onboarding + overlays globaux
  onboarding.tsx        # 4 steps (identité/morph/classe/pacte)
  (tabs)/               # 5 onglets : index(Quêtes) / ranking / muscles / inventory / profile
  workout/              # selection / active / recap
  admin/console.tsx     # Console debug Maxime
  mailbox/index.tsx     # Messages du Système

components/          # UI réutilisable (PascalCase.tsx)
services/            # Logique pure (gamification, workout, recovery, loot, quest, database)
store/useAppStore.ts # Zustand unique
types/index.ts       # Source de vérité entités (MuscleGroupId, UserProfile, Exercise, …)
data/                # Catalogues statiques (exercises, muscles, tiers, classes, ranks, titles, quests, consumables, equipment, secretQuests, challenges, workoutTemplates, itemSets, classEvolution)
constants/           # Magic numbers (gamification.ts)
hooks/               # Hooks métier (useX)
```

Alias TypeScript (`tsconfig.json`) : `@/` → racine · `@/types`, `@/store/*`, `@/services/*`, `@/data/*`, `@/constants/*`, `@/hooks/*`, `@/components/*`.

---

## Conventions de code

- **Commits** : Conventional Commits en FRANÇAIS. Exemples :
  - `feat: ajout du flow onboarding`
  - `fix(muscles): corrige la décroissance passive`
  - `chore: bump deps Expo`
  - `docs: update GDD`
  - `refactor: extrait loot rarity cap`
  - **Pas d'emojis** dans les messages ni dans le code ni dans les commentaires.

- **Styling** : NativeWind `className=""`. `StyleSheet.create` uniquement si impossible autrement (animation hooks, mesures DOM).

- **Palette** (tailwind.config.js → `theme.extend.colors.system`) :
  - `system-bg` #020617 · `system-panel` #101624 · `system-border` #1E293B
  - `system-neon` #60A5FA · `system-cyan` #22D3EE · `system-violet` #A855F7 · `system-gold` #FBBF24

- **Persistance** : Zustand `persist` + `createJSONStorage(AsyncStorage)`. `partialize` si on veut exclure `currentSession` ou des drops pending.

- **DB** : pattern `services/database/dbHelper.native.ts` + `.web.ts` + resolver `dbHelper.ts`. Expo-sqlite 16 API : `openDatabaseSync`, `runAsync`, `getAllAsync`.

- **Composants** : PascalCase, un export default par fichier. Pas de barrel files.

- **Hooks** : `useX` en camelCase, fichiers dans `hooks/`.

- **Écrans** : dans `app/`, file-based Expo Router. Tabs dans `app/(tabs)/`. SafeAreaView obligatoire avec `backgroundColor: #020617`.

- **Services pures** : pas d'effet de bord. La mutation atomique vit dans le store.

- **Gamification** : toute constante de tuning dans `constants/gamification.ts`. Toute formule XP dans `services/gamificationService.ts`. Ne pas éparpiller.

- **Pas de nouvelle dépendance** sans discussion préalable.

- **Pas de refactor sauvage** : respecter la structure existante.

- **Commentaires** : uniquement quand le "pourquoi" n'est pas évident. Jamais paraphraser ce que fait le code.

---

## Commandes courantes

```bash
# Lancement dev web (preferred pour debug rapide)
npx expo start --web --no-dev --clear

# iOS / Android (native build requis)
npx expo start --ios
npx expo start --android

# Typecheck
npm run typecheck

# Lint
npm run lint

# Export web statique (déploiement GitHub Pages via /GymLevel baseUrl)
npm run deploy
```

---

## Git

- **Remote** : https://github.com/AmIxEm10/GymLevel
- **Branche migration** : `migration/sdk-54` (actuelle, SDK 54 en place)
- **Branche source historique** : `claude/fitness-rpg-app-architecture-YqTVA` (SDK 51 archivé)
- **Jamais** `git push --force` sans autorisation explicite.
- **Jamais** `npm audit fix --force`.

---

## Mécaniques critiques — pointeurs rapides

Pour la spec complète, voir **GDD_GYMLEVEL.md**. Rappels éclair :

- **Formule XP** (`services/gamificationService.ts`) :
  `baseXp = volume × 0.5 × setMod × classMult(≤1.5) × equipMult(≤1.3)` ; puis per-muscle × involvement.weight × statusMod.

- **Level curve** (`constants/gamification.ts`) : `xp(n) = 100 × n^1.8`. Level max 99.

- **Rangs** (`data/ranks.ts`) : E(0) D(6) C(11) B(21) A(36) S(61).

- **Récupération** : 2 %/h (Healer 4 %/h), statut `frais`/`actif`/`fatigue`/`epuise` déterminé par `volumeLast24h / peakVolumePr`.

- **Déconditionnement** : pas entraîné >7 jours → perte 2%/jour, max 50% en un check, cooldown 12h.

- **Loot** : drop rate 35%(E)→100%(S), rareté clampée par level (L10 rare, L20 epic, L40 legendary).

- **Anti-cheat** : PR jump >25% → pendingValidation. Cadence sets implausible → simulationDetected.

---

## Anti-patterns à éviter

- ❌ Ajouter une dépendance sans discussion.
- ❌ Refactor "tant qu'on y est".
- ❌ Mettre du CSS dans `StyleSheet.create` alors que Tailwind suffit.
- ❌ Mettre de la logique métier dans un écran ; elle va dans `services/`.
- ❌ Modifier `types/index.ts` sans vérifier tous les consumers.
- ❌ Dupliquer une constante gamification : elles vivent dans `constants/gamification.ts`.
- ❌ Oublier la variante web dans `services/database/` (split natif/web).
- ❌ Utiliser un emoji dans le code, dans l'UI, dans un commit.

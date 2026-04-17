MISSION NUIT — REFONTE COMPLETE DE GYMLEVEL EN EXPO SDK 54

Tu travailles en autonomie pendant que je dors. Tu es en mode Accept Edits. Tu as une whitelist de commandes shell pré-approuvées que tu peux lancer sans demander. Pour toute commande hors whitelist, tu t'arrêtes et tu rédiges le NIGHT_REPORT.md.

CONTEXTE
========

- Projet actuel : GymLevel en Expo SDK 51, migration SDK 54 impossible
- Décision : extraire un GDD complet, archiver l'ancien, créer un nouveau projet SDK 54 propre, coder l'app
- Stack cible : Expo SDK 54 + Expo Router 6 + React 19 + NativeWind 4 + Zustand + expo-sqlite + react-native-svg
- GitHub : https://github.com/AmIxEm10/GymLevel
- Branche actuelle : claude/fitness-rpg-app-architecture-YqTVA
- Windows 10, Node 20 actif via NVM, Git configuré
- Utilisateur : Maxime Haon, étudiant BUT3 GMP en alternance

GARDE-FOUS ABSOLUS
==================

1. COMMITS FREQUENTS : un commit minimum par phase. Conventional Commits en français.
2. PAS de git push --force, JAMAIS.
3. PAS de npm audit fix --force, JAMAIS.
4. PAS de nouvelle dépendance hors de celles listées dans PHASE 3.
5. Si tu bloques et 3 tentatives échouent : commit, écris NIGHT_REPORT.md, ARRETE-TOI.
6. PAS de refactor sauvage.
7. Tu ne modifies PAS la config système Windows.
8. Action destructive = commit de safety avant.

WHITELIST COMMANDES (sans demander)
===================================

AUTORISEES :
- Navigation : cd, dir, type, echo
- Node/npm : node --version, npm --version, npm install, npm install --save-dev, npm install --ignore-scripts
- Expo : npx create-expo-app@latest, npx expo install, npx expo start --web --no-dev --clear
- Git : git status, git add, git commit, git push origin HEAD, git log, git branch, git checkout, git init, git remote add
- Fichiers : mkdir, rename (pour GymLevel -> GymLevel_OLD_SDK51)
- Création/édition de fichiers dans le projet

INTERDITES (STOP + NIGHT_REPORT) :
- npm audit fix --force
- git push --force
- git reset --hard sur commit push
- rmdir/del hors node_modules
- Config système Windows
- sudo/admin
- npm install -g
PHASE 1 — EXTRACTION DU GDD (30-45 min)
=======================================

1.1. Confirme ta position :
   git branch --show-current
   Tu dois être sur claude/fitness-rpg-app-architecture-YqTVA

1.2. Lis exhaustivement :
   - README.md, package.json, app.json
   - Tous les .ts/.tsx dans app/, components/, services/, store/, types/, data/, constants/, hooks/
   - tailwind.config.js, metro.config.js, babel.config.js, global.css, tsconfig.json

1.3. Crée GDD_GYMLEVEL.md avec sections exhaustives :
   # GDD — GymLevel : Le Système d'Éveil
   ## 1. PITCH ET VISION
   ## 2. PERSONA UTILISATEUR
   ## 3. MECANIQUES CORE (classes, rangs, XP, formules exactes)
   ## 4. ECRANS ET NAVIGATION
   ## 5. ENTITES DE DONNEES (SQLite + TS + Zustand)
   ## 6. SYSTEMES DE GAMIFICATION
   ## 7. DIRECTION ARTISTIQUE (palette Deep Night hex exacts)
   ## 8. BASE DE DONNEES D'EXERCICES
   ## 9. ETAT D'IMPLEMENTATION DU REPO ACTUEL
   ## 10. STACK TECHNIQUE V2 (versions SDK 54)
   ## 11. ARBORESCENCE CIBLE DU NOUVEAU PROJET

1.4. Commit + push :
   git add GDD_GYMLEVEL.md
   git commit -m "docs: extraction GDD complet avant refonte SDK 54"
   git push origin HEAD

1.5. Vérifie push réussi. Si échec : STOP, NIGHT_REPORT.md.


PHASE 2 — ARCHIVAGE (5 min)
===========================

2.1. cd ..
2.2. rename GymLevel GymLevel_OLD_SDK51
2.3. dir GymLevel_OLD_SDK51 pour vérifier


PHASE 3 — CREATION PROJET EXPO SDK 54 (15 min)
==============================================

3.1. npx create-expo-app@latest GymLevel --template default
3.2. cd GymLevel
3.3. type package.json (confirme expo ~54.x)
3.4. npx expo install nativewind tailwindcss zustand @react-native-async-storage/async-storage expo-sqlite expo-haptics expo-notifications expo-linking expo-constants expo-status-bar react-native-svg react-native-gesture-handler react-native-safe-area-context react-native-screens lucide-react-native date-fns uuid
3.5. npm install --save-dev @types/uuid
3.6. git remote add origin https://github.com/AmIxEm10/GymLevel.git
3.7. git checkout -b sdk54-rebuild
3.8. git add . && git commit -m "chore: initial Expo SDK 54 avec deps métier" && git push -u origin sdk54-rebuild
PHASE 4 — CLAUDE.md + NATIVEWIND (15 min)
=========================================

4.1. Crée CLAUDE.md à la racine :
   - Copie intégrale du GDD_GYMLEVEL.md (depuis GymLevel_OLD_SDK51/GDD_GYMLEVEL.md)
   - Section CONVENTIONS DE CODE :
     * TypeScript strict
     * Commits Conventional Commits français
     * NativeWind pour styling
     * Zustand persistance AsyncStorage
     * expo-sqlite pattern dbHelper.native.ts / dbHelper.web.ts
     * Composants PascalCase, hooks camelCase préfixés use
     * Ecrans dans app/ Expo Router file-based
     * Pas d'emojis dans code ni commits

4.2. Configure NativeWind SDK 54 :
   - tailwind.config.js : content app+components, preset nativewind
   - global.css : directives tailwind
   - babel.config.js : plugin nativewind/babel, jsxImportSource nativewind
   - metro.config.js : withNativeWind
   - tsconfig.json : jsxImportSource nativewind
   - Importe global.css depuis app/_layout.tsx

4.3. Teste build web :
   npx expo start --web --no-dev --clear
   Attends bundling, Ctrl+C. Si erreur : 2 fixes max sinon STOP.

4.4. git add . && git commit -m "chore: config NativeWind + CLAUDE.md V2" && git push origin HEAD


PHASE 5 — CONSTRUCTION APP (phases 5.1 à 5.8)
=============================================

Chaque sous-phase : test web rapide -> commit -> push.

5.1 Types + données statiques (30 min)
   - types/index.ts : User, Workout, Exercise, Muscle, Quest, Item, Class, Rank
   - data/exercises.ts : copie depuis GymLevel_OLD_SDK51/data/
   - data/muscles.ts : liste muscles + coords SVG
   - data/classes.ts : Guerrier, Assassin, Tank stats starter
   - constants/palette.ts : Deep Night (hex GDD)
   Commit "feat: types et données statiques"

5.2 Store Zustand (30 min)
   - store/useAppStore.ts persist AsyncStorage
   - Etat : user, workouts, inventory, currentWorkout, muscleFatigue
   - Actions : createUser, addWorkout, startWorkout, endWorkout, updateFatigue, addItem
   - createJSONStorage(AsyncStorage)
   Commit "feat: store Zustand persisté"

5.3 Services + DB (45 min)
   - services/database/dbHelper.native.ts : openDatabaseSync, tables
   - services/database/dbHelper.web.ts : mock mémoire
   - services/database/index.ts : export conditionnel Platform
   - services/gamificationService.ts : calculXP, rankThresholds, levelUp
   - services/workoutService.ts : startSession, logSet, endSession
   - services/recoveryService.ts : passive -2%/h par muscle
   Commit "feat: services métier et base SQLite"
5.4 Composants de base (45 min)
   - components/XPBar.tsx : barre holographique cyan
   - components/RankBadge.tsx : emblème E/D/C/B/A/S
   - components/ClassEmblem.tsx : icône classe
   - components/StatsCard.tsx : carte stat avec glow
   - components/BodySilhouette.tsx : SVG front/back basique
   Commit "feat: composants UI base Deep Night"

5.5 Onboarding (45 min)
   - app/onboarding.tsx : classe, poids, nom
   - Transition vers (tabs) après validation
   - Animations Animated core RN
   - Ecrit dans store Zustand
   Commit "feat: onboarding avec choix de classe"

5.6 Tabs (30 min)
   - app/_layout.tsx : Stack onboarding + (tabs)
   - app/(tabs)/_layout.tsx : 5 tabs icônes lucide
   - app/(tabs)/index.tsx : Dashboard stats + XP + quests
   - app/(tabs)/muscles.tsx : Silhouette
   - app/(tabs)/workout.tsx : Sélection
   - app/(tabs)/inventory.tsx : Inventaire
   - app/(tabs)/profile.tsx : Profil
   Commit "feat: navigation par onglets 5 écrans"

5.7 Flow workout (45 min)
   - app/workout/selection.tsx
   - app/workout/active.tsx : timer, compteur séries
   - app/workout/recap.tsx : XP gagné + loot
   Commit "feat: flow de séance complète"

5.8 Modales globales (30 min)
   - components/LootDropModal.tsx
   - components/SecretQuestModal.tsx
   - components/MuscleRankUpModal.tsx
   - Intégration app/_layout.tsx
   Commit "feat: modales gamification"


PHASE 6 — NIGHT_REPORT.md FINAL
===============================

A la fin OU blocage, crée NIGHT_REPORT.md :

# RAPPORT DE NUIT — [date heure]
## Phases terminées
## Phases partielles
## Phases non faites
## Blocages rencontrés
## Etat projet (compile web OUI/NON, iOS non testé, commits pushés)
## Pour Maxime au réveil (première action, décisions, commandes)
## Suggestions

git add NIGHT_REPORT.md
git commit -m "docs: rapport de nuit - [statut]"
git push origin HEAD


DEMARRAGE
=========

Commence Phase 1 maintenant. Tu es autonome, rigoureux, tu respectes les garde-fous. Bonne nuit à Maxime.
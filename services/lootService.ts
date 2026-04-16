/**
 * lootService.ts
 * --------------
 * End-of-dungeon loot resolution — called by the store's endSession.
 * The drop chance scales with the dungeon's computed rank, the rarity
 * of the item dropped follows the rank, and the player's class may
 * apply a luck multiplier (Mage) + a rarity-upgrade chance.
 */

import type {
  EquipmentItem,
  EquipmentRarity,
  PlayerClassId,
  WorkoutTemplate,
} from '@/types';
import { mintItem, pickRandomTemplate } from '@/data/equipment';
import { getPlayerClass } from '@/data/playerClasses';
import type { Rank } from '@/data/ranks';

// ---------------------------------------------------------------------------
// Rank → drop probability
// ---------------------------------------------------------------------------

/**
 * Drop chance per dungeon rank.
 * Bumped up (was E:0.20 D:0.30 C:0.45 B:0.60 A:0.80 S:0.95) to compensate
 * for the XP nerf — the fun now comes from loot, not raw levels.
 */
export const DROP_CHANCE_BY_RANK: Record<Rank, number> = {
  E: 0.35,
  D: 0.50,
  C: 0.65,
  B: 0.80,
  A: 0.92,
  S: 1.00,
};

export const RARITY_BY_RANK: Record<Rank, EquipmentRarity> = {
  E: 'common',
  D: 'common',
  C: 'rare',
  B: 'rare',
  A: 'epic',
  S: 'legendary',
};

const RARITY_ORDER: EquipmentRarity[] = [
  'common',
  'rare',
  'epic',
  'legendary',
];

function upgradeRarity(rarity: EquipmentRarity): EquipmentRarity {
  const idx = RARITY_ORDER.indexOf(rarity);
  if (idx < 0 || idx >= RARITY_ORDER.length - 1) return rarity;
  return RARITY_ORDER[idx + 1]!;
}

// ---------------------------------------------------------------------------
// Level-gating — controls when each rarity becomes droppable.
//
//   L 1-9   → no equipment at all (consumables only)
//   L 10-19 → common + rare
//   L 20-39 → common + rare + epic
//   L 40+   → all rarities (legendary unlocked)
//
// Used by:
//   - rollEndSessionLoot (post-dungeon roll)
//   - the secret-quest drop in store.endSession
//   - quest reward minting in store.claimQuestReward
// ---------------------------------------------------------------------------

export const EQUIPMENT_UNLOCK_LEVEL = 10;
export const EPIC_UNLOCK_LEVEL = 20;
export const LEGENDARY_UNLOCK_LEVEL = 40;

/**
 * Highest rarity the player is currently allowed to receive. Returns null
 * when the player hasn't reached the equipment unlock level — the caller
 * should award consumables (or nothing) instead.
 */
export function maxAllowedRarity(playerLevel: number): EquipmentRarity | null {
  if (playerLevel < EQUIPMENT_UNLOCK_LEVEL) return null;
  if (playerLevel >= LEGENDARY_UNLOCK_LEVEL) return 'legendary';
  if (playerLevel >= EPIC_UNLOCK_LEVEL) return 'epic';
  return 'rare';
}

/**
 * Clamp a rarity to whatever the player's level currently allows. Returns
 * null when no equipment may drop yet (player below EQUIPMENT_UNLOCK_LEVEL).
 */
export function clampRarityToLevel(
  rarity: EquipmentRarity,
  playerLevel: number,
): EquipmentRarity | null {
  const cap = maxAllowedRarity(playerLevel);
  if (cap === null) return null;
  const idxCap = RARITY_ORDER.indexOf(cap);
  const idxIn = RARITY_ORDER.indexOf(rarity);
  if (idxIn <= idxCap) return rarity;
  return cap;
}

/** Convenience predicate used by the Inventory UI lock screen. */
export function isEquipmentUnlocked(playerLevel: number): boolean {
  return playerLevel >= EQUIPMENT_UNLOCK_LEVEL;
}

// ---------------------------------------------------------------------------
// Rank resolution for a template (single source of truth — used by the
// selection UI and the loot service).
// ---------------------------------------------------------------------------

export function computeDungeonRank(template: WorkoutTemplate): Rank {
  if (template.rankOverride) return template.rankOverride;
  const n = template.exercises.length;
  if (template.difficulty === 'advanced') return n >= 6 ? 'S' : 'A';
  if (template.difficulty === 'intermediate') return n >= 6 ? 'B' : 'C';
  return n >= 5 ? 'D' : 'E';
}

// ---------------------------------------------------------------------------
// End-of-session loot roll
// ---------------------------------------------------------------------------

/**
 * Rolls loot at the end of a dungeon.
 *  - Hard gate: returns null immediately if the player is below L10
 *    (equipment is locked — only consumables can drop pre-unlock).
 *  - Drop chance = DROP_CHANCE_BY_RANK[rank] × class.lootLuck
 *  - Rarity baseline = RARITY_BY_RANK[rank], CLAMPED to the player level cap
 *  - Class may grant a rarityUpgradeChance (Mage: 30 %) to bump the tier
 *    (the upgrade is also clamped to the level cap)
 *
 * Returns a freshly-minted EquipmentItem ready to drop into the inventory,
 * or null when no loot drops.
 */
export function rollEndSessionLoot(
  rank: Rank,
  classId: PlayerClassId,
  now: number,
  playerLevel: number,
  /** Extra luck multiplier — e.g. set-bonus "Illusionniste". */
  extraLuck: number = 1.0,
): EquipmentItem | null {
  // Hard equipment lock — pre-L10 the player only ever earns consumables.
  if (playerLevel < EQUIPMENT_UNLOCK_LEVEL) return null;

  const playerClass = getPlayerClass(classId);
  const luck =
    (playerClass.passiveEffects?.lootLuck ?? 1.0) * extraLuck;
  const upgradeChance =
    playerClass.passiveEffects?.rarityUpgradeChance ?? 0;

  // Drop gate
  const chance = Math.min(1, DROP_CHANCE_BY_RANK[rank] * luck);
  if (Math.random() > chance) return null;

  // Rarity (with optional upgrade for lucky classes), clamped by level.
  let rarity = RARITY_BY_RANK[rank];
  if (upgradeChance > 0 && Math.random() < upgradeChance) {
    rarity = upgradeRarity(rarity);
  }
  const clamped = clampRarityToLevel(rarity, playerLevel);
  if (!clamped) return null;

  const tpl = pickRandomTemplate(clamped);
  if (!tpl) return null;
  return mintItem(tpl, now, 'end_session');
}

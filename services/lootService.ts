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
 *  - Drop chance = DROP_CHANCE_BY_RANK[rank] × class.lootLuck
 *  - Rarity baseline = RARITY_BY_RANK[rank]
 *  - Class may grant a rarityUpgradeChance (Mage: 30 %) to bump the tier
 *
 * Returns a freshly-minted EquipmentItem ready to drop into the inventory,
 * or null when no loot drops.
 */
export function rollEndSessionLoot(
  rank: Rank,
  classId: PlayerClassId,
  now: number,
  /** Extra luck multiplier — e.g. set-bonus "Illusionniste". */
  extraLuck: number = 1.0,
): EquipmentItem | null {
  const playerClass = getPlayerClass(classId);
  const luck =
    (playerClass.passiveEffects?.lootLuck ?? 1.0) * extraLuck;
  const upgradeChance =
    playerClass.passiveEffects?.rarityUpgradeChance ?? 0;

  // Drop gate
  const chance = Math.min(1, DROP_CHANCE_BY_RANK[rank] * luck);
  if (Math.random() > chance) return null;

  // Rarity (with optional upgrade for lucky classes)
  let rarity = RARITY_BY_RANK[rank];
  if (upgradeChance > 0 && Math.random() < upgradeChance) {
    rarity = upgradeRarity(rarity);
  }

  const tpl = pickRandomTemplate(rarity);
  if (!tpl) return null;
  return mintItem(tpl, now, 'end_session');
}

import type {
  EquipmentItem,
  EquipmentSlot,
  ExerciseCategory,
  Movement,
} from '@/types';

/**
 * Set Bonuses (synergies) — active when ALL `requiredItems` templateIds
 * are currently equipped. Effects stack with class + title + equipment
 * bonuses but each set can only contribute once.
 */

export type ItemSetEffect =
  | {
      kind: 'xp_boost';
      multiplier: number;
      /** Optional narrowing — applied only when the set's niche matches. */
      filter?: {
        category?: ExerciseCategory;
        movement?: Movement;
      };
    }
  | { kind: 'loot_luck'; multiplier: number }
  | { kind: 'fatigue_reduction'; points: number };

export interface ItemSet {
  id: string;
  name: string;
  description: string;
  /** Template ids of the items composing the set. */
  requiredItems: string[];
  bonusLabel: string;
  effect: ItemSetEffect;
  colorHex: string;
}

export const ITEM_SETS: readonly ItemSet[] = [
  {
    id: 'set_monarque_fer',
    name: 'Monarque de Fer',
    description: 'Lame + cuirasse. La force du Tanker décuplée sur les compounds.',
    requiredItems: ['epic_weapon_blade', 'epic_body_armor'],
    bonusLabel: '+10 % XP sur tout mouvement composé.',
    effect: {
      kind: 'xp_boost',
      multiplier: 1.10,
      filter: { movement: 'compound' },
    },
    colorHex: '#F59E0B',
  },
  {
    id: 'set_illusionniste',
    name: 'Illusionniste',
    description: 'Dague + ceinture + serre-tête. La chance arcanique sourit au porteur.',
    requiredItems: [
      'legendary_weapon_kasaka',
      'rare_accessory_belt',
      'rare_head_headband',
    ],
    bonusLabel: '×1.25 chance de loot en fin de donjon.',
    effect: { kind: 'loot_luck', multiplier: 1.25 },
    colorHex: '#A855F7',
  },
  {
    id: 'set_poids_plume',
    name: 'Poids Plume',
    description: 'Gants + bracelet. La respiration devient légère.',
    requiredItems: ['common_weapon_gloves', 'common_accessory_wristband'],
    bonusLabel: '-15 pts de fatigue globale affichée.',
    effect: { kind: 'fatigue_reduction', points: 15 },
    colorHex: '#22D3EE',
  },
];

export const ITEM_SETS_BY_ID: Record<string, ItemSet> = ITEM_SETS.reduce(
  (acc, s) => { acc[s.id] = s; return acc; },
  {} as Record<string, ItemSet>,
);

/** Which required items of a set are currently equipped? */
export function setProgress(
  set: ItemSet,
  equipped: Record<EquipmentSlot, EquipmentItem | null>,
): { matched: number; required: number; active: boolean } {
  const equippedTemplateIds = Object.values(equipped)
    .filter((i): i is EquipmentItem => !!i)
    .map(i => i.templateId);
  const matched = set.requiredItems.filter(id =>
    equippedTemplateIds.includes(id),
  ).length;
  return {
    matched,
    required: set.requiredItems.length,
    active: matched === set.requiredItems.length,
  };
}

/** All sets currently active given the equipped map. */
export function getActiveSets(
  equipped: Record<EquipmentSlot, EquipmentItem | null>,
): ItemSet[] {
  return ITEM_SETS.filter(s => setProgress(s, equipped).active);
}

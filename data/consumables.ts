import type { ConsumableItem, ConsumableTemplate } from '@/types';

/**
 * Catalog of consumable templates. Instances are minted via mintConsumable()
 * and stored in profile.inventory.consumables. The store's consumeItem()
 * action applies the effect and removes the instance.
 *
 * V2 — aligned with the Admin Console spec:
 *   ELIXIR_FATIGUE    → subtracts 30 % of every muscle's 24 h volume
 *   KEY_S_RANK        → flags the next session as a Rank-S dungeon
 *   SCROLL_DOUBLE_XP  → ×2 global XP for 60 minutes
 */
export const CONSUMABLE_TEMPLATES: readonly ConsumableTemplate[] = [
  {
    id: 'RATION_FRAICHE',
    name: 'Ration Fraîche',
    description:
      'Vivres standards du Système. Évapore 10 % de ta fatigue musculaire. ' +
      'Le seul kit accordé aux chasseurs novices.',
    icon: 'flask',
    rarity: 'common',
    subtype: 'elixir',
    effect: { kind: 'reduce_volume24h', percent: 10 },
  },
  {
    id: 'ELIXIR_FATIGUE',
    name: 'Élixir de Récupération',
    description:
      "Fiole scintillante du Système. Évapore 30 % de ta fatigue musculaire instantanément.",
    icon: 'flask',
    rarity: 'rare',
    subtype: 'elixir',
    effect: { kind: 'reduce_volume24h', percent: 30 },
  },
  {
    id: 'SCROLL_DOUBLE_XP',
    name: 'Parchemin de Double XP',
    description:
      "Sceau arcanique. Double ton XP pour les 60 prochaines minutes d'entraînement.",
    icon: 'sparkles',
    rarity: 'epic',
    subtype: 'scroll',
    effect: { kind: 'xp_boost_timed', multiplier: 2, durationSec: 60 * 60 },
  },
  {
    id: 'KEY_S_RANK',
    name: 'Clé de Donjon · Rang S',
    description:
      'Clé runique scellée. La prochaine séance devient un donjon de rang S — loot garanti au plus haut palier.',
    icon: 'key',
    rarity: 'legendary',
    subtype: 'key',
    effect: { kind: 'unlock_dungeon' },
  },
  {
    id: 'monarch_heart',
    name: 'Cœur du Monarque',
    description:
      'Relique légendaire. Ramène tous les muscles à l\'état frais.',
    icon: 'gem',
    rarity: 'legendary',
    subtype: 'relic',
    effect: { kind: 'reduce_fatigue', percent: 100 },
  },
];

export const CONSUMABLE_TEMPLATES_BY_ID: Record<string, ConsumableTemplate> =
  CONSUMABLE_TEMPLATES.reduce(
    (acc, t) => { acc[t.id] = t; return acc; },
    {} as Record<string, ConsumableTemplate>,
  );

let CONSUMABLE_SEQ = 0;

export function mintConsumable(
  template: ConsumableTemplate,
  now: number,
): ConsumableItem {
  return {
    id: `cns_${now}_${CONSUMABLE_SEQ++}`,
    templateId: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon,
    rarity: template.rarity,
    subtype: template.subtype,
    effect: JSON.parse(JSON.stringify(template.effect)),
    acquiredAt: now,
  };
}

/**
 * Fresh-profile starter pack — V3 nerf: a single Common ration. Powerful
 * consumables (Elixir / Scroll / Key / Cœur du Monarque) are now earned
 * through gameplay, not handed out.
 */
export function createStarterConsumables(now: number): ConsumableItem[] {
  const ration = CONSUMABLE_TEMPLATES_BY_ID.RATION_FRAICHE!;
  return [mintConsumable(ration, now)];
}

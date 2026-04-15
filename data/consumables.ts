import type { ConsumableItem, ConsumableTemplate } from '@/types';

/**
 * Catalog of consumable templates. Instances are minted via mintConsumable()
 * and stored in profile.inventory.consumables. The store's consumeItem()
 * action applies the effect and removes the instance.
 */
export const CONSUMABLE_TEMPLATES: readonly ConsumableTemplate[] = [
  {
    id: 'health_elixir',
    name: 'Élixir de Santé',
    description:
      "Fiole lumineuse du Système. Soulage les muscles les plus fatigués en un instant.",
    icon: 'flask',
    rarity: 'rare',
    subtype: 'elixir',
    effect: { kind: 'reduce_fatigue', percent: 20 },
  },
  {
    id: 'power_scroll',
    name: 'Parchemin de Puissance',
    description:
      "Parchemin scellé du Système. Transmet un fragment d'énergie arcanique au porteur.",
    icon: 'sparkles',
    rarity: 'epic',
    subtype: 'scroll',
    effect: { kind: 'instant_xp', amount: 500 },
  },
  {
    id: 'dungeon_key_basic',
    name: 'Clé de Donjon (Basic)',
    description: 'Clé délivrée par un Chasseur rang E. Permet d\'ouvrir une porte instable.',
    icon: 'key',
    rarity: 'common',
    subtype: 'key',
    effect: { kind: 'unlock_dungeon' },
  },
  {
    id: 'monarch_heart',
    name: 'Cœur du Monarque',
    description:
      "Relique légendaire. Ramène tous les muscles à l'état frais.",
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

/** Fresh-profile starter pack — gives the user 2 elixirs + 1 key. */
export function createStarterConsumables(now: number): ConsumableItem[] {
  return [
    mintConsumable(CONSUMABLE_TEMPLATES_BY_ID.health_elixir!, now),
    mintConsumable(CONSUMABLE_TEMPLATES_BY_ID.health_elixir!, now + 1),
    mintConsumable(CONSUMABLE_TEMPLATES_BY_ID.dungeon_key_basic!, now + 2),
  ];
}

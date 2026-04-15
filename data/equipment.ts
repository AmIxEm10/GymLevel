import type {
  EquipmentItem,
  EquipmentRarity,
  EquipmentSlot,
  ItemTemplate,
} from '@/types';

/**
 * Static item catalog. Every drop clones one of these templates into an
 * EquipmentItem instance (with a unique id + acquiredAt timestamp).
 *
 * Multipliers are intentionally modest (1.02 – 1.15) so items feel
 * incremental: they are the "+1 sword" loop, not a second class.
 */
export const ITEM_TEMPLATES: readonly ItemTemplate[] = [
  // ================================================================ COMMON
  {
    id: 'common_head_bandana',
    name: 'Bandeau du Débutant',
    description: 'Un simple bandeau. Absorbe un peu de sueur, un peu d\'XP.',
    icon: '🎽',
    rarity: 'common',
    slot: 'head',
    bonuses: [
      {
        id: 'itm_common_head_bandana_01',
        label: 'Concentration',
        description: '+2 % XP sur les exercices cardio.',
        multiplier: 1.02,
        condition: { kind: 'category', category: 'cardio' },
      },
    ],
  },
  {
    id: 'common_body_shirt',
    name: 'T-shirt technique',
    description: 'Tissu respirant. Léger bonus sur les longues séries.',
    icon: '👕',
    rarity: 'common',
    slot: 'body',
    bonuses: [
      {
        id: 'itm_common_body_shirt_01',
        label: 'Respirabilité',
        description: '+3 % XP sur les séries de 15+ reps.',
        multiplier: 1.03,
        condition: { kind: 'high_reps', minReps: 15 },
      },
    ],
  },
  {
    id: 'common_weapon_gloves',
    name: 'Gants d\'entraînement',
    description: 'Paire de gants usés. Meilleure prise sur les haltères.',
    icon: '🧤',
    rarity: 'common',
    slot: 'weapon',
    bonuses: [
      {
        id: 'itm_common_weapon_gloves_01',
        label: 'Prise ferme',
        description: '+3 % XP avec haltères.',
        multiplier: 1.03,
        condition: { kind: 'equipment', equipments: ['dumbbell'] },
      },
    ],
  },
  {
    id: 'common_accessory_wristband',
    name: 'Bracelet de poignet',
    description: 'Soutient les poignets sur les poussées.',
    icon: '📿',
    rarity: 'common',
    slot: 'accessory',
    bonuses: [
      {
        id: 'itm_common_accessory_wristband_01',
        label: 'Appui',
        description: '+2 % XP sur les exercices push.',
        multiplier: 1.02,
        condition: { kind: 'category', category: 'push' },
      },
    ],
  },

  // ================================================================== RARE
  {
    id: 'rare_head_headband',
    name: 'Serre-tête du Ranger',
    description: 'Artefact léger. Améliore l\'endurance.',
    icon: '🪶',
    rarity: 'rare',
    slot: 'head',
    bonuses: [
      {
        id: 'itm_rare_head_headband_01',
        label: 'Foulée légère',
        description: '+5 % XP sur les HIIT.',
        multiplier: 1.05,
        condition: { kind: 'category', category: 'hiit' },
      },
    ],
  },
  {
    id: 'rare_body_vest',
    name: 'Gilet lesté du Chasseur',
    description: 'Gilet lourd qui transforme chaque mouvement corporel en épreuve.',
    icon: '🦺',
    rarity: 'rare',
    slot: 'body',
    bonuses: [
      {
        id: 'itm_rare_body_vest_01',
        label: 'Gravité lourde',
        description: '+6 % XP sur les exercices au poids du corps.',
        multiplier: 1.06,
        condition: { kind: 'bodyweight_exercise' },
      },
    ],
  },
  {
    id: 'rare_weapon_straps',
    name: 'Sangles de tirage',
    description: 'Accroche infaillible. Idéales pour les dos larges.',
    icon: '🧵',
    rarity: 'rare',
    slot: 'weapon',
    bonuses: [
      {
        id: 'itm_rare_weapon_straps_01',
        label: 'Griffes du dos',
        description: '+6 % XP sur les exercices pull.',
        multiplier: 1.06,
        condition: { kind: 'category', category: 'pull' },
      },
    ],
  },
  {
    id: 'rare_accessory_belt',
    name: 'Ceinture de force',
    description: 'Stabilise le core sous charge lourde.',
    icon: '🎗️',
    rarity: 'rare',
    slot: 'accessory',
    bonuses: [
      {
        id: 'itm_rare_accessory_belt_01',
        label: 'Verrou abdominal',
        description: '+5 % XP sur les composés en 1-6 reps.',
        multiplier: 1.05,
        condition: {
          kind: 'all_of',
          conditions: [
            { kind: 'rep_range', minReps: 1, maxReps: 6 },
            { kind: 'movement', movement: 'compound' },
          ],
        },
      },
    ],
  },

  // ================================================================== EPIC
  {
    id: 'epic_head_visor',
    name: 'Visière de l\'Archimage',
    description: 'Affûte la précision sur les machines et poulies.',
    icon: '🔮',
    rarity: 'epic',
    slot: 'head',
    bonuses: [
      {
        id: 'itm_epic_head_visor_01',
        label: 'Œil arcanique',
        description: '+8 % XP sur isolation machine/poulie.',
        multiplier: 1.08,
        condition: {
          kind: 'all_of',
          conditions: [
            { kind: 'movement', movement: 'isolation' },
            { kind: 'equipment', equipments: ['machine', 'cable'] },
          ],
        },
      },
    ],
  },
  {
    id: 'epic_body_armor',
    name: 'Armure du Tanker',
    description: 'Cuirasse d\'acier runique. Boost de force pure.',
    icon: '🛡️',
    rarity: 'epic',
    slot: 'body',
    bonuses: [
      {
        id: 'itm_epic_body_armor_01',
        label: 'Fondation',
        description: '+8 % XP sur les compounds en 1-5 reps.',
        multiplier: 1.08,
        condition: {
          kind: 'all_of',
          conditions: [
            { kind: 'rep_range', minReps: 1, maxReps: 5 },
            { kind: 'movement', movement: 'compound' },
          ],
        },
      },
      {
        id: 'itm_epic_body_armor_02',
        label: 'Gardien',
        description: '+2 % XP sur tout mouvement composé.',
        multiplier: 1.02,
        condition: { kind: 'movement', movement: 'compound' },
      },
    ],
  },
  {
    id: 'epic_weapon_blade',
    name: 'Lame du Fighter',
    description: 'Arme du corps-à-corps. Récompense la répétition méthodique.',
    icon: '⚔️',
    rarity: 'epic',
    slot: 'weapon',
    bonuses: [
      {
        id: 'itm_epic_weapon_blade_01',
        label: 'Tranchant hypertrophique',
        description: '+8 % XP sur les séries 8-12 reps.',
        multiplier: 1.08,
        condition: { kind: 'rep_range', minReps: 8, maxReps: 12 },
      },
    ],
  },
  {
    id: 'epic_accessory_amulet',
    name: 'Amulette du Healer',
    description: 'Pulse doucement en rythme avec le core.',
    icon: '🔱',
    rarity: 'epic',
    slot: 'accessory',
    bonuses: [
      {
        id: 'itm_epic_accessory_amulet_01',
        label: 'Noyau sacré',
        description: '+8 % XP sur la catégorie Core.',
        multiplier: 1.08,
        condition: { kind: 'category', category: 'core' },
      },
      {
        id: 'itm_epic_accessory_amulet_02',
        label: 'Constance',
        description: '+3 % XP dès 5 jours de streak.',
        multiplier: 1.03,
        condition: { kind: 'streak_active', minDays: 5 },
      },
    ],
  },

  // ============================================================= LEGENDARY
  {
    id: 'legendary_weapon_kasaka',
    name: 'Kasaka, Dague de l\'Ombre',
    description:
      'Légendaire arme du Chasseur Sung. N\'apparaît qu\'aux plus disciplinés.',
    icon: '🗡️',
    rarity: 'legendary',
    slot: 'weapon',
    bonuses: [
      {
        id: 'itm_legendary_weapon_kasaka_01',
        label: 'Démon intérieur',
        description: '+12 % XP sur tout exercice au poids du corps.',
        multiplier: 1.12,
        condition: { kind: 'bodyweight_exercise' },
      },
      {
        id: 'itm_legendary_weapon_kasaka_02',
        label: 'Réveil',
        description: '+5 % XP dès 7 jours de streak.',
        multiplier: 1.05,
        condition: { kind: 'streak_active', minDays: 7 },
      },
    ],
  },
  {
    id: 'legendary_body_raiment',
    name: 'Robe du Monarque',
    description: 'Tissée d\'XP pur. Porte la puissance d\'une légende.',
    icon: '🧥',
    rarity: 'legendary',
    slot: 'body',
    bonuses: [
      {
        id: 'itm_legendary_body_raiment_01',
        label: 'Aura royale',
        description: '+10 % XP sur les compounds.',
        multiplier: 1.10,
        condition: { kind: 'movement', movement: 'compound' },
      },
      {
        id: 'itm_legendary_body_raiment_02',
        label: 'Souffle infini',
        description: '+5 % XP sur les séries de 20+ reps.',
        multiplier: 1.05,
        condition: { kind: 'high_reps', minReps: 20 },
      },
    ],
  },
];

export const ITEM_TEMPLATES_BY_ID: Record<string, ItemTemplate> =
  ITEM_TEMPLATES.reduce(
    (acc, t) => { acc[t.id] = t; return acc; },
    {} as Record<string, ItemTemplate>,
  );

/** Pre-built pools indexed by rarity — used when quests roll random loot. */
export const ITEM_POOL_BY_RARITY: Record<EquipmentRarity, ItemTemplate[]> =
  ITEM_TEMPLATES.reduce(
    (acc, t) => {
      acc[t.rarity] = acc[t.rarity] ?? [];
      acc[t.rarity].push(t);
      return acc;
    },
    { common: [], rare: [], epic: [], legendary: [] } as Record<EquipmentRarity, ItemTemplate[]>,
  );

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

let INSTANCE_SEQ = 0;

/**
 * Mint a new EquipmentItem instance from a template.
 * Bonuses are deep-copied so future template edits don't mutate owned items.
 */
export function mintItem(
  template: ItemTemplate,
  now: number,
  sourceQuestId?: string,
): EquipmentItem {
  const id = `item_${now}_${INSTANCE_SEQ++}`;
  return {
    id,
    templateId: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon,
    rarity: template.rarity,
    slot: template.slot,
    bonuses: template.bonuses.map(b => ({
      ...b,
      // Make each instance-bonus unique so audit logs can distinguish them.
      id: `${id}_${b.id}`,
      // JSON clone keeps compatibility with Hermes (no structuredClone).
      condition: JSON.parse(JSON.stringify(b.condition)),
    })),
    acquiredAt: now,
    sourceQuestId,
  };
}

/** Pick a random template from the given pool, optionally filtered by slot. */
export function pickRandomTemplate(
  rarity: EquipmentRarity,
  slot?: EquipmentSlot,
): ItemTemplate | null {
  const pool = ITEM_POOL_BY_RARITY[rarity]?.filter(
    t => (slot ? t.slot === slot : true),
  );
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

/** Empty equipped slots — used when constructing a fresh inventory. */
export function emptyEquippedMap(): Record<EquipmentSlot, EquipmentItem | null> {
  return {
    head: null,
    body: null,
    weapon: null,
    accessory: null,
  };
}

import {
  Backpack,
  FlaskConical,
  Gem,
  HardHat,
  Key,
  Lock,
  Shield,
  Shirt,
  Sparkles,
  Sword,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InventoryItemDetailModal } from '@/components/InventoryItemDetailModal';
import {
  InventorySlot,
  RARITY_PALETTE,
  type InventoryDisplayItem,
} from '@/components/InventorySlot';
import { selectInventory, useAppStore } from '@/store/useAppStore';
import type { EquipmentItem, EquipmentSlot } from '@/types';

const TOTAL_SLOTS = 20;

/** Default Lucide icon per equipment slot — used when mapping store items. */
const SLOT_ICON: Record<EquipmentSlot, LucideIcon> = {
  head: HardHat,
  body: Shirt,
  weapon: Sword,
  accessory: Gem,
};

// ---------------------------------------------------------------------------
// Placeholder Solo-Leveling items — surface for the current build while the
// full consumable / key system isn't wired. They are displayed AFTER the
// player's real owned equipment so the UI stays honest.
// ---------------------------------------------------------------------------

const PLACEHOLDER_ITEMS: InventoryDisplayItem[] = [
  {
    id: 'placeholder_health_elixir',
    name: 'Élixir de Santé',
    rarity: 'rare',
    description:
      "Fiole lumineuse du Système. À consommer lors d'une séance pour soulager un muscle épuisé.",
    icon: FlaskConical,
    kind: 'consumable',
    effects: ['Réduit la fatigue globale de 20 % pendant 24 h.'],
  },
  {
    id: 'placeholder_force_gauntlets',
    name: 'Gantelets de Force',
    rarity: 'epic',
    description:
      'Gantelets runiques forgés dans les Abysses. Augmentent la puissance des poussées.',
    icon: Shield,
    kind: 'equipment',
    effects: ['+5 % XP sur tous les exercices de poussée (push).'],
  },
  {
    id: 'placeholder_dungeon_key_basic',
    name: 'Clé de Donjon (Basic)',
    rarity: 'common',
    description:
      'Clé délivrée par un Chasseur rang E. Permet d’ouvrir une porte instable.',
    icon: Key,
    kind: 'key',
    effects: ['Débloque une quête spéciale de rang E.'],
  },
  {
    id: 'placeholder_power_scroll',
    name: 'Parchemin de Puissance',
    rarity: 'epic',
    description:
      'Parchemin scellé du Système. Transmet un fragment d’énergie arcanique au porteur.',
    icon: Sparkles,
    kind: 'consumable',
    effects: [
      '+15 % XP global pendant la prochaine séance.',
      'Se consume à la première série validée.',
    ],
  },
  {
    id: 'placeholder_monarch_heart',
    name: "Cœur du Monarque",
    rarity: 'legendary',
    description:
      'Relique légendaire. Pulse au rythme de la volonté du Chasseur. Réservée aux plus disciplinés.',
    icon: Gem,
    kind: 'consumable',
    effects: [
      '+25 % XP global pendant 3 séances.',
      "Ne peut être utilisé qu'une fois par semaine.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Mapper: EquipmentItem (store) → InventoryDisplayItem (UI)
// ---------------------------------------------------------------------------

function fromEquipment(
  item: EquipmentItem,
  isEquipped: boolean,
): InventoryDisplayItem {
  return {
    id: item.id,
    name: item.name,
    rarity: item.rarity,
    description: item.description ?? 'Objet d\'équipement.',
    icon: SLOT_ICON[item.slot] ?? Gem,
    kind: 'equipment',
    equipped: isEquipped,
    effects: item.bonuses.map(b => b.description),
  };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function InventoryScreen() {
  const inventory = useAppStore(selectInventory);

  const [selected, setSelected] = useState<InventoryDisplayItem | null>(null);

  const displayItems = useMemo<InventoryDisplayItem[]>(() => {
    const equippedIds = new Set(
      Object.values(inventory.equipped)
        .filter((v): v is EquipmentItem => Boolean(v))
        .map(v => v.id),
    );
    const real = inventory.equipment.map(it =>
      fromEquipment(it, equippedIds.has(it.id)),
    );
    return [...real, ...PLACEHOLDER_ITEMS].slice(0, TOTAL_SLOTS);
  }, [inventory.equipment, inventory.equipped]);

  // Build the 20-slot grid: real + placeholders followed by locked slots.
  const slots: (InventoryDisplayItem | null)[] = useMemo(() => {
    const filled: (InventoryDisplayItem | null)[] = [...displayItems];
    while (filled.length < TOTAL_SLOTS) filled.push(null);
    return filled;
  }, [displayItems]);

  const byRarity = useMemo(() => {
    const counts: Record<string, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (const it of displayItems) counts[it.rarity] = (counts[it.rarity] ?? 0) + 1;
    return counts;
  }, [displayItems]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#0B0F19]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================== HEADER */}
        <View className="px-5 pt-4 pb-5">
          <Text className="text-[10px] font-semibold tracking-[6px] text-blue-400/70">
            LE SYSTÈME
          </Text>
          <Text
            className="mt-1 text-4xl font-black tracking-[3px] text-blue-300"
            style={{
              textShadowColor: '#60A5FA',
              textShadowRadius: 18,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            INVENTAIRE
          </Text>
          <View className="mt-3 h-[2px] w-24 bg-blue-400" />
          <View className="mt-[2px] h-[1px] w-16 bg-cyan-400/60" />

          <View className="mt-4 flex-row items-center">
            <Backpack size={14} color="#60A5FA" strokeWidth={1.75} />
            <Text className="ml-2 text-xs text-slate-300">
              <Text className="font-bold text-blue-300">
                {displayItems.length}
              </Text>{' '}
              / {TOTAL_SLOTS} emplacements occupés
            </Text>
          </View>
        </View>

        {/* ================================================== RARITY COUNTS */}
        <View className="mx-5 mb-4 flex-row overflow-hidden rounded-2xl border border-blue-500/20 bg-white/[0.03]">
          {(['common', 'rare', 'epic', 'legendary'] as const).map(
            (r, idx, arr) => {
              const meta = RARITY_PALETTE[r];
              const isLast = idx === arr.length - 1;
              return (
                <View
                  key={r}
                  className="flex-1 px-2 py-3"
                  style={{
                    borderRightWidth: isLast ? 0 : 1,
                    borderRightColor: 'rgba(96,165,250,0.15)',
                  }}
                >
                  <Text
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: meta.border }}
                  >
                    {meta.label}
                  </Text>
                  <Text className="mt-0.5 text-xl font-black text-slate-100">
                    {byRarity[r] ?? 0}
                  </Text>
                </View>
              );
            },
          )}
        </View>

        {/* ================================================== GRID */}
        <View className="flex-row flex-wrap px-4">
          {slots.map((item, i) => (
            <View key={item?.id ?? `empty_${i}`} className="w-1/4 p-1.5">
              <InventorySlot
                item={item}
                emptyIcon={Lock}
                onPress={item ? () => setSelected(item) : undefined}
              />
            </View>
          ))}
        </View>

        {/* Footer hint */}
        <Text className="mt-4 px-8 text-center text-[10px] italic text-slate-600">
          Les cases verrouillées se débloquent en grimpant de rang.
        </Text>
      </ScrollView>

      <InventoryItemDetailModal
        item={selected}
        visible={selected !== null}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

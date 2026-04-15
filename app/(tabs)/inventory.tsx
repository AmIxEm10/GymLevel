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
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InventoryItemDetailModal } from '@/components/InventoryItemDetailModal';
import {
  InventorySlot,
  RARITY_PALETTE,
  type InventoryDisplayItem,
} from '@/components/InventorySlot';
import { selectInventory, useAppStore } from '@/store/useAppStore';
import type {
  ConsumableItem,
  EquipmentItem,
  EquipmentSlot,
} from '@/types';

const TOTAL_SLOTS = 20;

/** Default Lucide icon per equipment slot — used when mapping store items. */
const SLOT_ICON: Record<EquipmentSlot, LucideIcon> = {
  head: HardHat,
  body: Shirt,
  weapon: Sword,
  accessory: Gem,
};

// Icon by consumable subtype
const CONSUMABLE_ICON: Record<string, LucideIcon> = {
  elixir: FlaskConical,
  scroll: Sparkles,
  key: Key,
  relic: Gem,
};

/** Map a store Consumable → display item. */
function fromConsumable(c: ConsumableItem): InventoryDisplayItem & {
  consumableId: string;
} {
  const Icon = CONSUMABLE_ICON[c.subtype] ?? Gem;
  const effects: string[] = [];
  switch (c.effect.kind) {
    case 'reduce_fatigue':
      effects.push(`Réduit la fatigue globale de ${c.effect.percent} %.`);
      break;
    case 'instant_xp':
      effects.push(`+${c.effect.amount} XP global immédiat.`);
      break;
    case 'unlock_dungeon':
      effects.push('Débloque une quête spéciale du Système.');
      break;
  }
  return {
    id: c.id,
    name: c.name,
    rarity: c.rarity,
    description: c.description ?? 'Objet consommable.',
    icon: Icon,
    kind: 'consumable',
    effects,
    consumableId: c.id,
  };
}

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
  const consumeItem = useAppStore(s => s.consumeItem);

  const [selected, setSelected] = useState<
    (InventoryDisplayItem & { consumableId?: string }) | null
  >(null);

  const displayItems = useMemo<
    Array<InventoryDisplayItem & { consumableId?: string }>
  >(() => {
    const equippedIds = new Set(
      Object.values(inventory.equipped)
        .filter((v): v is EquipmentItem => Boolean(v))
        .map(v => v.id),
    );
    const real = inventory.equipment.map(it =>
      fromEquipment(it, equippedIds.has(it.id)),
    );
    const consumables = inventory.consumables.map(fromConsumable);
    return [...consumables, ...real].slice(0, TOTAL_SLOTS);
  }, [inventory.equipment, inventory.equipped, inventory.consumables]);

  // Build the 20-slot grid: real + placeholders followed by locked slots.
  type SlotItem = (InventoryDisplayItem & { consumableId?: string }) | null;
  const slots: SlotItem[] = useMemo(() => {
    const filled: SlotItem[] = [...displayItems];
    while (filled.length < TOTAL_SLOTS) filled.push(null);
    return filled;
  }, [displayItems]);

  const handleConsume = () => {
    if (selected?.consumableId) {
      consumeItem(selected.consumableId);
      setSelected(null);
    }
  };

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
        onConsume={selected?.consumableId ? handleConsume : undefined}
      />
    </SafeAreaView>
  );
}

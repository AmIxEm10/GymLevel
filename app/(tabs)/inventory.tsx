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
import { ITEM_SETS } from '@/data/itemSets';
import {
  EQUIPMENT_UNLOCK_LEVEL,
  EPIC_UNLOCK_LEVEL,
  LEGENDARY_UNLOCK_LEVEL,
} from '@/services/lootService';
import { selectInventory, selectProfile, useAppStore } from '@/store/useAppStore';
import type {
  ConsumableItem,
  EquipmentItem,
  EquipmentSlot,
} from '@/types';

/** 20 slots total — 4 reserved for consumables, 16 for equipment. */
const TOTAL_SLOTS = 20;
const CONSUMABLE_SLOTS = 4;
const EQUIPMENT_SLOTS = TOTAL_SLOTS - CONSUMABLE_SLOTS;

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
  // Resolve the item's owning ItemSet (if any).
  const ownerSet = ITEM_SETS.find(s => s.requiredItems.includes(item.templateId));
  const effects = item.bonuses.map(b => b.description);
  if (ownerSet) {
    effects.push(`⚡ Appartient au Set : ${ownerSet.name}`);
  }
  return {
    id: item.id,
    name: item.name,
    rarity: item.rarity,
    description: item.description ?? 'Objet d\'équipement.',
    icon: SLOT_ICON[item.slot] ?? Gem,
    kind: 'equipment',
    equipped: isEquipped,
    effects,
    setId: ownerSet?.id,
    setColor: ownerSet?.colorHex,
  };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function InventoryScreen() {
  const inventory = useAppStore(selectInventory);
  const profile = useAppStore(selectProfile);
  const consumeItem = useAppStore(s => s.consumeItem);
  const equipItem = useAppStore(s => s.equipItem);
  const unequipItem = useAppStore(s => s.unequipItem);

  const equipmentUnlocked = profile.level >= EQUIPMENT_UNLOCK_LEVEL;

  const [selected, setSelected] = useState<
    | (InventoryDisplayItem & {
        consumableId?: string;
        equipmentId?: string;
        equipmentSlot?: EquipmentSlot;
      })
    | null
  >(null);

  type SlotItem =
    | (InventoryDisplayItem & {
        consumableId?: string;
        equipmentId?: string;
        equipmentSlot?: EquipmentSlot;
      })
    | null;

  const consumableSlots: SlotItem[] = useMemo(() => {
    const filled: SlotItem[] = inventory.consumables
      .slice(0, CONSUMABLE_SLOTS)
      .map(fromConsumable);
    while (filled.length < CONSUMABLE_SLOTS) filled.push(null);
    return filled;
  }, [inventory.consumables]);

  const equipmentSlotsArr: SlotItem[] = useMemo(() => {
    const equippedIds = new Set(
      Object.values(inventory.equipped)
        .filter((v): v is EquipmentItem => Boolean(v))
        .map(v => v.id),
    );
    const real: SlotItem[] = inventory.equipment.map(it => ({
      ...fromEquipment(it, equippedIds.has(it.id)),
      equipmentId: it.id,
      equipmentSlot: it.slot,
    }));
    while (real.length < EQUIPMENT_SLOTS) real.push(null);
    return real.slice(0, EQUIPMENT_SLOTS);
  }, [inventory.equipment, inventory.equipped]);

  const displayItems = useMemo<
    Array<InventoryDisplayItem & { consumableId?: string }>
  >(
    () => [
      ...inventory.consumables.map(fromConsumable),
      ...inventory.equipment.map(it => ({
        ...fromEquipment(
          it,
          Object.values(inventory.equipped).some(e => e?.id === it.id),
        ),
        equipmentId: it.id,
        equipmentSlot: it.slot,
      })),
    ],
    [inventory.consumables, inventory.equipment, inventory.equipped],
  );

  const handleConsume = () => {
    if (selected?.consumableId) {
      consumeItem(selected.consumableId);
      setSelected(null);
    }
  };

  const handleEquip = () => {
    if (selected?.equipmentId) {
      equipItem(selected.equipmentId);
      setSelected(null);
    }
  };

  const handleUnequip = () => {
    if (selected?.equipmentSlot) {
      unequipItem(selected.equipmentSlot);
      setSelected(null);
    }
  };

  const byRarity = useMemo(() => {
    const counts: Record<string, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (const it of displayItems) counts[it.rarity] = (counts[it.rarity] ?? 0) + 1;
    return counts;
  }, [displayItems]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#020617]">
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

        {/* ================================================== CONSUMABLES */}
        <View className="px-5 pb-2">
          <Text
            className="text-[11px] font-black uppercase tracking-[3px] text-cyan-300"
            style={{ textShadowColor: '#22D3EE', textShadowRadius: 6 }}
          >
            Consommables
          </Text>
          <View className="mt-1 h-[1px] w-12 bg-cyan-400/70" />
        </View>
        <View className="flex-row flex-wrap px-4">
          {consumableSlots.map((item, i) => (
            <View key={item?.id ?? `cons_${i}`} className="w-1/4 p-1.5">
              <InventorySlot
                item={item}
                emptyIcon={Lock}
                onPress={item ? () => setSelected(item) : undefined}
              />
            </View>
          ))}
        </View>

        {/* ================================================== EQUIPMENT */}
        <View className="mt-4 px-5 pb-2 flex-row items-end justify-between">
          <View>
            <Text
              className="text-[11px] font-black uppercase tracking-[3px]"
              style={{
                color: equipmentUnlocked ? '#A5F3FC' : '#64748B',
                textShadowColor: equipmentUnlocked ? '#22D3EE' : 'transparent',
                textShadowRadius: equipmentUnlocked ? 6 : 0,
              }}
            >
              Équipement
            </Text>
            <View
              className="mt-1 h-[1px] w-12"
              style={{
                backgroundColor: equipmentUnlocked ? '#22D3EE' : '#334155',
              }}
            />
          </View>
          <Text
            className="text-[9px] uppercase tracking-widest"
            style={{
              color: equipmentUnlocked ? '#94A3B8' : '#475569',
            }}
          >
            {equipmentUnlocked
              ? `Niv. ${profile.level} · Cap : ${rarityCapLabel(profile.level)}`
              : `Verrouillé · Niv. ${EQUIPMENT_UNLOCK_LEVEL}`}
          </Text>
        </View>

        {equipmentUnlocked ? (
          <View className="flex-row flex-wrap px-4">
            {equipmentSlotsArr.map((item, i) => (
              <View key={item?.id ?? `eq_${i}`} className="w-1/4 p-1.5">
                <InventorySlot
                  item={item}
                  emptyIcon={Lock}
                  onPress={item ? () => setSelected(item) : undefined}
                />
              </View>
            ))}
          </View>
        ) : (
          <EquipmentLockBanner playerLevel={profile.level} />
        )}

        {/* Footer hint */}
        <Text className="mt-4 px-8 text-center text-[10px] italic text-slate-600">
          {equipmentUnlocked
            ? `Rare au Nv. ${EQUIPMENT_UNLOCK_LEVEL} · Épique au Nv. ${EPIC_UNLOCK_LEVEL} · Légendaire au Nv. ${LEGENDARY_UNLOCK_LEVEL}.`
            : 'Continue à monter en niveau, chasseur. Les reliques se mériteront.'}
        </Text>
      </ScrollView>

      <InventoryItemDetailModal
        item={selected}
        visible={selected !== null}
        onClose={() => setSelected(null)}
        onConsume={selected?.consumableId ? handleConsume : undefined}
        onEquip={
          selected?.equipmentId && !selected.equipped ? handleEquip : undefined
        }
        onUnequip={
          selected?.equipmentId && selected.equipped ? handleUnequip : undefined
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rarityCapLabel(level: number): string {
  if (level >= LEGENDARY_UNLOCK_LEVEL) return 'Légendaire';
  if (level >= EPIC_UNLOCK_LEVEL) return 'Épique';
  return 'Rare';
}

function EquipmentLockBanner({ playerLevel }: { playerLevel: number }) {
  const remaining = Math.max(0, EQUIPMENT_UNLOCK_LEVEL - playerLevel);
  const ratio = Math.min(1, playerLevel / EQUIPMENT_UNLOCK_LEVEL);
  return (
    <View className="mx-5 mt-1 mb-2">
      <View
        className="items-center rounded-2xl border-2 border-dashed border-slate-700 bg-white/[0.02] p-6"
        style={{
          shadowColor: '#22D3EE',
          shadowOpacity: 0.15,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <View
          className="h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-950/80"
        >
          <Lock size={22} color="#64748B" strokeWidth={1.75} />
        </View>
        <Text
          className="mt-3 text-center text-[12px] font-black uppercase tracking-[3px] text-slate-300"
        >
          Débloqué au Niveau {EQUIPMENT_UNLOCK_LEVEL}
        </Text>
        <Text className="mt-2 text-center text-[10px] italic leading-5 text-slate-500">
          Le Système ne distribue pas d'équipement aux chasseurs novices.
          {remaining > 0
            ? ` Encore ${remaining} niveau${remaining > 1 ? 'x' : ''} avant la première relique.`
            : ''}
        </Text>
        <View className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
          <View
            className="h-full rounded-full bg-cyan-400"
            style={{ width: `${ratio * 100}%` }}
          />
        </View>
        <Text className="mt-1 text-[9px] uppercase tracking-widest text-slate-600">
          Niv. {playerLevel} / {EQUIPMENT_UNLOCK_LEVEL}
        </Text>
      </View>
    </View>
  );
}

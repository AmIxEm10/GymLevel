import { Lock, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { EquipmentRarity } from '@/types';

/**
 * Minimal shape consumed by the Inventory UI — covers real EquipmentItem
 * instances AND placeholder consumables/keys while the full consumable
 * system isn't built out.
 */
export interface InventoryDisplayItem {
  id: string;
  name: string;
  rarity: EquipmentRarity;
  description: string;
  /** Lucide icon component used as the item's avatar. */
  icon: LucideIcon;
  kind: 'equipment' | 'consumable' | 'key';
  equipped?: boolean;
  /** Human-readable effect lines shown in the detail modal. */
  effects?: string[];
}

// ---------------------------------------------------------------------------
// Rarity palette
// ---------------------------------------------------------------------------

export const RARITY_PALETTE: Record<
  EquipmentRarity,
  {
    label: string;
    border: string;       // neon border color
    iconColor: string;    // icon tint
    glow: string;         // shadow color
    bgHex: string;        // subtle inner gradient tint
    textClass: string;    // Tailwind class for labels
  }
> = {
  common: {
    label: 'Commun',
    border: '#94A3B8',
    iconColor: '#CBD5E1',
    glow: '#94A3B8',
    bgHex: 'rgba(148,163,184,0.08)',
    textClass: 'text-slate-300',
  },
  rare: {
    label: 'Rare',
    border: '#60A5FA',
    iconColor: '#BFDBFE',
    glow: '#60A5FA',
    bgHex: 'rgba(96,165,250,0.10)',
    textClass: 'text-blue-200',
  },
  epic: {
    label: 'Épique',
    border: '#A855F7',
    iconColor: '#DDD6FE',
    glow: '#A855F7',
    bgHex: 'rgba(168,85,247,0.12)',
    textClass: 'text-purple-200',
  },
  legendary: {
    label: 'Légendaire',
    border: '#FBBF24',
    iconColor: '#FEF3C7',
    glow: '#FBBF24',
    bgHex: 'rgba(251,191,36,0.14)',
    textClass: 'text-amber-200',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SlotProps {
  item: InventoryDisplayItem | null;
  onPress?: () => void;
  /** Allow the consumer to override the background for empty slots. */
  emptyIcon?: LucideIcon;
}

export function InventorySlot({ item, onPress, emptyIcon }: SlotProps) {
  if (!item) {
    return <EmptySlot icon={emptyIcon} />;
  }

  const palette = RARITY_PALETTE[item.rarity];
  const Icon = item.icon;

  return (
    <Pressable
      onPress={onPress}
      className="aspect-square rounded-xl bg-slate-900/80 p-2 active:opacity-75"
      style={{
        borderWidth: 1.5,
        borderColor: palette.border,
        shadowColor: palette.glow,
        shadowOpacity: item.rarity === 'legendary' ? 0.95 : 0.55,
        shadowRadius: item.rarity === 'legendary' ? 16 : 10,
        shadowOffset: { width: 0, height: 0 },
        // Subtle inner tint (react-native-web supports a linear-gradient
        // via inlineStyle, but to stay cross-platform we just use a flat
        // rgba backgroundColor layered over bg-slate-900/80).
        backgroundColor: palette.bgHex,
      }}
    >
      {/* Equipped badge */}
      {item.equipped ? (
        <View
          className="absolute right-1 top-1 rounded-sm px-1 py-[1px]"
          style={{
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        >
          <Text
            className="text-[8px] font-black uppercase tracking-widest"
            style={{ color: palette.border }}
          >
            E
          </Text>
        </View>
      ) : null}

      {/* Icon */}
      <View className="flex-1 items-center justify-center">
        <Icon
          size={30}
          color={palette.iconColor}
          strokeWidth={1.75}
        />
      </View>

      {/* Name */}
      <Text
        numberOfLines={1}
        className={`text-[9px] text-center font-bold uppercase tracking-widest ${palette.textClass}`}
        style={{
          textShadowColor: palette.glow,
          textShadowRadius: 6,
          textShadowOffset: { width: 0, height: 0 },
        }}
      >
        {item.name}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty slot
// ---------------------------------------------------------------------------

function EmptySlot({ icon }: { icon?: LucideIcon }) {
  const Icon = icon ?? Lock;
  return (
    <View
      className="aspect-square items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60"
    >
      <Icon size={22} color="#1E293B" strokeWidth={1.5} />
    </View>
  );
}

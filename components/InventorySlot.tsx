import { Lock, Sparkles, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

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
  /** If the item belongs to a Set, that set's id + colour drive the badge. */
  setId?: string;
  setColor?: string;
}

// ---------------------------------------------------------------------------
// Rarity palette — V2
//   COMMON     → slate
//   RARE       → cyan   (matches the Profile aura tier 1)
//   EPIC       → purple (matches the Profile aura tier 2)
//   LEGENDARY  → gold   (matches the Profile aura tier 3 — and ONLY this
//                        tier triggers the sparkle + pulse effects)
// ---------------------------------------------------------------------------

/** Single source of truth for rarity hex values, consumed across the app. */
export const RARITY_COLORS: Record<EquipmentRarity, string> = {
  common:    '#94A3B8',
  rare:      '#22D3EE', // cyan — was blue (#60A5FA), now cohesive with aura
  epic:      '#A855F7',
  legendary: '#F59E0B', // gold border (warmer than #FBBF24 used for the glow)
};

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
    border: RARITY_COLORS.common,
    iconColor: '#CBD5E1',
    glow: RARITY_COLORS.common,
    bgHex: 'rgba(148,163,184,0.08)',
    textClass: 'text-slate-300',
  },
  rare: {
    label: 'Rare',
    border: RARITY_COLORS.rare,
    iconColor: '#A5F3FC',
    glow: RARITY_COLORS.rare,
    bgHex: 'rgba(34,211,238,0.10)',
    textClass: 'text-cyan-200',
  },
  epic: {
    label: 'Épique',
    border: RARITY_COLORS.epic,
    iconColor: '#DDD6FE',
    glow: RARITY_COLORS.epic,
    bgHex: 'rgba(168,85,247,0.12)',
    textClass: 'text-purple-200',
  },
  legendary: {
    label: 'Légendaire',
    border: RARITY_COLORS.legendary,
    iconColor: '#FEF3C7',
    glow: '#FBBF24',
    bgHex: 'rgba(245,158,11,0.14)',
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
  const isLegendary = item?.rarity === 'legendary';

  // Slow pulse on the outer glow — reserved to LEGENDARY items only.
  // Declared at the top so the hook ordering is stable across renders.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isLegendary) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLegendary, pulse]);

  if (!item) {
    return <EmptySlot icon={emptyIcon} />;
  }

  const palette = RARITY_PALETTE[item.rarity];
  const Icon = item.icon;

  // Glow intensity per rarity — calm for common/rare/epic, vivid for legendary.
  const baseShadowOpacity =
    item.rarity === 'common' ? 0.35 :
    item.rarity === 'rare'   ? 0.55 :
    item.rarity === 'epic'   ? 0.75 :
    0.95;
  const baseShadowRadius =
    item.rarity === 'common' ? 6 :
    item.rarity === 'rare'   ? 9 :
    item.rarity === 'epic'   ? 12 :
    18;

  // For legendary we drive shadow opacity / radius through the pulse value.
  const shadowOpacity = isLegendary
    ? (pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.7, 1],
      }) as unknown as number)
    : baseShadowOpacity;
  const shadowRadius = isLegendary
    ? (pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [14, 22],
      }) as unknown as number)
    : baseShadowRadius;

  return (
    <AnimatedPressable
      onPress={onPress}
      className="aspect-square rounded-xl bg-slate-900/80 p-2 active:opacity-75"
      style={{
        borderWidth: isLegendary ? 2 : 1.5,
        borderColor: palette.border,
        shadowColor: palette.glow,
        shadowOpacity,
        shadowRadius,
        shadowOffset: { width: 0, height: 0 },
        // Subtle inner tint cross-platform (no gradient).
        backgroundColor: palette.bgHex,
      }}
    >
      {/* Set badge (top-left) — when the item belongs to a known Set. */}
      {item.setId && item.setColor ? (
        <View
          className="absolute left-1 top-1 h-3.5 w-3.5 items-center justify-center rounded-full"
          style={{
            borderWidth: 1,
            borderColor: item.setColor,
            backgroundColor: 'rgba(0,0,0,0.65)',
            shadowColor: item.setColor,
            shadowOpacity: 0.9,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: item.setColor,
            }}
          />
        </View>
      ) : null}

      {/* Sparkle — RESERVED to legendary items, top-left corner. */}
      {isLegendary ? (
        <View className="absolute left-1 top-1">
          <Sparkles size={10} color="#FEF3C7" strokeWidth={2} />
        </View>
      ) : null}

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
          textShadowRadius: isLegendary ? 8 : 4,
          textShadowOffset: { width: 0, height: 0 },
        }}
      >
        {item.name}
      </Text>
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

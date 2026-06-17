import { Gem, HardHat, Shirt, Sparkles, Sword } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Text, View, Easing } from 'react-native';

import { RARITY_PALETTE } from '@/components/InventorySlot';
import { useAppStore } from '@/store/useAppStore';
import type { EquipmentSlot, EquipmentItem } from '@/types';

const SLOT_ICON: Record<EquipmentSlot, typeof Gem> = {
  head: HardHat,
  body: Shirt,
  weapon: Sword,
  accessory: Gem,
};

/**
 * Full-screen loot drop modal — shows when the store has a lastLootDrop.
 * Animated entry (scale + fade), neon border + pulsing aura in the rarity
 * colour. Close button calls dismissLootDrop().
 */
export function LootDropModal() {
  const item = useAppStore(s => s.lastLootDrop);
  const dismiss = useAppStore(s => s.dismissLootDrop);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (item) {
      opacity.setValue(0);
      scale.setValue(0.85);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtle pulse on the outer glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [item, opacity, scale, pulse]);

  if (!item) return null;
  const palette = RARITY_PALETTE[item.rarity];
  const Icon = SLOT_ICON[item.slot] ?? Gem;

  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="none"
      onRequestClose={dismiss}
    >
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: 'rgba(3,6,12,0.9)',
          opacity,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ backdropFilter: 'blur(12px)' } as any),
        }}
      >
        {/* Flavor line above card */}
        <Animated.Text
          className="mb-3 text-[10px] font-bold uppercase tracking-[6px]"
          style={{
            color: palette.border,
            textShadowColor: palette.glow,
            textShadowRadius: 10,
            opacity,
          }}
        >
          ◇ Récompense du Système ◇
        </Animated.Text>

        <Animated.View
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 24,
            padding: 28,
            backgroundColor: 'rgba(0,0,0,0.85)',
            borderWidth: 2,
            borderColor: palette.border,
            transform: [{ scale }],
            shadowColor: palette.glow,
            shadowOpacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.65, 1],
            }) as unknown as number,
            shadowRadius: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 30],
            }) as unknown as number,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <RarityChip palette={palette} />
          <HeroIcon item={item} palette={palette} Icon={Icon} />
          <BonusesList item={item} palette={palette} />
          <CloseButton dismiss={dismiss} palette={palette} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function RarityChip({ palette }: { palette: typeof RARITY_PALETTE[keyof typeof RARITY_PALETTE] }) {
  return (
    <View className="items-center">
      <View
        className="rounded-md px-2 py-0.5"
        style={{
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
      >
        <Text
          className={`text-[10px] font-black uppercase tracking-[5px] ${palette.textClass}`}
          style={{ textShadowColor: palette.glow, textShadowRadius: 6 }}
        >
          {palette.label}
        </Text>
      </View>
    </View>
  );
}

function HeroIcon({ item, palette, Icon }: { item: EquipmentItem, palette: typeof RARITY_PALETTE[keyof typeof RARITY_PALETTE], Icon: typeof Gem }) {
  return (
    <View className="mt-5 items-center">
      <View
        className="h-28 w-28 items-center justify-center rounded-2xl bg-white/[0.04]"
        style={{
          borderWidth: 2,
          borderColor: palette.border,
          shadowColor: palette.glow,
          shadowOpacity: 0.95,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Icon size={54} color={palette.iconColor} strokeWidth={1.75} />
      </View>

      <Text
        className="mt-5 text-center text-2xl font-black tracking-wider text-slate-100"
        style={{
          textShadowColor: palette.glow,
          textShadowRadius: 14,
          textShadowOffset: { width: 0, height: 0 },
        }}
      >
        {item.name.toUpperCase()}
      </Text>

      {item.description ? (
        <Text className="mt-2 text-center text-xs italic leading-relaxed text-slate-400">
          {item.description}
        </Text>
      ) : null}
    </View>
  );
}

function BonusesList({ item, palette }: { item: EquipmentItem, palette: typeof RARITY_PALETTE[keyof typeof RARITY_PALETTE] }) {
  if (item.bonuses.length === 0) return null;

  return (
    <View className="mt-5 rounded-xl border border-slate-800 bg-white/[0.02] p-3">
      <View className="flex-row items-center">
        <Sparkles size={12} color={palette.border} />
        <Text
          className="ml-2 text-[10px] font-bold uppercase tracking-[3px] text-slate-400"
        >
          Effets
        </Text>
      </View>
      <View className="mt-1.5 gap-1">
        {item.bonuses.map(b => (
          <Text
            key={b.id}
            className="text-[11px] leading-relaxed text-slate-300"
          >
            ◆ {b.description}
          </Text>
        ))}
      </View>
    </View>
  );
}

function CloseButton({ dismiss, palette }: { dismiss: () => void, palette: typeof RARITY_PALETTE[keyof typeof RARITY_PALETTE] }) {
  return (
    <Pressable
      onPress={dismiss}
      className="mt-6 rounded-xl border-2 py-3 active:opacity-70"
      style={{
        borderColor: palette.border,
        backgroundColor: 'rgba(255,255,255,0.04)',
        shadowColor: palette.glow,
        shadowOpacity: 0.7,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Text
        className="text-center text-sm font-black uppercase tracking-[4px]"
        style={{
          color: palette.border,
          textShadowColor: palette.glow,
          textShadowRadius: 8,
        }}
      >
        Fermer
      </Text>
    </Pressable>
  );
}

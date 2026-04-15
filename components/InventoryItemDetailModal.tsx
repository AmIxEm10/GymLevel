import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import {
  RARITY_PALETTE,
  type InventoryDisplayItem,
} from '@/components/InventorySlot';

interface Props {
  item: InventoryDisplayItem | null;
  visible: boolean;
  onClose: () => void;
}

/**
 * Full-screen modal that blurs the background (web only — native falls back
 * to a dark backdrop) and displays the selected item's details with a neon
 * border matching its rarity.
 */
export function InventoryItemDetailModal({ item, visible, onClose }: Props) {
  if (!item) return null;
  const palette = RARITY_PALETTE[item.rarity];
  const Icon = item.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      hardwareAccelerated
    >
      {/* Backdrop — click outside to close */}
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: 'rgba(5,8,15,0.78)',
          // web-only: actually blur the background
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ backdropFilter: 'blur(10px)' } as any),
        }}
      >
        {/* Card — stop propagation so inner taps don't close the modal */}
        <Pressable
          onPress={e => e?.stopPropagation?.()}
          className="w-full max-w-md rounded-3xl bg-black/80 p-6"
          style={{
            borderWidth: 2,
            borderColor: palette.border,
            shadowColor: palette.glow,
            shadowOpacity: 0.95,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          {/* Header row */}
          <View className="flex-row items-start justify-between">
            <View
              className="rounded-md px-2 py-0.5"
              style={{
                borderWidth: 1,
                borderColor: palette.border,
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            >
              <Text
                className={`text-[10px] font-black uppercase tracking-[4px] ${palette.textClass}`}
                style={{ textShadowColor: palette.glow, textShadowRadius: 6 }}
              >
                {palette.label}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="rounded-lg border border-slate-700 bg-white/5 p-1.5 active:opacity-60"
            >
              <X size={14} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Icon hero */}
          <View className="mt-5 items-center">
            <View
              className="h-24 w-24 items-center justify-center rounded-2xl bg-white/[0.03]"
              style={{
                borderWidth: 1.5,
                borderColor: palette.border,
                shadowColor: palette.glow,
                shadowOpacity: 0.9,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Icon size={48} color={palette.iconColor} strokeWidth={1.75} />
            </View>

            <Text
              className="mt-4 text-center text-2xl font-black tracking-wider text-slate-100"
              style={{
                textShadowColor: palette.glow,
                textShadowRadius: 12,
                textShadowOffset: { width: 0, height: 0 },
              }}
            >
              {item.name.toUpperCase()}
            </Text>

            {item.equipped ? (
              <Text
                className="mt-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: palette.border }}
              >
                Actuellement équipé
              </Text>
            ) : null}
          </View>

          {/* Description */}
          <Text className="mt-5 text-center text-sm leading-relaxed text-slate-300">
            {item.description}
          </Text>

          {/* Effects */}
          {item.effects && item.effects.length > 0 ? (
            <View className="mt-5 rounded-2xl border border-slate-800 bg-white/[0.02] p-4">
              <Text className="text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
                Effet magique
              </Text>
              <View className="mt-2 gap-1.5">
                {item.effects.map((effect, i) => (
                  <View key={i} className="flex-row items-start">
                    <Text
                      className="mr-2 mt-[2px] text-[12px]"
                      style={{ color: palette.border }}
                    >
                      ◆
                    </Text>
                    <Text className="flex-1 text-xs leading-relaxed text-slate-300">
                      {effect}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Footer hint */}
          <Text className="mt-5 text-center text-[10px] italic text-slate-600">
            Tape en dehors de la fenêtre pour fermer.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

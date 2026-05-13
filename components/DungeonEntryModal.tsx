import { AlertTriangle, DoorOpen, X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { RANK_META, type Rank } from '@/data/ranks';
import type { WorkoutTemplate } from '@/types';

interface Props {
  template: WorkoutTemplate | null;
  rank: Rank;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Solemn "do you really want to enter the dungeon" confirmation.
 * Background blur on web, neon border in the portal's rank colour.
 */
export function DungeonEntryModal({
  template,
  rank,
  visible,
  onConfirm,
  onCancel,
}: Props) {
  if (!template) return null;
  const meta = RANK_META[rank];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: 'rgba(3,6,12,0.88)',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ backdropFilter: 'blur(12px)' } as any),
        }}
      >
        <Pressable
          onPress={e => e?.stopPropagation?.()}
          className="w-full max-w-md rounded-3xl bg-black/85 p-6"
          style={{
            borderWidth: 2,
            borderColor: meta.color,
            shadowColor: meta.glow,
            shadowOpacity: 0.9,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          {/* Warning icon + close */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <AlertTriangle size={16} color={meta.color} strokeWidth={2} />
              <Text
                className="ml-2 text-[10px] font-black uppercase tracking-[5px]"
                style={{
                  color: meta.color,
                  textShadowColor: meta.glow,
                  textShadowRadius: 8,
                }}
              >
                Alerte de Portail · Rang {rank}
              </Text>
            </View>
            <Pressable
              onPress={onCancel}
              aria-label="Fermer"
              className="rounded-lg border border-slate-700 bg-white/5 p-1.5 active:opacity-60"
            >
              <X size={14} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Title */}
          <Text
            className="mt-4 text-2xl font-black tracking-wider text-slate-100"
            style={{
              textShadowColor: meta.glow,
              textShadowRadius: 14,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            {template.name.toUpperCase()}
          </Text>

          {/* Ominous body */}
          <View className="mt-4 rounded-xl border border-slate-800 bg-white/[0.02] p-4">
            <Text className="text-sm italic leading-relaxed text-slate-300">
              « Voulez-vous entrer dans le donjon ? Une fois à l'intérieur,
              vous ne pourrez pas ressortir tant que le Système n'aura pas
              consigné votre progression… »
            </Text>
            <Text className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Objectif : {template.exercises.length} exercices — durée
              estimée ~{template.estimatedDurationMinutes} min. Abandonner
              en cours réinitialisera le donjon mais conservera les séries
              validées.
            </Text>
          </View>

          {/* Actions */}
          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/60 py-3 active:opacity-70"
            >
              <Text className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                Reculer
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className="flex-1 flex-row items-center justify-center rounded-xl border-2 py-3 active:opacity-70"
              style={{
                borderColor: meta.color,
                backgroundColor: 'rgba(255,255,255,0.04)',
                shadowColor: meta.glow,
                shadowOpacity: 0.8,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <DoorOpen size={16} color={meta.color} strokeWidth={2.25} />
              <Text
                className="ml-2 text-xs font-black uppercase tracking-[3px]"
                style={{
                  color: meta.color,
                  textShadowColor: meta.glow,
                  textShadowRadius: 8,
                }}
              >
                Entrer
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

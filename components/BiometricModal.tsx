import {
  Activity,
  HeartPulse,
  Minus,
  Plus,
  Ruler,
  Scale,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

export type BiometricField = 'heightCm' | 'bodyweightKg' | 'restingBpm' | 'vo2max';

interface Props {
  field: BiometricField | null;
  onClose: () => void;
}

interface FieldConfig {
  label: string;
  unit: string;
  Icon: LucideIcon;
  min: number;
  max: number;
  step: number;
  color: string;
}

const FIELD_CONFIG: Record<BiometricField, FieldConfig> = {
  heightCm:     { label: 'Taille',       unit: 'cm',   Icon: Ruler,      min: 120, max: 230, step: 1,  color: '#22D3EE' },
  bodyweightKg: { label: 'Poids',        unit: 'kg',   Icon: Scale,      min: 30,  max: 250, step: 1,  color: '#A855F7' },
  restingBpm:   { label: 'Rythme cardiaque', unit: 'bpm', Icon: HeartPulse, min: 30,  max: 160, step: 1,  color: '#EF4444' },
  vo2max:       { label: 'VO2 max',      unit: 'ml/kg/min', Icon: Wind,   min: 15,  max: 80,  step: 1,  color: '#10B981' },
};

export function BiometricModal({ field, onClose }: Props) {
  const profile = useAppStore(s => s.profile);
  const updateBiometrics = useAppStore(s => s.updateBiometrics);

  const [draft, setDraft] = useState<number>(0);

  useEffect(() => {
    if (!field) return;
    const prefs = profile.preferences;
    const current = (prefs[field] as number | null | undefined) ?? null;
    const config = FIELD_CONFIG[field];
    const fallback =
      field === 'heightCm' ? 175
        : field === 'bodyweightKg' ? 70
        : field === 'restingBpm' ? 65
        : 40;
    setDraft(
      current !== null && typeof current === 'number'
        ? current
        : fallback,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);

  if (!field) return null;
  const config = FIELD_CONFIG[field];
  const Icon = config.Icon;

  const bump = (delta: number) => {
    setDraft(v => {
      const next = v + delta;
      return Math.max(config.min, Math.min(config.max, next));
    });
  };

  const save = () => {
    updateBiometrics({ [field]: draft } as Record<BiometricField, number>);
    onClose();
  };

  return (
    <Modal visible={field !== null} transparent animationType="fade" onRequestClose={onClose}>
      {/* F-04 — KeyboardAvoidingView prevents the keyboard from covering the
          value display and Save button on small iPhones. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: 'rgba(2,6,23,0.88)',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ backdropFilter: 'blur(12px)' } as any),
        }}
      >
        <Pressable
          onPress={e => e?.stopPropagation?.()}
          className="w-full max-w-md rounded-3xl bg-black/85 p-6"
          style={{
            borderWidth: 2,
            borderColor: config.color,
            shadowColor: config.color,
            shadowOpacity: 0.9,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Icon size={16} color={config.color} strokeWidth={2.25} />
              <Text
                className="ml-2 text-[10px] font-black uppercase tracking-[5px]"
                style={{
                  color: config.color,
                  textShadowColor: config.color,
                  textShadowRadius: 8,
                }}
              >
                Calibrage
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              aria-label="Close"
              className="rounded-lg border border-slate-700 bg-white/5 p-1.5 active:opacity-60"
            >
              <X size={14} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Label */}
          <Text
            className="mt-4 text-center text-xl font-black tracking-wider text-slate-100"
            style={{ textShadowColor: config.color, textShadowRadius: 10 }}
          >
            {config.label.toUpperCase()}
          </Text>

          {/* Value + buttons */}
          <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <View className="flex-row">
              <AdjustBtn onPress={() => bump(-10 * config.step)} color={config.color} label="-10" />
              <View style={{ width: 8 }} />
              <AdjustBtn onPress={() => bump(-config.step)} color={config.color} icon={Minus} />
            </View>

            <View className="items-center">
              <Text
                className="text-center text-4xl font-black"
                style={{
                  color: config.color,
                  textShadowColor: config.color,
                  textShadowRadius: 12,
                }}
              >
                {draft}
              </Text>
              <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                {config.unit}
              </Text>
            </View>

            <View className="flex-row">
              <AdjustBtn onPress={() => bump(config.step)} color={config.color} icon={Plus} />
              <View style={{ width: 8 }} />
              <AdjustBtn onPress={() => bump(10 * config.step)} color={config.color} label="+10" />
            </View>
          </View>

          <Text className="mt-2 text-center text-[10px] italic text-slate-600">
            {config.min} – {config.max} {config.unit}
          </Text>

          {/* Save */}
          <Pressable
            onPress={save}
            className="mt-5 items-center justify-center rounded-xl border-2 py-3 active:opacity-70"
            style={{
              borderColor: config.color,
              backgroundColor: `${config.color}25`,
              shadowColor: config.color,
              shadowOpacity: 0.85,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <View className="flex-row items-center">
              <Activity size={14} color={config.color} strokeWidth={2.5} />
              <Text
                className="ml-2 text-xs font-black uppercase tracking-[4px]"
                style={{
                  color: config.color,
                  textShadowColor: config.color,
                  textShadowRadius: 10,
                }}
              >
                Enregistrer
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AdjustBtn({
  onPress,
  color,
  icon: Icon,
  label,
}: {
  onPress: () => void;
  color: string;
  icon?: LucideIcon;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-lg border active:opacity-60"
      style={{
        borderColor: `${color}80`,
        backgroundColor: `${color}14`,
      }}
    >
      {Icon ? (
        <Icon size={16} color={color} strokeWidth={2.25} />
      ) : (
        <Text className="text-[10px] font-black" style={{ color }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

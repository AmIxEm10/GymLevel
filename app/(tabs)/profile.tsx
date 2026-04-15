import {
  Activity,
  Check,
  Edit2,
  HeartPulse,
  Ruler,
  Scale,
  Shield,
  Sparkles,
  Sword,
  Swords,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BodyView } from '@/components/BodyView';
import { FatigueBar, computeGlobalFatigue } from '@/components/FatigueBar';
import { GradientBar } from '@/components/GradientBar';
import { GrowthChart } from '@/components/GrowthChart';
import { RANK_INFO, RankEmblem, computeRank } from '@/components/RankEmblem';
import {
  selectPlayerClass,
  selectProfile,
  useAppStore,
} from '@/store/useAppStore';
import type { PlayerClassId } from '@/types';

// ---------------------------------------------------------------------------
// Class icon mapping (3 classes: guerrier / assassin / tank)
// ---------------------------------------------------------------------------

const PLAYER_CLASS_ICON: Record<PlayerClassId, LucideIcon> = {
  guerrier: Swords,
  assassin: Sword,
  tank: Shield,
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const profile = useAppStore(selectProfile);
  const playerClass = useAppStore(selectPlayerClass);
  const history = useAppStore(s => s.workoutHistory);
  const updateNickname = useAppStore(s => s.updateNickname);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profile.nickname);

  const ClassIcon = PLAYER_CLASS_ICON[profile.playerClassId] ?? Swords;
  const rank = computeRank(profile.level);
  const rankTagline = RANK_INFO[rank].tagline;
  const fatigue = computeGlobalFatigue(profile.muscleStats);
  const globalXpPercent = Math.min(
    100,
    (profile.totalXp / Math.max(1, profile.xpToNextLevel)) * 100,
  );

  const commitNickname = () => {
    const cleaned = draftName.trim().slice(0, 24);
    updateNickname(cleaned);
    setIsEditingName(false);
  };
  const cancelNicknameEdit = () => {
    setDraftName(profile.nickname);
    setIsEditingName(false);
  };
  const openNicknameEdit = () => {
    setDraftName(profile.nickname);
    setIsEditingName(true);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#020617]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================== HEADER */}
        <View className="px-5 pt-4 pb-4">
          <Text className="text-[10px] font-semibold tracking-[6px] text-blue-400/70">
            LE SYSTÈME
          </Text>

          <Text
            className="mt-1 text-5xl font-black tracking-[4px] text-blue-300"
            style={{
              textShadowColor: '#60A5FA',
              textShadowRadius: 18,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            STATUT
          </Text>

          <View className="mt-3 h-[2px] w-24 bg-blue-400" />
          <View className="mt-[2px] h-[1px] w-16 bg-cyan-400/60" />
        </View>

        {/* =========================== LEVEL HERO + NICKNAME */}
        <View className="mx-5 mb-4 overflow-hidden rounded-3xl border border-[#1e293b] bg-slate-950/60 p-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-[10px] uppercase tracking-[3px] text-slate-500">
                Chasseur
              </Text>

              {isEditingName ? (
                <View className="mt-1 flex-row items-center">
                  <TextInput
                    value={draftName}
                    onChangeText={setDraftName}
                    onSubmitEditing={commitNickname}
                    autoFocus
                    maxLength={24}
                    placeholder="Ton pseudo…"
                    placeholderTextColor="#475569"
                    selectionColor="#22D3EE"
                    className="flex-1 rounded-lg border border-cyan-400/60 bg-slate-900/80 px-3 py-2 text-base font-bold text-cyan-100"
                    style={{ textShadowColor: '#22D3EE', textShadowRadius: 6 }}
                  />
                  <Pressable
                    onPress={commitNickname}
                    className="ml-2 rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-3 py-2 active:opacity-60"
                  >
                    <Check size={14} color="#A5F3FC" />
                  </Pressable>
                  <Pressable
                    onPress={cancelNicknameEdit}
                    className="ml-1.5 rounded-lg border border-slate-700 bg-slate-800/60 p-2 active:opacity-60"
                  >
                    <X size={14} color="#94A3B8" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={openNicknameEdit}
                  className="mt-0.5 flex-row items-center active:opacity-60"
                >
                  <Text
                    className="text-xl font-black text-slate-100"
                    numberOfLines={1}
                  >
                    {profile.nickname?.trim() ? profile.nickname : 'Chasseur'}
                  </Text>
                  <View className="ml-2 rounded-md border border-cyan-400/40 bg-cyan-500/10 p-1">
                    <Edit2 size={11} color="#67E8F9" />
                  </View>
                </Pressable>
              )}

              <Text className="mt-3 text-[9px] uppercase tracking-[4px] text-cyan-400/70">
                NIVEAU
              </Text>
            </View>

            {/* HUGE level number */}
            <View className="items-end">
              <Text
                className="text-7xl font-black leading-none text-slate-100"
                style={{
                  textShadowColor: '#22D3EE',
                  textShadowRadius: 22,
                  textShadowOffset: { width: 0, height: 0 },
                  letterSpacing: -2,
                }}
              >
                {profile.level}
              </Text>
            </View>
          </View>

          {/* XP bar — full width with % on the right */}
          <View className="mt-4 flex-row items-center">
            <View className="flex-1">
              <GradientBar percent={globalXpPercent} height={6} />
            </View>
            <Text
              className="ml-3 text-[11px] font-black tracking-wider"
              style={{
                color: '#67E8F9',
                textShadowColor: '#22D3EE',
                textShadowRadius: 6,
              }}
            >
              {Math.round(globalXpPercent)}%
            </Text>
          </View>
          <Text className="mt-1 text-[10px] text-slate-600">
            {Math.round(profile.totalXp)} / {profile.xpToNextLevel} XP vers le
            prochain niveau
          </Text>
        </View>

        {/* =========================== BIOMETRIC STATS GRID 3×2 */}
        <View className="mx-5 mb-5">
          <View className="mb-2 flex-row items-end justify-between">
            <Text
              className="text-sm font-bold tracking-[2px] text-slate-100"
              style={{ textShadowColor: '#22D3EE', textShadowRadius: 6 }}
            >
              BIOMÉTRIE
            </Text>
            <Text className="text-[10px] uppercase tracking-widest text-slate-500">
              Indicateurs vitaux
            </Text>
          </View>
          <BiometricGrid profile={profile} />
        </View>

        {/* ================================================== RANK + CLASS + FATIGUE */}
        <View className="px-5">
          <View
            className="rounded-2xl border border-[#1e293b] bg-slate-950/60 p-4"
            style={{
              shadowColor: '#22D3EE',
              shadowOpacity: 0.25,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <View className="flex-row items-center">
              <RankEmblem level={profile.level} size={88} />

              <View className="ml-4 flex-1">
                <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                  Classe du Système
                </Text>
                <View className="mt-0.5 flex-row items-center">
                  <ClassIcon
                    color={playerClass.colorHex}
                    size={22}
                    strokeWidth={2}
                  />
                  <Text
                    className="ml-2 text-xl font-black tracking-[2px] text-slate-100"
                    style={{
                      textShadowColor: playerClass.colorHex,
                      textShadowRadius: 10,
                    }}
                  >
                    {playerClass.name.toUpperCase()}
                  </Text>
                </View>
                <Text className="mt-0.5 text-[11px] italic text-slate-500">
                  « {playerClass.tagline} »
                </Text>
                <Text className="mt-1.5 text-[10px] uppercase tracking-[3px] text-blue-300/80">
                  {rankTagline}
                </Text>
              </View>
            </View>

            {/* Fatigue bar */}
            <View className="mt-4">
              <FatigueBar value={fatigue} />
            </View>
          </View>

        </View>

        {/* ================================================== BODY MONITOR */}
        <View className="px-5 pt-8">
          <SectionTitle
            title="Monitoring Biométrique"
            subtitle="Appuie sur une zone"
          />
          <View className="mt-3">
            <BodyView muscleStats={profile.muscleStats} />
          </View>
        </View>

        {/* ================================================== GROWTH CHART */}
        <View className="px-5 pb-8 pt-8">
          <SectionTitle
            title="Analyse de Croissance"
            subtitle="Volume quotidien"
          />
          <View className="mt-3">
            <GrowthChart history={history} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="flex-row items-end justify-between">
      <View>
        <Text
          className="text-lg font-bold tracking-[2px] text-slate-100"
          style={{ textShadowColor: '#60A5FA', textShadowRadius: 8 }}
        >
          {title.toUpperCase()}
        </Text>
        <View className="mt-1 h-[1px] w-16 bg-blue-500/70" />
      </View>
      {subtitle ? (
        <Text className="text-[10px] uppercase tracking-widest text-slate-500">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Biometric grid (3×2)
// ---------------------------------------------------------------------------

function BiometricGrid({
  profile,
}: {
  profile: ReturnType<typeof selectProfile>;
}) {
  const prefs = profile.preferences;
  const height = prefs.heightCm ?? null;
  const weight = prefs.bodyweightKg;
  const bmi =
    height && weight && height > 0
      ? Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10
      : null;

  // AVM — Activité Volumique Moyenne (kT over last 7 days across all muscles)
  const avmKg = Object.values(profile.muscleStats).reduce(
    (sum, m) => sum + m.volumeLast7d,
    0,
  );
  const avmDisplay =
    avmKg >= 1000 ? `${(avmKg / 1000).toFixed(1)}k` : `${Math.round(avmKg)}`;

  const tiles = [
    { Icon: Ruler,      label: 'HT',  value: height !== null ? `${height}` : '—', unit: 'cm' },
    { Icon: Scale,      label: 'PDS', value: weight !== null ? `${weight}` : '—', unit: 'kg' },
    { Icon: Activity,   label: 'IMC', value: bmi !== null ? `${bmi}` : '—', unit: '' },
    { Icon: Sparkles,   label: 'AVM', value: avmDisplay, unit: 'kg' },
    { Icon: HeartPulse, label: 'BPM', value: prefs.restingBpm !== undefined && prefs.restingBpm !== null ? `${prefs.restingBpm}` : '—', unit: '' },
    { Icon: Wind,       label: 'VO2', value: prefs.vo2max !== undefined && prefs.vo2max !== null ? `${prefs.vo2max}` : '—', unit: '' },
  ];

  return (
    <View className="flex-row flex-wrap">
      {tiles.map(t => (
        <View key={t.label} className="w-1/3 p-1">
          <BioTile {...t} />
        </View>
      ))}
    </View>
  );
}

function BioTile({
  Icon,
  label,
  value,
  unit,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View
      className="rounded-2xl border border-[#1e293b] bg-slate-950/60 px-3 py-3"
    >
      <View className="flex-row items-center">
        <Icon size={11} color="#67E8F9" strokeWidth={2} />
        <Text className="ml-1 text-[9px] font-black uppercase tracking-[3px] text-slate-500">
          {label}
        </Text>
      </View>
      <View className="mt-1 flex-row items-baseline">
        <Text
          className="text-xl font-black text-slate-100"
          style={{
            textShadowColor: '#22D3EE',
            textShadowRadius: 8,
          }}
        >
          {value}
        </Text>
        {unit ? (
          <Text className="ml-1 text-[10px] font-bold text-slate-500">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

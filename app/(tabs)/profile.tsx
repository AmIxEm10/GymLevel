import {
  Check,
  Edit2,
  Edit3,
  Gem,
  HardHat,
  Heart,
  Shield,
  Shirt,
  Sparkles,
  Sprout,
  Sword,
  Swords,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BodyView } from '@/components/BodyView';
import { FatigueBar, computeGlobalFatigue } from '@/components/FatigueBar';
import { GrowthChart } from '@/components/GrowthChart';
import { RANK_INFO, RankEmblem, computeRank } from '@/components/RankEmblem';
import {
  selectBodyweightKg,
  selectEquipped,
  selectPlayerClass,
  selectProfile,
  useAppStore,
} from '@/store/useAppStore';
import type {
  EquipmentItem,
  EquipmentRarity,
  EquipmentSlot,
  PlayerClassId,
} from '@/types';

// ---------------------------------------------------------------------------
// Display maps
// ---------------------------------------------------------------------------

const PLAYER_CLASS_ICON: Record<PlayerClassId, LucideIcon> = {
  novice: Sprout,
  fighter: Swords,
  tanker: Shield,
  assassin: Sword,
  ranger: Target,
  mage: Sparkles,
  healer: Heart,
};

const SLOT_META: Record<
  EquipmentSlot,
  { label: string; Icon: LucideIcon }
> = {
  head:      { label: 'Tête',       Icon: HardHat },
  body:      { label: 'Corps',      Icon: Shirt },
  weapon:    { label: 'Arme',       Icon: Sword },
  accessory: { label: 'Accessoire', Icon: Gem },
};

const RARITY_META: Record<
  EquipmentRarity,
  { border: string; bg: string; label: string; text: string }
> = {
  common: {
    border: 'border-slate-400/60',
    bg: 'bg-slate-500/10',
    label: 'Commun',
    text: 'text-slate-300',
  },
  rare: {
    border: 'border-blue-500/70',
    bg: 'bg-blue-500/10',
    label: 'Rare',
    text: 'text-blue-300',
  },
  epic: {
    border: 'border-purple-500/70',
    bg: 'bg-purple-500/10',
    label: 'Épique',
    text: 'text-purple-300',
  },
  legendary: {
    border: 'border-amber-400/80',
    bg: 'bg-amber-500/10',
    label: 'Légendaire',
    text: 'text-amber-300',
  },
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const profile = useAppStore(selectProfile);
  const playerClass = useAppStore(selectPlayerClass);
  const equipped = useAppStore(selectEquipped);
  const bodyweightKg = useAppStore(selectBodyweightKg);
  const history = useAppStore(s => s.workoutHistory);
  const updateNickname = useAppStore(s => s.updateNickname);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profile.nickname);

  const ClassIcon = PLAYER_CLASS_ICON[profile.playerClassId] ?? Sprout;
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
    <SafeAreaView edges={['top']} className="flex-1 bg-[#0B0F19]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================== HEADER */}
        <View className="px-5 pt-4 pb-6">
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

          {/* Hunter identity — nickname edit */}
          <View className="mt-5">
            <Text className="text-[10px] uppercase tracking-widest text-slate-500">
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
                  selectionColor="#60A5FA"
                  className="flex-1 rounded-lg border border-blue-500/70 bg-slate-900/80 px-3 py-2 text-base font-bold text-blue-100"
                  style={{
                    textShadowColor: '#60A5FA',
                    textShadowRadius: 6,
                  }}
                />
                <Pressable
                  onPress={commitNickname}
                  className="ml-2 rounded-lg border border-blue-500/60 bg-blue-500/20 px-3 py-2 active:opacity-60"
                >
                  <View className="flex-row items-center">
                    <Check size={14} color="#93C5FD" />
                    <Text className="ml-1 text-[11px] font-bold uppercase tracking-widest text-blue-200">
                      Valider
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={cancelNicknameEdit}
                  className="ml-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2 active:opacity-60"
                >
                  <X size={14} color="#94A3B8" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={openNicknameEdit}
                className="mt-0.5 flex-row items-center active:opacity-60"
              >
                <Text className="text-2xl font-bold text-slate-100">
                  {profile.nickname?.trim() ? profile.nickname : 'Chasseur'}
                </Text>
                <View className="ml-2 rounded-md border border-blue-500/40 bg-blue-500/10 p-1">
                  <Edit2 size={12} color="#93C5FD" />
                </View>
              </Pressable>
            )}
          </View>

          {/* Global XP bar (compact) */}
          <View className="mt-3">
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <View
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${globalXpPercent}%` }}
              />
            </View>
            <View className="mt-1 flex-row justify-between">
              <Text className="text-[10px] text-slate-500">
                Niveau {profile.level} — {Math.round(profile.totalXp)} /{' '}
                {profile.xpToNextLevel} XP
              </Text>
              <Text className="text-[10px] text-blue-400/80">
                Prochain niveau
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================== RANK + CLASS + FATIGUE */}
        <View className="px-5">
          <View
            className="rounded-2xl border border-blue-500/30 bg-white/[0.04] p-4"
            style={{
              shadowColor: '#60A5FA',
              shadowOpacity: 0.3,
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

          {/* Bodyweight row */}
          <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-blue-500/20 bg-white/5 px-4 py-3">
            <View>
              <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                Poids du corps
              </Text>
              <Text className="mt-0.5 text-xl font-bold text-slate-100">
                {bodyweightKg !== null ? `${bodyweightKg} kg` : 'Non défini'}
              </Text>
            </View>
            <Pressable className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-2 active:opacity-60">
              <Edit3 size={16} color="#93C5FD" />
            </Pressable>
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

        {/* ================================================== EQUIPMENT */}
        <View className="px-5 pt-8">
          <SectionTitle title="Équipement Actif" subtitle="Loot équipé" />
          <View className="mt-3 flex-row flex-wrap">
            {(Object.keys(SLOT_META) as EquipmentSlot[]).map(slot => (
              <View key={slot} className="w-1/2 p-1.5">
                <EquipmentSlotCard slot={slot} item={equipped[slot]} />
              </View>
            ))}
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

function EquipmentSlotCard({
  slot,
  item,
}: {
  slot: EquipmentSlot;
  item: EquipmentItem | null;
}) {
  const meta = SLOT_META[slot];
  const Icon = meta.Icon;

  if (!item) {
    return (
      <View
        className="items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-white/[0.02] p-4"
        style={{ aspectRatio: 1.25 }}
      >
        <Icon size={26} color="#334155" strokeWidth={1.75} />
        <Text className="mt-2 text-[10px] uppercase tracking-widest text-slate-600">
          {meta.label}
        </Text>
        <Text className="mt-0.5 text-[10px] text-slate-700">Vide</Text>
      </View>
    );
  }

  const rarity = RARITY_META[item.rarity];
  const firstBonus = item.bonuses[0];

  return (
    <View
      className={`rounded-2xl border ${rarity.border} ${rarity.bg} p-3`}
      style={{ aspectRatio: 1.25 }}
    >
      <View className="flex-row items-center justify-between">
        <Icon size={18} color="#E2E8F0" strokeWidth={1.75} />
        <Text className={`text-[9px] uppercase tracking-widest ${rarity.text}`}>
          {rarity.label}
        </Text>
      </View>

      <Text className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">
        {meta.label}
      </Text>
      <Text
        className="mt-0.5 text-sm font-bold text-slate-100"
        numberOfLines={1}
      >
        {item.name}
      </Text>

      {firstBonus ? (
        <Text
          className="mt-auto text-[10px] leading-snug text-slate-400"
          numberOfLines={2}
        >
          {firstBonus.description}
        </Text>
      ) : null}
    </View>
  );
}

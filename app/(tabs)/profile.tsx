import {
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
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALL_MUSCLE_IDS, MUSCLE_GROUP_BY_ID } from '@/data/muscleGroups';
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
  MuscleGroupId,
  MuscleGroupStats,
  MuscleStatus,
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

const STATUS_META: Record<
  MuscleStatus,
  { label: string; text: string; bg: string; border: string }
> = {
  frais:   { label: 'Frais',   text: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  actif:   { label: 'Actif',   text: 'text-blue-300',    bg: 'bg-blue-500/15',    border: 'border-blue-500/40' },
  fatigue: { label: 'Fatigué', text: 'text-amber-300',   bg: 'bg-amber-500/15',   border: 'border-amber-500/40' },
  epuise:  { label: 'Épuisé',  text: 'text-red-300',     bg: 'bg-red-500/15',     border: 'border-red-500/40' },
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const profile = useAppStore(selectProfile);
  const playerClass = useAppStore(selectPlayerClass);
  const equipped = useAppStore(selectEquipped);
  const bodyweightKg = useAppStore(selectBodyweightKg);

  const ClassIcon = PLAYER_CLASS_ICON[profile.playerClassId] ?? Sprout;

  const globalXpPercent = Math.min(
    100,
    (profile.totalXp / Math.max(1, profile.xpToNextLevel)) * 100,
  );

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

          {/* Holographic underline */}
          <View className="mt-3 h-[2px] w-24 bg-blue-400" />
          <View className="mt-[2px] h-[1px] w-16 bg-cyan-400/60" />

          {/* Hunter identity + Level */}
          <View className="mt-6 flex-row items-end justify-between">
            <View className="flex-1">
              <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                Chasseur
              </Text>
              <Text className="mt-0.5 text-2xl font-bold text-slate-100">
                {profile.username}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                Niveau
              </Text>
              <Text
                className="text-5xl font-black leading-none text-blue-300"
                style={{
                  textShadowColor: '#60A5FA',
                  textShadowRadius: 14,
                }}
              >
                {profile.level}
              </Text>
            </View>
          </View>

          {/* Global XP bar */}
          <View className="mt-4">
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <View
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${globalXpPercent}%` }}
              />
            </View>
            <View className="mt-1 flex-row justify-between">
              <Text className="text-[10px] text-slate-500">
                {Math.round(profile.totalXp)} / {profile.xpToNextLevel} XP
              </Text>
              <Text className="text-[10px] text-blue-400/80">
                Prochain niveau
              </Text>
            </View>
          </View>

          {/* Class panel */}
          <View className="mt-6 flex-row items-center rounded-2xl border border-blue-500/30 bg-white/5 p-4">
            <View
              className="h-14 w-14 items-center justify-center rounded-xl border bg-white/5"
              style={{ borderColor: `${playerClass.colorHex}80` }}
            >
              <ClassIcon color={playerClass.colorHex} size={28} strokeWidth={2} />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-[10px] uppercase tracking-widest text-blue-300">
                Classe
              </Text>
              <Text className="text-lg font-bold text-slate-100">
                {playerClass.name}
              </Text>
              <Text className="text-xs italic text-slate-500">
                « {playerClass.tagline} »
              </Text>
            </View>
          </View>

          {/* Bodyweight */}
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

        {/* ================================================== EQUIPMENT */}
        <View className="px-5 pb-8">
          <SectionTitle title="Équipement Actif" subtitle="Loot équipé" />
          <View className="mt-3 flex-row flex-wrap">
            {(Object.keys(SLOT_META) as EquipmentSlot[]).map(slot => (
              <View key={slot} className="w-1/2 p-1.5">
                <EquipmentSlotCard slot={slot} item={equipped[slot]} />
              </View>
            ))}
          </View>
        </View>

        {/* ================================================== MUSCLES */}
        <View className="px-5 pb-10">
          <SectionTitle
            title="Évaluation Musculaire"
            subtitle="17 groupes surveillés"
          />
          <View className="mt-3 gap-2">
            {ALL_MUSCLE_IDS.map(id => (
              <MuscleRow
                key={id}
                muscleId={id}
                stats={profile.muscleStats[id]}
              />
            ))}
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

function MuscleRow({
  muscleId,
  stats,
}: {
  muscleId: MuscleGroupId;
  stats: MuscleGroupStats;
}) {
  const muscle = MUSCLE_GROUP_BY_ID[muscleId];
  const status = STATUS_META[stats.status];

  const xpPercent = Math.min(
    100,
    (stats.xp / Math.max(1, stats.xpToNextLevel)) * 100,
  );

  return (
    <View className="rounded-xl border border-blue-500/20 bg-white/[0.03] px-3 py-2.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className="mr-2.5 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: muscle.colorHex }}
          />
          <Text className="text-sm font-semibold text-slate-100">
            {muscle.name}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Text className="mr-2 text-[11px] font-bold tracking-wider text-blue-300">
            Nv. {stats.level}
          </Text>
          <View
            className={`rounded-md border px-1.5 py-0.5 ${status.border} ${status.bg}`}
          >
            <Text className={`text-[9px] font-bold uppercase ${status.text}`}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <View
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${xpPercent}%` }}
        />
      </View>

      <View className="mt-1 flex-row justify-between">
        <Text className="text-[10px] text-slate-500">
          {Math.round(stats.xp)} / {stats.xpToNextLevel} XP
        </Text>
        <Text className="text-[10px] text-slate-600">
          {Math.round(stats.totalVolumeLifetime).toLocaleString()} kg soulevés
        </Text>
      </View>
    </View>
  );
}

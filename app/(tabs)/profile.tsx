import {
  Activity,
  Check,
  ChevronRight,
  Edit2,
  HeartPulse,
  Mail,
  Ruler,
  Scale,
  Shield,
  Sparkles,
  Sprout,
  Sword,
  Swords,
  Target,
  Volume2,
  VolumeX,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { BiometricModal, type BiometricField } from '@/components/BiometricModal';
import { BodyView } from '@/components/BodyView';
import { FatigueBar, computeGlobalFatigue } from '@/components/FatigueBar';
import { GradientBar } from '@/components/GradientBar';
import { GrowthChart } from '@/components/GrowthChart';
import { RANK_INFO, RankEmblem, computeRank } from '@/components/RankEmblem';
import { RARITY_PALETTE } from '@/components/InventorySlot';
import { ITEM_SETS, getActiveSets, setProgress } from '@/data/itemSets';
import { TITLES, getTitle } from '@/data/titles';
import { calculatePowerLevel } from '@/services/gamificationService';
import { playSound, stopSound } from '@/services/soundService';
import {
  selectCanEvolve,
  selectEquipped,
  selectEvolutionStage,
  selectEvolvedClassName,
  selectIsAdmin,
  selectPlayerClass,
  selectProfile,
  selectUnreadCount,
  useAppStore,
} from '@/store/useAppStore';
import type { EquipmentSlot, PlayerClassId } from '@/types';

// ---------------------------------------------------------------------------
// Class icon mapping (3 classes: guerrier / assassin / tank)
// ---------------------------------------------------------------------------

const PLAYER_CLASS_ICON: Record<PlayerClassId, LucideIcon> = {
  novice: Sprout,
  guerrier: Swords,
  assassin: Sword,
  tank: Shield,
  ranger: Target,
  mage: Sparkles,
  healer: HeartPulse,
};

// ---------------------------------------------------------------------------
// Power Level Aura — glow tier that wraps the BodyView silhouette.
//   PL >= 30k  → gold   (hunter legend)
//   PL >= 15k  → purple (apex chasseur)
//   PL >= 5k   → cyan   (ascendant)
//   below      → no aura
// ---------------------------------------------------------------------------

interface AuraDef {
  id: 'gold' | 'purple' | 'cyan' | 'none';
  color: string;
  glow: string;
  label: string;
  intensity: number; // 0..1 — used for shadowRadius + opacity
}

function resolveAura(powerLevel: number): AuraDef {
  if (powerLevel >= 30000) {
    return { id: 'gold',   color: '#FBBF24', glow: '#FEF3C7', label: 'Aura Dorée',    intensity: 1.0 };
  }
  if (powerLevel >= 15000) {
    return { id: 'purple', color: '#A855F7', glow: '#E9D5FF', label: 'Aura Violette', intensity: 0.85 };
  }
  if (powerLevel >= 5000) {
    return { id: 'cyan',   color: '#22D3EE', glow: '#A5F3FC', label: 'Aura Cyan',     intensity: 0.7 };
  }
  return { id: 'none', color: '#1e293b', glow: 'transparent', label: '', intensity: 0 };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const profile = useAppStore(selectProfile);
  const playerClass = useAppStore(selectPlayerClass);
  const equipped = useAppStore(selectEquipped);
  const history = useAppStore(s => s.workoutHistory);
  const updateNickname = useAppStore(s => s.updateNickname);
  const setActiveTitle = useAppStore(s => s.setActiveTitle);
  const isAdmin = useAppStore(selectIsAdmin);
  const unreadCount = useAppStore(selectUnreadCount);
  const evolutionStage = useAppStore(selectEvolutionStage);
  const evolvedClassName = useAppStore(selectEvolvedClassName);
  const canEvolveNow = useAppStore(selectCanEvolve);
  const evolveClass = useAppStore(s => s.evolveClass);
  const isMuted = useAppStore(s => s.isMuted);
  const toggleMuted = useAppStore(s => s.toggleMuted);

  // Looping ambient theme — starts when the Profile mounts, stops on unmount.
  useEffect(() => {
    playSound('THEME_AMBIENT');
    return () => stopSound('THEME_AMBIENT');
  }, []);

  const activeTitle = getTitle(profile.activeTitleId);
  const activeSets = useMemo(() => getActiveSets(equipped), [equipped]);
  const powerLevel = useMemo(() => calculatePowerLevel(profile), [profile]);
  const aura = useMemo(() => resolveAura(powerLevel), [powerLevel]);
  const setFatigueReduction = activeSets.reduce(
    (sum, s) => (s.effect.kind === 'fatigue_reduction' ? sum + s.effect.points : sum),
    0,
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profile.nickname);
  const [bioField, setBioField] = useState<BiometricField | null>(null);

  const ClassIcon = PLAYER_CLASS_ICON[profile.playerClassId] ?? Swords;
  const rank = computeRank(profile.level);
  const rankTagline = RANK_INFO[rank].tagline;
  const fatigue = computeGlobalFatigue(
    profile.muscleStats,
    profile.activeTitleId,
    setFatigueReduction,
  );
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
        <View className="px-5 pt-4 pb-4 flex-row items-start justify-between">
          <View className="flex-1">
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

          <View className="flex-row items-center" style={{ gap: 8 }}>
            {/* Mute toggle — global SON ON/OFF for the audio engine */}
            <Pressable
              onPress={toggleMuted}
              className="rounded-xl border border-slate-700 bg-white/5 p-2.5 active:opacity-70"
              style={{
                shadowColor: isMuted ? 'transparent' : '#22D3EE',
                shadowOpacity: isMuted ? 0 : 0.4,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              {isMuted ? (
                <VolumeX size={16} color="#94A3B8" strokeWidth={2} />
              ) : (
                <Volume2 size={16} color="#A5F3FC" strokeWidth={2} />
              )}
            </Pressable>

            {/* Boîte aux Lettres — icon with unread pill */}
            <Pressable
              onPress={() => router.push('/mailbox')}
              className="relative rounded-xl border border-blue-500/40 bg-blue-500/10 p-2.5 active:opacity-70"
              style={{
                shadowColor: unreadCount > 0 ? '#F43F5E' : '#22D3EE',
                shadowOpacity: unreadCount > 0 ? 0.9 : 0.4,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Mail size={16} color="#BFDBFE" strokeWidth={2} />
              {unreadCount > 0 ? (
                <View
                  className="absolute -right-1 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1"
                  style={{
                    shadowColor: '#F43F5E',
                    shadowOpacity: 0.9,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <Text className="text-[9px] font-black text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
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

              {/* Active title — golden neon chip under the nickname */}
              {activeTitle ? (
                <Text
                  className="mt-1 text-[10px] font-black uppercase tracking-[4px]"
                  style={{
                    color: activeTitle.colorHex,
                    textShadowColor: activeTitle.colorHex,
                    textShadowRadius: 8,
                    textShadowOffset: { width: 0, height: 0 },
                  }}
                >
                  « {activeTitle.name} »
                </Text>
              ) : null}

              {/* Power Level aura — shimmer chip */}
              <View
                className="mt-2 flex-row items-center rounded-lg border border-cyan-400/70 bg-cyan-500/10 px-2.5 py-1 self-start"
                style={{
                  shadowColor: '#22D3EE',
                  shadowOpacity: 0.9,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text
                  className="text-[9px] font-black uppercase tracking-[4px] text-cyan-200"
                  style={{ textShadowColor: '#22D3EE', textShadowRadius: 8 }}
                >
                  Power Level
                </Text>
                <Text
                  className="ml-2 text-sm font-black tracking-wider text-cyan-100"
                  style={{ textShadowColor: '#22D3EE', textShadowRadius: 10 }}
                >
                  {powerLevel >= 1000
                    ? `${(powerLevel / 1000).toFixed(1)}k`
                    : powerLevel.toLocaleString()}
                </Text>
              </View>

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
          <BiometricGrid profile={profile} onTilePress={setBioField} />
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
                    className="ml-2 text-xl font-black tracking-[2px]"
                    style={{
                      color: playerClass.colorHex,
                      textShadowColor: playerClass.colorHex,
                      textShadowRadius: 12,
                      textShadowOffset: { width: 0, height: 0 },
                    }}
                    numberOfLines={1}
                  >
                    {evolvedClassName.toUpperCase()}
                  </Text>
                </View>
                {evolutionStage > 0 ? (
                  <Text
                    className="mt-0.5 text-[9px] font-black uppercase tracking-[3px]"
                    style={{
                      color: playerClass.colorHex,
                      textShadowColor: playerClass.colorHex,
                      textShadowRadius: 6,
                    }}
                  >
                    ÉVOLUTION {'I'.repeat(evolutionStage)} · +{evolutionStage * 5}%
                  </Text>
                ) : null}
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

            {/* Evolve CTA — surfaces when a new stage is reachable */}
            {canEvolveNow ? (
              <Pressable
                onPress={evolveClass}
                className="mt-4 flex-row items-center justify-center rounded-xl border-2 border-amber-400/80 bg-amber-400/10 py-2.5 active:opacity-70"
                style={{
                  shadowColor: '#FBBF24',
                  shadowOpacity: 0.9,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Sparkles size={14} color="#FEF3C7" strokeWidth={2.25} />
                <Text
                  className="ml-2 text-[11px] font-black uppercase tracking-[3px] text-amber-100"
                  style={{ textShadowColor: '#FBBF24', textShadowRadius: 10 }}
                >
                  Évoluer la Classe
                </Text>
                <ChevronRight size={12} color="#FEF3C7" strokeWidth={2.5} />
              </Pressable>
            ) : null}
          </View>

        </View>

        {/* ================================================== BODY MONITOR */}
        <View className="px-5 pt-8">
          <SectionTitle
            title="Monitoring Biométrique"
            subtitle={aura.id !== 'none' ? aura.label : 'Appuie sur une zone'}
          />
          <View
            className="mt-3 rounded-3xl"
            style={
              aura.id !== 'none'
                ? {
                    borderWidth: 1.5,
                    borderColor: aura.color,
                    backgroundColor: `${aura.color}10`,
                    padding: 10,
                    shadowColor: aura.color,
                    shadowOpacity: aura.intensity,
                    shadowRadius: 24 * aura.intensity,
                    shadowOffset: { width: 0, height: 0 },
                  }
                : undefined
            }
          >
            {/* Aura halo — inner soft ring that emphasises the silhouette. */}
            {aura.id !== 'none' ? (
              <View
                pointerEvents="none"
                className="absolute left-0 right-0 top-0 bottom-0 rounded-3xl"
                style={{
                  borderWidth: 0.75,
                  borderColor: aura.glow,
                  opacity: aura.intensity * 0.4,
                }}
              />
            ) : null}
            <BodyView muscleStats={profile.muscleStats} />
            {aura.id !== 'none' ? (
              <View className="mt-2 items-center">
                <Text
                  className="text-[9px] font-black uppercase tracking-[4px]"
                  style={{
                    color: aura.color,
                    textShadowColor: aura.color,
                    textShadowRadius: 10,
                  }}
                >
                  ◆ {aura.label} ◆
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ================================================= EQUIPMENT SLOTS */}
        <View className="px-5 pt-8">
          <SectionTitle title="Équipement Actif" subtitle="4 slots" />
          <View className="mt-3 flex-row justify-between gap-2">
            {(['head', 'body', 'weapon', 'accessory'] as EquipmentSlot[]).map(
              slot => (
                <EquipmentSlotMini key={slot} slot={slot} equipped={equipped} />
              ),
            )}
          </View>
        </View>

        {/* ==================================================== SET SYNERGIES */}
        <View className="px-5 pt-8">
          <SectionTitle
            title="Synergies Actives"
            subtitle={`${activeSets.length} complète${activeSets.length > 1 ? 's' : ''}`}
          />
          <View className="mt-3 gap-2">
            {ITEM_SETS.map(set => {
              const p = setProgress(set, equipped);
              const active = p.active;
              return (
                <View
                  key={set.id}
                  className="rounded-2xl border p-3"
                  style={{
                    borderColor: active ? set.colorHex : '#1e293b',
                    backgroundColor: active
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.02)',
                    shadowColor: active ? set.colorHex : 'transparent',
                    shadowOpacity: active ? 0.85 : 0,
                    shadowRadius: active ? 14 : 0,
                    shadowOffset: { width: 0, height: 0 },
                    opacity: active ? 1 : 0.6,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-sm font-black tracking-wider"
                      style={{
                        color: active ? set.colorHex : '#64748B',
                        textShadowColor: active ? set.colorHex : 'transparent',
                        textShadowRadius: active ? 10 : 0,
                      }}
                    >
                      {set.name.toUpperCase()}
                    </Text>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        color: active ? set.colorHex : '#475569',
                      }}
                    >
                      {p.matched} / {p.required}
                    </Text>
                  </View>
                  <Text className="mt-1 text-[11px] text-slate-400">
                    {set.bonusLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ==================================================== TITLES GRID */}
        <View className="px-5 pt-8">
          <SectionTitle
            title="Titres Débloqués"
            subtitle={`${profile.unlockedTitles.length} / ${TITLES.length}`}
          />
          <View className="mt-3 gap-2">
            {TITLES.map(t => {
              const unlocked = profile.unlockedTitles.includes(t.id);
              const isActive = profile.activeTitleId === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() =>
                    unlocked && setActiveTitle(isActive ? null : t.id)
                  }
                  className="rounded-2xl border p-3 active:opacity-70"
                  style={{
                    borderColor: unlocked ? t.colorHex : '#1e293b',
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(255,255,255,0.02)',
                    shadowColor: isActive ? t.colorHex : 'transparent',
                    shadowOpacity: isActive ? 0.85 : 0,
                    shadowRadius: isActive ? 14 : 0,
                    shadowOffset: { width: 0, height: 0 },
                    opacity: unlocked ? 1 : 0.55,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-sm font-black tracking-wider"
                      style={{
                        color: unlocked ? t.colorHex : '#475569',
                        textShadowColor:
                          isActive ? t.colorHex : 'transparent',
                        textShadowRadius: isActive ? 10 : 0,
                      }}
                    >
                      {t.name.toUpperCase()}
                    </Text>
                    {isActive ? (
                      <Text
                        className="rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[3px]"
                        style={{ borderColor: t.colorHex, color: t.colorHex }}
                      >
                        Actif
                      </Text>
                    ) : null}
                  </View>
                  <Text className="mt-0.5 text-[11px] italic text-slate-500">
                    « {t.description} »
                  </Text>
                  <Text className="mt-1 text-[10px] text-slate-400">
                    <Text
                      className="font-bold"
                      style={{ color: unlocked ? t.colorHex : '#64748B' }}
                    >
                      {unlocked ? 'Effet : ' : 'Condition : '}
                    </Text>
                    {unlocked ? t.effectDescription : t.unlockHint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ================================================== ADMIN CTA */}
        {isAdmin ? (
          <View className="px-5 pt-6">
            <Pressable
              onPress={() => router.push('/admin/console')}
              className="flex-row items-center justify-center rounded-2xl border border-rose-500/60 bg-rose-500/10 py-3 active:opacity-70"
              style={{
                shadowColor: '#F43F5E',
                shadowOpacity: 0.6,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Text
                className="text-[10px] font-black uppercase tracking-[4px] text-rose-200"
                style={{ textShadowColor: '#F43F5E', textShadowRadius: 8 }}
              >
                ⚙ Console Système
              </Text>
            </Pressable>
            <Text className="mt-1.5 text-center text-[9px] italic text-slate-600">
              Accès privilégié · Maxime uniquement
            </Text>
          </View>
        ) : null}

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

      <BiometricModal field={bioField} onClose={() => setBioField(null)} />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Equipment slot mini (head / body / weapon / accessory)
// ---------------------------------------------------------------------------

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: 'Tête',
  body: 'Corps',
  weapon: 'Arme',
  accessory: 'Access.',
};

function EquipmentSlotMini({
  slot,
  equipped,
}: {
  slot: EquipmentSlot;
  equipped: Record<EquipmentSlot, ReturnType<typeof selectEquipped> extends Record<EquipmentSlot, infer T> ? T : never>;
}) {
  const item = equipped[slot];
  if (!item) {
    return (
      <View
        className="flex-1 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-white/[0.02] py-4"
      >
        <Text className="text-[9px] uppercase tracking-widest text-slate-600">
          {SLOT_LABELS[slot]}
        </Text>
        <Text className="mt-0.5 text-[9px] text-slate-700">Vide</Text>
      </View>
    );
  }
  const palette = RARITY_PALETTE[item.rarity];
  return (
    <View
      className="flex-1 items-center rounded-xl py-3 px-1"
      style={{
        borderWidth: 1.5,
        borderColor: palette.border,
        backgroundColor: 'rgba(255,255,255,0.03)',
        shadowColor: palette.glow,
        shadowOpacity: 0.7,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Text
        className="text-[9px] font-bold uppercase tracking-widest"
        style={{ color: palette.border }}
      >
        {SLOT_LABELS[slot]}
      </Text>
      <Text
        numberOfLines={1}
        className="mt-1 text-[10px] font-bold text-slate-100"
      >
        {item.name}
      </Text>
    </View>
  );
}

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
  onTilePress,
}: {
  profile: ReturnType<typeof selectProfile>;
  onTilePress?: (field: 'heightCm' | 'bodyweightKg' | 'restingBpm' | 'vo2max') => void;
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

  const tiles: Array<{
    Icon: LucideIcon;
    label: string;
    value: string;
    unit: string;
    field?: 'heightCm' | 'bodyweightKg' | 'restingBpm' | 'vo2max';
  }> = [
    { Icon: Ruler,      label: 'HT',  value: height !== null ? `${height}` : '—', unit: 'cm', field: 'heightCm' },
    { Icon: Scale,      label: 'PDS', value: weight !== null ? `${weight}` : '—', unit: 'kg', field: 'bodyweightKg' },
    { Icon: Activity,   label: 'IMC', value: bmi !== null ? `${bmi}` : '—', unit: '' },
    { Icon: Sparkles,   label: 'AVM', value: avmDisplay, unit: 'kg' },
    { Icon: HeartPulse, label: 'BPM', value: prefs.restingBpm !== undefined && prefs.restingBpm !== null ? `${prefs.restingBpm}` : '—', unit: '', field: 'restingBpm' },
    { Icon: Wind,       label: 'VO2', value: prefs.vo2max !== undefined && prefs.vo2max !== null ? `${prefs.vo2max}` : '—', unit: '', field: 'vo2max' },
  ];

  return (
    <View className="flex-row flex-wrap">
      {tiles.map(t => (
        <View key={t.label} className="w-1/3 p-1">
          <BioTile
            {...t}
            onPress={
              t.field && onTilePress ? () => onTilePress(t.field!) : undefined
            }
          />
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
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  onPress?: () => void;
}) {
  const Wrapper = (onPress ? Pressable : View) as typeof Pressable;
  return (
    <Wrapper
      onPress={onPress}
      className="rounded-2xl border border-[#1e293b] bg-slate-950/60 px-3 py-3"
      style={
        onPress
          ? {
              shadowColor: '#22D3EE',
              shadowOpacity: 0.4,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }
          : undefined
      }
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
    </Wrapper>
  );
}

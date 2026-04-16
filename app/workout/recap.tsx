import { router } from 'expo-router';
import {
  Crown,
  Flame,
  Sparkles,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MUSCLE_GROUP_BY_ID } from '@/data/muscleGroups';
import { selectProfile, useAppStore } from '@/store/useAppStore';
import type { MuscleGroupId, Quest } from '@/types';

function formatChrono(seconds: number): string {
  const s = Math.max(0, seconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

export default function WorkoutRecapScreen() {
  const profile = useAppStore(selectProfile);
  const history = useAppStore(s => s.workoutHistory);
  const activeQuests = useAppStore(s => s.activeQuests);

  const lastSession = history[0];

  const newlyCompletedQuests = useMemo<Quest[]>(() => {
    if (!lastSession) return [];
    return activeQuests.filter(
      q =>
        q.status === 'completed' &&
        q.completedAt !== undefined &&
        q.completedAt >= lastSession.startedAt,
    );
  }, [activeQuests, lastSession]);

  const fatiguedMuscles = useMemo<MuscleGroupId[]>(() => {
    if (!lastSession) return [];
    return Object.keys(lastSession.xpByMuscle ?? {}) as MuscleGroupId[];
  }, [lastSession]);

  if (!lastSession) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#020617]">
        <Text className="text-sm uppercase tracking-[4px] text-slate-500">
          Aucune mission récente.
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          className="mt-4 rounded-xl border border-blue-500/50 bg-blue-500/10 px-4 py-2 active:opacity-70"
        >
          <Text className="text-xs font-bold uppercase tracking-widest text-blue-200">
            Retour
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalXp = Math.round(lastSession.totalXpGained);
  const totalVolume = Math.round(lastSession.totalVolume);
  const duration = lastSession.durationSeconds ?? 0;
  const setCount = lastSession.exercises.reduce(
    (sum, we) => sum + we.sets.length,
    0,
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#020617]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-5">
          <Text className="text-[10px] font-semibold tracking-[6px] text-blue-400/70">
            LE SYSTÈME
          </Text>
          <Text
            className="mt-1 text-4xl font-black tracking-[3px] text-blue-300"
            style={{
              textShadowColor: '#60A5FA',
              textShadowRadius: 18,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            FIN DE MISSION
          </Text>
          <View className="mt-3 h-[2px] w-24 bg-blue-400" />
          <Text className="mt-3 text-xs italic text-slate-500">
            {lastSession.name} — archivée dans tes registres.
          </Text>
        </View>

        {/* Security warnings */}
        {lastSession.simulationDetected || lastSession.densityWarning ? (
          <View className="mx-5 mb-4 rounded-xl border border-amber-500/60 bg-amber-500/10 p-3">
            <Text className="text-[10px] font-black uppercase tracking-[3px] text-amber-300">
              ⚠ Vérification du Système
            </Text>
            {lastSession.simulationDetected ? (
              <Text className="mt-1 text-[11px] text-amber-200">
                Simulation détectée — cadence de validation trop rapide.
              </Text>
            ) : null}
            {lastSession.densityWarning ? (
              <Text className="mt-1 text-[11px] text-amber-200">
                Distorsion de force — densité Volume/Temps hors norme.
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Pending PRs */}
        {(() => {
          const pendingPrs = Object.values(profile.personalRecords).filter(
            pr =>
              pr.pendingValidation &&
              pr.lastUpdatedAt >= lastSession.startedAt,
          );
          if (pendingPrs.length === 0) return null;
          return (
            <View className="mx-5 mb-4 rounded-xl border border-rose-500/60 bg-rose-500/10 p-3">
              <Text className="text-[10px] font-black uppercase tracking-[3px] text-rose-300">
                ⚠ Vérification · {pendingPrs.length} record{pendingPrs.length > 1 ? 's' : ''} en attente
              </Text>
              <Text className="mt-1 text-[11px] text-rose-200">
                Un ou plusieurs records ont bondi de plus de 25 % — le bonus
                XP est mis en attente jusqu'à confirmation par le Système.
              </Text>
            </View>
          );
        })()}

        {/* XP hero */}
        <View className="mx-5 mb-5 rounded-3xl border-2 border-amber-400/70 bg-amber-500/5 p-6 items-center"
          style={{
            shadowColor: '#FBBF24',
            shadowOpacity: 0.8,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Trophy size={28} color="#FBBF24" strokeWidth={2.25} />
          <Text className="mt-2 text-[10px] font-bold uppercase tracking-[4px] text-amber-300/80">
            XP Gagnée
          </Text>
          <Text
            className="mt-1 text-5xl font-black text-amber-200"
            style={{
              textShadowColor: '#FBBF24',
              textShadowRadius: 16,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            +{totalXp}
          </Text>
          <Text className="mt-1 text-[10px] text-slate-500">
            Niveau global : {profile.level} — {Math.round(profile.totalXp)} / {profile.xpToNextLevel} XP
          </Text>
        </View>

        {/* Stats grid */}
        <View className="mx-5 mb-5 flex-row gap-3">
          <StatTile
            Icon={TrendingUp}
            label="Volume"
            value={`${totalVolume.toLocaleString()}`}
            unit="kg"
            color="#60A5FA"
          />
          <StatTile
            Icon={Flame}
            label="Durée"
            value={formatChrono(duration)}
            color="#F97316"
          />
          <StatTile
            Icon={Sparkles}
            label="Séries"
            value={`${setCount}`}
            color="#A855F7"
          />
        </View>

        {/* Quests completed */}
        {newlyCompletedQuests.length > 0 ? (
          <View className="mx-5 mb-5">
            <Text
              className="text-base font-bold tracking-[2px] text-slate-100"
              style={{ textShadowColor: '#60A5FA', textShadowRadius: 6 }}
            >
              QUÊTES RÉSOLUES
            </Text>
            <View className="mt-1 h-[1px] w-16 bg-blue-500/70" />
            <View className="mt-3 gap-2">
              {newlyCompletedQuests.map(q => (
                <View
                  key={q.id}
                  className="flex-row items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3"
                >
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                      Rang {q.rank}
                    </Text>
                    <Text className="text-sm font-bold text-slate-100">
                      {q.title}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Crown size={14} color="#FBBF24" />
                    <Text className="ml-1 text-xs font-bold text-amber-300">
                      +{q.xpReward}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Muscles worked */}
        {fatiguedMuscles.length > 0 ? (
          <View className="mx-5 mb-5">
            <Text
              className="text-base font-bold tracking-[2px] text-slate-100"
              style={{ textShadowColor: '#60A5FA', textShadowRadius: 6 }}
            >
              MUSCLES SOLLICITÉS
            </Text>
            <View className="mt-1 h-[1px] w-16 bg-blue-500/70" />
            <View className="mt-3 flex-row flex-wrap gap-1.5">
              {fatiguedMuscles.map(id => {
                const muscle = MUSCLE_GROUP_BY_ID[id];
                const xp = Math.round(lastSession.xpByMuscle?.[id] ?? 0);
                const status = profile.muscleStats[id].status;
                const statusColor =
                  status === 'epuise'
                    ? '#EF4444'
                    : status === 'fatigue'
                    ? '#F97316'
                    : status === 'actif'
                    ? '#60A5FA'
                    : '#22D3EE';
                return (
                  <View
                    key={id}
                    className="flex-row items-center rounded-full border px-2.5 py-1"
                    style={{
                      borderColor: statusColor,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: muscle.colorHex,
                        marginRight: 6,
                      }}
                    />
                    <Text className="text-[11px] font-semibold text-slate-200">
                      {muscle.name}
                    </Text>
                    <Text
                      className="ml-2 text-[10px] font-bold"
                      style={{ color: statusColor }}
                    >
                      +{xp} XP
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View className="border-t border-slate-800 bg-[#020617]/80 px-5 py-4">
        <Pressable
          onPress={() => router.replace('/')}
          className="flex-row items-center justify-center rounded-2xl border-2 border-blue-400 bg-blue-500/20 py-4 active:opacity-70"
          style={{
            shadowColor: '#60A5FA',
            shadowOpacity: 0.85,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Text
            className="text-sm font-black uppercase tracking-[5px] text-blue-100"
            style={{ textShadowColor: '#60A5FA', textShadowRadius: 10 }}
          >
            Retour au Tableau
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function StatTile({
  Icon,
  label,
  value,
  unit,
  color,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  color: string;
}) {
  return (
    <View
      className="flex-1 rounded-2xl border bg-white/[0.03] p-3"
      style={{ borderColor: `${color}66` }}
    >
      <View className="flex-row items-center">
        <Icon size={14} color={color} strokeWidth={2} />
        <Text className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </Text>
      </View>
      <Text
        className="mt-1 text-xl font-black"
        style={{ color, textShadowColor: color, textShadowRadius: 6 }}
      >
        {value}
        {unit ? (
          <Text className="text-[10px] font-normal text-slate-500">
            {' '}
            {unit}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

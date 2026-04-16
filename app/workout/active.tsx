import { router } from 'expo-router';
import {
  Check,
  ChevronRight,
  Flag,
  Hourglass,
  Minus,
  Plus,
  SkipForward,
  Timer,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBar } from '@/components/GradientBar';
import { EXERCISES_BY_ID } from '@/data/exercises';
import {
  selectActiveSession,
  selectEquipped,
  selectProfile,
  useAppStore,
} from '@/store/useAppStore';
import { getActiveSets } from '@/data/itemSets';
import type { WorkoutExercise, WorkoutSet } from '@/types';

const DEFAULT_REST_SECONDS = 90;

type SetPhase = 'idle' | 'active' | 'validated';

function formatChrono(seconds: number): string {
  const s = Math.max(0, seconds);
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function WorkoutActiveScreen() {
  const activeSession = useAppStore(selectActiveSession);
  const addSet = useAppStore(s => s.addSet);
  const profile = useAppStore(selectProfile);
  const equipped = useAppStore(selectEquipped);
  const activeSets = getActiveSets(equipped);
  const endSession = useAppStore(s => s.endSession);
  const abandonSession = useAppStore(s => s.abandonSession);

  // Local UI state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [draftWeight, setDraftWeight] = useState(40);
  const [draftReps, setDraftReps] = useState(10);
  const [phase, setPhase] = useState<SetPhase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const phaseResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rest timer state — ticks down after each validated set.
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRest = () => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restIntervalRef.current = null;
    setRestRemaining(null);
  };

  const startRest = (seconds: number) => {
    clearRest();
    setRestRemaining(seconds);
    restIntervalRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          restIntervalRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const adjustRest = (delta: number) => {
    setRestRemaining(prev =>
      prev === null ? null : Math.max(0, Math.min(900, prev + delta)),
    );
  };

  // If no active session (e.g. direct deep-link to /workout/active),
  // redirect to the Salle des Portes so the user can pick a template.
  useEffect(() => {
    if (!activeSession) {
      router.replace('/workout/selection');
    }
  }, [activeSession]);

  // Chronomètre — tick every second from activeSession.startedAt
  useEffect(() => {
    if (!activeSession) return;
    setElapsed(Math.round((Date.now() - activeSession.startedAt) / 1000));
    const id = setInterval(() => {
      setElapsed(Math.round((Date.now() - activeSession.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [activeSession?.startedAt]);

  // When the current exercise changes, prefill drafts from the last logged set
  // of that exercise (if any), otherwise sensible defaults per exercise type.
  useEffect(() => {
    if (!activeSession) return;
    const we = activeSession.exercises[currentIdx];
    if (!we) return;
    const lastSet = we.sets[we.sets.length - 1];
    if (lastSet) {
      setDraftWeight(lastSet.weight);
      setDraftReps(lastSet.reps);
    } else {
      const ex = EXERCISES_BY_ID[we.exerciseId];
      setDraftWeight(ex?.isBodyweight ? 0 : 40);
      setDraftReps(10);
    }
    setPhase('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, activeSession?.id]);

  // Cleanup phase-reset + rest timers on unmount
  useEffect(() => {
    return () => {
      if (phaseResetRef.current) clearTimeout(phaseResetRef.current);
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, []);

  // Kill the rest timer when the user jumps to the next exercise.
  useEffect(() => {
    clearRest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // ------------- Guards -------------

  if (!activeSession) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#020617]">
        <Text className="text-sm uppercase tracking-[4px] text-slate-500">
          Initialisation de la séance…
        </Text>
      </SafeAreaView>
    );
  }

  const currentWE: WorkoutExercise | undefined =
    activeSession.exercises[currentIdx];
  const exerciseDef = currentWE
    ? EXERCISES_BY_ID[currentWE.exerciseId]
    : undefined;

  // ------------- Handlers -------------

  const markActive = () => {
    setPhase('active');
    if (phaseResetRef.current) clearTimeout(phaseResetRef.current);
    phaseResetRef.current = setTimeout(() => setPhase('idle'), 4000);
  };

  const markValidated = () => {
    setPhase('validated');
    if (phaseResetRef.current) clearTimeout(phaseResetRef.current);
    phaseResetRef.current = setTimeout(() => setPhase('idle'), 1500);
  };

  const adjustWeight = (delta: number) => {
    setDraftWeight(w => Math.max(0, Math.round((w + delta) * 2) / 2));
    markActive();
  };
  const adjustReps = (delta: number) => {
    setDraftReps(r => Math.max(1, r + delta));
    markActive();
  };

  const validate = () => {
    if (!currentWE) return;
    addSet(currentWE.id, {
      exerciseId: currentWE.exerciseId,
      reps: draftReps,
      weight: draftWeight,
      isWarmup: false,
      isDropset: false,
      isFailure: false,
    });
    markValidated();
    // Kick off the rest timer — use the template's targetRestSeconds when
    // present, otherwise the default 90 s.
    const restTarget = currentWE.targetRestSeconds ?? DEFAULT_REST_SECONDS;
    startRest(restTarget);
  };

  const goNextExercise = () => {
    if (currentIdx + 1 >= activeSession.exercises.length) {
      finishSession();
      return;
    }
    setCurrentIdx(i => i + 1);
  };

  const finishSession = () => {
    endSession();
    // After endSession the profile is updated and the session is pushed onto
    // history — the recap screen reads workoutHistory[0] to render the bilan.
    router.replace('/workout/recap');
  };

  const cancelSession = () => {
    abandonSession();
    router.replace('/');
  };

  // ------------- Styling: phase-driven neon -------------

  const borderCls =
    phase === 'active'
      ? 'border-red-500/80'
      : phase === 'validated'
      ? 'border-emerald-400/80'
      : 'border-blue-500/60';
  const glowColor =
    phase === 'active'
      ? '#EF4444'
      : phase === 'validated'
      ? '#10B981'
      : '#60A5FA';

  const isValidated = phase === 'validated';

  // ------------- Render -------------

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#020617]">
      <View className="flex-1">
        {/* Header: chrono + exit */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
          <View className="flex-row items-center">
            <Timer size={18} color="#60A5FA" strokeWidth={2} />
            <Text
              className="ml-2 text-3xl font-black tracking-widest text-blue-300"
              style={{
                textShadowColor: '#60A5FA',
                textShadowRadius: 10,
                textShadowOffset: { width: 0, height: 0 },
              }}
            >
              {formatChrono(elapsed)}
            </Text>

            {/* Buff chips — active set bonuses + active title */}
            {activeSets.length > 0 ? (
              <View className="ml-3 flex-row items-center">
                {activeSets.map(s => (
                  <View
                    key={s.id}
                    className="mr-1.5 rounded-md border px-1.5 py-0.5"
                    style={{
                      borderColor: s.colorHex,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      shadowColor: s.colorHex,
                      shadowOpacity: 0.8,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                    }}
                  >
                    <Text
                      className="text-[9px] font-black uppercase tracking-widest"
                      style={{
                        color: s.colorHex,
                        textShadowColor: s.colorHex,
                        textShadowRadius: 4,
                      }}
                    >
                      ◆ {s.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            {profile.activeTitleId ? (
              <View className="ml-1.5 rounded-md border border-amber-400/60 bg-amber-500/10 px-1.5 py-0.5">
                <Text className="text-[9px] font-black uppercase tracking-widest text-amber-200">
                  TITRE
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={cancelSession}
            className="rounded-lg border border-slate-700 bg-white/5 p-2 active:opacity-60"
          >
            <X size={16} color="#94A3B8" />
          </Pressable>
        </View>

        {/* Exercise title */}
        <View className="px-5 pb-4">
          <Text className="text-[10px] uppercase tracking-[4px] text-slate-500">
            Exercice {currentIdx + 1} / {activeSession.exercises.length}
          </Text>
          <Text
            className="mt-1 text-3xl font-black tracking-wider text-blue-200"
            style={{
              textShadowColor: '#60A5FA',
              textShadowRadius: 16,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            {(exerciseDef?.name ?? 'EXERCICE').toUpperCase()}
          </Text>
          {currentWE?.targetSets ? (
            <Text className="mt-1 text-xs text-slate-500">
              Objectif : {currentWE.targetSets} × {currentWE.targetReps}
            </Text>
          ) : null}
        </View>

        {/* Scrollable center: set block + history */}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Central Set Block */}
          <View
            className={`rounded-3xl border-2 bg-slate-950/60 p-6 ${borderCls}`}
            style={{
              shadowColor: glowColor,
              shadowOpacity: 0.8,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            {/* Set progress bar at top — Série X / Y */}
            <View className="mb-5 flex-row items-center">
              <View className="flex-1">
                <GradientBar
                  percent={
                    currentWE && currentWE.targetSets
                      ? Math.min(100, ((currentWE.sets.length) / currentWE.targetSets) * 100)
                      : 0
                  }
                  height={4}
                />
              </View>
              <Text className="ml-3 text-[10px] font-black uppercase tracking-[3px] text-cyan-300">
                Série {(currentWE?.sets.length ?? 0) + 1}
                {currentWE?.targetSets ? ` / ${currentWE.targetSets}` : ''}
              </Text>
            </View>

            {/* Reps HERO */}
            <Text className="text-center text-[10px] font-black uppercase tracking-[6px] text-cyan-400/80">
              Répétitions
            </Text>
            <View className="mt-3 flex-row items-center justify-between">
              <AdjustButton onPress={() => adjustReps(-1)} icon="minus" />
              <View className="flex-1 items-center">
                <Text
                  className="text-8xl font-black text-white"
                  style={{
                    textShadowColor: glowColor,
                    textShadowRadius: 24,
                    textShadowOffset: { width: 0, height: 0 },
                    letterSpacing: -4,
                  }}
                >
                  {draftReps}
                </Text>
                <Text
                  className="mt-1 text-[9px] font-black uppercase tracking-[6px] text-cyan-400/60"
                >
                  Reps
                </Text>
              </View>
              <AdjustButton onPress={() => adjustReps(1)} icon="plus" />
            </View>

            {/* Weight — secondary row */}
            <View className="mt-6 flex-row items-center justify-between rounded-2xl border border-[#1e293b] bg-slate-900/60 px-4 py-3">
              <View className="flex-1">
                <Text className="text-[9px] font-black uppercase tracking-[4px] text-slate-500">
                  Poids
                </Text>
                <Text
                  className="text-3xl font-black text-slate-100"
                  style={{
                    textShadowColor: glowColor,
                    textShadowRadius: 10,
                  }}
                >
                  {draftWeight}
                  <Text className="text-sm font-bold text-slate-500"> kg</Text>
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => adjustWeight(-2.5)}
                  className="h-10 w-10 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/10 active:bg-blue-500/25"
                >
                  <Minus size={18} color="#93C5FD" strokeWidth={2.5} />
                </Pressable>
                <Pressable
                  onPress={() => adjustWeight(2.5)}
                  className="h-10 w-10 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/10 active:bg-blue-500/25"
                >
                  <Plus size={18} color="#93C5FD" strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>

            {/* Last logged set — small guide under the inputs */}
            {(() => {
              const lastSet: WorkoutSet | undefined =
                currentWE?.sets[currentWE.sets.length - 1];
              if (!lastSet) return null;
              return (
                <View className="mt-4 flex-row items-center justify-center">
                  <Text className="text-[10px] uppercase tracking-[3px] text-slate-500">
                    Dernier set :{' '}
                  </Text>
                  <Text className="text-[11px] font-bold text-blue-200">
                    {lastSet.weight} kg × {lastSet.reps}
                  </Text>
                </View>
              );
            })()}

            {/* Validate — big neon CTA */}
            <Pressable
              onPress={validate}
              className={`mt-6 flex-row items-center justify-center rounded-2xl border-2 py-5 active:opacity-80 ${
                isValidated
                  ? 'border-emerald-400 bg-emerald-500/20'
                  : 'border-cyan-400 bg-cyan-500/15'
              }`}
              style={{
                shadowColor: isValidated ? '#10B981' : '#22D3EE',
                shadowOpacity: 0.9,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Check
                size={24}
                color={isValidated ? '#6EE7B7' : '#A5F3FC'}
                strokeWidth={3}
              />
              <Text
                className={`ml-2 text-base font-black uppercase tracking-[5px] ${
                  isValidated ? 'text-emerald-200' : 'text-cyan-100'
                }`}
                style={{
                  textShadowColor: isValidated ? '#10B981' : '#22D3EE',
                  textShadowRadius: 10,
                  textShadowOffset: { width: 0, height: 0 },
                }}
              >
                {isValidated ? 'SÉRIE ENREGISTRÉE' : 'VALIDER LA SÉRIE'}
              </Text>
            </Pressable>
          </View>

          {/* Rest timer — only visible while counting down */}
          {restRemaining !== null ? (
            <View
              className="mt-5 rounded-2xl border-2 border-amber-400/70 bg-amber-500/10 p-4"
              style={{
                shadowColor: '#FBBF24',
                shadowOpacity: 0.55,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Hourglass size={14} color="#FBBF24" strokeWidth={2.25} />
                  <Text className="ml-1.5 text-[10px] font-black uppercase tracking-[4px] text-amber-300">
                    Repos
                  </Text>
                </View>
                <Pressable
                  onPress={clearRest}
                  className="flex-row items-center rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 active:opacity-70"
                >
                  <SkipForward size={12} color="#FDE68A" strokeWidth={2.25} />
                  <Text className="ml-1 text-[10px] font-bold uppercase tracking-widest text-amber-200">
                    Skip
                  </Text>
                </Pressable>
              </View>

              <Text
                className="mt-2 text-center text-5xl font-black text-amber-200"
                style={{
                  textShadowColor: '#FBBF24',
                  textShadowRadius: 14,
                  textShadowOffset: { width: 0, height: 0 },
                }}
              >
                {formatChrono(restRemaining)}
              </Text>

              <View className="mt-3 flex-row justify-center gap-2">
                <Pressable
                  onPress={() => adjustRest(-15)}
                  className="rounded-lg border border-slate-700 bg-white/[0.03] px-3 py-1.5 active:opacity-70"
                >
                  <Text className="text-[11px] font-bold text-slate-300">
                    −15 s
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => adjustRest(15)}
                  className="rounded-lg border border-slate-700 bg-white/[0.03] px-3 py-1.5 active:opacity-70"
                >
                  <Text className="text-[11px] font-bold text-slate-300">
                    +15 s
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* History */}
          <View className="mt-6 rounded-2xl border border-slate-800 bg-white/[0.02] p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
                Séries déjà faites
              </Text>
              <Text className="text-[10px] text-slate-600">
                {currentWE?.sets.length ?? 0}
                {currentWE?.targetSets ? ` / ${currentWE.targetSets}` : ''}
              </Text>
            </View>
            {currentWE && currentWE.sets.length > 0 ? (
              <View className="mt-2 gap-1.5">
                {currentWE.sets.map((s, i) => (
                  <View
                    key={s.id}
                    className="flex-row items-center justify-between"
                  >
                    <Text className="text-sm text-slate-300">
                      <Text className="font-bold text-blue-400">
                        Série {i + 1}
                      </Text>{' '}
                      : {s.weight} kg × {s.reps}
                    </Text>
                    <Text className="text-[10px] text-slate-600">
                      {formatChrono(
                        Math.round((s.completedAt - activeSession.startedAt) / 1000),
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="mt-2 text-xs italic text-slate-600">
                Aucune série enregistrée pour cet exercice.
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Footer actions */}
        <View className="flex-row items-center justify-between px-5 pb-4 pt-3">
          <Pressable
            onPress={finishSession}
            className="flex-row items-center rounded-xl border border-red-500/70 bg-red-500/15 px-4 py-3 active:opacity-70"
            style={{
              shadowColor: '#EF4444',
              shadowOpacity: 0.6,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Flag size={16} color="#FCA5A5" strokeWidth={2.25} />
            <Text className="ml-2 text-xs font-bold uppercase tracking-widest text-red-200">
              Terminer la séance
            </Text>
          </Pressable>

          <Pressable
            onPress={goNextExercise}
            className="flex-row items-center rounded-xl border border-blue-500/70 bg-blue-500/15 px-4 py-3 active:opacity-70"
            style={{
              shadowColor: '#60A5FA',
              shadowOpacity: 0.6,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Text className="mr-2 text-xs font-bold uppercase tracking-widest text-blue-200">
              Exercice suivant
            </Text>
            <ChevronRight size={16} color="#93C5FD" strokeWidth={2.25} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AdjustButton({
  onPress,
  icon,
}: {
  onPress: () => void;
  icon: 'plus' | 'minus';
}) {
  const Icon = icon === 'plus' ? Plus : Minus;
  return (
    <Pressable
      onPress={onPress}
      className="h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/40 bg-blue-500/10 active:bg-blue-500/25"
      style={{
        shadowColor: '#60A5FA',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Icon size={28} color="#93C5FD" strokeWidth={2.5} />
    </Pressable>
  );
}

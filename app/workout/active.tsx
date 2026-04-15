import { router } from 'expo-router';
import {
  Check,
  ChevronRight,
  Flag,
  Minus,
  Plus,
  Timer,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EXERCISES_BY_ID } from '@/data/exercises';
import {
  selectActiveSession,
  useAppStore,
} from '@/store/useAppStore';
import type { WorkoutExercise } from '@/types';

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
  const endSession = useAppStore(s => s.endSession);
  const abandonSession = useAppStore(s => s.abandonSession);

  // Local UI state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [draftWeight, setDraftWeight] = useState(40);
  const [draftReps, setDraftReps] = useState(10);
  const [phase, setPhase] = useState<SetPhase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const phaseResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cleanup phase-reset timer on unmount
  useEffect(() => {
    return () => {
      if (phaseResetRef.current) clearTimeout(phaseResetRef.current);
    };
  }, []);

  // ------------- Guards -------------

  if (!activeSession) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
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
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-black">
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
            className={`rounded-3xl border-2 bg-black/60 p-6 ${borderCls}`}
            style={{
              shadowColor: glowColor,
              shadowOpacity: 0.8,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            {/* Weight row */}
            <Text className="text-[10px] font-semibold uppercase tracking-[4px] text-slate-400">
              Poids (kg)
            </Text>
            <View className="mt-2 flex-row items-center justify-between">
              <AdjustButton onPress={() => adjustWeight(-2.5)} icon="minus" />
              <Text
                className="text-6xl font-black text-white"
                style={{
                  textShadowColor: glowColor,
                  textShadowRadius: 14,
                  textShadowOffset: { width: 0, height: 0 },
                }}
              >
                {draftWeight}
              </Text>
              <AdjustButton onPress={() => adjustWeight(2.5)} icon="plus" />
            </View>

            {/* Reps row */}
            <View className="mt-5 border-t border-slate-800 pt-5">
              <Text className="text-[10px] font-semibold uppercase tracking-[4px] text-slate-400">
                Répétitions
              </Text>
              <View className="mt-2 flex-row items-center justify-between">
                <AdjustButton onPress={() => adjustReps(-1)} icon="minus" />
                <Text
                  className="text-6xl font-black text-white"
                  style={{
                    textShadowColor: glowColor,
                    textShadowRadius: 14,
                    textShadowOffset: { width: 0, height: 0 },
                  }}
                >
                  {draftReps}
                </Text>
                <AdjustButton onPress={() => adjustReps(1)} icon="plus" />
              </View>
            </View>

            {/* Validate — big neon CTA */}
            <Pressable
              onPress={validate}
              className={`mt-6 flex-row items-center justify-center rounded-2xl border-2 py-5 active:opacity-80 ${
                isValidated
                  ? 'border-emerald-400 bg-emerald-500/20'
                  : 'border-blue-400 bg-blue-500/20'
              }`}
              style={{
                shadowColor: isValidated ? '#10B981' : '#60A5FA',
                shadowOpacity: 0.9,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Check
                size={24}
                color={isValidated ? '#6EE7B7' : '#93C5FD'}
                strokeWidth={3}
              />
              <Text
                className={`ml-2 text-base font-black uppercase tracking-[5px] ${
                  isValidated ? 'text-emerald-200' : 'text-blue-100'
                }`}
                style={{
                  textShadowColor: isValidated ? '#10B981' : '#60A5FA',
                  textShadowRadius: 10,
                  textShadowOffset: { width: 0, height: 0 },
                }}
              >
                {isValidated ? 'SÉRIE ENREGISTRÉE' : 'VALIDER LA SÉRIE'}
              </Text>
            </Pressable>
          </View>

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

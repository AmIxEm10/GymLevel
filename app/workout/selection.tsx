import { router } from 'expo-router';
import {
  Check,
  ChevronRight,
  Clock,
  DoorOpen,
  Flame,
  Plus,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DungeonEntryModal } from '@/components/DungeonEntryModal';
import { RankEmblem } from '@/components/RankEmblem';
import { useShallow } from 'zustand/react/shallow';

import { EXERCISES, EXERCISES_BY_ID } from '@/data/exercises';
import { MUSCLE_GROUP_BY_ID } from '@/data/muscleGroups';
import { RANK_META, type Rank } from '@/data/ranks';
import {
  selectActiveSession,
  selectAllTemplates,
  useAppStore,
} from '@/store/useAppStore';
import type {
  ExerciseCategory,
  MuscleGroupId,
  NewTemplatePayload,
  WorkoutTemplate,
} from '@/types';

// ---------------------------------------------------------------------------
// Template → Rank mapping
// ---------------------------------------------------------------------------

import { computeDungeonRank as computeTemplateRank } from '@/services/lootService';

function levelFromRank(rank: Rank): number {
  // Used to render the hexagonal RankEmblem. Picks the bottom of each tier.
  switch (rank) {
    case 'S': return 61;
    case 'A': return 36;
    case 'B': return 21;
    case 'C': return 11;
    case 'D': return 6;
    case 'E':
    default:  return 1;
  }
}

/** Badge "difficulty" from exercise count. */
function intensityFromCount(n: number): {
  label: string;
  color: string;
} {
  if (n >= 8) return { label: 'Extrême', color: '#EF4444' };
  if (n >= 6) return { label: 'Intensif', color: '#F97316' };
  if (n >= 4) return { label: 'Standard', color: '#60A5FA' };
  return { label: 'Rapide', color: '#22C55E' };
}

/** Collect primary muscles (display names) across a template's exercises. */
function primaryMusclesOf(tpl: WorkoutTemplate): string[] {
  const set = new Set<MuscleGroupId>();
  for (const te of tpl.exercises) {
    const ex = EXERCISES_BY_ID[te.exerciseId];
    if (!ex) continue;
    ex.primaryMuscles.forEach(id => set.add(id));
  }
  return Array.from(set).map(id => MUSCLE_GROUP_BY_ID[id].name);
}

// ---------------------------------------------------------------------------
// Exercise list grouped by category (for the creation modal)
// ---------------------------------------------------------------------------

const CATEGORY_GROUPS: Array<{ id: ExerciseCategory; label: string }> = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
  { id: 'hiit', label: 'HIIT' },
];

// ⚡ Bolt: Pre-calculate the mapping of exercises by category once at load time.
// This prevents running an O(n) `.filter()` over the entire EXERCISES list
// on every render inside CreateTemplateModal, reducing CPU overhead.
const EXERCISES_BY_CATEGORY = CATEGORY_GROUPS.reduce((acc, group) => {
  acc[group.id] = EXERCISES.filter(ex => ex.category === group.id);
  return acc;
}, {} as Record<ExerciseCategory, typeof EXERCISES>);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function WorkoutSelectionScreen() {
  // ⚡ Bolt: useShallow prevents re-rendering on unrelated state changes when returning new array refs
  const templates = useAppStore(useShallow(selectAllTemplates));
  const activeSession = useAppStore(selectActiveSession);
  const startSessionFromTemplate = useAppStore(
    s => s.startSessionFromTemplate,
  );
  const saveCustomTemplate = useAppStore(s => s.saveCustomTemplate);
  const abandonSession = useAppStore(s => s.abandonSession);
  const startInstantDungeon = useAppStore(s => s.startInstantDungeon);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<WorkoutTemplate | null>(null);

  const sortedTemplates = useMemo(() => {
    // Built-ins first, custom last — but within each group, keep insertion order.
    return [...templates].sort(
      (a, b) => Number(a.isBuiltIn === false) - Number(b.isBuiltIn === false),
    );
  }, [templates]);

  const requestEntry = (template: WorkoutTemplate) => {
    setPendingEntry(template);
  };

  const confirmEntry = () => {
    if (!pendingEntry) return;
    if (activeSession) abandonSession();
    startSessionFromTemplate(pendingEntry.id);
    setPendingEntry(null);
    router.push('/workout/active');
  };

  const handleCreate = (payload: NewTemplatePayload) => {
    const id = saveCustomTemplate(payload);
    setShowCreateModal(false);
    // Auto-launch the freshly created portal via the entry modal
    const newlyCreated = { ...payload, id, isBuiltIn: false, createdAt: Date.now(), updatedAt: Date.now() } as WorkoutTemplate;
    setPendingEntry(newlyCreated);
  };

  const launchInstant = () => {
    if (activeSession) abandonSession();
    startInstantDungeon();
    router.push('/workout/active');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#020617]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================== HEADER */}
        <View className="flex-row items-start justify-between px-5 pt-4 pb-3">
          <View className="flex-1">
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
              LA SALLE DES PORTES
            </Text>
            <View className="mt-3 h-[2px] w-24 bg-blue-400" />
            <View className="mt-[2px] h-[1px] w-16 bg-cyan-400/60" />
          </View>
          <Pressable
            onPress={() => router.back()}
            aria-label="Fermer"
            className="rounded-lg border border-slate-700 bg-white/5 p-2 active:opacity-60"
          >
            <X size={16} color="#94A3B8" />
          </Pressable>
        </View>

        <Text className="px-5 pb-3 text-xs italic text-slate-500">
          Choisis un portail pour lancer le donjon. Les portes de haut rang
          exigent davantage.
        </Text>

        {/* Active session — quick-continue strip */}
        {activeSession ? (
          <Pressable
            onPress={() => router.push('/workout/active')}
            className="mx-5 mb-4 flex-row items-center rounded-2xl border border-amber-500/60 bg-amber-500/10 p-3 active:opacity-80"
          >
            <Flame size={16} color="#FBBF24" strokeWidth={2} />
            <Text className="ml-2 flex-1 text-[11px] text-slate-300">
              Séance en cours — tape pour continuer.
            </Text>
            <ChevronRight size={14} color="#FBBF24" />
          </Pressable>
        ) : null}

        {/* Donjon Instantané */}
        <View className="mx-5 mb-4">
          <Pressable
            onPress={launchInstant}
            className="flex-row items-center justify-center rounded-2xl border-2 border-cyan-400/70 bg-cyan-500/10 py-4 active:opacity-70"
            style={{
              shadowColor: '#22D3EE',
              shadowOpacity: 0.7,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Zap size={18} color="#67E8F9" strokeWidth={2.5} />
            <Text
              className="ml-2 text-sm font-black uppercase tracking-[5px] text-cyan-200"
              style={{
                textShadowColor: '#22D3EE',
                textShadowRadius: 10,
              }}
            >
              Donjon Instantané
            </Text>
          </Pressable>
          <Text className="mt-1 text-center text-[10px] italic text-slate-600">
            5 exercices équilibrés tirés au hasard par le Système.
          </Text>
        </View>

        {/* ================================================== PORTALS */}
        <View className="px-5 pb-4">
          <Text
            className="text-base font-bold tracking-[2px] text-slate-100"
            style={{ textShadowColor: '#60A5FA', textShadowRadius: 6 }}
          >
            PORTAILS DU SYSTÈME
          </Text>
          <View className="mt-1 h-[1px] w-16 bg-blue-500/70" />
        </View>

        <View className="px-5" style={{ gap: 14 }}>
          {sortedTemplates.map(tpl => (
            <PortalCard
              key={tpl.id}
              template={tpl}
              onSelect={() => requestEntry(tpl)}
            />
          ))}
        </View>

        {/* Create new template CTA */}
        <View className="mt-6 px-5">
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="flex-row items-center justify-center rounded-3xl border-2 border-dashed border-emerald-400/70 bg-emerald-500/5 py-5 active:opacity-70"
            style={{
              shadowColor: '#10B981',
              shadowOpacity: 0.45,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Plus size={20} color="#6EE7B7" strokeWidth={2.5} />
            <Text
              className="ml-2 text-sm font-black uppercase tracking-[4px] text-emerald-200"
              style={{
                textShadowColor: '#10B981',
                textShadowRadius: 10,
                textShadowOffset: { width: 0, height: 0 },
              }}
            >
              Ouvrir une nouvelle porte
            </Text>
          </Pressable>
          <Text className="mt-2 text-center text-[10px] italic text-slate-600">
            Crée ton propre programme — nom + exercices.
          </Text>
        </View>
      </ScrollView>

      <CreateTemplateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreate}
      />

      <DungeonEntryModal
        template={pendingEntry}
        rank={pendingEntry ? computeTemplateRank(pendingEntry) : 'E'}
        visible={pendingEntry !== null}
        onConfirm={confirmEntry}
        onCancel={() => setPendingEntry(null)}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Portal card
// ---------------------------------------------------------------------------

function PortalCard({
  template,
  onSelect,
}: {
  template: WorkoutTemplate;
  onSelect: () => void;
}) {
  const rank = computeTemplateRank(template);
  const rankMeta = RANK_META[rank];
  const intensity = intensityFromCount(template.exercises.length);
  const muscles = primaryMusclesOf(template);
  const visibleMuscles = muscles.slice(0, 4);
  const remainingMuscles = muscles.length - visibleMuscles.length;

  return (
    <Pressable
      onPress={onSelect}
      className="rounded-3xl bg-[#020617]/60 p-4 active:opacity-85"
      style={{
        borderWidth: 2,
        borderColor: rankMeta.color,
        shadowColor: rankMeta.glow,
        shadowOpacity: rank === 'S' ? 0.95 : 0.55,
        shadowRadius: rank === 'S' ? 22 : 16,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      {/* Header row */}
      <View className="flex-row">
        <RankEmblem level={levelFromRank(rank)} size={64} />

        <View className="ml-4 flex-1">
          <View className="flex-row items-center">
            <View
              className="rounded-md px-1.5 py-0.5"
              style={{
                borderWidth: 1,
                borderColor: rankMeta.color,
                backgroundColor: 'rgba(255,255,255,0.03)',
              }}
            >
              <Text
                className="text-[9px] font-black uppercase tracking-[3px]"
                style={{
                  color: rankMeta.color,
                  textShadowColor: rankMeta.glow,
                  textShadowRadius: 5,
                }}
              >
                PORTAIL · {rank}
              </Text>
            </View>
            {template.isBuiltIn === false ? (
              <View
                className="ml-1.5 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-1.5 py-0.5"
              >
                <Text className="text-[9px] font-bold uppercase tracking-widest text-emerald-300">
                  Sur mesure
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            className="mt-1.5 text-xl font-black tracking-wide text-slate-100"
            style={{
              textShadowColor: rankMeta.glow,
              textShadowRadius: 10,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            {template.name.toUpperCase()}
          </Text>

          {template.description ? (
            <Text
              numberOfLines={2}
              className="mt-0.5 text-[11px] italic leading-snug text-slate-500"
            >
              « {template.description} »
            </Text>
          ) : null}
        </View>
      </View>

      {/* Specs */}
      <View className="mt-3 flex-row flex-wrap">
        <SpecChip Icon={Target} label={`${template.exercises.length} exos`} />
        <SpecChip
          Icon={Flame}
          label={intensity.label}
          color={intensity.color}
        />
        <SpecChip
          Icon={Clock}
          label={`${template.estimatedDurationMinutes} min`}
        />
      </View>

      {/* Target muscles */}
      {visibleMuscles.length > 0 ? (
        <View className="mt-3 rounded-xl border border-slate-800 bg-white/[0.02] px-3 py-2">
          <Text className="text-[9px] font-bold uppercase tracking-[3px] text-slate-500">
            Cible
          </Text>
          <Text className="mt-0.5 text-xs text-slate-300">
            {visibleMuscles.join(' · ')}
            {remainingMuscles > 0 ? ` · +${remainingMuscles}` : ''}
          </Text>
        </View>
      ) : null}

      {/* Open button */}
      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row flex-wrap">
          {template.tags.slice(0, 3).map(tag => (
            <View
              key={tag}
              className="mr-1.5 mt-1 rounded-full border border-blue-500/30 bg-white/[0.02] px-2 py-0.5"
            >
              <Text className="text-[9px] uppercase tracking-widest text-slate-400">
                {tag}
              </Text>
            </View>
          ))}
        </View>
        <View
          className="flex-row items-center rounded-xl px-3 py-1.5"
          style={{
            borderWidth: 1,
            borderColor: rankMeta.color,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        >
          <Text
            className="mr-1 text-[10px] font-black uppercase tracking-[3px]"
            style={{
              color: rankMeta.color,
              textShadowColor: rankMeta.glow,
              textShadowRadius: 6,
            }}
          >
            Ouvrir la porte
          </Text>
          <ChevronRight size={14} color={rankMeta.color} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Spec chip (small icon + label row)
// ---------------------------------------------------------------------------

function SpecChip({
  Icon,
  label,
  color = '#60A5FA',
}: {
  Icon: typeof Clock;
  label: string;
  color?: string;
}) {
  return (
    <View className="mr-2 mt-1 flex-row items-center rounded-md border border-slate-800 bg-white/[0.02] px-2 py-0.5">
      <Icon size={11} color={color} strokeWidth={2} />
      <Text className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Create template modal
// ---------------------------------------------------------------------------

function CreateTemplateModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: NewTemplatePayload) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelectedIds(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id],
    );
  };

  const reset = () => {
    setName('');
    setDescription('');
    setSelectedIds([]);
  };

  const canSave = name.trim().length >= 3 && selectedIds.length >= 2;

  const save = () => {
    if (!canSave) return;
    const estimatedMin = Math.max(15, selectedIds.length * 8);
    onSave({
      name: name.trim().slice(0, 40),
      description: description.trim().slice(0, 120) || undefined,
      tags: ['custom'],
      difficulty: 'intermediate',
      estimatedDurationMinutes: estimatedMin,
      exercises: selectedIds.map((id, i) => ({
        exerciseId: id,
        order: i + 1,
        targetSets: 3,
        targetReps: '8-12',
        targetRestSeconds: 90,
      })),
    });
    reset();
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#020617]">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-800 px-5 py-4">
            <View>
              <Text className="text-[10px] font-semibold tracking-[5px] text-blue-400/70">
                LE SYSTÈME
              </Text>
              <Text
                className="mt-0.5 text-2xl font-black tracking-[2px] text-blue-300"
                style={{ textShadowColor: '#60A5FA', textShadowRadius: 12 }}
              >
                NOUVELLE PORTE
              </Text>
            </View>
            <Pressable
              onPress={close}
              aria-label="Fermer"
              className="rounded-lg border border-slate-700 bg-white/5 p-2 active:opacity-60"
            >
              <X size={16} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <View className="px-5 pt-4">
              <Text className="text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
                Nom du portail
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={40}
                placeholder="Ex. Donjon de fer — Pectoraux"
                placeholderTextColor="#475569"
                selectionColor="#60A5FA"
                className="mt-1.5 rounded-xl border border-blue-500/60 bg-slate-900/80 px-3 py-3 text-base font-bold text-blue-100"
                style={{
                  textShadowColor: '#60A5FA',
                  textShadowRadius: 5,
                }}
              />

              <Text className="mt-4 text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
                Description (optionnelle)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                maxLength={120}
                placeholder="Courte intention — « ravager les pectoraux »"
                placeholderTextColor="#475569"
                selectionColor="#60A5FA"
                className="mt-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-3 text-sm italic text-slate-200"
              />

              <Text className="mt-5 text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
                Exercices ({selectedIds.length} sélectionné
                {selectedIds.length > 1 ? 's' : ''})
              </Text>
            </View>

            {/* Exercise groups */}
            {CATEGORY_GROUPS.map(group => (
              <View key={group.id} className="mt-3 px-5">
                <Text className="text-[11px] font-black uppercase tracking-[3px] text-blue-300/80">
                  ◆ {group.label}
                </Text>
                <View className="mt-1.5 gap-1">
                  {EXERCISES_BY_CATEGORY[group.id].map(ex => {
                    const isSelected = selectedIds.includes(ex.id);
                    return (
                      <Pressable
                        key={ex.id}
                        onPress={() => toggle(ex.id)}
                        className={`flex-row items-center rounded-xl border px-3 py-2.5 active:opacity-70 ${
                          isSelected
                            ? 'border-blue-500/70 bg-blue-500/10'
                            : 'border-slate-800 bg-white/[0.02]'
                        }`}
                        style={
                          isSelected
                            ? {
                                shadowColor: '#60A5FA',
                                shadowOpacity: 0.6,
                                shadowRadius: 10,
                                shadowOffset: { width: 0, height: 0 },
                              }
                            : undefined
                        }
                      >
                        <View
                          className={`mr-3 h-5 w-5 items-center justify-center rounded-md border ${
                            isSelected
                              ? 'border-blue-400 bg-blue-500/40'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected ? (
                            <Check size={12} color="#E0F2FE" strokeWidth={3} />
                          ) : null}
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-sm font-semibold ${
                              isSelected ? 'text-blue-100' : 'text-slate-200'
                            }`}
                          >
                            {ex.name}
                          </Text>
                          <Text className="text-[10px] uppercase tracking-widest text-slate-600">
                            {ex.movement} · {ex.equipment}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer — sticky save button */}
          <View className="border-t border-slate-800 bg-[#020617]/80 px-5 py-4">
            <Pressable
              onPress={save}
              disabled={!canSave}
              className={`flex-row items-center justify-center rounded-2xl border-2 py-4 ${
                canSave
                  ? 'border-emerald-400 bg-emerald-500/20 active:opacity-70'
                  : 'border-slate-700 bg-slate-800/60 opacity-50'
              }`}
              style={
                canSave
                  ? {
                      shadowColor: '#10B981',
                      shadowOpacity: 0.8,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  : undefined
              }
            >
              <DoorOpen
                size={18}
                color={canSave ? '#6EE7B7' : '#64748B'}
                strokeWidth={2.5}
              />
              <Text
                className={`ml-2 text-sm font-black uppercase tracking-[4px] ${
                  canSave ? 'text-emerald-200' : 'text-slate-500'
                }`}
                style={
                  canSave
                    ? { textShadowColor: '#10B981', textShadowRadius: 8 }
                    : undefined
                }
              >
                Forger & entrer
              </Text>
            </Pressable>
            {!canSave ? (
              <Text className="mt-2 text-center text-[10px] italic text-slate-600">
                Nom ≥ 3 caractères · au moins 2 exercices sélectionnés.
              </Text>
            ) : (
              <View className="mt-2 flex-row items-center justify-center">
                <Sparkles size={12} color="#6EE7B7" />
                <Text className="ml-1 text-[10px] italic text-emerald-300">
                  Portail prêt — ~
                  {Math.max(15, selectedIds.length * 8)} min estimées
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

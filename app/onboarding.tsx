import { router } from 'expo-router';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Sprout,
  Sword,
  Swords,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PLAYER_CLASSES } from '@/data/playerClasses';
import { useAppStore } from '@/store/useAppStore';
import type { PlayerClassId } from '@/types';

// ---------------------------------------------------------------------------
// Step meta
// ---------------------------------------------------------------------------

type Step = 'identity' | 'bodyweight' | 'class' | 'accept';

const STEP_LABELS: Record<Step, string> = {
  identity: 'Identifiant',
  bodyweight: 'Morphologie',
  class: 'Classe',
  accept: 'Pacte',
};

const CLASS_ICON: Record<PlayerClassId, LucideIcon> = {
  novice: Sprout,
  guerrier: Swords,
  assassin: Sword,
  tank: Shield,
  ranger: Target,
  mage: Sparkles,
  healer: HeartPulse,
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const profile = useAppStore(s => s.profile);
  const needsOnboarding = useAppStore(s => s.needsOnboarding);
  const updateNickname = useAppStore(s => s.updateNickname);
  const setBodyweight = useAppStore(s => s.setBodyweight);
  const setPlayerClass = useAppStore(s => s.setPlayerClass);
  const acceptSystemTerms = useAppStore(s => s.acceptSystemTerms);

  const [step, setStep] = useState<Step>('identity');
  const [draftName, setDraftName] = useState(profile.nickname);
  const [draftWeight, setDraftWeight] = useState<number>(
    profile.preferences.bodyweightKg ?? 70,
  );
  const [draftClass, setDraftClass] = useState<PlayerClassId>(
    profile.playerClassId,
  );
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  // Fade-in on step change
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, fadeAnim]);

  // Redirect out if already onboarded (e.g. navigating back here manually)
  useEffect(() => {
    if (!needsOnboarding) router.replace('/');
  }, [needsOnboarding]);

  const canNextFromIdentity = draftName.trim().length >= 2;
  const canNextFromBodyweight = draftWeight >= 25 && draftWeight <= 300;

  const handleNext = () => {
    switch (step) {
      case 'identity':
        if (!canNextFromIdentity) return;
        updateNickname(draftName);
        setStep('bodyweight');
        return;
      case 'bodyweight':
        if (!canNextFromBodyweight) return;
        setBodyweight(draftWeight);
        setStep('class');
        return;
      case 'class':
        setPlayerClass(draftClass);
        setStep('accept');
        return;
      case 'accept':
        setShowAcceptModal(true);
        return;
    }
  };

  const handleBack = () => {
    if (step === 'identity') return;
    if (step === 'bodyweight') setStep('identity');
    else if (step === 'class') setStep('bodyweight');
    else if (step === 'accept') setStep('class');
  };

  const finalize = () => {
    // Make sure all fields are persisted in case the user jumped steps
    updateNickname(draftName);
    setBodyweight(draftWeight);
    setPlayerClass(draftClass);
    acceptSystemTerms();
    setShowAcceptModal(false);
    router.replace('/');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#020617]">
      {/* F-04 — KeyboardAvoidingView prevents the keyboard from covering the
          nickname TextInput and the Next button on small iPhones (SE, mini). */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 pt-3 pb-4">
          <Text className="text-[10px] font-semibold tracking-[6px] text-blue-400/70">
            LE SYSTÈME
          </Text>
          <Text
            className="mt-1 text-4xl font-black tracking-[4px] text-blue-300"
            style={{
              textShadowColor: '#60A5FA',
              textShadowRadius: 18,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            ÉVEIL
          </Text>
          <Text className="mt-2 text-xs italic text-slate-500">
            Le Système enregistre un nouveau Chasseur. Renseigne tes paramètres
            d'initialisation.
          </Text>
        </View>

        {/* Steps progress */}
        <View className="px-6 pb-6 flex-row">
          {(Object.keys(STEP_LABELS) as Step[]).map((s, i) => {
            const active = s === step;
            const passed =
              (Object.keys(STEP_LABELS) as Step[]).indexOf(step) > i;
            return (
              <View key={s} className="flex-1 mx-0.5">
                <View
                  className="h-[3px] rounded-full"
                  style={{
                    backgroundColor: active || passed ? '#60A5FA' : '#1E293B',
                    shadowColor: '#60A5FA',
                    shadowOpacity: active ? 0.9 : 0,
                    shadowRadius: active ? 8 : 0,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                />
                <Text
                  className={`mt-1 text-[9px] uppercase tracking-[3px] ${
                    active ? 'text-blue-300' : 'text-slate-600'
                  }`}
                >
                  {STEP_LABELS[s]}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Step content */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 24 }}>
          {step === 'identity' ? (
            <IdentityStep value={draftName} onChange={setDraftName} />
          ) : null}
          {step === 'bodyweight' ? (
            <BodyweightStep value={draftWeight} onChange={setDraftWeight} />
          ) : null}
          {step === 'class' ? (
            <ClassStep value={draftClass} onChange={setDraftClass} />
          ) : null}
          {step === 'accept' ? (
            <AcceptStep
              nickname={draftName}
              bodyweight={draftWeight}
              classId={draftClass}
            />
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* Footer actions */}
      <View className="flex-row items-center justify-between border-t border-slate-800 bg-[#020617]/90 px-5 py-4">
        <Pressable
          onPress={handleBack}
          disabled={step === 'identity'}
          className={`flex-row items-center rounded-xl border px-4 py-3 ${
            step === 'identity'
              ? 'border-slate-800 bg-slate-900/40 opacity-40'
              : 'border-slate-700 bg-white/5 active:opacity-70'
          }`}
        >
          <ChevronLeft size={14} color="#94A3B8" strokeWidth={2.25} />
          <Text className="ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Retour
          </Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={
            (step === 'identity' && !canNextFromIdentity) ||
            (step === 'bodyweight' && !canNextFromBodyweight)
          }
          className="flex-row items-center rounded-xl border-2 border-blue-400 bg-blue-500/20 px-5 py-3 active:opacity-70"
          style={{
            shadowColor: '#60A5FA',
            shadowOpacity: 0.8,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Text
            className="mr-2 text-xs font-black uppercase tracking-[4px] text-blue-100"
            style={{ textShadowColor: '#60A5FA', textShadowRadius: 8 }}
          >
            {step === 'accept' ? 'Accepter le pacte' : 'Continuer'}
          </Text>
          <ChevronRight size={14} color="#93C5FD" strokeWidth={2.25} />
        </Pressable>
      </View>

      {/* Accept modal */}
      <AcceptTermsModal
        visible={showAcceptModal}
        onConfirm={finalize}
        onCancel={() => setShowAcceptModal(false)}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Step: identity
// ---------------------------------------------------------------------------

function IdentityStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View>
      <Text
        className="text-2xl font-black tracking-wide text-slate-100"
        style={{ textShadowColor: '#60A5FA', textShadowRadius: 12 }}
      >
        QUI ES-TU ?
      </Text>
      <Text className="mt-2 text-sm leading-relaxed text-slate-400">
        Le Système a besoin d'un nom pour t'inscrire dans ses registres. Un
        pseudo visible uniquement de toi.
      </Text>

      <Text className="mt-6 text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
        Pseudo du Chasseur
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        autoFocus
        maxLength={24}
        placeholder="Ex. Sung Jinwoo"
        placeholderTextColor="#475569"
        selectionColor="#60A5FA"
        className="mt-1.5 rounded-xl border border-blue-500/70 bg-slate-900/80 px-3 py-3 text-base font-bold text-blue-100"
        style={{ textShadowColor: '#60A5FA', textShadowRadius: 6 }}
      />
      <Text className="mt-1 text-[10px] italic text-slate-600">
        2 à 24 caractères.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step: bodyweight
// ---------------------------------------------------------------------------

function BodyweightStep({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const bump = (delta: number) => {
    const next = Math.max(25, Math.min(300, Math.round(value + delta)));
    onChange(next);
  };

  return (
    <View>
      <Text
        className="text-2xl font-black tracking-wide text-slate-100"
        style={{ textShadowColor: '#60A5FA', textShadowRadius: 12 }}
      >
        CALIBRATION PHYSIQUE
      </Text>
      <Text className="mt-2 text-sm leading-relaxed text-slate-400">
        Ton poids de corps est utilisé pour calculer l'XP des exercices au
        poids du corps et scaler tes charges lourdes.
      </Text>

      <Text className="mt-6 text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
        Poids (kg)
      </Text>
      <View className="mt-2 flex-row items-center justify-between rounded-2xl border border-blue-500/40 bg-slate-900/60 p-4">
        <Pressable
          onPress={() => bump(-1)}
          aria-label="Diminuer"
          className="h-14 w-14 items-center justify-center rounded-xl border border-blue-500/50 bg-blue-500/10 active:opacity-70"
        >
          <Minus size={22} color="#93C5FD" strokeWidth={2.5} />
        </Pressable>
        <Text
          className="text-5xl font-black text-blue-100"
          style={{ textShadowColor: '#60A5FA', textShadowRadius: 14 }}
        >
          {value}
        </Text>
        <Pressable
          onPress={() => bump(1)}
          aria-label="Augmenter"
          className="h-14 w-14 items-center justify-center rounded-xl border border-blue-500/50 bg-blue-500/10 active:opacity-70"
        >
          <Plus size={22} color="#93C5FD" strokeWidth={2.5} />
        </Pressable>
      </View>
      <View className="mt-3 flex-row justify-center gap-2">
        {[-5, -2.5, 2.5, 5].map(step => (
          <Pressable
            key={step}
            onPress={() => bump(step)}
            className="rounded-lg border border-slate-700 bg-white/[0.02] px-3 py-1.5 active:opacity-70"
          >
            <Text className="text-[11px] font-bold text-slate-300">
              {step > 0 ? `+${step}` : step} kg
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step: class
// ---------------------------------------------------------------------------

function ClassStep({
  value,
  onChange,
}: {
  value: PlayerClassId;
  onChange: (v: PlayerClassId) => void;
}) {
  return (
    <View>
      <Text
        className="text-2xl font-black tracking-wide text-slate-100"
        style={{ textShadowColor: '#60A5FA', textShadowRadius: 12 }}
      >
        CHOIX DE LA CLASSE
      </Text>
      <Text className="mt-2 text-sm leading-relaxed text-slate-400">
        Ta classe détermine les bonus d'XP que tu reçois selon ton style
        d'entraînement. Tu pourras en changer plus tard.
      </Text>

      <View className="mt-5 gap-3">
        {PLAYER_CLASSES.map(cls => {
          const Icon = CLASS_ICON[cls.id];
          const selected = value === cls.id;
          return (
            <Pressable
              key={cls.id}
              onPress={() => onChange(cls.id)}
              className={`rounded-2xl border-2 p-4 active:opacity-80 ${
                selected ? 'bg-white/5' : 'border-slate-800 bg-white/[0.02]'
              }`}
              style={{
                borderColor: selected ? cls.colorHex : undefined,
                shadowColor: selected ? cls.colorHex : 'transparent',
                shadowOpacity: selected ? 0.8 : 0,
                shadowRadius: selected ? 16 : 0,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="h-14 w-14 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: selected ? cls.colorHex : '#334155',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <Icon
                    size={26}
                    color={cls.colorHex}
                    strokeWidth={selected ? 2.25 : 1.75}
                  />
                </View>
                <View className="ml-4 flex-1">
                  <Text
                    className="text-lg font-black tracking-wide text-slate-100"
                    style={{
                      textShadowColor: selected ? cls.colorHex : 'transparent',
                      textShadowRadius: selected ? 10 : 0,
                    }}
                  >
                    {cls.name.toUpperCase()}
                  </Text>
                  <Text className="text-[11px] italic text-slate-500">
                    « {cls.tagline} »
                  </Text>
                </View>
                {selected ? (
                  <View
                    className="rounded-full border px-2 py-0.5"
                    style={{ borderColor: cls.colorHex }}
                  >
                    <Text
                      className="text-[9px] font-black uppercase tracking-[3px]"
                      style={{ color: cls.colorHex }}
                    >
                      Choisi
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className="mt-2 text-xs leading-relaxed text-slate-400">
                {cls.description}
              </Text>
              <View className="mt-3 gap-1">
                {cls.bonuses.map(b => (
                  <Text
                    key={b.id}
                    className="text-[11px] text-slate-500"
                    numberOfLines={2}
                  >
                    ◆ {b.description}
                  </Text>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step: accept
// ---------------------------------------------------------------------------

function AcceptStep({
  nickname,
  bodyweight,
  classId,
}: {
  nickname: string;
  bodyweight: number;
  classId: PlayerClassId;
}) {
  const cls = PLAYER_CLASSES.find(c => c.id === classId)!;
  return (
    <View>
      <Text
        className="text-2xl font-black tracking-wide text-slate-100"
        style={{ textShadowColor: '#60A5FA', textShadowRadius: 12 }}
      >
        RÉCAPITULATIF
      </Text>
      <Text className="mt-2 text-sm leading-relaxed text-slate-400">
        Vérifie une dernière fois avant d'accepter le pacte du Système.
      </Text>

      <View className="mt-5 rounded-2xl border border-blue-500/30 bg-white/[0.03] p-4">
        <RecapRow label="Pseudo" value={nickname || '(vide)'} />
        <RecapRow label="Poids de corps" value={`${bodyweight} kg`} />
        <RecapRow
          label="Classe"
          value={cls.name}
          accent={cls.colorHex}
        />
      </View>

      <View className="mt-5 flex-row items-start rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
        <AlertTriangle size={14} color="#FBBF24" strokeWidth={2} />
        <Text className="ml-2 flex-1 text-[11px] italic leading-relaxed text-amber-200">
          Accepter le pacte inscrit ton profil dans les registres du Système.
          Cet acte est irréversible sans réinitialisation.
        </Text>
      </View>
    </View>
  );
}

function RecapRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
        {label}
      </Text>
      <Text
        className="text-sm font-bold"
        style={{
          color: accent ?? '#E2E8F0',
          textShadowColor: accent,
          textShadowRadius: accent ? 8 : 0,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Accept modal
// ---------------------------------------------------------------------------

function AcceptTermsModal({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: 'rgba(3,6,12,0.9)',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ backdropFilter: 'blur(12px)' } as any),
        }}
      >
        <View
          className="w-full max-w-md rounded-3xl bg-[#020617]/90 p-6"
          style={{
            borderWidth: 2,
            borderColor: '#60A5FA',
            shadowColor: '#60A5FA',
            shadowOpacity: 0.9,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-black uppercase tracking-[5px] text-blue-300">
              PACTE DU SYSTÈME
            </Text>
            <Pressable
              onPress={onCancel}
              aria-label="Fermer"
              className="rounded-lg border border-slate-700 bg-white/5 p-1.5 active:opacity-60"
            >
              <X size={14} color="#94A3B8" />
            </Pressable>
          </View>

          <Text
            className="mt-4 text-xl font-black leading-snug tracking-wide text-slate-100"
            style={{ textShadowColor: '#60A5FA', textShadowRadius: 12 }}
          >
            ACCEPTER LES CONDITIONS DU SYSTÈME
          </Text>

          <View className="mt-4 rounded-xl border border-slate-800 bg-white/[0.02] p-4">
            <Text className="text-xs italic leading-relaxed text-slate-300">
              « En acceptant, tu offres ta sueur et ta discipline au Système.
              Tu seras évalué à chaque séance, chaque répétition, chaque jour
              de repos manqué. En échange, le Système t'offre ses quêtes, son
              loot et sa puissance. »
            </Text>
            <Text className="mt-3 text-[11px] italic text-slate-500">
              « Que ta lame reste aiguisée, Chasseur. »
            </Text>
          </View>

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
              className="flex-1 flex-row items-center justify-center rounded-xl border-2 border-emerald-400 bg-emerald-500/20 py-3 active:opacity-70"
              style={{
                shadowColor: '#10B981',
                shadowOpacity: 0.85,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Check size={14} color="#6EE7B7" strokeWidth={3} />
              <Text
                className="ml-2 text-xs font-black uppercase tracking-[3px] text-emerald-200"
                style={{ textShadowColor: '#10B981', textShadowRadius: 10 }}
              >
                Accepter
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

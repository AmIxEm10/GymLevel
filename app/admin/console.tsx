import { router } from 'expo-router';
import {
  Crown,
  Flame,
  Gem,
  KeyRound,
  Mail,
  Package,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Sword,
  Trash2,
  TrendingUp,
  Wand2,
  X,
  Zap,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CONSUMABLE_TEMPLATES } from '@/data/consumables';
import { ITEM_TEMPLATES } from '@/data/equipment';
import { TITLES } from '@/data/titles';
import {
  selectIsAdmin,
  selectProfile,
  useAppStore,
} from '@/store/useAppStore';
import type { EquipmentRarity } from '@/types';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

type Tab = 'xp' | 'inventory' | 'titles' | 'danger';

export default function AdminConsoleScreen() {
  const isAdmin = useAppStore(selectIsAdmin);
  const profile = useAppStore(selectProfile);
  const antiCheatBypass = useAppStore(s => s.antiCheatBypass);

  const adminGrantXp = useAppStore(s => s.adminGrantXp);
  const adminResetFatigue = useAppStore(s => s.adminResetFatigue);
  const adminAddConsumable = useAppStore(s => s.adminAddConsumable);
  const adminAddEquipment = useAppStore(s => s.adminAddEquipment);
  const adminUnlockTitle = useAppStore(s => s.adminUnlockTitle);
  const adminMuscleLevelUp = useAppStore(s => s.adminMuscleLevelUp);
  const adminMuscleLevelDown = useAppStore(s => s.adminMuscleLevelDown);
  const adminResetInventoryAndTitles = useAppStore(
    s => s.adminResetInventoryAndTitles,
  );
  const adminToggleAntiCheat = useAppStore(s => s.adminToggleAntiCheat);
  const adminForceEvolve = useAppStore(s => s.adminForceEvolve);
  const adminBoostPowerLevel = useAppStore(s => s.adminBoostPowerLevel);
  const adminSimulateMessage = useAppStore(s => s.adminSimulateMessage);

  const [tab, setTab] = useState<Tab>('xp');
  const [itemMode, setItemMode] = useState<'equipment' | 'consumable'>('consumable');

  // Hard gate — kick anybody who tries to land here without the privilege.
  useEffect(() => {
    if (!isAdmin) router.replace('/');
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#020617]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-[5px] text-rose-400">
              PRIVILÈGE SYSTÈME
            </Text>
            <Text
              className="mt-1 text-3xl font-black tracking-[3px] text-rose-200"
              style={{
                textShadowColor: '#F43F5E',
                textShadowRadius: 18,
              }}
            >
              CONSOLE
            </Text>
            <Text className="mt-1 text-[10px] italic text-slate-500">
              Bienvenue, architecte {profile.nickname}.
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            aria-label="Fermer"
            className="rounded-lg border border-slate-700 bg-white/5 p-2 active:opacity-60"
          >
            <X size={16} color="#94A3B8" />
          </Pressable>
        </View>

        {/* Tab picker */}
        <View className="mx-5 mb-4 flex-row rounded-full border border-rose-500/30 bg-white/[0.03] p-1" style={{ gap: 4 }}>
          {(
            [
              { id: 'xp',        label: 'XP / Fatigue' },
              { id: 'inventory', label: 'Inventaire' },
              { id: 'titles',    label: 'Titres' },
              { id: 'danger',    label: 'Reset' },
            ] as const
          ).map(t => {
            const active = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                className="flex-1 items-center justify-center rounded-full py-1.5 active:opacity-70"
                style={{
                  backgroundColor: active ? 'rgba(244,63,94,0.22)' : 'transparent',
                  borderWidth: active ? 1 : 0,
                  borderColor: '#F43F5E',
                }}
              >
                <Text
                  className={`text-center text-[10px] font-black uppercase ${
                    active ? 'text-rose-200' : 'text-slate-500'
                  }`}
                  numberOfLines={1}
                  style={{ letterSpacing: 1 }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* XP + Fatigue tab */}
        {tab === 'xp' ? (
          <View className="px-5" style={{ gap: 12 }}>
            <SectionTitle title="XP Global" />
            <View className="flex-row" style={{ gap: 8 }}>
              {[1000, 10000, 100000].map(amount => (
                <AdminBtn
                  key={amount}
                  label={`+${amount >= 1000 ? `${amount / 1000}k` : amount}`}
                  Icon={Sparkles}
                  onPress={() => adminGrantXp(amount)}
                  color="#FBBF24"
                />
              ))}
            </View>

            <SectionTitle title="Muscle Rank" />
            <View className="flex-row" style={{ gap: 8 }}>
              <AdminBtn
                label="Level Up +1"
                Icon={Crown}
                onPress={adminMuscleLevelUp}
                color="#22D3EE"
              />
              <AdminBtn
                label="Level Down −1"
                Icon={ShieldAlert}
                onPress={adminMuscleLevelDown}
                color="#94A3B8"
              />
            </View>

            <SectionTitle title="Fatigue" />
            <AdminBtn
              label="Réinitialiser la fatigue"
              Icon={Flame}
              onPress={adminResetFatigue}
              color="#10B981"
            />

            <SectionTitle title="Évolution Thématique" />
            <View className="flex-row" style={{ gap: 8 }}>
              <AdminBtn
                label="Forcer Évolution"
                Icon={Wand2}
                onPress={adminForceEvolve}
                color="#FBBF24"
              />
              <AdminBtn
                label="Boost PL +50k"
                Icon={TrendingUp}
                onPress={() => adminBoostPowerLevel(50000)}
                color="#A855F7"
              />
            </View>
            <AdminBtn
              label="Simuler un Message du Système"
              Icon={Mail}
              onPress={() => adminSimulateMessage('ominous')}
              color="#F43F5E"
            />

            <SectionTitle title="Anti-Cheat" />
            <Pressable
              onPress={adminToggleAntiCheat}
              className="flex-row items-center justify-between rounded-xl border border-slate-700 bg-white/[0.04] px-4 py-3 active:opacity-70"
              style={{
                shadowColor: antiCheatBypass ? '#F43F5E' : 'transparent',
                shadowOpacity: antiCheatBypass ? 0.8 : 0,
                shadowRadius: antiCheatBypass ? 12 : 0,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-200">
                Bypass
              </Text>
              <Text
                className="text-[11px] font-black uppercase tracking-widest"
                style={{
                  color: antiCheatBypass ? '#FCA5A5' : '#6EE7B7',
                }}
              >
                {antiCheatBypass ? 'OFF' : 'ON'}
              </Text>
            </Pressable>
            <Text className="text-[9px] italic text-slate-600">
              Quand ON, aucune session n'est flaguée simulation / densité.
            </Text>
          </View>
        ) : null}

        {/* Inventory tab */}
        {tab === 'inventory' ? (
          <View className="px-5" style={{ gap: 12 }}>
            <View className="flex-row rounded-full border border-rose-500/30 bg-white/[0.03] p-1" style={{ gap: 4 }}>
              {(['consumable', 'equipment'] as const).map(mode => {
                const active = itemMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setItemMode(mode)}
                    className="flex-1 items-center justify-center rounded-full py-1.5 active:opacity-70"
                    style={{
                      backgroundColor: active ? 'rgba(244,63,94,0.22)' : 'transparent',
                      borderWidth: active ? 1 : 0,
                      borderColor: '#F43F5E',
                    }}
                  >
                    <Text
                      className={`text-[10px] font-black uppercase ${
                        active ? 'text-rose-200' : 'text-slate-500'
                      }`}
                      style={{ letterSpacing: 1.5 }}
                    >
                      {mode === 'consumable' ? 'Consommables' : 'Équipement'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {itemMode === 'consumable'
              ? CONSUMABLE_TEMPLATES.map(tpl => (
                  <View
                    key={tpl.id}
                    className="rounded-xl border border-slate-800 bg-white/[0.02] p-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 text-[12px] font-bold text-slate-100">
                        {tpl.name}
                      </Text>
                      <RarityChip rarity={tpl.rarity} />
                    </View>
                    <Text className="mt-0.5 text-[10px] italic text-slate-500">
                      {tpl.description}
                    </Text>
                    <View className="mt-2 flex-row" style={{ gap: 6 }}>
                      {[1, 5, 10].map(q => (
                        <Pressable
                          key={q}
                          onPress={() => adminAddConsumable(tpl.id, q)}
                          className="flex-1 items-center justify-center rounded-lg border border-rose-500/50 bg-rose-500/10 py-1.5 active:opacity-70"
                        >
                          <Text className="text-[10px] font-black text-rose-200">
                            +{q}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))
              : ITEM_TEMPLATES.map(tpl => (
                  <View
                    key={tpl.id}
                    className="flex-row items-center rounded-xl border border-slate-800 bg-white/[0.02] p-3"
                  >
                    <View className="flex-1">
                      <Text className="text-[12px] font-bold text-slate-100">
                        {tpl.name}
                      </Text>
                      <Text className="mt-0.5 text-[10px] text-slate-500">
                        {tpl.slot}
                      </Text>
                    </View>
                    <RarityChip rarity={tpl.rarity} />
                    <Pressable
                      onPress={() => adminAddEquipment(tpl.id, 1)}
                      className="ml-2 items-center justify-center rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-1.5 active:opacity-70"
                    >
                      <Text className="text-[10px] font-black text-rose-200">
                        +1
                      </Text>
                    </Pressable>
                  </View>
                ))}
          </View>
        ) : null}

        {/* Titles tab */}
        {tab === 'titles' ? (
          <View className="px-5" style={{ gap: 8 }}>
            {TITLES.map(t => {
              const unlocked = profile.unlockedTitles.includes(t.id);
              return (
                <View
                  key={t.id}
                  className="flex-row items-center rounded-xl border border-slate-800 bg-white/[0.02] p-3"
                  style={{
                    borderColor: unlocked ? t.colorHex : '#1e293b',
                    opacity: unlocked ? 1 : 0.75,
                  }}
                >
                  <View className="flex-1">
                    <Text
                      className="text-[12px] font-black uppercase tracking-widest"
                      style={{ color: t.colorHex }}
                    >
                      {t.name}
                    </Text>
                    <Text className="mt-0.5 text-[10px] italic text-slate-500" numberOfLines={1}>
                      {t.description}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => adminUnlockTitle(t.id)}
                    disabled={unlocked}
                    className="ml-2 items-center justify-center rounded-lg border px-3 py-1.5 active:opacity-70"
                    style={{
                      borderColor: unlocked ? '#334155' : t.colorHex,
                      backgroundColor: unlocked ? 'rgba(255,255,255,0.02)' : `${t.colorHex}22`,
                      opacity: unlocked ? 0.6 : 1,
                    }}
                  >
                    <Text
                      className="text-[9px] font-black uppercase tracking-widest"
                      style={{ color: unlocked ? '#64748B' : t.colorHex }}
                    >
                      {unlocked ? 'OK' : 'Débloquer'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Danger zone */}
        {tab === 'danger' ? (
          <View className="px-5" style={{ gap: 12 }}>
            <View className="rounded-xl border border-rose-500/70 bg-rose-500/10 p-4">
              <Text className="text-[11px] font-black uppercase tracking-widest text-rose-300">
                ⚠ Zone rouge
              </Text>
              <Text className="mt-1 text-[10px] italic text-slate-400">
                Vide l'inventaire, les titres et les quêtes complétées. Utile pour
                tester un nouveau parcours utilisateur après onboarding.
              </Text>
              <Pressable
                onPress={adminResetInventoryAndTitles}
                className="mt-3 items-center justify-center rounded-lg border-2 border-rose-500 bg-rose-500/20 py-2.5 active:opacity-70"
              >
                <View className="flex-row items-center">
                  <Trash2 size={14} color="#FCA5A5" strokeWidth={2.25} />
                  <Text
                    className="ml-2 text-[11px] font-black uppercase tracking-widest text-rose-200"
                    style={{ textShadowColor: '#F43F5E', textShadowRadius: 8 }}
                  >
                    Reset Inventaire + Titres
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ title }: { title: string }) {
  return (
    <View>
      <Text
        className="text-[11px] font-black uppercase tracking-[3px] text-rose-300"
        style={{ textShadowColor: '#F43F5E', textShadowRadius: 6 }}
      >
        {title}
      </Text>
      <View className="mt-1 h-[1px] w-12 bg-rose-500/70" />
    </View>
  );
}

function AdminBtn({
  label,
  Icon,
  onPress,
  color,
}: {
  label: string;
  Icon: typeof Zap;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center rounded-xl border px-3 py-2.5 active:opacity-70"
      style={{
        borderColor: color,
        backgroundColor: `${color}15`,
        shadowColor: color,
        shadowOpacity: 0.55,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Icon size={12} color={color} strokeWidth={2.25} />
      <Text
        className="ml-1.5 text-[10px] font-black uppercase tracking-widest"
        numberOfLines={1}
        style={{ color, textShadowColor: color, textShadowRadius: 6 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RarityChip({ rarity }: { rarity: EquipmentRarity }) {
  const color =
    rarity === 'legendary' ? '#FBBF24'
      : rarity === 'epic'  ? '#A855F7'
      : rarity === 'rare'  ? '#60A5FA'
      : '#94A3B8';
  return (
    <View
      className="rounded-md px-1.5 py-[1px]"
      style={{
        borderWidth: 1,
        borderColor: color,
        backgroundColor: `${color}18`,
      }}
    >
      <Text
        className="text-[8px] font-black uppercase tracking-widest"
        style={{ color }}
      >
        {rarity}
      </Text>
    </View>
  );
}

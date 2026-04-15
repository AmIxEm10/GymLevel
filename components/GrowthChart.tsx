import { useMemo } from 'react';
import { Text, View } from 'react-native';

import type { WorkoutSession } from '@/types';

const DAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

interface DailyPoint {
  dayStart: number;
  label: string;
  isToday: boolean;
  volume: number;
}

/** Aggregate last-7-day volumes from session history. */
export function buildDailyVolumes(
  history: WorkoutSession[],
  now: number = Date.now(),
): DailyPoint[] {
  const today = startOfDay(now);
  return Array.from({ length: 7 }).map((_, i) => {
    const dayStart = today - (6 - i) * ONE_DAY_MS;
    const dayEnd = dayStart + ONE_DAY_MS;
    const volume = history
      .filter(s => s.startedAt >= dayStart && s.startedAt < dayEnd)
      .reduce((sum, s) => sum + s.totalVolume, 0);
    return {
      dayStart,
      label: DAY_LABELS_FR[new Date(dayStart).getDay()]!,
      isToday: dayStart === today,
      volume,
    };
  });
}

interface Props {
  history: WorkoutSession[];
  /** Chart height in px — default 140. */
  height?: number;
}

export function GrowthChart({ history, height = 140 }: Props) {
  const data = useMemo(() => buildDailyVolumes(history), [history]);
  const max = Math.max(1, ...data.map(d => d.volume));
  const total = data.reduce((s, d) => s + d.volume, 0);
  const best = data.reduce<DailyPoint | null>(
    (m, d) => (!m || d.volume > m.volume ? d : m),
    null,
  );

  return (
    <View className="rounded-2xl border border-blue-500/20 bg-white/[0.04] p-4">
      <View className="flex-row items-end justify-between">
        <View>
          <Text
            className="text-sm font-bold tracking-[2px] text-slate-100"
            style={{ textShadowColor: '#60A5FA', textShadowRadius: 6 }}
          >
            VOLUME — 7 DERNIERS JOURS
          </Text>
          <View className="mt-1 h-[1px] w-14 bg-blue-500/60" />
        </View>
        <Text className="text-[10px] uppercase tracking-widest text-slate-500">
          {total > 0 ? `${Math.round(total).toLocaleString()} kg` : 'Aucune donnée'}
        </Text>
      </View>

      <View className="mt-4 flex-row items-end" style={{ height }}>
        {data.map(d => {
          const ratio = d.volume > 0 ? d.volume / max : 0;
          const barHeight = ratio === 0 ? 2 : Math.max(4, ratio * (height - 24));
          const isBest = best?.volume === d.volume && d.volume > 0;
          return (
            <View key={d.dayStart} className="flex-1 items-center">
              <View className="h-full justify-end">
                {/* Value label (only when positive) */}
                {d.volume > 0 ? (
                  <Text
                    className="mb-1 text-[9px] font-bold text-blue-300"
                    style={{
                      textShadowColor: '#60A5FA',
                      textShadowRadius: 4,
                      textAlign: 'center',
                    }}
                  >
                    {Math.round(d.volume / 1000) >= 1
                      ? `${(d.volume / 1000).toFixed(1)}t`
                      : `${Math.round(d.volume)}`}
                  </Text>
                ) : null}
                <View
                  style={{
                    width: 18,
                    height: barHeight,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    backgroundColor:
                      d.volume === 0
                        ? 'rgba(96,165,250,0.15)'
                        : isBest
                        ? '#FBBF24'
                        : '#60A5FA',
                    shadowColor:
                      d.volume === 0
                        ? '#60A5FA'
                        : isBest
                        ? '#FBBF24'
                        : '#60A5FA',
                    shadowOpacity: d.volume === 0 ? 0.1 : 0.6,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                />
              </View>
              <Text
                className="mt-1.5 text-[10px] uppercase tracking-widest"
                style={{
                  color: d.isToday ? '#60A5FA' : '#64748B',
                  fontWeight: d.isToday ? '700' : '400',
                }}
              >
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>

      {total === 0 ? (
        <Text className="mt-3 text-center text-[10px] italic text-slate-600">
          Commence une séance pour alimenter la courbe.
        </Text>
      ) : null}
    </View>
  );
}

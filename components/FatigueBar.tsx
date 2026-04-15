import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { MuscleGroupStats, MuscleStatus } from '@/types';

/** Map 4 statuses to a 0..100 fatigue weight. */
const STATUS_WEIGHT: Record<MuscleStatus, number> = {
  frais: 0,
  actif: 25,
  fatigue: 65,
  epuise: 100,
};

/**
 * Compute a single "global fatigue" (0–100) as the weighted average across
 * all tracked muscle groups. Exhausted muscles dominate the score.
 */
export function computeGlobalFatigue(
  muscleStats: Record<string, MuscleGroupStats>,
): number {
  const values = Object.values(muscleStats);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, s) => acc + STATUS_WEIGHT[s.status], 0);
  return Math.round(sum / values.length);
}

interface Props {
  value: number; // 0..100
  height?: number;
}

export function FatigueBar({ value, height = 10 }: Props) {
  const [width, setWidth] = useState(0);
  const pct = Math.max(0, Math.min(100, value));
  const fillWidth = width * (pct / 100);

  return (
    <View className="w-full">
      <View
        className="flex-row items-center justify-between"
        style={{ marginBottom: 6 }}
      >
        <Text className="text-[10px] font-semibold uppercase tracking-[3px] text-slate-400">
          Fatigue
        </Text>
        <Text
          className="text-[11px] font-bold"
          style={{
            color: pct >= 70 ? '#EF4444' : pct >= 35 ? '#F59E0B' : '#60A5FA',
            textShadowColor: pct >= 70 ? '#EF4444' : pct >= 35 ? '#F59E0B' : '#60A5FA',
            textShadowRadius: 6,
          }}
        >
          {pct} / 100
        </Text>
      </View>

      <View
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        className="overflow-hidden rounded-full border border-blue-500/20 bg-slate-900/80"
        style={{ height }}
      >
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="fatigueGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#60A5FA" stopOpacity={1} />
                <Stop offset="0.5" stopColor="#F59E0B" stopOpacity={1} />
                <Stop offset="1" stopColor="#EF4444" stopOpacity={1} />
              </LinearGradient>
              <LinearGradient id="fatigueTrack" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#60A5FA" stopOpacity={0.12} />
                <Stop offset="0.5" stopColor="#F59E0B" stopOpacity={0.12} />
                <Stop offset="1" stopColor="#EF4444" stopOpacity={0.12} />
              </LinearGradient>
            </Defs>
            {/* Faint full-width track */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="url(#fatigueTrack)"
              rx={height / 2}
            />
            {/* Actual fill */}
            <Rect
              x={0}
              y={0}
              width={fillWidth}
              height={height}
              fill="url(#fatigueGrad)"
              rx={height / 2}
            />
          </Svg>
        )}
      </View>
    </View>
  );
}

import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MUSCLE_GROUP_BY_ID } from '@/data/muscleGroups';
import type { MuscleGroupId, MuscleGroupStats, MuscleStatus } from '@/types';

// ---------------------------------------------------------------------------
// Zone definitions
// ---------------------------------------------------------------------------

type ZoneId =
  | 'shoulders'
  | 'chest'
  | 'back'
  | 'arms'
  | 'core'
  | 'legs'
  | 'calves';

interface Zone {
  id: ZoneId;
  label: string;
  muscleIds: MuscleGroupId[];
  /** Placements for the visual shapes — multiple means multiple "halves". */
  rects: Array<{
    top: number;
    left: number;
    width: number;
    height: number;
    radius: number;
  }>;
}

/** Silhouette bounding box in pixels — all rects below are in this space. */
const BODY_W = 200;
const BODY_H = 400;

const ZONES: Zone[] = [
  {
    id: 'shoulders',
    label: 'Épaules',
    muscleIds: [
      'deltoides_anterieur',
      'deltoides_lateral',
      'deltoides_posterieur',
    ],
    rects: [
      { top: 58, left: 35, width: 38, height: 28, radius: 14 },
      { top: 58, left: 127, width: 38, height: 28, radius: 14 },
    ],
  },
  {
    id: 'chest',
    label: 'Pectoraux',
    muscleIds: ['pectoraux'],
    rects: [{ top: 86, left: 58, width: 84, height: 44, radius: 16 }],
  },
  {
    id: 'back',
    label: 'Dos',
    muscleIds: ['dorsaux', 'trapezes', 'lombaires'],
    // Rendered as a narrow vertical strip on the right of the body — a
    // schematic "dorsal view" indicator for the front silhouette.
    rects: [{ top: 88, left: 175, width: 20, height: 90, radius: 10 }],
  },
  {
    id: 'arms',
    label: 'Bras',
    muscleIds: ['biceps', 'triceps', 'avant_bras'],
    rects: [
      { top: 90, left: 6, width: 22, height: 104, radius: 11 },
      { top: 90, left: 172, width: 0, height: 0, radius: 0 }, // placeholder, overridden below
      { top: 90, left: 145, width: 22, height: 104, radius: 11 },
    ],
  },
  {
    id: 'core',
    label: 'Core & Abdos',
    muscleIds: ['abdominaux', 'obliques'],
    rects: [{ top: 134, left: 66, width: 68, height: 58, radius: 14 }],
  },
  {
    id: 'legs',
    label: 'Jambes',
    muscleIds: [
      'quadriceps',
      'ischio_jambiers',
      'fessiers',
      'adducteurs',
    ],
    rects: [
      { top: 196, left: 54, width: 38, height: 96, radius: 14 },
      { top: 196, left: 108, width: 38, height: 96, radius: 14 },
    ],
  },
  {
    id: 'calves',
    label: 'Mollets',
    muscleIds: ['mollets'],
    rects: [
      { top: 296, left: 58, width: 28, height: 70, radius: 12 },
      { top: 296, left: 114, width: 28, height: 70, radius: 12 },
    ],
  },
];

// Fix the arms zone (second entry was a sentinel)
ZONES[3].rects = [
  { top: 90, left: 6, width: 22, height: 104, radius: 11 },
  { top: 90, left: 172, width: 22, height: 104, radius: 11 },
];

// ---------------------------------------------------------------------------
// Color mapping
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<MuscleStatus, { fill: string; border: string; glow: string; label: string }> = {
  frais:   { fill: 'rgba(34,211,238,0.18)',  border: '#22D3EE', glow: '#67E8F9', label: 'Frais' },
  actif:   { fill: 'rgba(96,165,250,0.18)',  border: '#60A5FA', glow: '#93C5FD', label: 'Actif' },
  fatigue: { fill: 'rgba(249,115,22,0.22)',  border: '#F97316', glow: '#FB923C', label: 'Fatigué' },
  epuise:  { fill: 'rgba(239,68,68,0.28)',   border: '#EF4444', glow: '#FCA5A5', label: 'Épuisé' },
};

/** Worst status wins — a zone goes red if any of its muscles is 'epuise'. */
const STATUS_RANK: Record<MuscleStatus, number> = {
  frais: 0, actif: 1, fatigue: 2, epuise: 3,
};
function worstStatus(
  ids: MuscleGroupId[],
  stats: Record<MuscleGroupId, MuscleGroupStats>,
): MuscleStatus {
  return ids.reduce<MuscleStatus>((acc, id) => {
    const s = stats[id].status;
    return STATUS_RANK[s] > STATUS_RANK[acc] ? s : acc;
  }, 'frais');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  muscleStats: Record<MuscleGroupId, MuscleGroupStats>;
}

export function BodyView({ muscleStats }: Props) {
  const [activeZoneId, setActiveZoneId] = useState<ZoneId | null>('chest');

  const activeZone = useMemo(
    () => ZONES.find(z => z.id === activeZoneId) ?? null,
    [activeZoneId],
  );

  return (
    <View>
      {/* Silhouette container with a soft outer holo-frame */}
      <View className="items-center rounded-2xl border border-blue-500/20 bg-white/[0.03] py-4">
        <View
          style={{
            width: BODY_W,
            height: BODY_H,
            position: 'relative',
          }}
        >
          {/* Decorative head */}
          <View
            style={{
              position: 'absolute',
              top: 6,
              left: (BODY_W - 46) / 2,
              width: 46,
              height: 46,
              borderRadius: 23,
              borderWidth: 1,
              borderColor: 'rgba(96,165,250,0.25)',
              backgroundColor: 'rgba(255,255,255,0.02)',
            }}
          />

          {/* Neck */}
          <View
            style={{
              position: 'absolute',
              top: 48,
              left: (BODY_W - 16) / 2,
              width: 16,
              height: 14,
              backgroundColor: 'rgba(96,165,250,0.06)',
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: 'rgba(96,165,250,0.15)',
            }}
          />

          {/* Zones */}
          {ZONES.map(zone => {
            const status = worstStatus(zone.muscleIds, muscleStats);
            const palette = STATUS_COLOR[status];
            const isActive = activeZoneId === zone.id;
            return (
              <View key={zone.id}>
                {zone.rects.map((rect, idx) => (
                  <Pressable
                    key={`${zone.id}_${idx}`}
                    onPress={() => setActiveZoneId(zone.id)}
                    style={{
                      position: 'absolute',
                      top: rect.top,
                      left: rect.left,
                      width: rect.width,
                      height: rect.height,
                      borderRadius: rect.radius,
                      borderWidth: isActive ? 2 : 1.25,
                      borderColor: palette.border,
                      backgroundColor: palette.fill,
                      shadowColor: palette.glow,
                      shadowOpacity: isActive ? 0.9 : 0.45,
                      shadowRadius: isActive ? 14 : 8,
                      shadowOffset: { width: 0, height: 0 },
                    }}
                  />
                ))}
              </View>
            );
          })}
        </View>

        {/* Legend */}
        <View className="mt-3 flex-row flex-wrap justify-center gap-2 px-4">
          {(['frais', 'actif', 'fatigue', 'epuise'] as MuscleStatus[]).map(s => (
            <View key={s} className="flex-row items-center">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: STATUS_COLOR[s].border,
                  marginRight: 4,
                }}
              />
              <Text className="text-[10px] uppercase tracking-widest text-slate-400">
                {STATUS_COLOR[s].label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tooltip / detail panel */}
      {activeZone ? (
        <ZoneDetail zone={activeZone} muscleStats={muscleStats} />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tooltip card
// ---------------------------------------------------------------------------

function ZoneDetail({
  zone,
  muscleStats,
}: {
  zone: Zone;
  muscleStats: Record<MuscleGroupId, MuscleGroupStats>;
}) {
  const status = worstStatus(zone.muscleIds, muscleStats);
  const palette = STATUS_COLOR[status];

  return (
    <View
      className="mt-3 rounded-2xl border bg-white/[0.04] p-4"
      style={{
        borderColor: palette.border,
        shadowColor: palette.glow,
        shadowOpacity: 0.45,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text
          className="text-base font-bold tracking-[2px] text-slate-100"
          style={{ textShadowColor: palette.glow, textShadowRadius: 8 }}
        >
          {zone.label.toUpperCase()}
        </Text>
        <View
          className="rounded-md px-2 py-0.5"
          style={{
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        >
          <Text
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: palette.border }}
          >
            {palette.label}
          </Text>
        </View>
      </View>

      <View className="mt-3 gap-1.5">
        {zone.muscleIds.map(id => {
          const s = muscleStats[id];
          const muscle = MUSCLE_GROUP_BY_ID[id];
          const ratio = Math.min(
            100,
            (s.xp / Math.max(1, s.xpToNextLevel)) * 100,
          );
          const mPalette = STATUS_COLOR[s.status];
          return (
            <View key={id} className="flex-row items-center">
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: muscle.colorHex,
                  marginRight: 8,
                }}
              />
              <Text className="flex-1 text-[12px] text-slate-200" numberOfLines={1}>
                {muscle.name}
              </Text>
              <Text className="mr-2 text-[11px] font-bold text-blue-300">
                Nv. {s.level}
              </Text>
              <View
                className="w-20 overflow-hidden rounded-full bg-slate-800"
                style={{ height: 4 }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${ratio}%`,
                    backgroundColor: mPalette.border,
                  }}
                />
              </View>
              <Text className="ml-2 w-10 text-right text-[10px] text-slate-500">
                {Math.round(s.xp)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

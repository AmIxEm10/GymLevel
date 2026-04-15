import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';

import { RANK_META, computeRank, type Rank } from '@/data/ranks';

export { computeRank } from '@/data/ranks';
export type { Rank } from '@/data/ranks';

/** Back-compat: profile.tsx reads RANK_INFO[rank].tagline. */
export const RANK_INFO: Record<Rank, { tagline: string }> = {
  E: { tagline: RANK_META.E.tagline },
  D: { tagline: RANK_META.D.tagline },
  C: { tagline: RANK_META.C.tagline },
  B: { tagline: RANK_META.B.tagline },
  A: { tagline: RANK_META.A.tagline },
  S: { tagline: RANK_META.S.tagline },
};

interface Props {
  level: number;
  /** Default size is 84px. */
  size?: number;
}

export function RankEmblem({ level, size = 84 }: Props) {
  const rank = computeRank(level);
  const meta = RANK_META[rank];

  const hex = '50,4 92,26 92,74 50,96 8,74 8,26';

  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        shadowColor: meta.glow,
        shadowOpacity: 0.8,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="rankFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={meta.color} stopOpacity={0.35} />
            <Stop offset="1" stopColor="#0B0F19" stopOpacity={0.9} />
          </LinearGradient>
          <LinearGradient id="rankStroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={meta.glow} stopOpacity={1} />
            <Stop offset="1" stopColor={meta.color} stopOpacity={0.4} />
          </LinearGradient>
        </Defs>

        <Polygon
          points={hex}
          fill="url(#rankFill)"
          stroke="url(#rankStroke)"
          strokeWidth={2.5}
        />
        <Polygon
          points="50,16 82,32 82,68 50,84 18,68 18,32"
          fill="transparent"
          stroke={meta.color}
          strokeOpacity={0.45}
          strokeWidth={1}
        />
      </Svg>

      <View className="absolute inset-0 items-center justify-center">
        <Text
          className="text-[9px] font-bold uppercase tracking-[4px] text-slate-400"
          style={{ marginBottom: -2 }}
        >
          RANG
        </Text>
        <Text
          className="font-black"
          style={{
            fontSize: size * 0.42,
            color: meta.color,
            textShadowColor: meta.glow,
            textShadowRadius: 10,
            textShadowOffset: { width: 0, height: 0 },
          }}
        >
          {rank}
        </Text>
      </View>
    </View>
  );
}

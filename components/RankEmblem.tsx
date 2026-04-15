import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

/** Map global level → Rank. Tuned against the LEVEL_EXPONENT curve. */
export function computeRank(level: number): Rank {
  if (level >= 61) return 'S';
  if (level >= 36) return 'A';
  if (level >= 21) return 'B';
  if (level >= 11) return 'C';
  if (level >= 6) return 'D';
  return 'E';
}

const RANK_META: Record<
  Rank,
  { color: string; glow: string; label: string; tagline: string }
> = {
  E: { color: '#64748B', glow: '#94A3B8', label: 'Classe E', tagline: 'Éveillé récent' },
  D: { color: '#22C55E', glow: '#4ADE80', label: 'Classe D', tagline: 'Chasseur confirmé' },
  C: { color: '#22D3EE', glow: '#67E8F9', label: 'Classe C', tagline: 'Traqueur d\'ombres' },
  B: { color: '#A855F7', glow: '#C084FC', label: 'Classe B', tagline: 'Lame des Abysses' },
  A: { color: '#F97316', glow: '#FB923C', label: 'Classe A', tagline: 'Élite du Système' },
  S: { color: '#FBBF24', glow: '#FDE68A', label: 'Classe S', tagline: 'Monarque' },
};

interface Props {
  level: number;
  /** Default size is 80px. */
  size?: number;
}

export function RankEmblem({ level, size = 84 }: Props) {
  const rank = computeRank(level);
  const meta = RANK_META[rank];

  // Flat-top hexagon points in a 100×100 viewBox.
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

        {/* Outer glow hex (slightly bigger via stroke) */}
        <Polygon
          points={hex}
          fill="url(#rankFill)"
          stroke="url(#rankStroke)"
          strokeWidth={2.5}
        />

        {/* Inner stroke for the holographic double-outline feel */}
        <Polygon
          points="50,16 82,32 82,68 50,84 18,68 18,32"
          fill="transparent"
          stroke={meta.color}
          strokeOpacity={0.45}
          strokeWidth={1}
        />
      </Svg>

      {/* Absolute text overlay */}
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

export const RANK_INFO: Record<Rank, { tagline: string }> = {
  E: { tagline: RANK_META.E.tagline },
  D: { tagline: RANK_META.D.tagline },
  C: { tagline: RANK_META.C.tagline },
  B: { tagline: RANK_META.B.tagline },
  A: { tagline: RANK_META.A.tagline },
  S: { tagline: RANK_META.S.tagline },
};

import { useId, useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Thin horizontal progress bar with a blue → cyan gradient fill.
 * Used for the System's XP bars, quest progress, set counters, etc.
 */
interface Props {
  /** 0 .. 100 */
  percent: number;
  /** Bar height in px. */
  height?: number;
  /** Track colour behind the fill. Default = slate-800 (#1e293b). */
  trackColor?: string;
  /** Start colour (blue profond). Default = #1e40af. */
  startColor?: string;
  /** End colour (cyan éclatant). Default = #22d3ee. */
  endColor?: string;
  /** Rounded pill shape by default. Set false to keep hard edges. */
  rounded?: boolean;
}

export function GradientBar({
  percent,
  height = 6,
  trackColor = '#1e293b',
  startColor = '#1e40af',
  endColor = '#22d3ee',
  rounded = true,
}: Props) {
  const [width, setWidth] = useState(0);
  const rawId = useId();
  // useId can include a ":" which is illegal in SVG ids on web
  const gradId = `gb_${rawId.replace(/:/g, '_')}`;
  const pct = Math.max(0, Math.min(100, percent));
  const fillWidth = width * (pct / 100);
  const radius = rounded ? height / 2 : 0;

  return (
    <View
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={{
        height,
        backgroundColor: trackColor,
        borderRadius: radius,
        overflow: 'hidden',
      }}
    >
      {width > 0 && fillWidth > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={startColor} />
              <Stop offset="1" stopColor={endColor} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={fillWidth}
            height={height}
            rx={radius}
            fill={`url(#${gradId})`}
          />
        </Svg>
      ) : null}
    </View>
  );
}

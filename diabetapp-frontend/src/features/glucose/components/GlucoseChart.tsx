import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { color, space } from '@/src/shared/theme/tokens';
import { buildChart, ChartSize } from '../chart';
import { GlucoseReading } from '../types';

/**
 * Gráfico de tendencia (spec fase 15, RF-15.7): línea de las mediciones sobre la banda del rango
 * objetivo. Los puntos fuera de rango son rombos rellenos (forma distinta, no solo color). Es
 * un complemento: la lista de mediciones va siempre debajo y el gráfico se describe a los
 * lectores de pantalla.
 */
const HEIGHT = 168;
const PADDING = { top: 12, right: 12, bottom: 12, left: 36 };

interface GlucoseChartProps {
  readings: Pick<GlucoseReading, 'id' | 'value' | 'timestamp'>[];
  target: { min: number | null; max: number | null };
}

const GlucoseChart = ({ readings, target }: GlucoseChartProps) => {
  const [width, setWidth] = useState(0);

  const size: ChartSize = useMemo(() => ({ width, height: HEIGHT, padding: PADDING }), [width]);
  const model = useMemo(() => buildChart(readings, size, target), [readings, size, target]);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.round(event.nativeEvent.layout.width));

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={model.description}
      style={styles.container}
    >
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {model.band ? (
            <Rect
              x={PADDING.left}
              y={model.band.y}
              width={Math.max(0, width - PADDING.left - PADDING.right)}
              height={model.band.height}
              fill={color.successBg}
            />
          ) : null}

          {model.yTicks.map((tick) => (
            <React.Fragment key={tick.label}>
              <Line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={tick.y}
                y2={tick.y}
                stroke={color.border}
                strokeWidth={1}
              />
              <SvgText
                x={PADDING.left - 6}
                y={tick.y + 4}
                fontSize={12}
                fill={color.textMuted}
                textAnchor="end"
              >
                {tick.label}
              </SvgText>
            </React.Fragment>
          ))}

          {model.path ? (
            <Path d={model.path} stroke={color.primary} strokeWidth={2} fill="none" />
          ) : null}

          {model.points.map((point) =>
            point.outOfRange ? (
              <Rect
                key={point.id}
                x={point.x - 5}
                y={point.y - 5}
                width={10}
                height={10}
                fill={color.danger}
                transform={`rotate(45 ${point.x} ${point.y})`}
              />
            ) : (
              <Circle key={point.id} cx={point.x} cy={point.y} r={4} fill={color.primary} />
            ),
          )}
        </Svg>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: HEIGHT, marginTop: space.sm },
});

export default GlucoseChart;

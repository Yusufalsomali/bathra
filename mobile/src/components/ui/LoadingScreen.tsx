import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const SIZE = 44;
const STROKE = 3;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CIRC = 2 * Math.PI * R;
const ARC = CIRC * 0.32;
const DASH = `${ARC} ${CIRC}`;

function CircularLoader() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 850,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [rotation]);

  const spin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={spin} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle
          cx={CX}
          cy={CY}
          r={R}
          stroke="#000000"
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={DASH}
          strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      </Svg>
    </Animated.View>
  );
}

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <CircularLoader />
    </View>
  );
}

import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number;
}

export function Skeleton({ className = "", height = 16 }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ height, borderRadius: 6 }, animatedStyle]}
      className={`bg-slate-200 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="bg-white rounded-xl p-4 border border-slate-100 mb-3">
      <View className="flex-row items-center mb-3">
        <Skeleton className="w-11 rounded-full" height={44} />
        <View className="flex-1 ml-3 gap-2">
          <Skeleton className="w-3/4" height={14} />
          <Skeleton className="w-1/2" height={11} />
        </View>
      </View>
      <Skeleton className="w-full mb-2" height={12} />
      <Skeleton className="w-2/3" height={12} />
    </View>
  );
}

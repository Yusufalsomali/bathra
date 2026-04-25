import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0f172a" />
      {message && (
        <Text className="text-slate-500 mt-3 text-sm">{message}</Text>
      )}
    </View>
  );
}

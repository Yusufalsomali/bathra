import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "search-outline",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-4">
        <Ionicons name={icon} size={36} color="#94a3b8" />
      </View>
      <Text className="text-lg font-semibold text-slate-800 text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-slate-500 text-center leading-5">
          {description}
        </Text>
      )}
      {action && <View className="mt-6">{action}</View>}
    </View>
  );
}

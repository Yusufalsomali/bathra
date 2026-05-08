import React from "react";
import { View, Text } from "react-native";
import { LucideIcon, Search } from "lucide-react-native";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: IconComponent = Search,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-4">
        <IconComponent size={36} stroke="#94a3b8" strokeWidth={1.5} />
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

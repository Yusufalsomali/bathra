import React from "react";
import { View, Text } from "react-native";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: "bg-slate-100", text: "text-slate-700" },
  success: { container: "bg-green-100", text: "text-green-700" },
  warning: { container: "bg-amber-100", text: "text-amber-700" },
  error: { container: "bg-red-100", text: "text-red-700" },
  info: { container: "bg-blue-100", text: "text-blue-700" },
  outline: { container: "border border-slate-300 bg-transparent", text: "text-slate-700" },
};

export function Badge({ label, variant = "default", className = "" }: BadgeProps) {
  const { container, text } = variantClasses[variant];
  return (
    <View className={`px-2.5 py-1 rounded-full self-start ${container} ${className}`}>
      <Text className={`text-xs font-medium ${text}`}>{label}</Text>
    </View>
  );
}

export function statusToBadgeVariant(
  status: "pending" | "approved" | "rejected" | "flagged" | "active" | "archived"
): BadgeVariant {
  switch (status) {
    case "approved":
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
    case "flagged":
      return "error";
    case "archived":
      return "default";
    default:
      return "default";
  }
}

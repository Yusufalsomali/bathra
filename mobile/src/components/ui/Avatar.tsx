import React from "react";
import { View, Text, Image } from "react-native";

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-indigo-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ name = "?", uri, size = 48, className = "" }: AvatarProps) {
  const initials = getInitials(name);
  const color = getColorFromName(name);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className={className}
      />
    );
  }

  return (
    <View
      className={`${color} items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text className="text-white font-bold" style={{ fontSize: size * 0.35 }}>
        {initials}
      </Text>
    </View>
  );
}

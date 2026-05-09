import React from "react";
import { LucideIcon } from "lucide-react-native";

interface IconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  icon: LucideIconComponent,
  size = 16,
  color = "#000000",
  strokeWidth = 1.5,
}: IconProps) {
  return (
    <LucideIconComponent size={size} stroke={color} strokeWidth={strokeWidth} />
  );
}

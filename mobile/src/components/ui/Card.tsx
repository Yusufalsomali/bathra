import React from "react";
import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View
      className={`bg-white rounded-xl p-4 border border-slate-100 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

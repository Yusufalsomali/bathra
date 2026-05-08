import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = "flex-row items-center justify-center rounded-lg";

  const variantClasses = {
    primary: "bg-slate-900",
    secondary: "bg-slate-100",
    outline: "border border-slate-300 bg-transparent",
    ghost: "bg-transparent",
    destructive: "bg-red-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-5 py-3.5",
    lg: "px-6 py-4",
  };

  const textVariantClasses = {
    primary: "text-white font-medium",
    secondary: "text-slate-900 font-medium",
    outline: "text-slate-900 font-medium",
    ghost: "text-slate-900 font-medium",
    destructive: "text-white font-medium",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? "opacity-50" : ""} ${className ?? ""}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "destructive" ? "#fff" : "#0f172a"}
          size="small"
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            className={`font-semibold ${textVariantClasses[variant]} ${textSizeClasses[size]}`}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

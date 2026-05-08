import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isRTL?: boolean;
  secureToggle?: boolean;
}

export function Input({
  label,
  error,
  isRTL = false,
  secureToggle = false,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry || secureToggle;

  return (
    <View className="mb-4">
      {label && (
        <Text
          className={`text-sm font-medium text-slate-700 mb-1.5 ${isRTL ? "text-right" : "text-left"}`}
        >
          {label}
        </Text>
      )}
      <View className="relative">
        <TextInput
          className={`bg-slate-50 border ${error ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3.5 text-black text-base`}
          placeholderTextColor="#94a3b8"
          textAlign={isRTL ? "right" : "left"}
          secureTextEntry={isPassword && !showPassword}
          style={style}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            className={`absolute top-3.5 ${isRTL ? "left-4" : "right-4"}`}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#94a3b8"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className={`text-red-500 text-xs mt-1 ${isRTL ? "text-right" : "text-left"}`}>
          {error}
        </Text>
      )}
    </View>
  );
}

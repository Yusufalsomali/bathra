import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { useContext } from "react";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 items-center justify-between px-6 pt-20 pb-16">
        {/* Spacer top */}
        <View className="flex-1 items-center justify-center">
          {/* Logo */}
          <View className="w-24 h-24 rounded-3xl bg-white items-center justify-center mb-6 shadow-lg">
            <Text className="text-slate-900 font-black text-4xl">B</Text>
          </View>

          {/* Brand name */}
          <Text className="text-white text-4xl font-black tracking-tight mb-3">
            Bathra
          </Text>

          {/* Slogan */}
          <Text className="text-slate-400 text-base text-center leading-6 px-4">
            {isRTL
              ? "منصة ربط رواد الأعمال بالمستثمرين"
              : "Connecting startups with investors"}
          </Text>
        </View>

        {/* Proceed button */}
        <TouchableOpacity
          className="bg-white w-full rounded-2xl py-4 items-center"
          activeOpacity={0.85}
          onPress={() => router.push("/(auth)/welcome" as Href)}
        >
          <Text className="text-slate-900 font-black text-base">
            {t("auth.proceed")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

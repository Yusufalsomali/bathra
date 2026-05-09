import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { useContext } from "react";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { BathraLogoMark } from "@/components/branding/BathraLogoMark";

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-between px-6 pt-20 pb-16">
        {/* Spacer top */}
        <View className="flex-1 items-center justify-center">
          <BathraLogoMark width={300} className="mb-6" />

          {/* Slogan */}
          <Text className="text-slate-600 text-base text-center leading-6 px-4">
            {isRTL
              ? "منصة ربط رواد الأعمال بالمستثمرين"
              : "Connecting startups with investors"}
          </Text>
        </View>

        {/* Proceed button */}
        <TouchableOpacity
          className="bg-black w-full rounded-2xl py-4 items-center"
          activeOpacity={0.85}
          onPress={() => router.push("/(auth)/welcome" as Href)}
        >
          <Text className="text-white font-black text-base">
            {t("auth.proceed")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

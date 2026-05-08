import { View, Text, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";

const SIGNUP_URL = "https://bathra-ten.vercel.app/signup";

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-10 pb-10">
        {/* Back */}
        <TouchableOpacity className="mb-8" onPress={() => router.back()}>
          <Text className="text-slate-600 text-sm">
            {isRTL ? "→" : "←"} {t("common.back")}
          </Text>
        </TouchableOpacity>

        {/* Branding */}
        <View className="items-center mb-14">
          <View className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 items-center justify-center mb-4">
            <Text className="text-slate-900 font-black text-2xl">B</Text>
          </View>
          <Text className="text-slate-900 text-2xl font-black tracking-tight">Bathra</Text>
          <Text className="text-slate-600 text-sm mt-1 text-center">
            {isRTL
              ? "منصة ربط رواد الأعمال بالمستثمرين"
              : "Connecting startups with investors"}
          </Text>
        </View>

        {/* Buttons */}
        <View className="gap-4">
          <TouchableOpacity
            className="bg-slate-900 rounded-2xl py-4 items-center"
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text className="text-white font-black text-base">{t("auth.logIn")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border border-slate-200 rounded-2xl py-4 items-center bg-slate-50"
            activeOpacity={0.85}
            onPress={() => Linking.openURL(SIGNUP_URL)}
          >
            <Text className="text-slate-900 font-bold text-base">{t("auth.signUpOnWeb")}</Text>
            <Text className="text-slate-500 text-xs mt-1">{t("auth.signUpNote")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

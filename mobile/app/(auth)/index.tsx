import { View, Text, TouchableOpacity, SafeAreaView, Image } from "react-native";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";

export default function LandingScreen() {
  const router = useRouter();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 px-6 pt-16 pb-10">
        {/* Logo / brand */}
        <View className="items-center mb-16">
          <View className="w-20 h-20 rounded-2xl bg-white items-center justify-center mb-4">
            <Text className="text-slate-900 font-black text-3xl">B</Text>
          </View>
          <Text className="text-white text-3xl font-black tracking-tight">Bathra</Text>
          <Text className="text-slate-400 text-base mt-2 text-center">
            {isRTL ? "منصة ربط رواد الأعمال بالمستثمرين" : "Connecting startups with investors"}
          </Text>
        </View>

        {/* Role selection */}
        <Text className={`text-white text-xl font-bold mb-6 ${isRTL ? "text-right" : "text-left"}`}>
          {t("auth.chooseRole")}
        </Text>

        <TouchableOpacity
          className="bg-white rounded-2xl p-5 mb-4 flex-row items-center"
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: "/(auth)/signup", params: { role: "startup" } })
          }
        >
          <View className="w-12 h-12 rounded-xl bg-slate-900 items-center justify-center mr-4">
            <Text className="text-2xl">🚀</Text>
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-lg">{t("auth.startup")}</Text>
            <Text className="text-slate-500 text-sm">{t("auth.startupDesc")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-white/20 rounded-2xl p-5 mb-10 flex-row items-center"
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: "/(auth)/signup", params: { role: "investor" } })
          }
        >
          <View className="w-12 h-12 rounded-xl bg-amber-500 items-center justify-center mr-4">
            <Text className="text-2xl">💼</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">{t("auth.investor")}</Text>
            <Text className="text-slate-400 text-sm">{t("auth.investorDesc")}</Text>
          </View>
        </TouchableOpacity>

        {/* Sign in link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-slate-400">{t("auth.haveAccount")} </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text className="text-white font-semibold">{t("auth.signIn")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

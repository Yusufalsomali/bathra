import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext } from "react";
import { useRouter, Href } from "expo-router";
import { I18nContext } from "@/context/i18n-context";

export default function NotConfiguredScreen() {
  const router = useRouter();
  const { t } = useContext(I18nContext);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/" as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-8 py-8">
          <TouchableOpacity onPress={goBack} className="mb-6 self-start" accessibilityRole="button">
            <Text className="text-slate-300 text-sm">← {t("common.back")}</Text>
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 rounded-2xl bg-amber-500 items-center justify-center mb-6">
              <Text className="text-3xl">⚙️</Text>
            </View>

            <Text className="text-white text-xl font-black text-center mb-3">
              Configuration Required
            </Text>
            <Text className="text-slate-400 text-sm text-center leading-6 mb-8">
              The app is not connected to Supabase yet. Add your credentials to the{" "}
              <Text className="text-amber-400 font-mono">mobile/.env</Text> file.
            </Text>

            <View className="w-full bg-slate-800 rounded-2xl p-5">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
                mobile/.env
              </Text>
              <Text className="text-green-400 font-mono text-sm leading-6">
                {"EXPO_PUBLIC_SUPABASE_URL=\n  https://xxxx.supabase.co\n\nEXPO_PUBLIC_SUPABASE_ANON_KEY=\n  eyJhbGci..."}
              </Text>
            </View>

            <Text className="text-slate-500 text-xs text-center mt-6 leading-5">
              Find these values in your Supabase project under{"\n"}
              Settings → API → Project URL & anon key
            </Text>

            <Text className="text-slate-600 text-xs text-center mt-4">
              After editing .env, restart with:{"\n"}
              <Text className="font-mono text-slate-500">npx expo start --clear</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

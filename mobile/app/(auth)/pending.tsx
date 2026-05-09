import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext } from "react";
import { useRouter, Href } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { Button } from "@/components/ui/Button";

export default function PendingScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const isRejected = user?.status === "rejected";

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)");
  };

  const handleBack = async () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    await signOut();
    router.replace("/(auth)" as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableOpacity
        className={`px-4 pt-3 pb-2 border-b border-slate-100 ${isRTL ? "items-end" : "items-start"}`}
        onPress={handleBack}
        accessibilityRole="button"
      >
        <Text className="text-slate-600 text-sm">
          {isRTL ? "→" : "←"} {t("common.back")}
        </Text>
      </TouchableOpacity>
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-24 h-24 rounded-full bg-amber-100 items-center justify-center mb-6">
          <Text className="text-5xl">{isRejected ? "❌" : "⏳"}</Text>
        </View>

        <Text
          className={`text-xl font-black text-black text-center mb-3 ${isRTL ? "text-right" : "text-center"}`}
        >
          {isRejected ? t("auth.rejected") : t("auth.pendingApproval")}
        </Text>

        <Text className="text-slate-500 text-center leading-6 mb-10">
          {isRejected
            ? "Please contact support for more information."
            : t("auth.pendingDesc")}
        </Text>

        <Button
          title={t("auth.signOut")}
          variant="outline"
          onPress={handleSignOut}
          className="w-full"
        />
      </View>
    </SafeAreaView>
  );
}

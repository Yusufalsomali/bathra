import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext } from "react";
import { useRouter } from "expo-router";
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-24 h-24 rounded-full bg-amber-100 items-center justify-center mb-6">
          <Text className="text-5xl">{isRejected ? "❌" : "⏳"}</Text>
        </View>

        <Text
          className={`text-2xl font-black text-slate-900 text-center mb-3 ${isRTL ? "text-right" : "text-center"}`}
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

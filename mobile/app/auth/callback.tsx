import { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { I18nContext } from "@/context/i18n-context";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase/client";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { t } = useContext(I18nContext);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleDeepLink = async () => {
      const url = await Linking.getInitialURL();
      if (!url) {
        router.replace("/");
        return;
      }

      const parsed = Linking.parse(url);
      const params = parsed.queryParams || {};

      const accessToken = params["access_token"] as string;
      const refreshToken = params["refresh_token"] as string;

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setError(error.message);
          return;
        }
        router.replace("/(stack)/reset-password");
      } else {
        router.replace("/");
      }
    };

    handleDeepLink();
  }, [router]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-red-500 text-center mb-6">{error}</Text>
        <TouchableOpacity onPress={() => router.replace("/")} accessibilityRole="button">
          <Text className="text-slate-700 font-semibold">{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <LoadingScreen />;
}

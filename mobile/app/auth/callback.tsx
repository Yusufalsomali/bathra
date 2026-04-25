import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase/client";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function AuthCallbackScreen() {
  const router = useRouter();
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
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  return <LoadingScreen message="Authenticating..." />;
}
